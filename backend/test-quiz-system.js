/**
 * Test Quiz System
 * Tests MCQ quiz generation, submission, and scoring
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8000/api';

// Test resume ID (replace with actual one from your database)
const TEST_RESUME_ID = 'test_resume_123';

async function testQuizSystem() {
  console.log('🧪 Testing Quiz System\n');
  
  try {
    // ========================================================================
    // TEST 1: Generate Quiz
    // ========================================================================
    console.log('1️⃣ Generating quiz for React skill...');
    
    const generateResponse = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: TEST_RESUME_ID,
        skillName: 'React',
        difficulty: 'Intermediate',
        questionCount: 5,
        timeLimit: 30
      })
    });
    
    const quizData = await generateResponse.json();
    console.log('✅ Quiz generated:', JSON.stringify(quizData, null, 2));
    
    if (!quizData.success) {
      throw new Error('Quiz generation failed');
    }
    
    const quizId = quizData.quizId;
    console.log(`\n📝 Quiz ID: ${quizId}\n`);
    
    // ========================================================================
    // TEST 2: Start Quiz
    // ========================================================================
    console.log('2️⃣ Starting quiz...');
    
    const startResponse = await fetch(`${API_BASE}/quiz/start/${quizId}`, {
      method: 'POST'
    });
    
    const startData = await startResponse.json();
    console.log('✅ Quiz started:', JSON.stringify(startData, null, 2));
    
    // ========================================================================
    // TEST 3: Simulate User Answering Questions
    // ========================================================================
    console.log('\n3️⃣ Simulating user answers...');
    
    // Generate random answers (for testing - real app would get user input)
    const answers = quizData.questions.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: Math.floor(Math.random() * 4), // Random answer 0-3
      timeSpent: Math.floor(Math.random() * 60) + 30 // 30-90 seconds
    }));
    
    console.log('📊 Sample answers:', JSON.stringify(answers.slice(0, 2), null, 2));
    
    // ========================================================================
    // TEST 4: Submit Quiz
    // ========================================================================
    console.log('\n4️⃣ Submitting quiz...');
    
    const submitResponse = await fetch(`${API_BASE}/quiz/submit/${quizId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    
    const results = await submitResponse.json();
    console.log('✅ Quiz results:', JSON.stringify(results, null, 2));
    
    console.log('\n📈 Score Summary:');
    console.log(`   Score: ${results.score}%`);
    console.log(`   Correct: ${results.correctAnswers}/${results.totalQuestions}`);
    console.log(`   Time: ${results.timeSpent}s`);
    console.log(`   Proficiency: ${results.feedback?.proficiencyLevel}`);
    
    // ========================================================================
    // TEST 5: Get Quiz History
    // ========================================================================
    console.log('\n5️⃣ Getting quiz history...');
    
    const historyResponse = await fetch(`${API_BASE}/quiz/history/${TEST_RESUME_ID}?limit=5`);
    const historyData = await historyResponse.json();
    
    console.log('✅ Quiz history:', JSON.stringify(historyData, null, 2));
    
    // ========================================================================
    // TEST 6: Get Skill Statistics
    // ========================================================================
    console.log('\n6️⃣ Getting skill statistics...');
    
    const statsResponse = await fetch(`${API_BASE}/quiz/stats/${TEST_RESUME_ID}/React`);
    const statsData = await statsResponse.json();
    
    console.log('✅ Skill stats:', JSON.stringify(statsData, null, 2));
    
    // ========================================================================
    // TEST 7: Retrieve Quiz with Answers
    // ========================================================================
    console.log('\n7️⃣ Retrieving completed quiz...');
    
    const getQuizResponse = await fetch(`${API_BASE}/quiz/${quizId}?includeAnswers=true`);
    const quizDetails = await getQuizResponse.json();
    
    console.log('✅ Quiz details retrieved');
    console.log(`   Questions with answers: ${quizDetails.quiz.questions?.length || 0}`);
    
    console.log('\n✅ All tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testQuizSystem();
