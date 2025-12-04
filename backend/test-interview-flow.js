/**
 * Integration Test: Interview System End-to-End Flow
 * Tests the complete workflow from question generation to verification status
 */

import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

// Test configuration
const TEST_CONFIG = {
  resumeId: 'test-resume-' + Date.now(),
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python']
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    }
    if (data) config.data = data
    
    const response = await axios(config)
    return { success: true, data: response.data }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    }
  }
}

// Test functions
async function testGenerateInterview() {
  console.log('\n📝 Test 1: Generate Interview Questions')
  console.log('=' .repeat(60))
  
  const result = await apiCall('POST', '/interview/generate', {
    resumeId: TEST_CONFIG.resumeId,
    skills: TEST_CONFIG.skills,
    questionsPerSkill: 3,
    difficulty: { easy: 40, medium: 40, hard: 20 }
  })
  
  if (result.success) {
    const { sessionId, questions } = result.data
    TEST_CONFIG.sessionId = sessionId
    TEST_CONFIG.questions = questions
    
    console.log('✅ Interview generated successfully')
    console.log(`   Session ID: ${sessionId}`)
    console.log(`   Total Questions: ${questions.length}`)
    console.log(`   Skills Covered: ${[...new Set(questions.map(q => q.skill))].join(', ')}`)
    
    // Show sample questions
    console.log('\n📋 Sample Questions:')
    questions.slice(0, 3).forEach((q, idx) => {
      console.log(`\n${idx + 1}. [${q.difficulty.toUpperCase()}] ${q.skill}`)
      console.log(`   ${q.question}`)
      console.log(`   Options: ${q.options.join(' | ')}`)
    })
    
    return true
  } else {
    console.log('❌ Failed to generate interview:', result.error)
    return false
  }
}

async function testSubmitInterview() {
  console.log('\n\n📤 Test 2: Submit Interview Answers')
  console.log('=' .repeat(60))
  
  if (!TEST_CONFIG.sessionId || !TEST_CONFIG.questions) {
    console.log('❌ No session ID or questions available')
    return false
  }
  
  // Generate mock answers (mix of correct and incorrect)
  const answers = TEST_CONFIG.questions.map((q, idx) => ({
    questionId: q.id,
    selectedOption: ['A', 'B', 'C', 'D'][idx % 4] // Rotating answers
  }))
  
  const result = await apiCall('POST', '/interview/submit', {
    sessionId: TEST_CONFIG.sessionId,
    answers
  })
  
  if (result.success) {
    const { results } = result.data
    
    console.log('✅ Interview submitted successfully')
    console.log(`\n📊 Results:`)
    console.log(`   Score: ${results.score}%`)
    console.log(`   Correct Answers: ${results.correctAnswers}/${results.totalQuestions}`)
    console.log(`   Credibility Score: ${results.credibilityScore}/100`)
    
    if (results.badge) {
      console.log(`   Badge: ${results.badge.icon} ${results.badge.label} (${results.badge.level})`)
    }
    
    if (results.verifiedSkills?.length > 0) {
      console.log(`\n✅ Verified Skills (${results.verifiedSkills.length}):`)
      results.verifiedSkills.forEach(skill => {
        console.log(`   - ${skill.skill}: ${skill.score}%`)
      })
    }
    
    if (results.questionableSkills?.length > 0) {
      console.log(`\n⚠️  Questionable Skills (${results.questionableSkills.length}):`)
      results.questionableSkills.forEach(skill => {
        console.log(`   - ${skill.skill}: ${skill.score}%`)
      })
    }
    
    return true
  } else {
    console.log('❌ Failed to submit interview:', result.error)
    return false
  }
}

