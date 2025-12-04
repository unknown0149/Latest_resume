/**
 * Detailed API Test for Watson X.ai and Gemini
 * Shows full error responses
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Watson X.ai
const WATSONX_API_KEY = process.env.WATSONX_API_KEY || 'hxc5jmpB4ayGh4zOTAl9ecnkMSR91iWR35gWxyixjGul';
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID || 'c16845a7-6cf1-408f-b6bf-5b684d165c3f';
const WATSONX_URL = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const WATSONX_MODEL_ID = 'ibm/granite-3-8b-instruct';

// Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDeZ38UOrh9oHXJ_-ClOUlZpqMrnFesrRQ';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

async function getWatsonIAMToken() {
  console.log('\n🔑 Getting Watson IAM token...');
  try {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSONX_API_KEY}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IAM token error:', errorText);
      throw new Error(`Failed to get IAM token: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ IAM token obtained successfully');
    console.log('Token expires in:', data.expires_in, 'seconds');
    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to get IAM token:', error.message);
    throw error;
  }
}

async function testWatsonX() {
  console.log('\n🔵 Testing Watson X.ai...');
  console.log('API Key:', WATSONX_API_KEY.substring(0, 20) + '...');
  console.log('Project ID:', WATSONX_PROJECT_ID);
  console.log('URL:', WATSONX_URL);
  console.log('Model:', WATSONX_MODEL_ID);

  try {
    // Get IAM token first
    const token = await getWatsonIAMToken();

    const response = await fetch(WATSONX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model_id: WATSONX_MODEL_ID,
        input: 'List 3 programming languages:',
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 200,
          temperature: 0.7
        },
        project_id: WATSONX_PROJECT_ID
      })
    });

    console.log('\nStatus:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse Body:');
    console.log(text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Success! Generated text:', data.results?.[0]?.generated_text);
    } else {
      console.log('\n❌ Failed:', text);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

async function testGemini() {
  console.log('\n🟢 Testing Google Gemini...');
  console.log('API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('URL:', GEMINI_URL);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'List 3 programming languages:' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    });

    console.log('\nStatus:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse Body:');
    console.log(text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Success! Generated text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('\n❌ Failed:', text);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

async function main() {
  console.log('🧪 Detailed API Testing\n');
  console.log('='.repeat(60));

  await testWatsonX();
  
  console.log('\n' + '='.repeat(60));
  
  await testGemini();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Testing complete!');
}

main();
