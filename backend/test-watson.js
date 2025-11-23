/**
 * IBM Watson X.ai API Key Verification Test
 * Tests if the configured API credentials are working correctly
 */

import 'dotenv/config';
import https from 'https';

// Load credentials from .env
const IBM_API_KEY = process.env.IBM_API_KEY;
const IBM_PROJECT_ID = process.env.IBM_PROJECT_ID;
const IBM_MODEL_ID = process.env.IBM_MODEL_ID || 'ibm/granite-3-8b-instruct';

console.log('='.repeat(60));
console.log('IBM Watson X.ai API Key Verification Test');
console.log('='.repeat(60));
console.log();

// Question 1: Check if environment variables are loaded
console.log('📋 Question 1: Are environment variables loaded?');
console.log('-'.repeat(60));
console.log(`IBM_API_KEY exists: ${IBM_API_KEY ? '✅ YES' : '❌ NO'}`);
console.log(`IBM_API_KEY length: ${IBM_API_KEY ? IBM_API_KEY.length : 0} characters`);
console.log(`IBM_API_KEY preview: ${IBM_API_KEY ? IBM_API_KEY.substring(0, 10) + '...' : 'NOT FOUND'}`);
console.log();
console.log(`IBM_PROJECT_ID exists: ${IBM_PROJECT_ID ? '✅ YES' : '❌ NO'}`);
console.log(`IBM_PROJECT_ID: ${IBM_PROJECT_ID || 'NOT FOUND'}`);
console.log();
console.log(`IBM_MODEL_ID: ${IBM_MODEL_ID}`);
console.log();

if (!IBM_API_KEY || !IBM_PROJECT_ID) {
  console.error('❌ ERROR: Missing required environment variables');
  console.error('Please check your .env file in the backend directory');
  process.exit(1);
}

// Question 2: Get IAM access token
console.log('📋 Question 2: Can we get an IAM access token?');
console.log('-'.repeat(60));

const getIAMToken = () => {
  return new Promise((resolve, reject) => {
    const tokenData = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_API_KEY}`;
    
    const tokenOptions = {
      hostname: 'iam.cloud.ibm.com',
      path: '/identity/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(tokenData)
      }
    };

    console.log('Requesting IAM token from IBM Cloud...');
    
    const req = https.request(tokenOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Successfully obtained IAM token');
            console.log(`Token type: ${response.token_type}`);
            console.log(`Expires in: ${response.expires_in} seconds`);
            console.log();
            resolve(response.access_token);
          } catch (error) {
            reject(new Error('Failed to parse IAM token response: ' + error.message));
          }
        } else {
          reject(new Error(`IAM token request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error('Network error while getting IAM token: ' + error.message));
    });
    
    req.write(tokenData);
    req.end();
  });
};

// Question 3: Test Watson API with IAM token
const testWatsonAPI = (iamToken) => {
  console.log('📋 Question 3: Can we connect to IBM Watson X.ai API?');
  console.log('-'.repeat(60));

  const testPrompt = 'Hello! Please respond with "API is working" if you can read this message.';

  const requestData = JSON.stringify({
    input: testPrompt,
    parameters: {
      max_new_tokens: 50,
      temperature: 0.1,
      return_options: {
        input_text: false
      }
    },
    model_id: IBM_MODEL_ID,
    project_id: IBM_PROJECT_ID
  });

  const options = {
    hostname: 'us-south.ml.cloud.ibm.com',
    path: '/ml/v1/text/generation?version=2023-05-29',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${iamToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };

  console.log('Sending test request...');
  console.log(`Endpoint: https://${options.hostname}${options.path}`);
  console.log(`Model: ${IBM_MODEL_ID}`);
  console.log();

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Response Status Code: ${res.statusCode}`);
      console.log();

      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          
          console.log('✅ SUCCESS: Watson X.ai API is working!');
          console.log();
          console.log('📋 Question 4: What did the AI respond?');
          console.log('-'.repeat(60));
          
          if (response.results && response.results.length > 0) {
            const generatedText = response.results[0].generated_text;
            console.log('AI Response:', generatedText);
            console.log();
            console.log('Token Usage:');
            console.log(`  - Input tokens: ${response.results[0].input_token_count || 'N/A'}`);
            console.log(`  - Generated tokens: ${response.results[0].generated_token_count || 'N/A'}`);
            console.log();
            console.log('Model Info:');
            console.log(`  - Model ID: ${response.model_id || 'N/A'}`);
            console.log(`  - Created At: ${response.created_at || 'N/A'}`);
          } else {
            console.log('⚠️ WARNING: Response received but no results found');
            console.log('Full response:', JSON.stringify(response, null, 2));
          }
          
          console.log();
          console.log('='.repeat(60));
          console.log('✅ ALL TESTS PASSED!');
          console.log('IBM Watson X.ai API is ready for Phase 2 implementation');
          console.log('='.repeat(60));
          
        } catch (error) {
          console.error('❌ ERROR: Failed to parse API response');
          console.error('Error:', error.message);
          console.error('Raw response:', data);
        }
      } else {
        console.error(`❌ ERROR: Watson API request failed with status ${res.statusCode}`);
        console.error('Response:', data);
        
        try {
          const errorResponse = JSON.parse(data);
          if (errorResponse.errors) {
            console.error('Error details:', JSON.stringify(errorResponse.errors, null, 2));
          }
        } catch (e) {
          // Response is not JSON
        }
        
        console.log();
        console.log('Troubleshooting:');
        console.log('1. Verify project ID is correct');
        console.log('2. Check IBM Cloud account status and billing');
        console.log('3. Ensure model ID is available: ' + IBM_MODEL_ID);
        console.log('4. Verify IAM token has proper permissions');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ ERROR: Network request failed');
    console.error('Error:', error.message);
    console.log();
    console.log('Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify firewall is not blocking the request');
    console.log('3. Check if IBM Watson endpoint is accessible');
  });

  req.write(requestData);
  req.end();
};

// Run the test
getIAMToken()
  .then(token => testWatsonAPI(token))
  .catch(error => {
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
    console.log();
    console.log('Please check:');
    console.log('1. API key is correct in .env file');
    console.log('2. API key has not expired');
    console.log('3. IBM Cloud account is active');
    console.log('4. You have internet connectivity');
  });
