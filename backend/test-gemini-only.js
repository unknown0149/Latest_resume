/**
 * Test Google Gemini API Only
 * Check if Gemini API key is valid and can generate learning resources
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDeZ38UOrh9oHXJ_-ClOUlZpqMrnFesrRQ';

async function testGeminiModels() {
  console.log('🔍 Testing available Gemini models...\n');
  
  // Test different model endpoints
  const models = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro'
  ];

  for (const model of models) {
    try {
      console.log(`\n📝 Testing model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'List 3 programming languages:' }]
          }]
        })
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`✅ SUCCESS! Response: ${text?.substring(0, 100)}...`);
        return { model, works: true };
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed: ${errorText.substring(0, 150)}...`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  return null;
}

async function testLearningResources(model) {
  console.log(`\n\n🎯 Testing Learning Resources Generation with ${model}...\n`);
  
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `You are an expert learning resource curator. Generate the TOP 10 FREE learning resources for the skill "React" at Beginner level.

Requirements:
1. Focus on HIGH-QUALITY, FREE resources only
2. Include a mix of:
   - YouTube tutorials/courses (4-5 resources)
   - Official documentation (1-2 resources)
   - Interactive platforms like freeCodeCamp, Scrimba, Codecademy (2-3 resources)
   - Articles/guides (1-2 resources)
3. Prefer resources from reputable sources (freeCodeCamp, Traversy Media, Fireship, The Net Ninja, official docs)

Format your response EXACTLY as JSON array (no markdown, no code blocks):
[
  {
    "type": "video",
    "title": "React Crash Course 2024",
    "url": "https://youtube.com/watch?v=example",
    "platform": "YouTube - Traversy Media",
    "duration": "2 hours"
  }
]

Generate 10 resources for "React" (Beginner level):`;

  try {
    console.log('📤 Sending request to Gemini...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed: ${errorText}`);
      return;
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('\n📥 Raw Response:');
    console.log(text.substring(0, 500) + '...\n');

    // Clean and parse JSON
    text = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const resources = JSON.parse(jsonMatch[0]);
      console.log(`\n✅ Successfully parsed ${resources.length} resources:\n`);
      
      resources.slice(0, 5).forEach((resource, index) => {
        console.log(`${index + 1}. [${resource.type}] ${resource.title}`);
        console.log(`   Platform: ${resource.platform}`);
        console.log(`   Duration: ${resource.duration}`);
        console.log(`   URL: ${resource.url}\n`);
      });
      
      if (resources.length > 5) {
        console.log(`... and ${resources.length - 5} more resources\n`);
      }

      console.log('✅ Gemini is working perfectly for learning resources!');
      return true;
    } else {
      console.log('❌ Could not extract JSON from response');
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testInterviewQuestions(model) {
  console.log(`\n\n💼 Testing Interview Questions Generation with ${model}...\n`);
  
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `You are an expert technical interviewer. Generate 5 interview questions for "JavaScript" at Intermediate level.

Format your response EXACTLY as JSON array:
[
  {
    "question": "What is the virtual DOM in React?",
    "type": "theoretical",
    "difficulty": "easy",
    "answer": "Brief answer explaining the concept"
  }
]

Generate 5 questions for "JavaScript" (Intermediate):`;

  try {
    console.log('📤 Sending request to Gemini...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed: ${errorText}`);
      return false;
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Clean and parse JSON
    text = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      console.log(`\n✅ Successfully parsed ${questions.length} questions:\n`);
      
      questions.forEach((q, index) => {
        console.log(`${index + 1}. [${q.type}] ${q.difficulty}`);
        console.log(`   Q: ${q.question}`);
        console.log(`   A: ${q.answer?.substring(0, 80)}...\n`);
      });

      console.log('✅ Gemini is working for interview questions!');
      return true;
    } else {
      console.log('❌ Could not extract JSON from response');
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Google Gemini API');
  console.log('='.repeat(60));
  console.log(`API Key: ${GEMINI_API_KEY.substring(0, 20)}...`);
  console.log('='.repeat(60));

  // Step 1: Find working model
  const result = await testGeminiModels();
  
  if (!result) {
    console.log('\n❌ No working Gemini model found!');
    console.log('⚠️  Please check:');
    console.log('   1. API key is valid');
    console.log('   2. Gemini API is enabled in Google Cloud Console');
    console.log('   3. You have billing enabled (required for Gemini API)');
    return;
  }

  console.log(`\n✅ Found working model: ${result.model}`);

  // Step 2: Test learning resources
  const resourcesWork = await testLearningResources(result.model);

  // Step 3: Test interview questions
  const questionsWork = await testInterviewQuestions(result.model);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Working Model: ${result.model}`);
  console.log(`Learning Resources: ${resourcesWork ? '✅ Working' : '❌ Failed'}`);
  console.log(`Interview Questions: ${questionsWork ? '✅ Working' : '❌ Failed'}`);
  console.log('='.repeat(60));

  if (resourcesWork && questionsWork) {
    console.log('\n🎉 Gemini API is fully functional!');
    console.log(`\n💡 Update your service to use: ${result.model}`);
  } else {
    console.log('\n⚠️  Gemini API has issues. Watson X.ai is recommended as primary.');
  }
}

main();
