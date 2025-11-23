/**
 * Comprehensive AI Models Test
 * Tests all AI/ML components in the system
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('='.repeat(80));
console.log('AI MODELS CONFIGURATION TEST');
console.log('='.repeat(80));
console.log();

// Test 1: Google Gemini API (for embeddings)
console.log('📊 Test 1: Google Gemini API Configuration');
console.log('-'.repeat(80));
const googleApiKey = process.env.GOOGLE_API_KEY?.trim();
if (googleApiKey && googleApiKey.length > 0) {
  console.log('✅ Google API Key: CONFIGURED');
  console.log(`   - Key preview: ${googleApiKey.substring(0, 10)}...`);
  console.log('   - Usage: Generating embeddings for semantic matching');
  console.log('   - Model: text-embedding-004');
} else {
  console.log('❌ Google API Key: NOT CONFIGURED');
  console.log('   - Status: Using mock embeddings (limited accuracy)');
  console.log('   - Impact: Job matching will use rule-based scoring only');
  console.log('   - Fix: Set GOOGLE_API_KEY in .env file');
  console.log('   - Get key from: https://makersuite.google.com/app/apikey');
}
console.log();

// Test 2: IBM Watson X.ai (for LLM parsing)
console.log('🤖 Test 2: IBM Watson X.ai Configuration');
console.log('-'.repeat(80));
const ibmApiKey = process.env.IBM_API_KEY?.trim();
const ibmProjectId = process.env.IBM_PROJECT_ID?.trim();
const ibmUrl = process.env.IBM_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const ibmModel = process.env.IBM_MODEL_ID || 'ibm/granite-3-8b-instruct';

if (ibmApiKey && ibmProjectId) {
  console.log('✅ IBM Watson X.ai: CONFIGURED');
  console.log(`   - API Key preview: ${ibmApiKey.substring(0, 10)}...`);
  console.log(`   - Project ID: ${ibmProjectId}`);
  console.log(`   - Model: ${ibmModel}`);
  console.log(`   - Endpoint: ${ibmUrl}`);
  console.log('   - Usage: Advanced resume parsing, role prediction');
} else {
  console.log('❌ IBM Watson X.ai: NOT CONFIGURED');
  console.log('   - Status: Using regex-only parsing (limited accuracy)');
  console.log('   - Impact: Resume parsing will miss complex information');
  console.log('   - Fix: Set IBM_API_KEY and IBM_PROJECT_ID in .env file');
  console.log('   - Get credentials from: https://cloud.ibm.com/');
}
console.log();

// Test 3: System Features Status
console.log('⚙️  Test 3: System Features Status');
console.log('-'.repeat(80));

const features = [
  {
    name: 'Resume Text Extraction',
    status: 'active',
    description: 'PDF/DOCX parsing with fallback',
    requirements: 'None (built-in)'
  },
  {
    name: 'Regex-based Parsing',
    status: 'active',
    description: 'Extract skills, contact, education',
    requirements: 'None (built-in)'
  },
  {
    name: 'AI Resume Parsing',
    status: (ibmApiKey && ibmProjectId) ? 'active' : 'disabled',
    description: 'Advanced parsing with Watson X.ai',
    requirements: 'IBM Watson API'
  },
  {
    name: 'Semantic Job Matching',
    status: googleApiKey ? 'active' : 'degraded',
    description: 'Vector similarity matching',
    requirements: 'Google Gemini API'
  },
  {
    name: 'Rule-based Matching',
    status: 'active',
    description: 'Keyword and skill matching',
    requirements: 'None (built-in)'
  },
  {
    name: 'Role Prediction',
    status: (ibmApiKey && ibmProjectId) ? 'active' : 'disabled',
    description: 'AI-powered career role analysis',
    requirements: 'IBM Watson API'
  }
];

features.forEach(feature => {
  const statusIcon = feature.status === 'active' ? '✅' : 
                     feature.status === 'degraded' ? '⚠️' : '❌';
  console.log(`${statusIcon} ${feature.name}: ${feature.status.toUpperCase()}`);
  console.log(`   ${feature.description}`);
  if (feature.status !== 'active') {
    console.log(`   Required: ${feature.requirements}`);
  }
});
console.log();

// Test 4: Summary and Recommendations
console.log('📋 Test 4: Summary and Recommendations');
console.log('-'.repeat(80));

const allConfigured = googleApiKey && ibmApiKey && ibmProjectId;
const someConfigured = googleApiKey || (ibmApiKey && ibmProjectId);

if (allConfigured) {
  console.log('✅ All AI models are configured!');
  console.log('   Your system has full AI capabilities enabled.');
} else if (someConfigured) {
  console.log('⚠️  Some AI models are configured');
  console.log('   Your system has partial AI capabilities.');
  console.log();
  console.log('   To enable full functionality:');
  if (!googleApiKey) {
    console.log('   1. Get Google API key from: https://makersuite.google.com/app/apikey');
    console.log('      Add to .env: GOOGLE_API_KEY=your_key_here');
  }
  if (!ibmApiKey || !ibmProjectId) {
    console.log('   2. Get IBM Watson credentials from: https://cloud.ibm.com/');
    console.log('      Add to .env: IBM_API_KEY=your_key_here');
    console.log('                   IBM_PROJECT_ID=your_project_id_here');
  }
} else {
  console.log('❌ No AI models configured');
  console.log('   Your system is running with basic functionality only.');
  console.log();
  console.log('   Current capabilities:');
  console.log('   ✅ Resume text extraction from PDF/DOCX');
  console.log('   ✅ Basic regex-based parsing (skills, contact, education)');
  console.log('   ✅ Rule-based job matching (keyword/skill matching)');
  console.log();
  console.log('   Disabled features:');
  console.log('   ❌ AI-powered resume parsing (missing Watson)');
  console.log('   ❌ Semantic similarity matching (missing Google API)');
  console.log('   ❌ AI role prediction (missing Watson)');
  console.log();
  console.log('   To enable AI features:');
  console.log('   1. Get Google API key: https://makersuite.google.com/app/apikey');
  console.log('   2. Get IBM Watson credentials: https://cloud.ibm.com/');
  console.log('   3. Add to backend/.env file');
}

console.log();
console.log('='.repeat(80));
console.log('MODELS USED IN THIS SYSTEM:');
console.log('='.repeat(80));
console.log('1. Google Gemini (text-embedding-004) - For semantic embeddings');
console.log('2. IBM Watson X.ai (granite-3-8b-instruct) - For LLM parsing');
console.log();
console.log('NOTE: This system does NOT use Hugging Face models.');
console.log('='.repeat(80));
