/**
 * Test script to verify embedding generation with sample data
 */

import dotenv from 'dotenv';
import { 
  generateCandidateEmbedding, 
  generateJobEmbedding,
  generateMockEmbedding,
  normalizeVector
} from './src/services/embeddingService.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

// Sample resume data
const sampleResume = {
  current_title: 'Full Stack Developer',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'REST API', 'Git', 'Docker'],
  experience: [
    {
      position: 'Full Stack Developer',
      company: 'Tech Corp',
      bullets: [
        'Built scalable REST APIs using Node.js and Express',
        'Developed responsive web applications with React',
        'Implemented MongoDB database schemas and queries',
        'Deployed applications using Docker containers'
      ]
    },
    {
      position: 'Junior Developer',
      company: 'StartUp Inc',
      bullets: [
        'Created frontend components with React and TypeScript',
        'Collaborated with backend team on API integration',
        'Wrote unit tests using Jest'
      ]
    }
  ]
};

// Sample job data
const sampleJob = {
  title: 'Senior Full Stack Engineer',
  description: 'We are looking for an experienced Full Stack Engineer to join our growing team. You will work on building scalable web applications using modern JavaScript technologies.',
  requirements: [
    '5+ years of experience with JavaScript/TypeScript',
    'Strong knowledge of React and Node.js',
    'Experience with MongoDB or other NoSQL databases',
    'Familiarity with Docker and containerization',
    'Understanding of REST API design principles'
  ],
  required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST API'],
  preferred_skills: ['TypeScript', 'Docker', 'AWS', 'GraphQL']
};

