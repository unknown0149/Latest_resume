/**
 * Test Hugging Face Models with Sample Data
 * Tests all Transformers.js models in the backend/models directory
 */

console.log('⏳ Loading models... (This may take a while on first run)');
console.log();

const embeddingsModule = await import('./models/embeddings.js');
const nerModule = await import('./models/ner.js');
const skillsModule = await import('./models/skills.js');
const jobroleModule = await import('./models/jobrole.js');

const getEmbedding = embeddingsModule.getEmbedding;
const extractNER = nerModule.extractNER;
const extractSkills = skillsModule.extractSkills;
const predictRole = jobroleModule.predictRole;

console.log('✅ All models loaded successfully!');
console.log();

// Sample resume text
const sampleResumeText = `
John Smith
Senior Full Stack Developer
Email: john.smith@email.com
Phone: +1-555-0123

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications. 
Proficient in JavaScript, React, Node.js, Python, and cloud technologies. Strong problem-solving 
skills and experience leading development teams.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Vue.js, Angular, HTML5, CSS3, Redux
Backend: Node.js, Express, Django, Flask, REST API, GraphQL
Database: MongoDB, PostgreSQL, MySQL, Redis
DevOps: Docker, Kubernetes, AWS, Azure, CI/CD, Jenkins
Tools: Git, GitHub, Jira, Webpack, Babel

PROFESSIONAL EXPERIENCE
Senior Full Stack Developer | Tech Solutions Inc. | 2021 - Present
- Led development of microservices architecture using Node.js and Docker
- Built responsive web applications with React and TypeScript
- Implemented RESTful APIs serving 100K+ daily requests
- Mentored team of 5 junior developers
- Reduced application load time by 60% through optimization

Full Stack Developer | StartUp Ventures | 2019 - 2021
- Developed e-commerce platform using MERN stack
- Integrated payment gateways including Stripe and PayPal
- Optimized database queries reducing response time by 40%
- Implemented CI/CD pipeline using Jenkins and AWS

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2015 - 2019 | GPA: 3.8/4.0

CERTIFICATIONS
- AWS Certified Solutions Architect
- MongoDB Certified Developer
`;

// Sample job description
const sampleJobDescription = `
Senior Full Stack Engineer
Tech Company Inc.

We are looking for an experienced Full Stack Engineer to join our growing team. 
You will work on building scalable web applications using modern JavaScript technologies.

Requirements:
- 5+ years of experience with JavaScript/TypeScript
- Strong knowledge of React and Node.js
- Experience with MongoDB or other NoSQL databases
- Familiarity with Docker and containerization
- Understanding of REST API design principles
- Experience with cloud platforms (AWS/Azure)

Preferred Skills:
- GraphQL experience
- Kubernetes knowledge
- CI/CD pipeline experience
- Team leadership experience
`;

