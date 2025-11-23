/**
 * ═══════════════════════════════════════════════════════════════════════
 * JOB API ROUTES (Using Unified Intelligent Matching Service)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Endpoints:
 *   - POST /api/resume/:resumeId/analyze-role → AI role prediction + skill gaps
 *   - GET /api/jobs/match/:resumeId → Hybrid job matching (embeddings + classical)
 *   - GET /api/jobs/semantic-match/:resumeId → Pure semantic matching
 *   - POST /api/jobs/:jobId/track → Track interactions (view/apply/save)
 *   - GET /api/jobs/saved/:resumeId → User saved jobs
 */

import express from 'express';
import { 
  predictBestRole, 
  analyzeSkills, 
  findMatchingJobs, 
  findSemanticMatches, 
  findSimilarJobs,
  trackJobInteraction,
  getJobWithMatch
} from '../services/intelligentJobMatchingService.js';
import { queueResumeEmbedding, queueJobEmbedding, getQueueStats, processQueue } from '../services/embeddingQueueService.js';
import { loadSeedJobs, clearSeedJobs } from '../services/seedJobsService.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/resume/:resumeId/analyze-role
 * Analyze resume and predict best job role with skill gaps
 */
router.post('/resume/:resumeId/analyze-role', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Check if already analyzed (cache)
    if (resume.job_analysis?.predictedRole && !req.query.force) {
      const cacheAge = Date.now() - new Date(resume.job_analysis.analyzedAt).getTime();
      const cacheMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (cacheAge < cacheMaxAge) {
        logger.info(`Returning cached analysis for resume ${resumeId}`);
        return res.json({
          success: true,
          cached: true,
          data: resume.job_analysis,
          metadata: {
            cachedAt: resume.job_analysis.analyzedAt,
            cacheAgeHours: Math.floor(cacheAge / (1000 * 60 * 60))
          }
        });
      }
    }
    
    // Step 1: Predict best role
    logger.info(`Analyzing role for resume ${resumeId}`);
    const rolePrediction = await predictBestRole(resume);
    
    // Step 2: Analyze skills for predicted role
    const skillAnalysis = await analyzeSkills(resume, rolePrediction.primaryRole.name);
    
    // Step 3: Save analysis to resume
    resume.job_analysis = {
      predictedRole: rolePrediction.primaryRole,
      alternativeRoles: rolePrediction.alternativeRoles,
      skillsHave: skillAnalysis.skillsHave,
      skillsMissing: skillAnalysis.skillsMissing,
      salaryBoostOpportunities: skillAnalysis.salaryBoostOpportunities.topOpportunities,
      analyzedAt: new Date()
    };
    
    // Update parsing metadata
    if (!resume.parsing_metadata) {
      resume.parsing_metadata = {};
    }
    resume.parsing_metadata.watsonCallCount = (resume.parsing_metadata.watsonCallCount || 0) + 
      (rolePrediction.metadata.watsonUsed ? 1 : 0);
    
    await resume.save();
    
    // Step 4: Return combined results
    res.json({
      success: true,
      cached: false,
      data: {
        rolePrediction: rolePrediction,
        skillAnalysis: skillAnalysis,
        recommendations: skillAnalysis.recommendations
      }
    });
    
  } catch (error) {
    logger.error('Role analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/match/:resumeId
 * Find matching jobs for a resume
 * Query params:
 *   - useEmbeddings: boolean (default: false) - Enable hybrid scoring with embeddings
 *   - limit, minMatchScore, includeRemote, employmentType, generateAISummaries
 */
router.get('/jobs/match/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const {
      limit = 20,
      minMatchScore = 50,
      includeRemote = true,
      employmentType = null,
      generateAISummaries = true,
      useEmbeddings = false // NEW: Enable hybrid scoring
    } = req.query;
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Find matching jobs
    logger.info(`Finding matching jobs for resume ${resumeId} (embeddings: ${useEmbeddings === 'true'})`);
    const matchResult = await findMatchingJobs(resume, {
      limit: parseInt(limit),
      minMatchScore: parseInt(minMatchScore),
      includeRemote: includeRemote === 'true',
      employmentType: employmentType,
      generateAISummaries: generateAISummaries === 'true',
      useEmbeddings: useEmbeddings === 'true', // Pass to service
      preferences: {
        minSalary: resume.parsed_data?.expectedSalary
      }
    });
    
    res.json({
      success: true,
      data: matchResult
    });
    
  } catch (error) {
    logger.error('Job matching failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get job details with match information
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeId } = req.query;
    
    if (resumeId) {
      // Get job with match info
      const result = await getJobWithMatch(jobId, resumeId);
      res.json({
        success: true,
        data: result
      });
    } else {
      // Get job only
      const job = await Job.findOne({ jobId: jobId, status: 'active' });
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      res.json({
        success: true,
        data: { job: job, match: null }
      });
    }
    
  } catch (error) {
    logger.error('Failed to get job details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/:jobId/track
 * Track job interaction (view, apply, save, dismiss)
 */
router.post('/jobs/:jobId/track', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeId, action } = req.body;
    
    if (!resumeId || !action) {
      return res.status(400).json({
        success: false,
        error: 'resumeId and action are required'
      });
    }
    
    if (!['view', 'apply', 'save', 'dismiss'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: view, apply, save, or dismiss'
      });
    }
    
    const result = await trackJobInteraction(jobId, resumeId, action);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Failed to track job interaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/saved/:resumeId
 * Get saved jobs for a user
 */
router.get('/jobs/saved/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Get saved matches
    const matches = await JobMatch.find({
      resumeId: resumeId,
      saved: true
    }).sort({ savedAt: -1 });
    
    // Fetch job details
    const jobIds = matches.map(m => m.jobId);
    const jobs = await Job.find({ jobId: { $in: jobIds }, status: 'active' });
    
    // Combine match and job data
    const savedJobs = matches.map(match => {
      const job = jobs.find(j => j.jobId === match.jobId);
      return {
        job: job,
        match: {
          matchScore: match.matchScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          aiSummary: match.aiSummary,
          savedAt: match.savedAt
        }
      };
    }).filter(item => item.job); // Filter out jobs that no longer exist
    
    res.json({
      success: true,
      count: savedJobs.length,
      data: savedJobs
    });
    
  } catch (error) {
    logger.error('Failed to get saved jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/applied/:resumeId
 * Get applied jobs for a user
 */
router.get('/jobs/applied/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const matches = await JobMatch.find({
      resumeId: resumeId,
      applied: true
    }).sort({ appliedAt: -1 });
    
    const jobIds = matches.map(m => m.jobId);
    const jobs = await Job.find({ jobId: { $in: jobIds } });
    
    const appliedJobs = matches.map(match => {
      const job = jobs.find(j => j.jobId === match.jobId);
      return {
        job: job,
        match: {
          matchScore: match.matchScore,
          appliedAt: match.appliedAt,
          applicationStatus: match.applicationStatus
        }
      };
    }).filter(item => item.job);
    
    res.json({
      success: true,
      count: appliedJobs.length,
      data: appliedJobs
    });
    
  } catch (error) {
    logger.error('Failed to get applied jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/semantic-match/:resumeId
 * Find semantically similar jobs using embeddings (Phase 3)
 * Query params:
 *   - threshold: number (default: 0.70) - Minimum similarity score (0-1)
 *   - limit: number (default: 20) - Max results
 */
router.get('/jobs/semantic-match/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const {
      threshold = 0.70,
      limit = 20
    } = req.query;
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Check if resume has embedding
    if (!resume.embedding || resume.embedding.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume does not have an embedding. Generate one first using POST /api/resume/:resumeId/generate-embedding',
        hint: 'Embeddings are generated automatically after parsing, or you can trigger generation manually.'
      });
    }
    
    logger.info(`Finding semantic matches for resume ${resumeId} (threshold: ${threshold})`);
    const result = await findSemanticMatches(resumeId, {
      minSimilarity: parseFloat(threshold),
      limit: parseInt(limit),
      includeJobDetails: true,
      applySkillAdjustment: true
    });
    
    res.json({
      success: result.success,
      data: {
        matches: result.matches,
        metadata: result.metadata
      }
    });
    
  } catch (error) {
    logger.error('Semantic matching failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/:jobId/similar
 * Find similar jobs to a given job using embeddings (Phase 3)
 * Query params:
 *   - limit: number (default: 5) - Max similar jobs to return
 */
router.get('/jobs/:jobId/similar', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 5 } = req.query;
    
    logger.info(`Finding similar jobs to ${jobId}`);
    const result = await findSimilarJobs(jobId, {
      limit: parseInt(limit),
      includeJobDetails: true
    });
    
    res.json({
      success: result.success,
      data: {
        referenceJob: result.referenceJob,
        similarJobs: result.matches,
        metadata: result.metadata
      }
    });
    
  } catch (error) {
    logger.error('Failed to find similar jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/resume/:resumeId/generate-embedding
 * Manually trigger embedding generation for a resume (Phase 3)
 */
router.post('/resume/:resumeId/generate-embedding', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Check if resume has parsed data
    if (!resume.parsed_resume || !resume.parsed_resume.skills || resume.parsed_resume.skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume must be parsed first. Use POST /api/resume/:resumeId/parse'
      });
    }
    
    // Queue embedding generation with high priority
    const result = queueResumeEmbedding(resumeId, 'high');
    
    // Calculate estimated time
    const queueStats = getQueueStats();
    const estimatedMinutes = Math.ceil((result.position * 0.5) / 60); // ~30s per batch, 10/batch
    
    logger.info(`Queued embedding generation for resume ${resumeId} at position ${result.position}`);
    
    res.json({
      success: true,
      message: 'Embedding generation queued',
      data: {
        queued: result.queued,
        position: result.position,
        queueSize: result.queueSize,
        estimatedTimeMinutes: estimatedMinutes,
        queueStats: queueStats
      }
    });
    
  } catch (error) {
    logger.error('Failed to queue embedding generation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/embedding-queue-stats
 * Get embedding queue statistics (admin only)
 */
router.get('/admin/embedding-queue-stats', async (req, res) => {
  try {
    const stats = getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/process-embedding-queue
 * Manually trigger queue processing (admin only, for testing)
 */
router.post('/admin/process-embedding-queue', async (req, res) => {
  try {
    logger.info('Manually triggering embedding queue processing');
    
    // Process queue asynchronously
    processQueue().catch(err => {
      logger.error('Queue processing error:', err);
    });
    
    res.json({
      success: true,
      message: 'Queue processing triggered',
      data: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to trigger queue processing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/seed-jobs
 * Load seed jobs into database (admin only)
 */
router.post('/admin/seed-jobs', async (req, res) => {
  try {
    const result = await loadSeedJobs();
    res.json(result);
  } catch (error) {
    logger.error('Failed to load seed jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/seed-jobs
 * Clear all seed jobs (admin only)
 */
router.delete('/admin/seed-jobs', async (req, res) => {
  try {
    const result = await clearSeedJobs();
    res.json(result);
  } catch (error) {
    logger.error('Failed to clear seed jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/watson-usage
 * Get Watson API usage statistics
 */
router.get('/stats/watson-usage', async (req, res) => {
  try {
    // Get total resumes analyzed
    const totalResumes = await Resume.countDocuments({
      'parsing_metadata.parsedAt': { $exists: true }
    });
    
    // Get resumes that used Watson
    const watsonResumes = await Resume.countDocuments({
      'parsing_metadata.watsonCallCount': { $gt: 0 }
    });
    
    // Get total Watson calls
    const watsonCallsResult = await Resume.aggregate([
      { $match: { 'parsing_metadata.watsonCallCount': { $exists: true } } },
      { $group: { _id: null, total: { $sum: '$parsing_metadata.watsonCallCount' } } }
    ]);
    
    const totalWatsonCalls = watsonCallsResult.length > 0 ? watsonCallsResult[0].total : 0;
    
    // Calculate percentage
    const watsonUsagePercent = totalResumes > 0 ? ((watsonResumes / totalResumes) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        totalResumes: totalResumes,
        resumesUsingWatson: watsonResumes,
        totalWatsonCalls: totalWatsonCalls,
        watsonUsagePercent: parseFloat(watsonUsagePercent),
        targetUsagePercent: 5.0
      }
    });
    
  } catch (error) {
    logger.error('Failed to get Watson usage stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