async function testVerificationStatus() {
  console.log('\n\n🔍 Test 3: Get Verification Status')
  console.log('=' .repeat(60))
  
  const result = await apiCall('GET', `/interview/status/${TEST_CONFIG.resumeId}`)
  
  if (result.success) {
    const { verification } = result.data
    
    console.log('✅ Verification status retrieved successfully')
    console.log(`\n📋 Status:`)
    console.log(`   Verified: ${verification.isVerified ? 'Yes' : 'No'}`)
    console.log(`   Credibility Score: ${verification.credibilityScore}/100`)
    console.log(`   Trust Level: ${verification.trustLevel}`)
    console.log(`   Total Interviews: ${verification.totalInterviews}`)
    
    if (verification.badge) {
      console.log(`   Badge: ${verification.badge.icon} ${verification.badge.label}`)
    }
    
    if (verification.verifiedSkills?.length > 0) {
      console.log(`\n✅ Verified Skills (${verification.verifiedSkills.length}):`)
      verification.verifiedSkills.forEach(skill => {
        console.log(`   - ${skill.skill}: ${skill.score}%`)
      })
    }
    
    if (verification.lastInterviewAt) {
      console.log(`\n⏰ Last Interview: ${new Date(verification.lastInterviewAt).toLocaleString()}`)
    }
    
    return true
  } else {
    console.log('❌ Failed to get verification status:', result.error)
    return false
  }
}

async function testJobSpecificInterview() {
  console.log('\n\n💼 Test 4: Job-Specific Interview')
  console.log('=' .repeat(60))
  
  const result = await apiCall('POST', '/interview/job-apply', {
    resumeId: TEST_CONFIG.resumeId,
    jobId: 'test-job-001',
    questionsPerSkill: 5,
    difficulty: { easy: 30, medium: 50, hard: 20 }
  })
  
  if (result.success) {
    const { sessionId, questions } = result.data
    
    console.log('✅ Job-specific interview generated')
    console.log(`   Session ID: ${sessionId}`)
    console.log(`   Total Questions: ${questions.length}`)
    console.log(`   Questions per skill: 5 (stricter evaluation)`)
    
    return true
  } else {
    console.log('❌ Failed to generate job-specific interview:', result.error)
    return false
  }
}

async function testFieldDetection() {
  console.log('\n\n🌍 Test 5: Universal Field Detection')
  console.log('=' .repeat(60))
  
  const multiFieldSkills = [
    'JavaScript', // IT
    'Financial Accounting', // Finance
    'Fashion Design', // Fashion
    'Marketing Strategy', // Marketing
    'Patient Care', // Healthcare
    'Contract Law', // Law
    'Curriculum Development', // Education
    'Painting', // Arts
    'Business Strategy', // Business
    'Economics' // Commerce
  ]
  
  const result = await apiCall('POST', '/interview/generate', {
    resumeId: 'multi-field-test',
    skills: multiFieldSkills,
    questionsPerSkill: 2
  })
  
  if (result.success) {
    const { questions } = result.data
    const fields = [...new Set(questions.map(q => q.skill))]
    
    console.log('✅ Multi-field interview generated')
    console.log(`   Total Questions: ${questions.length}`)
    console.log(`   Fields Covered: ${fields.length}`)
    console.log(`\n📚 Detected Fields:`)
    fields.forEach(field => {
      console.log(`   - ${field}`)
    })
    
    return true
  } else {
    console.log('❌ Failed to test field detection:', result.error)
    return false
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Interview System Integration Tests')
  console.log('=' .repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Test Resume ID: ${TEST_CONFIG.resumeId}`)
  console.log(`Test Skills: ${TEST_CONFIG.skills.join(', ')}`)
  
  const tests = [
    { name: 'Generate Interview', fn: testGenerateInterview },
    { name: 'Submit Interview', fn: testSubmitInterview },
    { name: 'Verification Status', fn: testVerificationStatus },
    { name: 'Job-Specific Interview', fn: testJobSpecificInterview },
    { name: 'Field Detection', fn: testFieldDetection }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await test.fn()
    if (result) {
      passed++
    } else {
      failed++
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // Delay between tests
  }
  
  console.log('\n\n🎯 Test Summary')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${passed}/${tests.length}`)
  console.log(`❌ Failed: ${failed}/${tests.length}`)
  console.log(`📊 Success Rate: ${Math.round((passed / tests.length) * 100)}%`)
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! Interview system is fully functional.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.')
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error during tests:', error)
  process.exit(1)
})
