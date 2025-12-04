# Python HuggingFace Models Integration

This directory contains Python services for running local HuggingFace models.

## Setup

Install required Python packages:

```bash
pip install -r requirements.txt
```

## Services

### 1. NER Service (`ner_service.py`)
- **Model**: `dslim/bert-base-NER`
- **Purpose**: Named Entity Recognition for skill extraction
- **Usage**: `python ner_service.py "Your text here"`

### 2. Classification Service (`classification_service.py`)
- **Model**: `facebook/bart-large-mnli`
- **Purpose**: Zero-shot classification for job skill categorization
- **Usage**: `python classification_service.py "Your text here" [threshold] [skills_json]`

### 3. Embedding Service (`embedding_service.py`)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Purpose**: Generate semantic embeddings for job matching
- **Usage**: `python embedding_service.py "Your text here"`

## Integration

These services are called from `aiRouter.js` via Node.js `child_process.spawn()`.

The Node.js backend automatically routes AI requests to the appropriate Python service.

## First Run

Models will be downloaded automatically on first use (may take a few minutes):
- bert-base-NER: ~400MB
- bart-large-mnli: ~1.6GB
- all-MiniLM-L6-v2: ~90MB

**Total disk space required**: ~2.1GB
