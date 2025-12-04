/**
 * Seed Skill Roadmaps with Gemini-Generated Resources
 * Processes 100+ skills with rate limiting (10 req/min)
 */

import mongoose from 'mongoose';
import SkillRoadmap from '../src/models/SkillRoadmap.js';
import { skillRoadmapsData } from '../src/data/skillRoadmapsData.js';
import { generateLearningResources } from '../src/services/geminiService.js';
import { logger } from '../src/utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_genie';

// Progress tracking
let processedCount = 0;
let successCount = 0;
let failedCount = 0;
const startTime = Date.now();

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✓ Connected to MongoDB');
  } catch (error) {
    logger.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Seed a single skill
 */
async function seedSkill(skillData, index, total) {
  try {
    const { skillName, difficulty } = skillData;
    
    // Check if skill already exists
    let existingSkill = await SkillRoadmap.findOne({ skillName });
    
    if (existingSkill && existingSkill.resourcesGenerated) {
      logger.info(`[${index + 1}/${total}] ⏭️  Skipping ${skillName} (already has resources)`);
      processedCount++;
      successCount++;
      return { success: true, skipped: true };
    }

    // Generate resources using Gemini (with rate limiting built-in)
    logger.info(`[${index + 1}/${total}] 🔄 Generating resources for ${skillName}...`);
    
    const resources = await generateLearningResources(skillName, difficulty);
    
    // Prepare skill data
    const skillToSave = {
      ...skillData,
      learningResources: resources,
      resourcesGenerated: true,
      lastResourceUpdate: new Date()
    };

    // Upsert (update or insert)
    const result = await SkillRoadmap.findOneAndUpdate(
      { skillName },
      skillToSave,
      { upsert: true, new: true }
    );

    processedCount++;
    successCount++;
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const avg = Math.round(elapsed / processedCount);
    const remaining = Math.round((total - processedCount) * avg);
    
    logger.info(`[${index + 1}/${total}] ✓ ${skillName} - ${resources.length} resources | ${elapsed}s elapsed | ~${remaining}s remaining`);
    
    return { success: true, resourceCount: resources.length };

  } catch (error) {
    processedCount++;
    failedCount++;
    
    logger.error(`[${index + 1}/${total}] ✗ ${skillData.skillName} failed:`, error.message);
    
    // Save without resources if generation fails
    try {
      await SkillRoadmap.findOneAndUpdate(
        { skillName: skillData.skillName },
        { ...skillData, resourcesGenerated: false },
        { upsert: true }
      );
      logger.info(`  └─ Saved ${skillData.skillName} without resources (will retry later)`);
    } catch (saveError) {
      logger.error(`  └─ Failed to save ${skillData.skillName}:`, saveError.message);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Main seeding function
 */
async function seedAllSkills() {
  try {
    await connectDB();

    const total = skillRoadmapsData.length;
    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`🌱 Starting Skill Roadmap Seeding`);
    logger.info(`   Total Skills: ${total}`);
    logger.info(`   Rate Limit: 10 requests/minute`);
    logger.info(`   Estimated Time: ~${Math.ceil(total / 10)} minutes`);
    logger.info(`${'='.repeat(70)}\n`);

    // Process skills sequentially (rate limiter handles delays)
    for (let i = 0; i < skillRoadmapsData.length; i++) {
      await seedSkill(skillRoadmapsData[i], i, total);
    }

    // Summary
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`🎉 Seeding Complete!`);
    logger.info(`   Total Processed: ${processedCount}/${total}`);
    logger.info(`   Success: ${successCount}`);
    logger.info(`   Failed: ${failedCount}`);
    logger.info(`   Total Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
    logger.info(`${'='.repeat(70)}\n`);

    // Show failed skills if any
    if (failedCount > 0) {
      logger.info('⚠️  Failed skills can be retried by running this script again.');
    }

  } catch (error) {
    logger.error('Fatal error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('✓ MongoDB connection closed');
    process.exit(0);
  }
}

/**
 * Retry failed skills (those without resources)
 */
async function retryFailed() {
  try {
    await connectDB();

    const failedSkills = await SkillRoadmap.find({ resourcesGenerated: false });
    const total = failedSkills.length;

    if (total === 0) {
      logger.info('✓ No failed skills to retry. All skills have resources!');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`🔄 Retrying Failed Skills`);
    logger.info(`   Total to Retry: ${total}`);
    logger.info(`${'='.repeat(70)}\n`);

    for (let i = 0; i < failedSkills.length; i++) {
      const skill = failedSkills[i];
      
      try {
        logger.info(`[${i + 1}/${total}] 🔄 Retrying ${skill.skillName}...`);
        
        const resources = await generateLearningResources(skill.skillName, skill.difficulty);
        
        skill.learningResources = resources;
        skill.resourcesGenerated = true;
        skill.lastResourceUpdate = new Date();
        await skill.save();
        
        successCount++;
        logger.info(`[${i + 1}/${total}] ✓ ${skill.skillName} - ${resources.length} resources`);
        
      } catch (error) {
        failedCount++;
        logger.error(`[${i + 1}/${total}] ✗ ${skill.skillName} failed again:`, error.message);
      }
      
      processedCount++;
    }

    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`🎉 Retry Complete!`);
    logger.info(`   Success: ${successCount}/${total}`);
    logger.info(`   Still Failed: ${failedCount}/${total}`);
    logger.info(`${'='.repeat(70)}\n`);

  } catch (error) {
    logger.error('Fatal error during retry:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'retry') {
  logger.info('🔄 Running in RETRY mode...\n');
  retryFailed();
} else {
  logger.info('🌱 Running in SEED mode...\n');
  seedAllSkills();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n\n⚠️  Received SIGINT. Shutting down gracefully...');
  logger.info(`   Processed: ${processedCount}`);
  logger.info(`   Success: ${successCount}`);
  logger.info(`   Failed: ${failedCount}`);
  await mongoose.connection.close();
  process.exit(0);
});
