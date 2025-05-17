import json
import os
from multiprocessing.dummy import dict

from elastic_transport import ObjectApiResponse
from flask import request, Flask, jsonify

# from elastic import response
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
# from torch.onnx._internal.diagnostics.infra.sarif import Exception

from flask_cors import CORS, cross_origin
from transformers import pipeline

#OpenAI
from openai import OpenAI
openAIClient = OpenAI()

# Initialize Flask app
app = Flask(__name__)
cors = CORS(app) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'

# Elasticsearch connection setup
# NOTE: Replace with your actual Elasticsearch API key and endpoint if different
ES_API_KEY = os.environ.get('ES_API_KEY', 'UVd6SzJKWUJuamJ5X2w2WWY5Q0I6b2Y4TXNQSTRUYUxMSi0zMk9aX0Vsdw==')
ES_HOST = os.environ.get('ES_HOST', 'http://localhost:9200')
INDEX_NAME = 'my_vector_index-01'  # Should match the index created in your pipeline
PIPELINE_ID = "vector_embedding_demo"
# Connect to Elasticsearch
es = Elasticsearch(ES_HOST, api_key=ES_API_KEY)

@app.route('/ingest_summary', methods=['PUT'])
@cross_origin()
def ingest_summary():
    """
    Ingest a call summary (between customer and agent) into Elasticsearch.
    Expects JSON: {"summary": "...", "metadata": "..."}
    """
    data = request.get_json()
    summary = data.get('summary')
    metadata = data.get('metadata', [])  # Optional metadata (e.g., agent/customer info)

    if not summary:
        return jsonify({'error': 'Missing summary'}), 400

    # Extract issue and resolution from summary
    issue_extraction_prompt = f"Here is the summary of a conversation between an agent and a customer. \
        In one to two lines only, provide the description of the problem that the customer is facing. \
            Here is the summary - {summary}"
    
    problem_resolution_prompt = f"Here is the summary of a conversation between an agent and a customer. \
        In max 4 or less concise statements, describe how the agent resolved customer's issue. Here is the summary - {summary}"
    
    issue = openAIClient.responses.create(model="gpt-4.1", input=issue_extraction_prompt).output_text
    resolution = openAIClient.responses.create(model="gpt-4.1", input=problem_resolution_prompt).output_text

    resolution_arr = resolution.split('.')

    # Prepare the document for ingestion
    doc = {
        'my_issue': issue,         # This field will be embedded by the pipeline
        'my_metadata': metadata,
        'resolution': resolution_arr
    }

    # Index the document (Elasticsearch pipeline will handle embedding)
    try:
        res = es.index(index=INDEX_NAME, document=doc, pipeline=PIPELINE_ID)
        return jsonify({'result': 'success', 'es_response': res.body}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['PUT'])
@cross_origin()
def search_summaries():
    """
    Search for call summaries using keywords and/or semantic queries.

    Expects JSON: {
        "keywords": ["word1", "word2", ...],    # Array of keywords for exact matching in summaries
        "query": "semantic search phrase",      # Text for semantic search
        "metadata_filters": {                   # Key-Value pairs for metadata matching
            "key1": "value1",
            "key2": "value2"
            ...
        }
    }
    """
    data = request.get_json()
    keywords = data.get('keywords', [])
    query_text = data.get('query', '')
    metadata_filters = data.get('metadata_filters', {})

    # Validate that at least one search parameter is provided
    if not keywords and not query_text and not metadata_filters:
        return jsonify({'error': 'At least one of keywords or query must be provided'}), 400

    # Initialize search components
    search_query = {"bool": {"must": [], "filter": []}}
    knn_component = None

    # Build a keyword search component if keywords are provided
    if keywords:
        valid_keywords = [k for k in keywords if k.strip()]
        if valid_keywords:
            keyword_query = {
                "bool": {
                    "must": [{"match": {"my_issue": keyword}} for keyword in valid_keywords],
                }
            }
            search_query["bool"]["must"].append(keyword_query)


    # Add metadata filters if provided
    if metadata_filters:
        for key, value in metadata_filters.items():
            term_query = {"match": {f"my_metadata.{key}": value}}
            search_query["bool"]["filter"].append(term_query)

    if query_text:
        knn_component = {
            "field": "my_vector",
            "k": 3,
            "num_candidates": 5,
            "query_vector_builder": {
                "text_embedding": {
                    "model_id": "sentence-transformers__all-distilroberta-v1",
                    "model_text": query_text
                }
            },
            "filter": {
                "bool": {
                    "filter": [{"match": {f"my_metadata.{key}": value}}
                               for key, value in metadata_filters.items()]
                }
            }
        }

    try:
        response = es.search(
            index=INDEX_NAME,
            knn=knn_component,
            query=search_query,
            sort=["_score"],
            _source=["my_issue", "my_metadata", "resolution"],
        )
        # Transform the response for the frontend
        hits = response["hits"]["hits"]
        results = [{
            # "id": hit["_id"],
            "score": hit["_score"],
            "issue": hit["_source"]["my_issue"] ,
            "metadata": hit["_source"].get("my_metadata", {}),
            "resolution": hit["_source"].get("resolution", [])
        } for hit in hits]

        return jsonify({
            "results": results,
            "total": response["hits"]["total"]["value"],
            # "took_ms": response["took"]
        }), 200

    except Exception as e:
        # Use Python's built-in Exception class instead of the imported one
        return jsonify({'error': e}), 500

