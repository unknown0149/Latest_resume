/**
 * Test Gemini AI Service
 * Quick test before full seeding
 */

import { generateLearningResources } from './src/services/geminiService.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.cyan}${'='.repeat(70)}`);
console.log('🧪 Testing Gemini AI Service');
console.log(`${'='.repeat(70)}${colors.reset}\n`);

async function testGemini() {
  try {
    // Test with React (popular skill)
    console.log(`${colors.blue}📚 Generating learning resources for: React (Beginner)${colors.reset}\n`);
    
    const resources = await generateLearningResources('React', 'Beginner');
    
    console.log(`${colors.green}✅ Success! Generated ${resources.length} resources:${colors.reset}\n`);
    
    resources.forEach((resource, idx) => {
      console.log(`${colors.yellow}Resource ${idx + 1}:${colors.reset}`);
      console.log(`  Type: ${resource.type}`);
      console.log(`  Title: ${resource.title}`);
      console.log(`  Platform: ${resource.platform}`);
      console.log(`  Duration: ${resource.duration}`);
      console.log(`  URL: ${resource.url.substring(0, 60)}...`);
      console.log();
    });

    console.log(`${colors.cyan}${'='.repeat(70)}`);
    console.log('✨ Gemini AI is working correctly!');
    console.log('Ready to run: node scripts/seedSkillRoadmaps.js');
    console.log(`${'='.repeat(70)}${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.yellow}❌ Error:${colors.reset}`, error.message);
    console.log('\n⚠️  Check your Gemini API key and internet connection');
  }
}

testGemini();
