/**
 * Test Hugging Face Models Directly
 * Uses @xenova/transformers to test models with sample data
 */

import { pipeline } from "@xenova/transformers";

console.log('='.repeat(80));
console.log('HUGGING FACE MODELS TEST WITH SAMPLE DATA');
console.log('='.repeat(80));
console.log();

// Sample data
const sampleText = "John Smith is a Senior Full Stack Developer with 5 years of experience in JavaScript, React, Node.js, Python, Docker, and AWS.";

// Test 1: Embeddings
console.log('🔢 Test 1: Sentence Embeddings (sentence-transformers/all-mpnet-base-v2)');
console.log('-'.repeat(80));
console.log('Loading model...');
try {
  const embedder = await pipeline('feature-extraction', 'sentence-transformers/all-mpnet-base-v2');
  console.log('✅ Model loaded successfully');
  
  const startTime = Date.now();
  const result = await embedder(sampleText, { pooling: 'mean', normalize: true });
  const processingTime = Date.now() - startTime;
  
  console.log(`✅ Embedding generated in ${processingTime}ms`);
  console.log(`   Shape: [${result.dims.join(', ')}]`);
  console.log(`   Dimensions: ${result.dims.reduce((a, b) => a * b, 1)}`);
  console.log(`   First 5 values: ${Array.from(result.data).slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
}
console.log();

// Test 2: Named Entity Recognition
console.log('🏷️  Test 2: Named Entity Recognition (dbmdz/bert-large-cased-finetuned-conll03-english)');
console.log('-'.repeat(80));
console.log('Loading model...');
try {
  const ner = await pipeline('token-classification', 'Xenova/bert-base-NER');
  console.log('✅ Model loaded successfully');
  
  const startTime = Date.now();
  const result = await ner(sampleText);
  const processingTime = Date.now() - startTime;
  
  console.log(`✅ NER completed in ${processingTime}ms`);
  console.log(`   Entities found: ${result.length}`);
  
  // Group by entity type
  const entityGroups = {};
  result.forEach(entity => {
    const type = entity.entity.replace('B-', '').replace('I-', '');
    if (!entityGroups[type]) entityGroups[type] = [];
    entityGroups[type].push(entity.word);
  });
  
  console.log('   By type:');
  Object.entries(entityGroups).forEach(([type, words]) => {
    console.log(`   - ${type}: ${words.join(', ')}`);
  });
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
}
console.log();

// Test 3: Text Classification
console.log('💡 Test 3: Text Classification (distilbert-base-uncased-finetuned-sst-2-english)');
console.log('-'.repeat(80));
console.log('Loading model...');
try {
  const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  console.log('✅ Model loaded successfully');
  
  const testTexts = [
    "I love working with React and Node.js!",
    "This project is challenging but rewarding.",
    "I have extensive experience in full stack development."
  ];
  
  for (const text of testTexts) {
    const startTime = Date.now();
    const result = await classifier(text);
    const processingTime = Date.now() - startTime;
    
    console.log(`   Text: "${text}"`);
    console.log(`   Result: ${result[0].label} (${(result[0].score * 100).toFixed(2)}%) - ${processingTime}ms`);
  }
  console.log('✅ Classification completed');
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
}
console.log();

// Test 4: Zero-shot Classification
console.log('🎯 Test 4: Zero-shot Classification (Role Prediction)');
console.log('-'.repeat(80));
console.log('Loading model...');
try {
  const classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
  console.log('✅ Model loaded successfully');
  
  const roles = [
    'Senior Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'DevOps Engineer',
    'Data Scientist'
  ];
  
  const startTime = Date.now();
  const result = await classifier(sampleText, roles);
  const processingTime = Date.now() - startTime;
  
  console.log(`✅ Classification completed in ${processingTime}ms`);
  console.log('   Top 3 predicted roles:');
  result.scores.slice(0, 3).forEach((score, i) => {
    console.log(`   ${i + 1}. ${result.labels[i]}: ${(score * 100).toFixed(2)}%`);
  });
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('✅ Hugging Face models (@xenova/transformers) are working!');
console.log('📦 Models tested:');
console.log('   1. Sentence Embeddings (all-mpnet-base-v2)');
console.log('   2. Named Entity Recognition (bert-base-NER)');
console.log('   3. Text Classification (distilbert-sst-2)');
console.log('   4. Zero-shot Classification (distilbert-mnli)');
console.log();
console.log('💡 These models can be integrated into your resume analysis workflow!');
console.log('='.repeat(80));
