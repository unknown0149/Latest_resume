/**
 * Job Fetch Service - Cron Scheduler for Job Updates
 * Refreshes job data daily and cleans up expired jobs
 */

import cron from 'node-cron';
import { reloadJobsFromFile, getJobsFilePath } from './fileJobService.js';
import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import { logger } from '../utils/logger.js';

/**
 * Cleanup expired jobs
 */
async function cleanupExpiredJobs() {
  try {
    logger.info('Starting expired jobs cleanup...');
    
    const result = await Job.cleanupExpiredJobs();
    
    logger.info(`Cleaned up ${result.deletedCount} expired jobs`);
    return result;
  } catch (error) {
    logger.error('Failed to cleanup expired jobs:', error);
    throw error;
  }
}

/**
 * Refresh job postings (for MVP, just ensures seed jobs exist)
 */
async function refreshJobs() {
  try {
    logger.info('Starting job refresh process...');

    const [jobCount, fileJobCount] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'active', 'source.platform': 'file' })
    ]);

    await logJobSourceBreakdown('pre-refresh');

    // Always ensure curated jobs exist, even if seeds are already loaded
    if (fileJobCount === 0) {
      logger.warn(`[Jobs] Missing curated jobs despite ${jobCount} active listings. Forcing reload from ${getJobsFilePath()}`);
      return await loadCuratedJobs('missing-file-jobs');
    }

    if (jobCount === 0) {
      logger.info('No active jobs found. Attempting to load curated dataset...');
      return await loadCuratedJobs('empty-database');
    }

    logger.info(`${jobCount} active jobs found (${fileJobCount} from jobs.csv). Skipping reload.`);

    // In production, this would:
    // 1. Call LinkedIn/Indeed/Glassdoor APIs
    // 2. Parse job listings
    // 3. Update existing jobs or create new ones
    // 4. Mark outdated jobs as expired

    return { success: true, jobCount, fileJobCount };
  } catch (error) {
    logger.error('Failed to refresh jobs:', error);
    throw error;
  }
}

async function loadCuratedJobs(reason = 'manual') {
  try {
    const fileResult = await reloadJobsFromFile();
    logger.info(`[Jobs] ${reason}: inserted ${fileResult.inserted} curated jobs from ${getJobsFilePath()}`);
    await logJobSourceBreakdown(`${reason}-post-file`);
    return { success: true, jobCount: fileResult.inserted, source: 'file' };
  } catch (fileError) {
    logger.error(`[Jobs] ${reason}: jobs.csv import failed (${fileError.message}). No fallback sources will be loaded.`);
    throw new Error('jobs.csv import failed; please fix the file feed.');
  }
}

async function logJobSourceBreakdown(stage = 'snapshot') {
  try {
    const stats = await Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$source.platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!stats.length) {
      logger.info(`[Jobs] ${stage}: no active jobs present.`);
      return;
    }

    const summary = stats.map(({ _id, count }) => `${_id || 'unknown'}=${count}`).join(', ');
    logger.info(`[Jobs] ${stage} source breakdown: ${summary}`);
  } catch (error) {
    logger.warn(`Unable to compute job source breakdown at stage ${stage}: ${error.message}`);
  }
}

/**
 * Update job statistics
 */
async function updateJobStatistics() {
  try {
    logger.info('Updating job statistics...');
    
    // Get trending jobs (most views in last 7 days)
    const trendingJobs = await Job.getTrendingJobs(10);
    
    logger.info(`Found ${trendingJobs.length} trending jobs`);
    
    // Log some analytics
    const totalJobs = await Job.countDocuments({ status: 'active' });
    const totalMatches = await JobMatch.countDocuments();
    const totalApplications = await JobMatch.countDocuments({ applied: true });
    
    logger.info(`Job Analytics: ${totalJobs} active jobs, ${totalMatches} matches, ${totalApplications} applications`);
    
    return {
      totalJobs: totalJobs,
      totalMatches: totalMatches,
      totalApplications: totalApplications,
      trendingJobs: trendingJobs.length
    };
  } catch (error) {
    logger.error('Failed to update job statistics:', error);
    throw error;
  }
}

/**
 * Initialize cron jobs
 */
export function startJobScheduler() {
  logger.info('Starting job scheduler...');
  
  // Load seed jobs immediately on startup
  (async () => {
    try {
      logger.info('Loading curated jobs (jobs.csv) on startup...');
      await refreshJobs();
      logger.info('Initial job load complete');
    } catch (error) {
      logger.error('Initial job load failed:', error);
    }
  })();
  
  // Daily job refresh at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily job refresh...');
    try {
      await refreshJobs();
      await cleanupExpiredJobs();
      await updateJobStatistics();
    } catch (error) {
      logger.error('Daily job refresh failed:', error);
    }
  });
  
  // Cleanup expired jobs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running periodic cleanup...');
    try {
      await cleanupExpiredJobs();
    } catch (error) {
      logger.error('Periodic cleanup failed:', error);
    }
  });
  
  // Update statistics every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await updateJobStatistics();
    } catch (error) {
      logger.error('Statistics update failed:', error);
    }
  });
  
  logger.info('Job scheduler started successfully');
  logger.info('Schedules:');
  logger.info('- Daily job refresh: 00:00 (midnight)');
  logger.info('- Expired jobs cleanup: Every 6 hours');
  logger.info('- Statistics update: Every hour');
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopJobScheduler() {
  logger.info('Stopping job scheduler...');
  cron.getTasks().forEach(task => task.stop());
  logger.info('Job scheduler stopped');
}

export default {
  startJobScheduler,
  stopJobScheduler,
  refreshJobs,
  cleanupExpiredJobs,
  updateJobStatistics
};
