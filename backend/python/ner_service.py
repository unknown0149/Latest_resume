"""
Named Entity Recognition Service
Extracts skills and entities from text using dslim/bert-base-NER
"""

import sys
import json
import argparse
from pathlib import Path
from transformers import pipeline

# Initialize NER pipeline with aggregated entities for easier post-processing
ner_pipeline = pipeline(
    "token-classification",
    model="dslim/bert-base-NER",
    aggregation_strategy="max"  # Better token merging
)

def extract_entities(text):
    """Extract named entities from text"""
    try:
        # Run NER (strip superfluous whitespace to reduce token count)
        condensed_text = " ".join(text.split())
        results = ner_pipeline(condensed_text)
        
        # Format results - aggregation_strategy="simple" merges subword tokens
        entities = []
        for entity in results:
            # Clean up word (remove ## prefix from subword tokens)
            word = entity['word'].replace('##', '')
            
            entities.append({
                'entity_group': entity.get('entity_group', entity.get('entity', 'UNKNOWN')),
                'word': word,
                'score': float(entity['score']),
                'start': entity.get('start', 0),
                'end': entity.get('end', 0)
            })
        
        return {
            'success': True,
            'entities': entities,
            'count': len(entities)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'entities': []
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run NER skill extraction")
    parser.add_argument("--text", type=str, help="Input text for NER")
    parser.add_argument("--file", type=str, help="Path to file containing input text")
    args = parser.parse_args()

    input_text = None
    if args.file:
        file_path = Path(args.file)
        if file_path.is_file():
            input_text = file_path.read_text(encoding="utf-8", errors="ignore")
    if input_text is None and args.text:
        input_text = args.text

    if not input_text:
        print(json.dumps({'success': False, 'error': 'No input text provided'}))
        sys.exit(1)
    result = extract_entities(input_text)
    print(json.dumps(result))
