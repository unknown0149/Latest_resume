import mongoose from 'mongoose';
import Resume from './src/models/Resume.js';
import Job from './src/models/Job.js';

mongoose.connect('mongodb://localhost:27017/resume_analyzer')
  .then(async () => {
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    const job = await Job.findOne({ title: 'MERN Stack Developer' });
    
    console.log('\n🧪 Manual Match Score Calculation\n' + '='.repeat(60));
    
    const candidateSkills = resume.parsed_resume?.skills || [];
    const requiredSkills = job.skills?.required || [];
    const optionalSkills = job.skills?.preferred || [];
    
    console.log(`\n📄 Resume Skills (${candidateSkills.length}):`);
    candidateSkills.forEach(s => console.log(`   - ${s}`));
    
    console.log(`\n💼 Job Required Skills (${requiredSkills.length}):`);
    requiredSkills.forEach(s => console.log(`   - ${s}`));
    
    // Skill match calculation
    const matchedSkills = requiredSkills.filter(reqSkill =>
      candidateSkills.some(candSkill =>
        candSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(candSkill.toLowerCase())
      )
    );
    
    console.log(`\n✅ Matched Skills (${matchedSkills.length}):`);
    matchedSkills.forEach(s => console.log(`   - ${s}`));
    
    const skillMatchScore = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 50;
    
    console.log(`\n📊 Skill Match Score: ${skillMatchScore.toFixed(2)}%`);
    console.log(`   Formula: (${matchedSkills.length} / ${requiredSkills.length}) * 100`);
    
    // Experience match
    const candidateExp = resume.parsed_resume?.years_experience || 0;
    const minExp = job.experienceYears?.min || 0;
    const maxExp = job.experienceYears?.max || 10;
    const expMatch = candidateExp >= minExp && candidateExp <= maxExp;
    const experienceScore = expMatch ? 100 : Math.max(0, 100 - Math.abs(candidateExp - minExp) * 10);
    
    console.log(`\n👔 Experience Match:`);
    console.log(`   Candidate: ${candidateExp} years`);
    console.log(`   Required: ${minExp}-${maxExp} years`);
    console.log(`   Match: ${expMatch ? 'Yes' : 'No'}`);
    console.log(`   Score: ${experienceScore}%`);
    
    // Recency
    const daysSincePosted = (Date.now() - new Date(job.postedDate || job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - daysSincePosted * 2);
    
    console.log(`\n📅 Recency:`);
    console.log(`   Days since posted: ${daysSincePosted.toFixed(1)}`);
    console.log(`   Score: ${recencyScore.toFixed(2)}%`);
    
    // Salary
    const salaryScore = 100; // Default
    
    // Classical composite score
    const classicalScore = 
      0.6 * skillMatchScore +
      0.2 * experienceScore +
      0.1 * recencyScore +
      0.1 * salaryScore;
    
    console.log(`\n🎯 Final Classical Score:`);
    console.log(`   60% × ${skillMatchScore.toFixed(2)}% = ${(0.6 * skillMatchScore).toFixed(2)}`);
    console.log(`   20% × ${experienceScore}% = ${(0.2 * experienceScore).toFixed(2)}`);
    console.log(`   10% × ${recencyScore.toFixed(2)}% = ${(0.1 * recencyScore).toFixed(2)}`);
    console.log(`   10% × ${salaryScore}% = ${(0.1 * salaryScore).toFixed(2)}`);
    console.log(`   ──────────────────────`);
    console.log(`   TOTAL: ${classicalScore.toFixed(2)}%`);
    
    if (classicalScore >= 50) {
      console.log(`\n✅ PASS: Score ${classicalScore.toFixed(2)}% >= 50% threshold`);
    } else {
      console.log(`\n❌ FAIL: Score ${classicalScore.toFixed(2)}% < 50% threshold`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    mongoose.disconnect();
  });
