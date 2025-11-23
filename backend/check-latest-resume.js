import mongoose from 'mongoose';
import Resume from './src/models/Resume.js';
import Job from './src/models/Job.js';

const MONGODB_URI = 'mongodb://localhost:27017/resume_analyzer';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('\n📊 Database Analysis\n' + '='.repeat(60));

    // Get latest resume
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    if (!resume) {
      console.log('❌ No resumes found in database');
      process.exit(1);
    }

    console.log(`\n📄 Latest Resume: ${resume.resumeId}`);
    console.log(`   Created: ${resume.createdAt}`);
    console.log(`   Has embedding: ${!!resume.embedding}`);
    console.log(`   Skills (${resume.parsed_resume?.skills?.length || 0}):`);
    if (resume.parsed_resume?.skills) {
      resume.parsed_resume.skills.slice(0, 15).forEach(skill => {
        console.log(`      - ${skill}`);
      });
    }

    // Check jobs
    const jobCount = await Job.countDocuments({ status: 'active' });
    console.log(`\n💼 Active Jobs: ${jobCount}`);

    if (jobCount > 0) {
      const sampleJob = await Job.findOne({ status: 'active' });
      console.log(`\n   Sample Job: ${sampleJob.title}`);
      console.log(`   Required Skills (${sampleJob.skills.required?.length || 0}):`);
      sampleJob.skills.required?.slice(0, 10).forEach(skill => {
        console.log(`      - ${skill}`);
      });

      // Check for skill overlaps
      const resumeSkills = (resume.parsed_resume?.skills || []).map(s => s.toLowerCase());
      const jobSkills = (sampleJob.skills.required || []).map(s => s.toLowerCase());
      const overlap = resumeSkills.filter(s => jobSkills.includes(s));
      
      console.log(`\n   Skill Overlap: ${overlap.length} skills`);
      if (overlap.length > 0) {
        overlap.forEach(skill => console.log(`      - ${skill}`));
      }
    }

    // Check if resume skills match ANY job
    const resumeSkillsLower = (resume.parsed_resume?.skills || []).map(s => s.toLowerCase());
    console.log(`\n🔍 Checking matches across all jobs...`);
    
    const jobs = await Job.find({ status: 'active' }).limit(10);
    let bestMatch = null;
    let bestMatchCount = 0;

    for (const job of jobs) {
      const jobSkills = (job.skills.required || []).map(s => s.toLowerCase());
      const matches = resumeSkillsLower.filter(s => jobSkills.includes(s));
      
      if (matches.length > bestMatchCount) {
        bestMatchCount = matches.length;
        bestMatch = {
          title: job.title,
          company: job.company.name,
          matchedSkills: matches,
          totalRequired: jobSkills.length
        };
      }
    }

    if (bestMatch) {
      console.log(`\n   Best Match: ${bestMatch.title} at ${bestMatch.company}`);
      console.log(`   Matched Skills: ${bestMatchCount}/${bestMatch.totalRequired}`);
      console.log(`   Match %: ${Math.round((bestMatchCount / bestMatch.totalRequired) * 100)}%`);
    } else {
      console.log('\n   ⚠️  No skill matches found with any jobs!');
      console.log('\n   This means:');
      console.log('   - Resume skills are not normalized correctly');
      console.log('   - OR job skills don\'t match resume skills format');
      console.log('   - OR matching threshold (50%) is too high');
    }

    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
