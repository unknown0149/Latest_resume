/**
 * Initialize jobs database from CSV
 */

import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import { createSampleJobsCSV, importJobsFromCSV } from './src/services/csvJobImportService.js';
import { logger } from './src/utils/logger.js';
import path from 'path';

dotenv.config();

async function initializeJobs() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create sample CSV if it doesn't exist
    const csvPath = path.join(process.cwd(), 'jobs.csv');
    logger.info('Creating sample jobs CSV...');
    await createSampleJobsCSV(csvPath);
    
    // Import jobs from CSV
    logger.info('Importing jobs from CSV...');
    const result = await importJobsFromCSV(csvPath);
    
    console.log('\n' + '='.repeat(80));
    console.log('JOB IMPORT COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Successfully imported: ${result.imported} jobs`);
    console.log(`📊 Total rows processed: ${result.total}`);
    console.log(`❌ Errors: ${result.errors}`);
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    logger.error('Job initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initializeJobs();
