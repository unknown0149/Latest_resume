/**
 * Debug Script - Test Analyze Endpoint
 * Run with: node test-analyze.js <resumeId>
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const resumeId = process.argv[2] || 'test-resume-id';

async function testAnalyze() {
  console.log('🔍 Testing analyze endpoint...\n');
  console.log(`Resume ID: ${resumeId}\n`);

  try {
    // Test 1: Check if resume exists
    console.log('📋 Step 1: Checking if resume exists...');
    try {
      const resumeCheck = await axios.get(`${BASE_URL}/resume/${resumeId}`);
      console.log('✅ Resume found:', resumeCheck.data.resumeId);
      console.log('   - Has parsed data:', !!resumeCheck.data.parsed_resume);
      console.log('   - Skills:', resumeCheck.data.parsed_resume?.skills?.length || 0);
    } catch (err) {
      console.log('❌ Resume not found:', err.response?.data?.error || err.message);
      console.log('\n💡 Tip: First upload a resume using the frontend or run:');
      console.log('   curl -X POST http://localhost:8000/api/resume/upload -F "file=@resume.pdf"');
      return;
    }

    // Test 2: Try to analyze role
    console.log('\n🎯 Step 2: Analyzing role...');
    const analyzeResponse = await axios.post(`${BASE_URL}/resume/${resumeId}/analyze-role`);
    
    console.log('✅ Analysis successful!');
    console.log('\n📊 Results:');
    console.log('   Primary Role:', analyzeResponse.data.data.rolePrediction.primaryRole.name);
    console.log('   Match Score:', analyzeResponse.data.data.rolePrediction.primaryRole.matchPercentage + '%');
    console.log('   Skills Have:', analyzeResponse.data.data.skillAnalysis.skillsHave.length);
    console.log('   Skills Missing:', analyzeResponse.data.data.skillAnalysis.skillsMissing.length);
    console.log('   Watson Used:', analyzeResponse.data.data.rolePrediction.metadata.watsonUsed);

  } catch (error) {
    console.log('\n❌ Error during analysis:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.error || error.message);
    console.log('   Stack:', error.response?.data?.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server is not running! Start it with:');
      console.log('   cd backend && npm run dev');
    }
  }
}

testAnalyze();
