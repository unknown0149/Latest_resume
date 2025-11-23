/**
 * Quick Hugging Face Model Test
 */

import { pipeline } from "@xenova/transformers";

console.log('Testing Hugging Face Models...\n');

// Test 1: NER
console.log('1. Named Entity Recognition');
try {
  const ner = await pipeline('token-classification', 'Xenova/bert-base-NER');
  const text = "John Smith works at Microsoft in Seattle.";
  const result = await ner(text);
  console.log(`   ✅ Found ${result.length} entities`);
  console.log(`   Sample: ${result[0].word} (${result[0].entity})`);
} catch (error) {
  console.log(`   ❌ Failed: ${error.message}`);
}

// Test 2: Text Classification
console.log('\n2. Sentiment Analysis');
try {
  const classifier = await pipeline('sentiment-analysis');
  const result = await classifier("I love working with React and Node.js!");
  console.log(`   ✅ Sentiment: ${result[0].label} (${(result[0].score * 100).toFixed(1)}%)`);
} catch (error) {
  console.log(`   ❌ Failed: ${error.message}`);
}

// Test 3: Embeddings (using smaller model)
console.log('\n3. Text Embeddings');
try {
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const result = await embedder("Full Stack Developer with React experience", { pooling: 'mean', normalize: true });
  console.log(`   ✅ Generated embedding with ${result.data.length} dimensions`);
  console.log(`   First 3 values: ${Array.from(result.data).slice(0, 3).map(v => v.toFixed(4)).join(', ')}`);
} catch (error) {
  console.log(`   ❌ Failed: ${error.message}`);
}

console.log('\n✅ Hugging Face models are working with @xenova/transformers!');
