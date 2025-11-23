/**
 * Test script to verify the complete resume upload and analysis flow
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:8000';

async function testResumeFlow() {
  try {
    console.log('\n🧪 Starting Resume Upload Flow Test\n');
    console.log('='.repeat(60));

    // Get the most recent resume file
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const resumeFile = files[files.length - 1];
    const resumePath = path.join(uploadsDir, resumeFile);

    console.log(`📄 Using resume: ${resumeFile}\n`);

    // Step 1: Upload Resume
    console.log('Step 1: Uploading resume...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(resumePath));

    const uploadResponse = await axios.post(`${BASE_URL}/api/resume/upload`, formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ Upload successful');
    console.log(`   Resume ID: ${uploadResponse.data.resumeId}`);
    console.log(`   Extraction Status: ${uploadResponse.data.extraction_status}`);
    
    const resumeId = uploadResponse.data.resumeId;

    // Step 2: Parse Resume
    console.log('\nStep 2: Parsing resume...');
    const parseResponse = await axios.post(`${BASE_URL}/api/resume/${resumeId}/parse`, {
      mode: 'deep'
    });

    console.log('✅ Parse successful');
    console.log(`   Skills found: ${parseResponse.data.parsed_resume?.skills?.length || 0}`);
    console.log(`   Experience: ${parseResponse.data.parsed_resume?.experience?.total_years || 0} years`);

    // Step 3: Analyze Role
    console.log('\nStep 3: Analyzing role...');
    const roleResponse = await axios.post(`${BASE_URL}/api/resume/${resumeId}/analyze-role`);

    console.log('✅ Role analysis successful');
    if (roleResponse.data.success) {
      const data = roleResponse.data.data;
      console.log(`   Predicted Role: ${data.predictedRole?.role || 'None'}`);
      console.log(`   Confidence: ${data.predictedRole?.confidence || 0}%`);
      console.log(`   Skills Have: ${data.skillAnalysis?.skillsHave?.length || 0}`);
      console.log(`   Skills Missing: ${data.skillAnalysis?.skillsMissing?.length || 0}`);
      console.log(`   Salary Boost Opportunities: ${data.skillAnalysis?.salaryBoostOpportunities?.length || 0}`);
      
      // Print salary boost details
      if (data.skillAnalysis?.salaryBoostOpportunities?.length > 0) {
        console.log('\n   💰 Salary Boost Opportunities:');
        data.skillAnalysis.salaryBoostOpportunities.forEach((boost, idx) => {
          console.log(`      ${idx + 1}. ${boost.skill} (${boost.type}) - ${boost.impact}`);
        });
      }
    }

    // Step 4: Get Matching Jobs
    console.log('\nStep 4: Finding matching jobs...');
    const jobsResponse = await axios.get(`${BASE_URL}/api/jobs/match/${resumeId}`, {
      params: {
        limit: 20,
        minMatchScore: 50,
        useEmbeddings: true,
        generateAISummaries: true
      }
    });

    console.log('✅ Job matching successful');
    if (jobsResponse.data.success) {
      const matches = jobsResponse.data.data.matches || [];
      console.log(`   Total matches: ${matches.length}`);
      
      if (matches.length > 0) {
        console.log('\n   🎯 Top 3 Matches:');
        matches.slice(0, 3).forEach((match, idx) => {
          console.log(`      ${idx + 1}. ${match.job?.title || 'Unknown'}`);
          console.log(`         Company: ${match.job?.company?.name || 'Unknown'}`);
          console.log(`         Match Score: ${match.matchScore || 0}%`);
          console.log(`         Matched Skills: ${match.matchedSkills?.length || 0}`);
          console.log(`         Missing Skills: ${match.missingSkills?.length || 0}`);
          console.log();
        });

        // Check data structure
        console.log('\n   📊 First Match Data Structure:');
        const firstMatch = matches[0];
        console.log(JSON.stringify({
          matchScore: firstMatch.matchScore,
          hasJob: !!firstMatch.job,
          hasTitle: !!firstMatch.job?.title,
          hasCompany: !!firstMatch.job?.company,
          hasMatchedSkills: !!firstMatch.matchedSkills,
          hasMissingSkills: !!firstMatch.missingSkills,
          hasAISummary: !!firstMatch.aiSummary
        }, null, 2));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
      console.error(`   Details:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testResumeFlow();
