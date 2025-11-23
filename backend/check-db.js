import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/resume-analyzer')
  .then(async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 MongoDB Collections:\n');
    collections.forEach(c => console.log(`   - ${c.name}`));
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`      (${count} documents)`);
    }
    
    mongoose.disconnect();
  });
