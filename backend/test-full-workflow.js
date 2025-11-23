/**
 * End-to-End Test with Sample Resume
 * Tests the complete workflow: upload -> parse -> analyze -> match jobs
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const API_BASE = 'http://localhost:8000';

// Create a sample PDF resume
async function createSampleResumePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = 750;
  
  // Header
  page.drawText('ARNAV CHAUHAN', {
    x: 50,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  page.drawText('Full Stack Developer', {
    x: 50,
    y: yPosition,
    size: 14,
    font: font,
  });
  yPosition -= 20;
  
  page.drawText('Email: arnav.chauhan@email.com | Phone: +1-555-0123', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('LinkedIn: linkedin.com/in/arnavchauhan | GitHub: github.com/arnavchauhan', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 30;
  
  // Summary
  page.drawText('PROFESSIONAL SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 20;
  
  page.drawText('Experienced Full Stack Developer with 5+ years of expertise in building scalable web', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('applications. Proficient in JavaScript, React, Node.js, and MongoDB. Strong problem-solving', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('skills and experience leading development teams.', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 30;
  
  // Skills
  page.drawText('TECHNICAL SKILLS', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 20;
  
  page.drawText('Languages: JavaScript, TypeScript, Python, Java', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('Frontend: React, Vue.js, HTML5, CSS3, Redux, Tailwind CSS', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('Backend: Node.js, Express, Django, REST API, GraphQL', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('Database: MongoDB, PostgreSQL, MySQL, Redis', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 15;
  
  page.drawText('DevOps: Docker, Kubernetes, AWS, CI/CD, Jenkins', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  yPosition -= 30;
  
  // Experience
  page.drawText('PROFESSIONAL EXPERIENCE', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 20;
  
  page.drawText('Senior Full Stack Developer | Tech Solutions Inc. | 2021 - Present', {
    x: 50,
    y: yPosition,
    size: 11,
    font: boldFont,
  });
  yPosition -= 15;
  
  const experience1 = [
    '• Led development of microservices architecture using Node.js and Docker',
    '• Built responsive web applications with React and TypeScript',
    '• Implemented RESTful APIs serving 100K+ daily requests',
    '• Mentored team of 5 junior developers',
  ];
  
  experience1.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;
  });
  yPosition -= 10;
  
  page.drawText('Full Stack Developer | StartUp Ventures | 2019 - 2021', {
    x: 50,
    y: yPosition,
    size: 11,
    font: boldFont,
  });
  yPosition -= 15;
  
  const experience2 = [
    '• Developed e-commerce platform using MERN stack',
    '• Integrated payment gateways (Stripe, PayPal)',
    '• Optimized database queries reducing load time by 40%',
    '• Implemented CI/CD pipeline using Jenkins and AWS',
  ];
  
  experience2.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;
  });
  yPosition -= 20;
  
  // Education
  page.drawText('EDUCATION', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 20;
  
  page.drawText('Bachelor of Science in Computer Science', {
    x: 50,
    y: yPosition,
    size: 11,
    font: boldFont,
  });
  yPosition -= 15;
  
  page.drawText('University of Technology | 2015 - 2019 | GPA: 3.8/4.0', {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('./test-resume.pdf', pdfBytes);
  console.log('✅ Sample resume PDF created: test-resume.pdf');
}

// Test functions
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  console.log('-'.repeat(80));
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is healthy');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   MongoDB: ${response.data.mongodb}`);
    console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
    return true;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testResumeUpload() {
  console.log('\n📤 Test 2: Resume Upload');
  console.log('-'.repeat(80));
  try {
    const form = new FormData();
    form.append('resume', fs.createReadStream('./test-resume.pdf'));
    
    const response = await axios.post(`${API_BASE}/api/resume/upload`, form, {
      headers: form.getHeaders(),
    });
    
    console.log('✅ Resume uploaded successfully');
    console.log(`   Resume ID: ${response.data.resumeId}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Text extracted: ${response.data.extractedText ? 'Yes' : 'No'}`);
    console.log(`   Text length: ${response.data.extractedText?.length || 0} characters`);
    
    return response.data.resumeId;
  } catch (error) {
    console.log(`❌ Upload failed: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testResumeParsing(resumeId) {
  console.log('\n🔍 Test 3: Resume Parsing (with Watson AI)');
  console.log('-'.repeat(80));
  try {
    const response = await axios.post(`${API_BASE}/api/resume/${resumeId}/parse`, {
      mode: 'deep'
    });
    
    console.log('✅ Resume parsed successfully');
    console.log(`   Name: ${response.data.parsed_resume?.name || 'N/A'}`);
    console.log(`   Email: ${response.data.parsed_resume?.email || 'N/A'}`);
    console.log(`   Phone: ${response.data.parsed_resume?.phone || 'N/A'}`);
    console.log(`   Current Title: ${response.data.parsed_resume?.current_title || 'N/A'}`);
    console.log(`   Skills found: ${response.data.parsed_resume?.skills?.length || 0}`);
    if (response.data.parsed_resume?.skills?.length > 0) {
      console.log(`   Top skills: ${response.data.parsed_resume.skills.slice(0, 8).join(', ')}`);
    }
    console.log(`   Experience entries: ${response.data.parsed_resume?.experience?.length || 0}`);
    console.log(`   Education entries: ${response.data.parsed_resume?.education?.length || 0}`);
    console.log(`   Watson used: ${response.data.parsing_metadata?.watson_used ? '✅ Yes' : '❌ No'}`);
    console.log(`   Parsing time: ${response.data.parsing_metadata?.processing_time_ms || 0}ms`);
    
    return true;
  } catch (error) {
    console.log(`❌ Parsing failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testRoleAnalysis(resumeId) {
  console.log('\n🎯 Test 4: Role Analysis (with Watson AI)');
  console.log('-'.repeat(80));
  try {
    const response = await axios.post(`${API_BASE}/api/resume/${resumeId}/analyze-role`);
    
    console.log('✅ Role analysis completed');
    console.log(`   Predicted Role: ${response.data.role?.title || 'N/A'}`);
    console.log(`   Confidence: ${response.data.role?.confidence ? (response.data.role.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   Seniority: ${response.data.role?.seniority_level || 'N/A'}`);
    
    if (response.data.skill_analysis) {
      console.log(`   Total Skills: ${response.data.skill_analysis.total_skills || 0}`);
      console.log(`   Core Skills: ${response.data.skill_analysis.core_skills?.length || 0}`);
      console.log(`   Technical Skills: ${response.data.skill_analysis.technical_skills?.length || 0}`);
    }
    
    if (response.data.salary_insights) {
      console.log(`   Salary Range: $${response.data.salary_insights.min_salary?.toLocaleString() || 'N/A'} - $${response.data.salary_insights.max_salary?.toLocaleString() || 'N/A'}`);
      console.log(`   Median Salary: $${response.data.salary_insights.median_salary?.toLocaleString() || 'N/A'}`);
    }
    
    console.log(`   Watson used: ${response.data.metadata?.watson_used ? '✅ Yes' : '❌ No'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Role analysis failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testJobMatching(resumeId) {
  console.log('\n💼 Test 5: Job Matching');
  console.log('-'.repeat(80));
  try {
    const response = await axios.get(`${API_BASE}/api/jobs/match/${resumeId}`);
    
    console.log('✅ Job matching completed');
    console.log(`   Total matches found: ${response.data.total_matches || 0}`);
    console.log(`   Jobs returned: ${response.data.matches?.length || 0}`);
    console.log(`   Embeddings used: ${response.data.metadata?.embeddings_used ? '✅ Yes' : '❌ No (rule-based only)'}`);
    console.log(`   Processing time: ${response.data.metadata?.processing_time_ms || 0}ms`);
    
    if (response.data.matches?.length > 0) {
      console.log('\n   Top 3 Matches:');
      response.data.matches.slice(0, 3).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.title} at ${match.company}`);
        console.log(`      Match Score: ${(match.match_score * 100).toFixed(1)}%`);
        console.log(`      Salary: $${match.salary_min?.toLocaleString() || 'N/A'} - $${match.salary_max?.toLocaleString() || 'N/A'}`);
        console.log(`      Location: ${match.location || 'N/A'}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Job matching failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testEmbeddingGeneration(resumeId) {
  console.log('\n🔢 Test 6: Embedding Generation');
  console.log('-'.repeat(80));
  try {
    // Wait a bit for queue processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.get(`${API_BASE}/api/resume/${resumeId}`);
    
    const hasEmbedding = response.data.resume?.embedding && response.data.resume.embedding.length > 0;
    
    if (hasEmbedding) {
      console.log('✅ Embedding generated');
      console.log(`   Dimensions: ${response.data.resume.embedding.length}`);
      console.log(`   First 5 values: ${response.data.resume.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
    } else {
      console.log('⚠️  Embedding not yet generated (queue processing)');
      console.log('   Note: Embeddings are generated asynchronously');
    }
    
    return hasEmbedding;
  } catch (error) {
    console.log(`❌ Embedding check failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(80));
  console.log('END-TO-END SYSTEM TEST WITH SAMPLE DATA');
  console.log('='.repeat(80));
  
  // Create sample resume
  await createSampleResumePDF();
  
  // Run tests
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server not responding. Make sure backend is running on port 8000');
    return;
  }
  
  const resumeId = await testResumeUpload();
  if (!resumeId) {
    console.log('\n❌ Cannot continue without resume ID');
    return;
  }
  
  await testResumeParsing(resumeId);
  await testRoleAnalysis(resumeId);
  await testJobMatching(resumeId);
  await testEmbeddingGeneration(resumeId);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ All core features tested');
  console.log('📄 Sample resume created and processed');
  console.log('🤖 IBM Watson AI integration tested');
  console.log('💼 Job matching algorithm tested');
  console.log('\n💡 TIP: Check backend terminal for detailed logs');
  console.log('='.repeat(80));
  
  // Cleanup
  if (fs.existsSync('./test-resume.pdf')) {
    fs.unlinkSync('./test-resume.pdf');
    console.log('\n🧹 Cleaned up test file');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
