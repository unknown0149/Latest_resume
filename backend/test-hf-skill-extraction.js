/**
 * Test HuggingFace Skill Extraction
 * Tests NER-based skill extraction from job descriptions
 */

import { extractJobSkills, extractSkillsWithNER, getProviderStats } from './src/services/aiRouter.js';

async function testHFSkillExtraction() {
  console.log('🧪 Testing HuggingFace Skill Extraction\n');
  
  try {
    // ========================================================================
    // TEST 1: Extract skills from job description using zero-shot
    // ========================================================================
    console.log('1️⃣ Testing Job Skill Extraction (Zero-Shot Classification)...\n');
    
    const jobDescription = `
      We are looking for a Senior Full Stack Developer with strong experience in:
      - React, TypeScript, and Node.js
      - MongoDB and PostgreSQL databases
      - AWS cloud services (EC2, S3, Lambda)
      - Docker and Kubernetes for containerization
      - CI/CD pipelines with Jenkins
      - RESTful APIs and GraphQL
      - Agile/Scrum methodologies
      
      Must have 5+ years of experience and strong problem-solving skills.
    `;
    
    console.log('Job Description:', jobDescription.trim().substring(0, 150) + '...\n');
    
    const result = await extractJobSkills(jobDescription);
    
    console.log('✅ Extraction Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');
    
    // ========================================================================
    // TEST 2: Extract entities using NER
    // ========================================================================
    console.log('2️⃣ Testing NER Skill Extraction...\n');
    
    const resumeText = 'Expert in React with 5 years of TypeScript and Node.js experience. Worked with AWS and Docker.';
    
    console.log('Resume Text:', resumeText);
    console.log('');
    
    const nerResult = await extractSkillsWithNER(resumeText);
    
    console.log('✅ NER Result:');
    console.log(JSON.stringify(nerResult, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');
    
    // ========================================================================
    // TEST 3: Check Provider Statistics
    // ========================================================================
    console.log('3️⃣ Provider Statistics...\n');
    
    const stats = getProviderStats();
    
    console.log('✅ AI Provider Stats:');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ All HuggingFace tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testHFSkillExtraction();
