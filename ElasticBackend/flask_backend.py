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

# Initialize Flask app
app = Flask(__name__)
cors = CORS(app) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'

# Elasticsearch connection setup
# NOTE: Replace with your actual Elasticsearch API key and endpoint if different
ES_API_KEY = os.environ.get('ES_API_KEY', 'SjkteHBKWUJZcml2dGNPLTVSY1I6UVFnOXhPbF9PLTBLZUxRWEhIbERIZw==')
ES_HOST = os.environ.get('ES_HOST', 'https://383e-2401-4900-883b-f869-8c22-f15c-868c-3ae1.ngrok-free.app/')
INDEX_NAME = 'my_vector_index-01'  # Should match the index created in your pipeline
PIPELINE_ID = "vector_embedding_demo"
# Connect to Elasticsearch
es = Elasticsearch(ES_HOST, api_key=ES_API_KEY)

@app.route('/ingest_summary', methods=['PUT'])
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

    # Prepare the document for ingestion
    doc = {
        'my_issue': summary,         # This field will be embedded by the pipeline
        'my_metadata': metadata     # Any extra info (optional)
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
    json_file = os.path.join(os.path.dirname(__file__), "data.json")

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


if __name__ == '__main__':
    ingest_pipeline_setup()
    index_mapping()
    reset_index()
    bulk_ingest()

    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)

# TODO Create ingest pipeline for summaries to data
# 1. Take summaries.json as input
# 2. Find a model to extract the required fields
# 3. Map to the model format (refer data.json for fields)
# 4. Return data into data.json
# 4. Consume data.json via bulk_ingest()