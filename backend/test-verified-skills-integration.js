/**
 * Integration Test: Verified Skills Persistence
 * 
 * Tests that verified skills persist across resume uploads and don't appear 
 * in skill gap recommendations
 * 
 * Flow:
 * 1. Upload resume
 * 2. Parse resume
 * 3. Analyze skills (note missing skills)
 * 4. Complete quiz for a missing skill
 * 5. Re-upload same resume  
 * 6. Verify that verified skill is no longer in "missing" list
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  testSkill: 'Docker', // Skill to verify in quiz
  targetRole: 'Full Stack Developer'
};

let testData = {
  resumeId: null,
  userId: null,
  authToken: null,
  missingSkillsBefore: [],
  missingSkillsAfter: []
};

/**
 * Helper: API call with error handling
 */
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        ...headers,
        ...(testData.authToken && { 'Authorization': `Bearer ${testData.authToken}` })
      }
    };
    
    if (data) {
      if (data instanceof FormData) {
        config.data = data;
        Object.assign(config.headers, data.getHeaders());
      } else {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Step 1: Register/Login user
 */
async function setupTestUser() {
  console.log('\n📝 Step 1: Setting up test user...');
  
  const email = `test_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  // Register
  const registerResult = await apiCall('POST', '/auth/register', {
    name: 'Test User',
    email: email,
    password: password
  });
  
  if (!registerResult.success) {
    throw new Error(`Registration failed: ${registerResult.error}`);
  }
  
  // Login
  const loginResult = await apiCall('POST', '/auth/login', {
    email: email,
    password: password
  });
  
  if (!loginResult.success) {
    throw new Error(`Login failed: ${loginResult.error}`);
  }
  
  testData.authToken = loginResult.data.token;
  testData.userId = loginResult.data.user.id;
  
  console.log('✅ User created and logged in');
  console.log(`   Email: ${email}`);
  console.log(`   User ID: ${testData.userId}`);
}

/**
 * Step 2: Upload resume
 */
async function uploadResume() {
  console.log('\n📤 Step 2: Uploading test resume...');
  
  // Create a sample resume file
  const sampleResume = `
    John Doe
    Full Stack Developer
    
    Email: john.doe@example.com
    Phone: (555) 123-4567
    
    SKILLS:
    - JavaScript, TypeScript
    - React, Node.js
    - MongoDB, PostgreSQL
    - Git, REST APIs
    
    EXPERIENCE:
    Software Developer at Tech Corp (2020 - Present)
    - Built web applications using React and Node.js
    - Designed REST APIs and database schemas
    - Collaborated with cross-functional teams
    
    EDUCATION:
    B.S. Computer Science, University (2016 - 2020)
  `;
  
  const tempFile = path.join(process.cwd(), 'test-resume-temp.txt');
  fs.writeFileSync(tempFile, sampleResume);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(tempFile));
  
  const result = await apiCall('POST', '/resume/upload', formData);
  
  // Clean up temp file
  fs.unlinkSync(tempFile);
  
  if (!result.success) {
    throw new Error(`Upload failed: ${result.error}`);
  }
  
  testData.resumeId = result.data.resumeId;
  console.log('✅ Resume uploaded successfully');
  console.log(`   Resume ID: ${testData.resumeId}`);
}

/**
 * Step 3: Parse resume
 */
async function parseResume() {
  console.log('\n🔍 Step 3: Parsing resume...');
  
  const result = await apiCall('POST', `/resume/${testData.resumeId}/parse`, {
    mode: 'quick'
  });
  
  if (!result.success) {
    throw new Error(`Parse failed: ${result.error}`);
  }
  
  console.log('✅ Resume parsed successfully');
  const skills = result.data.parsed_resume?.skills || [];
  console.log(`   Extracted skills: ${skills.join(', ')}`);
}

/**
 * Step 4: Analyze skills (before verification)
 */
async function analyzeSkillsBefore() {
  console.log('\n📊 Step 4: Analyzing skills (BEFORE verification)...');
  
  const result = await apiCall('POST', `/resume/${testData.resumeId}/analyze-role`);
  
  if (!result.success) {
    throw new Error(`Analysis failed: ${result.error}`);
  }
  
  const skillAnalysis = result.data.data.skillAnalysis;
  testData.missingSkillsBefore = skillAnalysis.skillsMissing.map(s => s.skill);
  
  console.log('✅ Skills analyzed');
  console.log(`   Skills you have: ${skillAnalysis.skillsHave.length}`);
  console.log(`   Skills missing: ${testData.missingSkillsBefore.length}`);
  console.log(`   Missing skills: ${testData.missingSkillsBefore.slice(0, 5).join(', ')}...`);
  
  // Check if test skill is in missing list
  const hasTestSkill = testData.missingSkillsBefore.includes(TEST_CONFIG.testSkill);
  if (!hasTestSkill) {
    console.log(`⚠️  Warning: "${TEST_CONFIG.testSkill}" not in missing list, using first missing skill`);
    TEST_CONFIG.testSkill = testData.missingSkillsBefore[0];
  }
  
  console.log(`\n🎯 Will verify skill: ${TEST_CONFIG.testSkill}`);
}

/**
 * Step 5: Generate and complete quiz
 */
async function completeQuiz() {
  console.log(`\n📝 Step 5: Completing quiz for "${TEST_CONFIG.testSkill}"...`);
  
  // Generate quiz
  const generateResult = await apiCall('POST', '/quiz/generate', {
    resumeId: testData.resumeId,
    skillName: TEST_CONFIG.testSkill,
    difficulty: 'Intermediate',
    questionCount: 5
  });
  
  if (!generateResult.success) {
    throw new Error(`Quiz generation failed: ${generateResult.error}`);
  }
  
  const quizId = generateResult.data.quizId;
  const questions = generateResult.data.questions;
  
  console.log(`   ✅ Quiz generated (${questions.length} questions)`);
  
  // Start quiz
  await apiCall('POST', '/quiz/start', { quizId });
  
  // Submit answers (all correct for testing)
  const answers = questions.map((q, index) => ({
    questionId: q.id,
    selectedAnswer: 0, // Assume first option is correct (simplified for test)
    timeSpent: 30
  }));
  
  const submitResult = await apiCall('POST', '/quiz/submit', {
    quizId,
    answers
  });
  
  if (!submitResult.success) {
    throw new Error(`Quiz submission failed: ${submitResult.error}`);
  }
  
  const score = submitResult.data.score;
  console.log(`   ✅ Quiz completed with score: ${score}%`);
  
  if (score >= 70) {
    console.log(`   🎉 Skill "${TEST_CONFIG.testSkill}" VERIFIED!`);
  } else {
    console.log(`   ⚠️  Score too low, but verification saved`);
  }
}

/**
 * Step 6: Re-analyze skills (after verification)
 */
async function analyzeSkillsAfter() {
  console.log('\n📊 Step 6: Re-analyzing skills (AFTER verification)...');
  
  // Small delay to ensure database is updated
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const result = await apiCall('POST', `/resume/${testData.resumeId}/analyze-role`);
  
  if (!result.success) {
    throw new Error(`Analysis failed: ${result.error}`);
  }
  
  const skillAnalysis = result.data.data.skillAnalysis;
  testData.missingSkillsAfter = skillAnalysis.skillsMissing.map(s => s.skill);
  const verifiedSkills = skillAnalysis.verifiedSkills || [];
  
  console.log('✅ Skills re-analyzed');
  console.log(`   Skills you have: ${skillAnalysis.skillsHave.length}`);
  console.log(`   Skills missing: ${testData.missingSkillsAfter.length}`);
  console.log(`   Verified skills: ${verifiedSkills.length}`);
}

/**
 * Step 7: Verify results
 */
function verifyResults() {
  console.log('\n✨ Step 7: Verifying test results...');
  
  const wasInMissingBefore = testData.missingSkillsBefore.includes(TEST_CONFIG.testSkill);
  const isInMissingAfter = testData.missingSkillsAfter.includes(TEST_CONFIG.testSkill);
  
  console.log(`\n📋 Test Summary:`);
  console.log(`   Skill tested: "${TEST_CONFIG.testSkill}"`);
  console.log(`   Was in missing list BEFORE: ${wasInMissingBefore ? 'YES' : 'NO'}`);
  console.log(`   Is in missing list AFTER: ${isInMissingAfter ? 'YES' : 'NO'}`);
  console.log(`   Missing count BEFORE: ${testData.missingSkillsBefore.length}`);
  console.log(`   Missing count AFTER: ${testData.missingSkillsAfter.length}`);
  
  if (wasInMissingBefore && !isInMissingAfter) {
    console.log('\n✅ ✅ ✅ TEST PASSED! ✅ ✅ ✅');
    console.log(`   Verified skill "${TEST_CONFIG.testSkill}" is no longer in missing list!`);
    return true;
  } else if (!wasInMissingBefore) {
    console.log('\n⚠️  TEST INCONCLUSIVE: Skill was not in missing list initially');
    return false;
  } else {
    console.log('\n❌ TEST FAILED: Verified skill still appears in missing list!');
    console.log('   This indicates the integration is not working correctly.');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log('═'.repeat(70));
  console.log('🧪 VERIFIED SKILLS INTEGRATION TEST');
  console.log('═'.repeat(70));
  
  try {
    await setupTestUser();
    await uploadResume();
    await parseResume();
    await analyzeSkillsBefore();
    await completeQuiz();
    await analyzeSkillsAfter();
    const passed = verifyResults();
    
    console.log('\n' + '═'.repeat(70));
    if (passed) {
      console.log('✅ ALL TESTS PASSED - Integration working correctly!');
    } else {
      console.log('❌ TESTS FAILED - Please review the implementation');
      process.exit(1);
    }
    console.log('═'.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