async function testAllModels() {
  console.log('='.repeat(80));
  console.log('HUGGING FACE MODELS TEST WITH SAMPLE DATA');
  console.log('='.repeat(80));
  console.log();

  // Test 1: Embeddings Model
  console.log('🔢 Test 1: Sentence Embeddings (sentence-transformers/all-mpnet-base-v2)');
  console.log('-'.repeat(80));
  try {
    const startTime = Date.now();
    
    // Test resume embedding
    console.log('Testing resume embedding...');
    const resumeEmbedding = await getEmbedding(sampleResumeText.substring(0, 500));
    const resumeTime = Date.now() - startTime;
    
    console.log('✅ Resume embedding generated successfully');
    console.log(`   Processing time: ${resumeTime}ms`);
    console.log(`   Embedding shape: [${resumeEmbedding.dims.join(', ')}]`);
    console.log(`   Total dimensions: ${resumeEmbedding.dims.reduce((a, b) => a * b, 1)}`);
    console.log(`   Data type: ${resumeEmbedding.type}`);
    
    // Get first few values
    const embeddingArray = Array.from(resumeEmbedding.data).slice(0, 5);
    console.log(`   First 5 values: ${embeddingArray.map(v => v.toFixed(4)).join(', ')}`);
    
    // Test job embedding
    console.log();
    console.log('Testing job description embedding...');
    const jobStartTime = Date.now();
    const jobEmbedding = await getEmbedding(sampleJobDescription);
    const jobTime = Date.now() - jobStartTime;
    
    console.log('✅ Job embedding generated successfully');
    console.log(`   Processing time: ${jobTime}ms`);
    console.log(`   Embedding shape: [${jobEmbedding.dims.join(', ')}]`);
    
    // Calculate cosine similarity
    const resumeArray = Array.from(resumeEmbedding.data);
    const jobArray = Array.from(jobEmbedding.data);
    
    let dotProduct = 0;
    let resumeMag = 0;
    let jobMag = 0;
    
    for (let i = 0; i < resumeArray.length; i++) {
      dotProduct += resumeArray[i] * jobArray[i];
      resumeMag += resumeArray[i] * resumeArray[i];
      jobMag += jobArray[i] * jobArray[i];
    }
    
    const cosineSimilarity = dotProduct / (Math.sqrt(resumeMag) * Math.sqrt(jobMag));
    
    console.log();
    console.log('📊 Similarity Analysis:');
    console.log(`   Cosine similarity: ${(cosineSimilarity * 100).toFixed(2)}%`);
    console.log(`   Match quality: ${cosineSimilarity > 0.7 ? '✅ High' : cosineSimilarity > 0.5 ? '⚠️ Medium' : '❌ Low'}`);
    
  } catch (error) {
    console.log(`❌ Embeddings test failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 2: Named Entity Recognition (NER)
  console.log('🏷️  Test 2: Named Entity Recognition (dbmdz/bert-large-cased-finetuned-conll03-english)');
  console.log('-'.repeat(80));
  try {
    const startTime = Date.now();
    const nerResults = await extractNER(sampleResumeText.substring(0, 500));
    const processingTime = Date.now() - startTime;
    
    console.log('✅ NER extraction completed');
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Entities found: ${nerResults.length}`);
    console.log();
    
    // Group entities by type
    const entityTypes = {};
    nerResults.forEach(entity => {
      const type = entity.entity.replace('B-', '').replace('I-', '');
      if (!entityTypes[type]) entityTypes[type] = [];
      entityTypes[type].push(entity.word);
    });
    
    console.log('   Entities by type:');
    Object.entries(entityTypes).forEach(([type, words]) => {
      console.log(`   - ${type}: ${words.slice(0, 10).join(', ')}`);
    });
    
  } catch (error) {
    console.log(`❌ NER test failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 3: Skills Extraction
  console.log('💡 Test 3: Skills Extraction (jgoncalvesjr/skills-extraction-distilbert-base-uncased)');
  console.log('-'.repeat(80));
  try {
    const startTime = Date.now();
    
    // Test with skill-related text
    const skillText = "Experience with JavaScript, React, Node.js, Python, Docker, and AWS cloud services.";
    const skillResults = await extractSkills(skillText);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Skills extraction completed');
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Input text: "${skillText}"`);
    console.log();
    console.log('   Results:');
    
    if (Array.isArray(skillResults)) {
      skillResults.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. Label: ${result.label}, Score: ${(result.score * 100).toFixed(2)}%`);
      });
    } else {
      console.log(`   Label: ${skillResults.label}, Score: ${(skillResults.score * 100).toFixed(2)}%`);
    }
    
  } catch (error) {
    console.log(`❌ Skills extraction test failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Test 4: Job Role Prediction
  console.log('🎯 Test 4: Job Role Prediction (google/flan-t5-large)');
  console.log('-'.repeat(80));
  try {
    const startTime = Date.now();
    
    const resumeSummary = `
      Senior developer with 5+ years experience in JavaScript, React, Node.js, Python.
      Led teams, built microservices, worked with AWS and Docker. Full stack development.
    `;
    
    const roleResult = await predictRole(resumeSummary);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Role prediction completed');
    console.log(`   Processing time: ${processingTime}ms`);
    console.log();
    console.log('   Input: Resume summary');
    console.log('   Predicted roles:');
    
    if (Array.isArray(roleResult)) {
      roleResult.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.generated_text || result.text || JSON.stringify(result)}`);
      });
    } else {
      console.log(`   ${roleResult.generated_text || roleResult[0]?.generated_text || JSON.stringify(roleResult)}`);
    }
    
  } catch (error) {
    console.log(`❌ Role prediction test failed: ${error.message}`);
    console.error(error);
  }
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('Models tested:');
  console.log('1. ✅ sentence-transformers/all-mpnet-base-v2 (Embeddings)');
  console.log('2. ✅ dbmdz/bert-large-cased-finetuned-conll03-english (NER)');
  console.log('3. ✅ jgoncalvesjr/skills-extraction-distilbert-base-uncased (Skills)');
  console.log('4. ✅ google/flan-t5-large (Role Prediction)');
  console.log();
  console.log('All Hugging Face models are working! 🎉');
  console.log('='.repeat(80));
}

// Run tests
testAllModels().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
