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
import { importJobsFromJSON, importJobsFromCSV } from '../services/csvJobImportService.js';
import { generateTagline, generateBio } from '../services/taglineService.js';
import { analyzeStrengths } from '../services/softSkillsService.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import { logger } from '../utils/logger.js';
import { loadJobsFromFile, reloadJobsFromFile, getJobsFilePath } from '../services/fileJobService.js';
import { evaluateJobCompatibilityWithWatson, mapResumeToProfile } from '../services/watsonJobCompatibilityService.js';

const router = express.Router();

/**
 * NOTE: /api/resume/:resumeId/analyze-role endpoint moved to resume.routes.js
 * to avoid conflicts and keep resume-related operations together.
 */

/**
 * POST /api/resume/:resumeId/analyze-role-fast
 * Fast role analysis WITHOUT Watson AI (heuristic-only, <2 seconds)
 * Use this when you need quick results without AI overhead
 */
router.post('/resume/:resumeId/analyze-role-fast', async (req, res) => {
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
    
    const skills = resume.parsed_resume?.skills || [];
    const experience = resume.parsed_resume?.years_experience || 0;
    
    if (skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume must have skills for analysis'
      });
    }
    
    // Fast heuristic role matching (no AI)
    const roleScores = [];
    for (const roleData of roles) {
      const { role: roleName, requiredSkills = [], preferredSkills = [] } = roleData;
      
      const coreMatches = requiredSkills.filter(skill => 
        skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
      
      const score = (coreMatches.length / requiredSkills.length) * 100;
      
      roleScores.push({
        name: roleName,
        score,
        coreMatches: coreMatches.length,
        totalCore: requiredSkills.length
      });
    }
    
    roleScores.sort((a, b) => b.score - a.score);
    const topRole = roleScores[0];
    
    // Quick skill analysis
    const roleData = getRoleByName(topRole.name);
    const requiredSkills = roleData?.requiredSkills || [];
    const skillsHave = requiredSkills.filter(skill => 
      skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
    const skillsMissing = requiredSkills.filter(skill => 
      !skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
    
    res.json({
      success: true,
      fast: true,
      data: {
        predictedRole: {
          name: topRole.name,
          score: topRole.score,
          matchPercentage: Math.round(topRole.score)
        },
        skillsHave,
        skillsMissing,
        totalSkills: skills.length,
        processingTime: '<2s'
      }
    });
    
  } catch (error) {
    logger.error('Fast role analysis failed:', error);
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
      useEmbeddings = false, // Hybrid scoring toggle
      verifyWithWatson = 'false'
    } = req.query;
    const enforceWatson = verifyWithWatson === 'true';
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Load CSV-backed job pool first so matches always reflect jobs.csv
    const fileJobs = await loadJobsFromFile();
    if (!fileJobs.length) {
      logger.error('jobs.csv returned 0 records. Aborting match request to avoid non-curated sources.');
      return res.status(503).json({
        success: false,
        error: 'jobs.csv feed is empty. Please upload at least one job entry before matching.'
      });
    }

    logger.info(
      `Finding matching jobs for resume ${resumeId} (embeddings: ${useEmbeddings === 'true'}, watson: ${enforceWatson}) using jobs.csv dataset`
    );
    let matchResult = await findMatchingJobs(resume, {
      limit: parseInt(limit),
      minMatchScore: parseInt(minMatchScore),
      includeRemote: includeRemote === 'true',
      employmentType,
      generateAISummaries: generateAISummaries === 'true',
      useEmbeddings: useEmbeddings === 'true', // Pass to service
      preferences: {
        minSalary: resume.parsed_data?.expectedSalary
      },
      verifyWithWatson: enforceWatson,
      sourcePlatforms: ['file']
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
 * GET /api/jobs/file-feed
 * Return jobs directly from backend/jobs.csv for quick card rendering
 */
router.get('/jobs/file-feed', async (req, res) => {
  try {
    const rawShape = req.query.shape === 'raw' || req.query.raw === 'true';
    const jobsData = await loadJobsFromFile();
    const total = jobsData.length;
    const offsetParam = Math.max(parseInt(req.query.offset) || 0, 0);
    const offset = Math.min(offsetParam, total);
    const requestedLimit = Math.max(parseInt(req.query.limit) || 50, 1);
    const slice = jobsData.slice(offset, Math.min(offset + requestedLimit, total));
    const payload = rawShape
      ? slice
      : slice.map((job) => ({
          id: job.jobId,
          title: job.title,
          company: job.company?.name,
          location: job.location?.city,
          salaryMin: job.salary?.min,
          salaryMax: job.salary?.max,
          currency: job.salary?.currency,
          experienceLevel: job.experienceLevel,
          employmentType: job.employmentType,
          skills: job.skills?.allSkills || [],
          description: job.description,
          applicationUrl: job.applicationUrl,
          tag: job.tag,
          source: job.source?.platform
        }));

    res.json({
      success: true,
      total,
      jobs: payload,
      metadata: {
        offset,
        limit: payload.length,
        filePath: 'backend/jobs.csv'
      }
    });
  } catch (error) {
    logger.error('Failed to read jobs.csv for file-feed:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to load jobs from file feed'
    });
  }
});

/**
 * GET /api/jobs/search
 * Search jobs from jobs.csv with lightweight server-side filtering and optional resume compatibility
 */
router.get('/jobs/search', async (req, res) => {
  try {
    const {
      q,
      location,
      employmentType,
      experienceLevel,
      isRemote,
      tag,
      skills,
      offset = 0,
      limit = 20,
      resumeId
    } = req.query;

    const jobsData = await loadJobsFromFile();
    let filtered = jobsData;

    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company?.name?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query)
      );
    }

    if (location) {
      const city = location.toLowerCase();
      filtered = filtered.filter(job => job.location?.city?.toLowerCase().includes(city));
    }

    if (employmentType) {
      filtered = filtered.filter(job => job.employmentType === employmentType);
    }

    if (experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === experienceLevel);
    }

    if (isRemote === 'true') {
      filtered = filtered.filter(job => job.location?.isRemote);
    } else if (isRemote === 'false') {
      filtered = filtered.filter(job => !job.location?.isRemote);
    }

    if (tag) {
      filtered = filtered.filter(job => job.tag === tag);
    }

    if (skills) {
      const skillList = skills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (skillList.length) {
        filtered = filtered.filter(job =>
          skillList.every(skill => job.skills?.allSkills?.includes(skill))
        );
      }
    }

    const maxLimit = Math.min(parseInt(limit) || 20, 50);
    let cursor = Math.max(parseInt(offset) || 0, 0);
    const total = filtered.length;
    const results = [];

    let resumeProfile = null;
    if (resumeId) {
      const resume = await Resume.findOne({ resumeId });
      resumeProfile = mapResumeToProfile(resume);
    }

    while (cursor < total && results.length < maxLimit) {
      const job = filtered[cursor];
      cursor++;

      if (resumeProfile) {
        const compatibility = await evaluateJobCompatibilityWithWatson(resumeProfile, job);
        job.compatibility = compatibility;
        if (!compatibility.compatible) {
          continue;
        }
      }

      results.push(job);
    }

    res.json({
      success: true,
      total,
      returned: results.length,
      nextOffset: cursor < total ? cursor : null,
      jobs: results
    });
  } catch (error) {
    logger.error('Job search failed:', error);
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
 * POST /api/admin/import-jobs-json
 * Import jobs from JSON file (admin only)
 */
router.post('/admin/import-jobs-json', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath is required'
      });
    }
    
    const result = await importJobsFromJSON(filePath);
    res.json(result);
  } catch (error) {
    logger.error('Failed to import jobs from JSON:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/import-jobs-csv
 * Import jobs from CSV file (admin only)
 */
router.post('/admin/import-jobs-csv', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath is required'
      });
    }
    
    const result = await importJobsFromCSV(filePath);
    res.json(result);
  } catch (error) {
    logger.error('Failed to import jobs from CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/reload-file-jobs
 * Purge Job collection and reload from backend/jobs.csv
 */
router.post('/admin/reload-file-jobs', async (_req, res) => {
  try {
    const result = await reloadJobsFromFile();
    res.json({
      success: true,
      message: `Reloaded ${result.inserted} jobs from ${getJobsFilePath()}`,
      data: result
    });
  } catch (error) {
    logger.error('Failed to reload jobs from csv file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/list
 * List all jobs with advanced filtering and sorting
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Jobs per page (default: 20)
 *   - search: Search in title, company, description
 *   - location: Filter by city/state
 *   - employmentType: Filter by employment type (full-time, part-time, contract, internship, freelance)
 *   - experienceLevel: Filter by experience level (entry, mid, senior, lead, executive)
 *   - isRemote: Filter remote jobs (true/false)
 *   - tag: Filter by tag (internship, job, etc)
 *   - company: Filter by company name
 *   - salaryMin: Minimum salary
 *   - salaryMax: Maximum salary
 *   - skills: Comma-separated skills to match
 *   - sortBy: Sort field (postedDate, salary, title, company)
 *   - sortOrder: Sort direction (asc, desc) - default: desc
 */
router.get('/jobs/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      employmentType,
      experienceLevel,
      isRemote,
      tag,
      company,
      salaryMin,
      salaryMax,
      skills,
      sortBy = 'postedDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter query
    const filter = { status: 'active' };
    
    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Location filter
    if (location) {
      filter.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ];
    }
    
    // Employment type filter
    if (employmentType) {
      filter.employmentType = employmentType;
    }
    
    // Experience level filter
    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }
    
    // Remote filter
    if (isRemote !== undefined) {
      filter['location.isRemote'] = isRemote === 'true';
    }
    
    // Tag filter
    if (tag) {
      filter.tag = tag;
    }
    
    // Company filter
    if (company) {
      filter['company.name'] = { $regex: company, $options: 'i' };
    }
    
    // Salary range filter
    if (salaryMin || salaryMax) {
      filter['salary.max'] = {};
      if (salaryMin) filter['salary.max'].$gte = parseInt(salaryMin);
      if (salaryMax) filter['salary.min'] = { $lte: parseInt(salaryMax) };
    }
    
    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      filter['skills.allSkills'] = { $in: skillsArray };
    }
    
    // Build sort object
    const sortOptions = {};
    if (sortBy === 'salary') {
      sortOptions['salary.max'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'title') {
      sortOptions.title = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'company') {
      sortOptions['company.name'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.postedDate = sortOrder === 'asc' ? 1 : -1;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-embedding -embedding_metadata'),
      Job.countDocuments(filter)
    ]);
    
    // Get filter statistics
    const stats = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgSalaryMin: { $avg: '$salary.min' },
          avgSalaryMax: { $avg: '$salary.max' },
          employmentTypes: { $addToSet: '$employmentType' },
          experienceLevels: { $addToSet: '$experienceLevel' },
          tags: { $addToSet: '$tag' },
          companies: { $addToSet: '$company.name' }
        }
      }
    ]);
    
    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + jobs.length < total
      },
      stats: stats[0] || {},
      filters: {
        search,
        location,
        employmentType,
        experienceLevel,
        isRemote,
        tag,
        company,
        salaryMin,
        salaryMax,
        skills,
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    logger.error('Failed to list jobs:', error);
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
