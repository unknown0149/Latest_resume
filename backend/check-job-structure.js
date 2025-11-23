import mongoose from 'mongoose';
import Job from './src/models/Job.js';

mongoose.connect('mongodb://localhost:27017/resume_analyzer')
  .then(async () => {
    const job = await Job.findOne({ status: 'active' });
    console.log('\n📄 Sample Job Document Structure:\n');
    console.log('Title:', job.title);
    console.log('\nSkills object:', JSON.stringify(job.skills, null, 2));
    console.log('\nExperience object:', JSON.stringify(job.experience, null, 2));
    console.log('\nSalary object:', JSON.stringify(job.salary, null, 2));
    console.log('\nPosted Date:', job.postedDate);
    console.log('\nCreated At:', job.createdAt);
    
    mongoose.disconnect();
  });