async function testEmbeddings() {
  console.log('='.repeat(80));
  console.log('EMBEDDING SERVICE TEST');
  console.log('='.repeat(80));
  console.log();

  // Test 1: Mock Embedding Generation
  console.log('📝 Test 1: Mock Embedding Generation');
  console.log('-'.repeat(80));
  try {
    const mockEmbedding = generateMockEmbedding('Test text for embedding', 768);
    console.log('✅ Mock embedding generated successfully');
    console.log(`   - Dimensions: ${mockEmbedding.length}`);
    console.log(`   - First 5 values: ${mockEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
    
    // Check if normalized (magnitude should be ~1)
    const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`   - Vector magnitude: ${magnitude.toFixed(6)} (should be ~1.0)`);
    console.log(`   - Is normalized: ${Math.abs(magnitude - 1.0) < 0.001 ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`❌ Mock embedding failed: ${error.message}`);
  }
  console.log();

  // Test 2: Resume Embedding Generation
  console.log('📄 Test 2: Resume Embedding Generation');
  console.log('-'.repeat(80));
  console.log('Sample resume data:');
  console.log(`   - Title: ${sampleResume.current_title}`);
  console.log(`   - Skills: ${sampleResume.skills.join(', ')}`);
  console.log(`   - Experience positions: ${sampleResume.experience.length}`);
  console.log();

  try {
    const startTime = Date.now();
    const resumeResult = await generateCandidateEmbedding(sampleResume, false);
    const endTime = Date.now();
    
    console.log('✅ Resume embedding generated successfully');
    console.log(`   - Processing time: ${endTime - startTime}ms`);
    console.log(`   - Dimensions: ${resumeResult.embedding.length}`);
    console.log(`   - Is mock: ${resumeResult.is_mock ? '⚠️ YES' : '✅ NO (Real API)'}`);
    if (resumeResult.is_mock && resumeResult.reason) {
      console.log(`   - Mock reason: ${resumeResult.reason}`);
    }
    if (resumeResult.cached) {
      console.log(`   - Cached: ✅ YES`);
    }
    console.log(`   - First 5 values: ${resumeResult.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
    
    // Verify normalization
    const magnitude = Math.sqrt(resumeResult.embedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`   - Vector magnitude: ${magnitude.toFixed(6)}`);
    console.log(`   - Is normalized: ${Math.abs(magnitude - 1.0) < 0.001 ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`❌ Resume embedding failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 3: Job Embedding Generation
  console.log('💼 Test 3: Job Embedding Generation');
  console.log('-'.repeat(80));
  console.log('Sample job data:');
  console.log(`   - Title: ${sampleJob.title}`);
  console.log(`   - Required skills: ${sampleJob.required_skills.join(', ')}`);
  console.log(`   - Preferred skills: ${sampleJob.preferred_skills.join(', ')}`);
  console.log();

  try {
    const startTime = Date.now();
    const jobResult = await generateJobEmbedding(sampleJob, false);
    const endTime = Date.now();
    
    console.log('✅ Job embedding generated successfully');
    console.log(`   - Processing time: ${endTime - startTime}ms`);
    console.log(`   - Dimensions: ${jobResult.embedding.length}`);
    console.log(`   - Is mock: ${jobResult.is_mock ? '⚠️ YES' : '✅ NO (Real API)'}`);
    if (jobResult.is_mock && jobResult.reason) {
      console.log(`   - Mock reason: ${jobResult.reason}`);
    }
    if (jobResult.cached) {
      console.log(`   - Cached: ✅ YES`);
    }
    console.log(`   - First 5 values: ${jobResult.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
    
    // Verify normalization
    const magnitude = Math.sqrt(jobResult.embedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`   - Vector magnitude: ${magnitude.toFixed(6)}`);
    console.log(`   - Is normalized: ${Math.abs(magnitude - 1.0) < 0.001 ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`❌ Job embedding failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 4: Cosine Similarity Calculation
  console.log('🔍 Test 4: Cosine Similarity Between Resume and Job');
  console.log('-'.repeat(80));
  try {
    const resumeResult = await generateCandidateEmbedding(sampleResume, false);
    const jobResult = await generateJobEmbedding(sampleJob, false);
    
    // Calculate cosine similarity
    const dotProduct = resumeResult.embedding.reduce((sum, val, i) => 
      sum + val * jobResult.embedding[i], 0
    );
    
    console.log('✅ Similarity calculated successfully');
    console.log(`   - Cosine similarity: ${(dotProduct * 100).toFixed(2)}%`);
    console.log(`   - Match quality: ${dotProduct > 0.7 ? '✅ High' : dotProduct > 0.5 ? '⚠️ Medium' : '❌ Low'}`);
    
    // Test with dissimilar job
    const dissimilarJob = {
      title: 'Marketing Manager',
      description: 'Looking for an experienced marketing professional',
      requirements: ['Marketing experience', 'Social media management'],
      required_skills: ['Marketing', 'Social Media', 'Content Creation'],
      preferred_skills: ['SEO', 'Analytics']
    };
    
    const dissimilarResult = await generateJobEmbedding(dissimilarJob, false);
    const dissimilarScore = resumeResult.embedding.reduce((sum, val, i) => 
      sum + val * dissimilarResult.embedding[i], 0
    );
    
    console.log(`   - Dissimilar job similarity: ${(dissimilarScore * 100).toFixed(2)}%`);
    console.log(`   - Differentiation works: ${dotProduct > dissimilarScore ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.log(`❌ Similarity calculation failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 5: API Configuration Status
  console.log('⚙️  Test 5: API Configuration Status');
  console.log('-'.repeat(80));
  const googleApiKey = process.env.GOOGLE_API_KEY;
  console.log(`   - Google API Key configured: ${googleApiKey ? '✅ YES' : '❌ NO'}`);
  if (googleApiKey) {
    console.log(`   - Key preview: ${googleApiKey.substring(0, 10)}...`);
  } else {
    console.log(`   - ⚠️  Using mock embeddings (limited accuracy)`);
    console.log(`   - 💡 To use real embeddings, set GOOGLE_API_KEY in .env file`);
  }
  console.log();

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run tests
testEmbeddings().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
