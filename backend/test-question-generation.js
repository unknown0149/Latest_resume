/**
 * Test Watson Alternative - Question Generation using Xenova Transformers
 * Testing if we can generate questions using local AI models
 */

import { pipeline } from '@xenova/transformers';

async function testQuestionGeneration() {
  console.log('Testing AI Question Generation...\n');
  
  try {
    // Test 1: Text generation with Flan-T5 (good for question generation)
    console.log('1. Loading text generation model (Xenova/flan-t5-small)...');
    const generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
    
    // Test generating questions for different fields
    const testCases = [
      { skill: 'Python Programming', field: 'IT' },
      { skill: 'Financial Accounting', field: 'Finance' },
      { skill: 'Fashion Design Principles', field: 'Fashion' },
      { skill: 'Marketing Strategy', field: 'Marketing' }
    ];
    
    for (const test of testCases) {
      console.log(`\n--- Testing ${test.skill} (${test.field}) ---`);
      
      const prompt = `Generate a multiple choice question about ${test.skill}. 
Question: What is an important concept in ${test.skill}?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct Answer: A`;
      
      const result = await generator(prompt, {
        max_length: 200,
        temperature: 0.7,
        do_sample: true
      });
      
      console.log('Generated:', result[0].generated_text);
    }
    
    console.log('\n✅ Question generation successful! Using Flan-T5 model.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nFalling back to template-based generation...');
  }
}

testQuestionGeneration();
