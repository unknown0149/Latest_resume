"""
Zero-Shot Classification Service
Classifies text into skill categories using facebook/bart-large-mnli
"""

import sys
import json
from transformers import pipeline

# Initialize zero-shot classification pipeline
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Common skill categories
DEFAULT_SKILLS = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
    'express', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'git', 'html', 'css', 'typescript', 
    'graphql', 'rest api', 'microservices', 'ci/cd', 'jenkins',
    'agile', 'scrum', 'sql', 'nosql', 'redis', 'elasticsearch',
    'machine learning', 'artificial intelligence', 'data science',
    'tensorflow', 'pytorch', 'spring boot', 'django', 'flask',
    'dotnet', 'c#', 'go', 'rust', 'php', 'ruby', 'rails'
]

def classify_skills(text, candidate_labels=None, threshold=0.5):
    """Classify text into skill categories"""
    try:
        if candidate_labels is None:
            candidate_labels = DEFAULT_SKILLS
        
        # Run classification
        results = classifier(text, candidate_labels, multi_label=True)
        
        # Filter by threshold and format results
        skills = []
        for label, score in zip(results['labels'], results['scores']):
            if score >= threshold:
                skills.append({
                    'skill': label,
                    'confidence': float(score),
                    'method': 'zero-shot-classification'
                })
        
        return {
            'success': True,
            'skills': skills,
            'count': len(skills)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'skills': []
        }

if __name__ == "__main__":
    # Read input from command line
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No input text provided'}))
        sys.exit(1)
    
    input_text = sys.argv[1]
    
    # Optional: custom threshold and skills
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    custom_skills = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
    
    result = classify_skills(input_text, custom_skills, threshold)
    print(json.dumps(result))
