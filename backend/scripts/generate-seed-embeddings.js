/**
 * Batch script to generate embeddings for all seed jobs
 * Usage: node backend/scripts/generate-seed-embeddings.js [--mock]
 * 
 * This script:
 * - Connects to MongoDB
 * - Fetches all active seed jobs without embeddings
 * - Generates embeddings in batches of 10 (rate limiting)
 * - Uses mock embeddings if --mock flag or no GOOGLE_API_KEY
 * - Saves checkpoint after each batch for crash recovery
 * - Displays progress and statistics
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateJobEmbedding, getAPIUsageStats } from '../src/services/embeddingService.js';
import Job from '../src/models/Job.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 6000; // 6 seconds between batches (10 jobs/min = well under quota)
const CHECKPOINT_FILE = path.join(__dirname, '.embeddings-checkpoint.json');

// Parse command line arguments
const args = process.argv.slice(2);
const forceMock = args.includes('--mock');
const useMock = forceMock || !process.env.GOOGLE_API_KEY;

// Statistics
const stats = {
  totalJobs: 0,
  alreadyProcessed: 0,
  successCount: 0,
  failureCount: 0,
  mockCount: 0,
  realCount: 0,
  startTime: Date.now(),
  batchesProcessed: 0,
};

/**
 * Save checkpoint to file
 */
function saveCheckpoint(processedJobIds) {
  const fs = require('fs');
  const checkpoint = {
    timestamp: new Date().toISOString(),
    processedJobIds,
    stats,
  };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

/**
 * Load checkpoint from file
 */
function loadCheckpoint() {
  try {
    const fs = require('fs');
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      console.log(`📂 Loaded checkpoint from ${checkpoint.timestamp}`);
      console.log(`   Previously processed: ${checkpoint.processedJobIds.length} jobs`);
      return checkpoint.processedJobIds;
    }
  } catch (error) {
    console.warn('⚠️  Failed to load checkpoint:', error.message);
  }
  return [];
}

/**
 * Clear checkpoint file
 */
function clearCheckpoint() {
  try {
    const fs = require('fs');
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
  } catch (error) {
    console.warn('⚠️  Failed to clear checkpoint:', error.message);
  }
}

/**
 * Display progress bar
 */