def ingest_pipeline_setup():
    pipeline = {
        "processors": [
            {
                "inference": {
                    "field_map": {"my_issue": "text_field"},             # map model's text_field to my_issue
                    "model_id": "sentence-transformers__all-distilroberta-v1",
                    "target_field": "ml.inference.my_vector",   # map model's output to my_vector
                    "on_failure": [
                        {
                            "append": {
                                "field": "_source._ingest.inference_errors",
                                "value": [
                                    {
                                        "message": "Processor 'inference' in pipeline 'ml-inference-title-vector' failed with message '{{ _ingest.on_failure_message }}'",
                                        "pipeline": "ml-inference-title-vector",
                                        "timestamp": "{{{ _ingest.timestamp }}}",
                                    }
                                ],
                            }
                        }
                    ],
                }
            },
            {
                "set": { # set the value of my_vector to the predicted_value
                    "field": "my_vector",
                    "if": "ctx?.ml?.inference != null && ctx.ml.inference['my_vector'] != null",    # check if the predicted_value is not null
                    "copy_from": "ml.inference.my_vector.predicted_value", # copy the predicted_value to my_vector
                    "description": "Copy the predicted_value to 'my_vector'", # description of the processor
                }
            },
            {"remove": {
                "field": "ml.inference.my_vector", # remove the ml.inference.my_vector field
                "ignore_missing": True # ignore the missing field
            }
            },
        ]
    }

    response = es.ingest.put_pipeline(id=PIPELINE_ID, body=pipeline)

    # Print the response
    print(response)

def index_mapping():
    index_patterns = ["my_vector_index-*"]

    priority = 1

    settings = {
        "index.default_pipeline": PIPELINE_ID,
    }

    mappings = {
        "properties": {
            "my_vector": {"type": "dense_vector", "dims": 768,"index": 'true', "similarity": "cosine"},
            "my_issue": {"type": "text"},
            "my_metadata": {"type": "object"},
            "resolution": {"type": "keyword"},
        },
        "_source": {"excludes": ["my_vector"]},
    }

    # Create the index template using put_index_template
    response = es.indices.put_index_template(
        name="my_vector_index_template",  # Template name
        index_patterns=index_patterns,
        priority=priority,
        template={
            "settings": settings,
            "mappings": mappings,
        },
    )

    # Print the response
    print(response)

@app.route('/get_all_data', methods=['GET'])
@cross_origin()
def get_all_data():
    """
    Retrieve all documents from the Elasticsearch index.
    """
    try:
        # Query to match all documents
        query = {"match_all": {}}

        response = es.search(
            index=INDEX_NAME,
            query=query,
            size=100,
            from_=0,
            sort=["_score"]
        )

        # Transform the response
        hits = response["hits"]["hits"]
        results = [{
            "id": hit["_id"],
            "score": hit["_score"],
            "issue": hit["_source"].get("my_issue", ""),
            "metadata": hit["_source"].get("my_metadata", {}),
            "resolution": hit["_source"].get("resolution", {})
        } for hit in hits]

        return jsonify({
            "results": results,
            "total": response["hits"]["total"]["value"],
            "took_ms": response["took"]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def reset_index():
    if es.indices.exists(index=INDEX_NAME):
        es.indices.delete(index=INDEX_NAME)
    es.indices.create(index=INDEX_NAME)

def bulk_ingest():
    json_file = os.path.join(os.path.dirname(__file__), "data/banking_data.json")

    with open(json_file, "r") as json_file:
        data = json.load(json_file)

    actions = [
        {
            "_op_type": "index",
            "_index": INDEX_NAME,
            "_source": {"my_issue": text["issue"], "my_metadata": text["metadata"], "resolution": text["resolution"]},
        }
        for text in data
    ]

    response = bulk(es, actions)
    print(response)

    # Refresh the index to make sure all data is searchable
    es.indices.refresh(index=INDEX_NAME)

def populate_context_store():
    # Load the question-answering pipeline
    qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

    # Define questions
    question_issue = "What is the issue described? Express in customers point of view"
    question_resolution = "What steps were required to solve the issue?"
    question_metadata_category = "What was the category of the issue?"

    json_file = os.path.join(os.path.dirname(__file__), "summaries.json")
    output_json_file_path = os.path.join(os.path.dirname(__file__), "processed_data.json")

    processed_data = []

    with open(json_file, "r") as json_file:
        data = json.load(json_file)

    for text in data:
        summary_text = text["summary"]
        metadata = text["metadata"]

        # Get answers
        issue_result = qa_pipeline(question=question_issue, context=summary_text)
        resolution_result = qa_pipeline(question=question_resolution, context=summary_text)

        # Extracted information
        extracted_issue = issue_result['answer']
        extracted_resolution_text = resolution_result['answer']

        if not metadata.get("category"):
            metadata["category"] = qa_pipeline(question=question_metadata_category, context=summary_text)['answer']

        processed_data.append({
            "metadata": metadata,
            "issue": extracted_issue,
            "resolution": extracted_resolution_text.split("."),
        })

        with open(output_json_file_path, "w") as outfile:
            json.dump(processed_data, outfile, indent=2)

if __name__ == '__main__':
    # populate_context_store()
    ingest_pipeline_setup()
    index_mapping()
    reset_index()
    bulk_ingest()

    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)