import os
from multiprocessing.dummy import dict

from elastic_transport import ObjectApiResponse
from flask import request, Flask, jsonify

# from elastic import response
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
# from torch.onnx._internal.diagnostics.infra.sarif import Exception

# Initialize Flask app
app = Flask(__name__)

# Elasticsearch connection setup
# NOTE: Replace with your actual Elasticsearch API key and endpoint if different
ES_API_KEY = os.environ.get('ES_API_KEY', 'SjkteHBKWUJZcml2dGNPLTVSY1I6UVFnOXhPbF9PLTBLZUxRWEhIbERIZw==')
ES_HOST = os.environ.get('ES_HOST', 'http://localhost:9200')
INDEX_NAME = 'my_vector_index-01'  # Should match the index created in your pipeline

# Connect to Elasticsearch
# es = Elasticsearch(ES_HOST, api_key=ES_API_KEY)

@app.route('/ingest_summary', methods=['POST'])
def ingest_summary():
    """
    Ingest a call summary (between customer and agent) into Elasticsearch.
    Expects JSON: {"summary": "...", "metadata": "..."}
    """
    data = request.get_json()
    summary = data.get('summary')
    metadata = data.get('metadata', '')  # Optional metadata (e.g., agent/customer info)

    if not summary:
        return jsonify({'error': 'Missing summary'}), 400

    # Prepare the document for ingestion
    doc = {
        'my_text': summary,         # This field will be embedded by the pipeline
        'my_metadata': metadata     # Any extra info (optional)
    }

    # Index the document (Elasticsearch pipeline will handle embedding)
    try:
        # res = es.index(index=INDEX_NAME, document=doc)
        res = {}
        return jsonify({'result': 'success', 'es_response': res.body}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def search_summaries():
    """
    Search for call summaries using keywords and/or semantic queries.

    Expects JSON: {
        "keywords": ["word1", "word2", ...],  # Array of keywords for exact matching
        "query": "semantic search phrase"      # Text for semantic search
    }
    """
    data = request.get_json()
    keywords = data.get('keywords', [])
    query_text = data.get('query', '')

    # Validate that at least one search parameter is provided
    if not keywords and not query_text:
        return jsonify({'error': 'At least one of keywords or query must be provided'}), 400

    # Initialize search components
    search_query = None
    knn_component = None

    # Build a keyword search component if keywords are provided
    if keywords:
        valid_keywords = [k for k in keywords if k.strip()]
        if valid_keywords:
            # If multiple keywords, use bool query with should clauses
            search_query = {
                "bool": {
                    "should": [{"match": {"my_text": keyword}} for keyword in valid_keywords],
                    "minimum_should_match": 1
                }
            }


    # Build a semantic search component if a query is provided
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
            }
        }

    # Fields to return
    fields = ["my_text", "my_metadata"]

    try:
        # Common search parameters
        search_params = {
            "index": INDEX_NAME,
            "fields": fields,
            "size": 10,
            "source": False
        }

        # Case 1: Both keyword and semantic search (hybrid)
        if search_query and knn_component:
            search_params.update({
                "query": search_query,
                "knn": knn_component,
                "rank": {"rrf": {}}  # Reciprocal Rank Fusion for hybrid search
            })
        # Case 2: Only keyword search
        elif search_query:
            search_params.update({"query": search_query})
        # Case 3: Only semantic search
        else:
            search_params.update({"knn": knn_component})

        # response = es.search(**search_params)
        response = dict(took=8, timed_out=False, _shards={'total': 1, 'successful': 1, 'skipped': 0, 'failed': 0},
                        hits=dict(total={'value': 2, 'relation': 'eq'}, max_score=0.7825787, hits=[
                            dict(_index='my_vector_index-01', _id='ndmhrpYBca9xMcEAnock', _score=0.7825787,
                                 _source=dict(my_text="Hey, careful, man, there's a beverage here!",
                                              my_metadata='The Dude', ml={'inference': {}})),
                            dict(_index='my_vector_index-01', _id='ntmhrpYBca9xMcEAnock', _score=0.60257983, _source=dict(
                                my_text='I’m The Dude. So, that’s what you call me. You know, that or, uh, His Dudeness, or, uh, Duder, or El Duderino, if you’re not into the whole brevity thing',
                                my_metadata='The Dude', ml=dict(inference={})))]))
        # Transform the response for the frontend
        hits = response["hits"]["hits"]
        results = [{
            "id": hit["_id"],
            "score": hit["_score"],
            "text": hit["_source"]["my_text"] ,
            "metadata": hit["_source"]["my_metadata"]
        } for hit in hits]

        return jsonify({
            "results": results,
            "total": response["hits"]["total"]["value"],
            "took_ms": response["took"]
        }), 200

    except Exception as e:
        # Use Python's built-in Exception class instead of the imported one
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)