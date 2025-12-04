/**
 * Import Real-Time Jobs from JSON
 * Usage: node import-jobs.js [path-to-jobs.json]
 * Default: Imports from ./jobs.csv (which is actually JSON format)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { importJobsFromJSON } from './src/services/csvJobImportService.js';
import connectDB from './src/config/database.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Get file path from command line argument or use default
    const filePath = process.argv[2] || path.join(__dirname, 'jobs.csv');
    
    console.log('🚀 Starting Job Import Process...\n');
    console.log(`📁 Reading jobs from: ${filePath}`);

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Import jobs
    console.log('⚙️  Processing jobs...\n');
    const result = await importJobsFromJSON(filePath);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📈 IMPORT SUMMARY');
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log(`Total Jobs Processed: ${result.total}`);
      console.log(`✅ Successfully Imported: ${result.imported}`);
      console.log(`❌ Errors: ${result.errors}`);
      console.log(`🔄 Embeddings Queued: ${result.embeddingsQueued}`);
    } else {
      console.log(`❌ Import failed: ${result.message}`);
      console.log(`Total Jobs Processed: ${result.total}`);
      console.log(`Errors: ${result.errors}`);
    }

    console.log('='.repeat(60));
    console.log('\n✨ Job import complete!');
    console.log('\n💡 Tip: Visit http://localhost:3000/jobs to see your imported jobs');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