function displayProgress(current, total, batchNum, totalBatches) {
  const percent = ((current / total) * 100).toFixed(1);
  const barLength = 40;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(
    `📊 Batch ${batchNum}/${totalBatches} | ${bar} | ${percent}% (${current}/${total} jobs)`
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution function
 */
async function main() {
  console.log('========================================');
  console.log('🚀 Seed Job Embeddings Generator');
  console.log('========================================\n');
  
  // Display configuration
  console.log('📋 Configuration:');
  console.log(`   Database: ${process.env.MONGODB_URI}`);
  console.log(`   Embedding Mode: ${useMock ? '🧪 MOCK (deterministic)' : '🌐 REAL (Google Gemini API)'}`);
  console.log(`   Batch Size: ${BATCH_SIZE} jobs`);
  console.log(`   Batch Delay: ${BATCH_DELAY_MS / 1000} seconds\n`);
  
  if (forceMock) {
    console.log('⚠️  --mock flag detected: Using mock embeddings\n');
  } else if (!process.env.GOOGLE_API_KEY) {
    console.log('⚠️  No GOOGLE_API_KEY found: Using mock embeddings\n');
  }
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Load checkpoint
    const processedJobIds = loadCheckpoint();
    
    // Fetch all seed jobs
    console.log('🔍 Fetching seed jobs...');
    const query = {
      'source.platform': 'seed',
      status: 'active',
    };
    
    // Skip already processed jobs if checkpoint exists
    if (processedJobIds.length > 0) {
      query.jobId = { $nin: processedJobIds };
    }
    
    const jobs = await Job.find(query).select('jobId title company description skills');
    stats.totalJobs = jobs.length;
    
    console.log(`✅ Found ${jobs.length} seed jobs to process`);
    
    // Check for already processed jobs
    const jobsWithEmbeddings = await Job.countDocuments({
      'source.platform': 'seed',
      status: 'active',
      embedding: { $exists: true, $ne: null },
    });
    stats.alreadyProcessed = jobsWithEmbeddings;
    
    if (jobsWithEmbeddings > 0) {
      console.log(`ℹ️  ${jobsWithEmbeddings} jobs already have embeddings\n`);
    }
    
    if (jobs.length === 0) {
      console.log('\n✨ All seed jobs already have embeddings! Nothing to do.\n');
      await mongoose.disconnect();
      clearCheckpoint();
      return;
    }
    
    // Calculate batches
    const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);
    console.log(`📦 Processing ${totalBatches} batches...\n`);
    
    // Process in batches
    const processedIds = [...processedJobIds];
    
    for (let i = 0; i < totalBatches; i++) {
      const batchNum = i + 1;
      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, jobs.length);
      const batch = jobs.slice(startIdx, endIdx);
      
      stats.batchesProcessed = batchNum;
      displayProgress(startIdx, jobs.length, batchNum, totalBatches);
      
      // Process batch
      for (const job of batch) {
        try {
          // Generate embedding
          const result = await generateJobEmbedding(job, useMock);
          
          // Update job in database
          job.embedding = result.embedding;
          job.embedding_metadata = result.metadata;
          await job.save();
          
          // Update statistics
          stats.successCount++;
          if (result.metadata.is_mock) {
            stats.mockCount++;
          } else {
            stats.realCount++;
          }
          
          processedIds.push(job.jobId);
          
          // Small delay between jobs in batch
          await sleep(100);
          
        } catch (error) {
          console.error(`\n❌ Failed to process job ${job.jobId}:`, error.message);
          stats.failureCount++;
        }
      }
      
      // Save checkpoint after each batch
      saveCheckpoint(processedIds);
      
      // Delay between batches (except for last batch)
      if (batchNum < totalBatches) {
        const apiStats = getAPIUsageStats();
        const remainingCalls = apiStats.hourlyLimit - apiStats.apiCallsThisHour;
        
        // Display batch completion
        console.log(`\n   ✓ Batch ${batchNum} complete`);
        console.log(`   API Usage: ${apiStats.apiCallsThisHour}/${apiStats.hourlyLimit} calls (${apiStats.percentUsed.toFixed(1)}%)`);
        console.log(`   Remaining: ${remainingCalls} calls\n`);
        
        // Wait before next batch
        console.log(`⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`);
        await sleep(BATCH_DELAY_MS);
      }
    }
    
    // Final progress
    displayProgress(jobs.length, jobs.length, totalBatches, totalBatches);
    console.log('\n');
    
    // Display final statistics
    const elapsedTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    const apiStats = getAPIUsageStats();
    
    console.log('\n========================================');
    console.log('✅ Processing Complete!');
    console.log('========================================\n');
    console.log('📊 Statistics:');
    console.log(`   Total Jobs: ${stats.totalJobs}`);
    console.log(`   Already Processed: ${stats.alreadyProcessed}`);
    console.log(`   Successfully Generated: ${stats.successCount}`);
    console.log(`   Failed: ${stats.failureCount}`);
    console.log(`   Mock Embeddings: ${stats.mockCount}`);
    console.log(`   Real Embeddings: ${stats.realCount}`);
    console.log(`   Batches Processed: ${stats.batchesProcessed}/${totalBatches}`);
    console.log(`   Elapsed Time: ${elapsedTime}s\n`);
    
    console.log('🔌 API Usage:');
    console.log(`   Calls This Hour: ${apiStats.apiCallsThisHour}/${apiStats.hourlyLimit}`);
    console.log(`   Usage: ${apiStats.percentUsed.toFixed(1)}%`);
    console.log(`   Cache Size: ${apiStats.cacheSize}/${apiStats.cacheLimit}\n`);
    
    // Clear checkpoint on successful completion
    if (stats.failureCount === 0) {
      clearCheckpoint();
      console.log('✨ All embeddings generated successfully!\n');
    } else {
      console.log(`⚠️  ${stats.failureCount} jobs failed. Run script again to retry.\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
