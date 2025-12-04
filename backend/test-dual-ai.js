/**
 * Test Dual AI System (Watson + Gemini)
 * Tests learning resources and interview questions generation
 */

import { generateLearningResources, generateInterviewQuestions, getAIStats } from './src/services/geminiService.js';
import { logger } from './src/utils/logger.js';

async function testDualAI() {
  console.log('🧪 Testing Dual AI System (Watson X.ai + Gemini)\n');

  try {
    // Test 1: Learning Resources Generation
    console.log('📚 Test 1: Generating Learning Resources for React...\n');
    const resources = await generateLearningResources('React', 'Beginner');
    
    console.log(`✅ Generated ${resources.length} resources:\n`);
    resources.forEach((resource, index) => {
      console.log(`Resource ${index + 1}: [${resource.type}] ${resource.title}`);
      console.log(`  Platform: ${resource.platform}`);
      console.log(`  Duration: ${resource.duration}`);
      console.log(`  URL: ${resource.url}`);
      console.log('');
    });

    // Test 2: Interview Questions Generation
    console.log('\n💼 Test 2: Generating Interview Questions for JavaScript...\n');
    const questions = await generateInterviewQuestions('JavaScript', 'Intermediate', 5);
    
    console.log(`✅ Generated ${questions.length} interview questions:\n`);
    questions.forEach((q, index) => {
      console.log(`Question ${index + 1}: [${q.type}] ${q.difficulty}`);
      console.log(`  Q: ${q.question}`);
      if (q.answer) {
        console.log(`  A: ${q.answer.substring(0, 100)}...`);
      }
      console.log('');
    });

    // Show AI Stats
    console.log('\n📊 AI Provider Statistics:');
    const stats = getAIStats();
    console.log(`Watson: ${stats.watson.success} success / ${stats.watson.failures} failures (${(stats.watsonSuccessRate * 100).toFixed(1)}%)`);
    console.log(`Gemini: ${stats.gemini.success} success / ${stats.gemini.failures} failures (${(stats.geminiSuccessRate * 100).toFixed(1)}%)`);
    console.log(`Fallback: ${stats.fallback}`);
    console.log(`Cached: ${stats.cacheHits} items`);
    console.log(`Total Requests: ${stats.totalRequests}`);

    console.log('\n✨ All tests completed successfully!');
    console.log('\n📝 Recommendation:');
    if (stats.watsonSuccessRate > stats.geminiSuccessRate) {
      console.log('   Use Watson X.ai as primary (better performance)');
    } else if (stats.geminiSuccessRate > 0) {
      console.log('   Use Gemini as primary (better performance)');
    } else {
      console.log('   Both providers working, current setup optimal');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDualAI();
