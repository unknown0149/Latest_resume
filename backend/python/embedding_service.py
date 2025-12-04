"""
Embedding Service
Generates semantic embeddings using sentence-transformers/all-MiniLM-L6-v2
"""

import sys
import json
import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F

# Initialize model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

def mean_pooling(model_output, attention_mask):
    """Mean pooling to get sentence embeddings"""
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

def generate_embedding(text):
    """Generate embedding vector for text"""
    try:
        # Tokenize
        encoded_input = tokenizer([text], padding=True, truncation=True, return_tensors='pt')
        
        # Generate embeddings
        with torch.no_grad():
            model_output = model(**encoded_input)
        
        # Perform pooling
        sentence_embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
        
        # Normalize embeddings
        sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)
        
        return {
            'success': True,
            'embedding': sentence_embeddings[0].tolist(),
            'dimension': len(sentence_embeddings[0])
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'embedding': []
        }

def generate_embeddings_batch(texts):
    """Generate embeddings for multiple texts"""
    try:
        # Tokenize
        encoded_input = tokenizer(texts, padding=True, truncation=True, return_tensors='pt')
        
        # Generate embeddings
        with torch.no_grad():
            model_output = model(**encoded_input)
        
        # Perform pooling
        sentence_embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
        
        # Normalize embeddings
        sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)
        
        return {
            'success': True,
            'embeddings': [emb.tolist() for emb in sentence_embeddings],
            'count': len(sentence_embeddings),
            'dimension': len(sentence_embeddings[0])
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'embeddings': []
        }

if __name__ == "__main__":
    # Read input from command line
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No input text provided'}))
        sys.exit(1)
    
    input_data = sys.argv[1]
    
    # Check if batch mode (JSON array) or single text
    try:
        texts = json.loads(input_data)
        if isinstance(texts, list):
            result = generate_embeddings_batch(texts)
        else:
            result = generate_embedding(str(texts))
    except json.JSONDecodeError:
        # Single text string
        result = generate_embedding(input_data)
    
    print(json.dumps(result))
