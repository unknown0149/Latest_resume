/**
 * Job Matching Service
 * Finds and scores matching jobs for a resume using hybrid approach:
 * 1. Backend skill matching with MongoDB indexes
 * 2. Watson summaries ONLY for top 3 matched jobs
 */

import { normalizeSkillsArray, matchSkillsFuzzy } from '../utils/skillNormalizer.js';
import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import { findSemanticMatches } from './semanticMatchingService.js';
import { logger } from '../utils/logger.js';

// Watson X.ai configuration
const WATSON_API_KEY = process.env.IBM_API_KEY;
const WATSON_PROJECT_ID = process.env.IBM_PROJECT_ID;
const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';
const WATSON_API_URL = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';

// Cache IAM token
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get IBM IAM token for Watson API authentication
 */
async function getIAMToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  try {
    const response = await fetch(IAM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSON_API_KEY}`,
    });

    if (!response.ok) {
      throw new Error(`IAM token request failed: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return cachedToken;
  } catch (error) {
    logger.error('Failed to get IAM token:', error);
    throw error;
  }
}

/**
 * Generate AI summary for a job match using Watson (ONLY for top 3 jobs)
 */
async function generateJobSummary(job, userSkills, matchScore) {
  const token = await getIAMToken();
  
  const prompt = `You are a career advisor. Write a concise 2-sentence summary explaining why this job matches the candidate's profile.

Job: ${job.title} at ${job.company.name}
Required Skills: ${job.skills.required.join(', ')}
Candidate Skills: ${userSkills.join(', ')}
Match Score: ${matchScore.toFixed(1)}%

Write ONLY 2 sentences focusing on the strongest skill matches and growth opportunities. Be encouraging but realistic.`;

  try {
    const response = await fetch(WATSON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.5,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.results[0].generated_text.trim();
    
    logger.info(`Watson summary generated for job ${job.jobId}`);
    return summary;
  } catch (error) {
    logger.error('Watson summary generation failed:', error);
    return null;
  }
}

/**
 * Calculate composite match score with multiple factors
 */
function calculateCompositeScore(job, userSkills, userExperience, preferences = {}) {
  const weights = {
    skills: 0.60,
    experience: 0.20,
    recency: 0.10,
    salary: 0.10,
  };
  
  // Skills match (60%)
  const skillScore = job.calculateMatchScore(userSkills);
  
  // Experience match (20%)
  let expScore = 0;
  if (job.experienceYears && userExperience) {
    const minExp = job.experienceYears.min || 0;
    const maxExp = job.experienceYears.max || 999;
    
    if (userExperience >= minExp && userExperience <= maxExp) {
      expScore = 100;
    } else if (userExperience < minExp) {
      // Penalize if under-qualified
      const gap = minExp - userExperience;
      expScore = Math.max(0, 100 - (gap * 15));
    } else {
      // Slight penalty if over-qualified
      const excess = userExperience - maxExp;
      expScore = Math.max(70, 100 - (excess * 5));
    }
  } else {
    expScore = 50; // Neutral if experience not specified
  }
  
  // Recency score (10%)
  const daysSincePosted = (Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - (daysSincePosted * 2));
  
  // Salary match (10%)
  let salaryScore = 50; // Default neutral
  if (preferences.minSalary && job.salary.min) {
    if (job.salary.min >= preferences.minSalary) {
      salaryScore = 100;
    } else {
      const gap = ((preferences.minSalary - job.salary.min) / preferences.minSalary) * 100;
      salaryScore = Math.max(0, 100 - gap);
    }
  }
  
  // Calculate weighted composite score
  const compositeScore = 
    (skillScore * weights.skills) +
    (expScore * weights.experience) +
    (recencyScore * weights.recency) +
    (salaryScore * weights.salary);
  
  return {
    composite: compositeScore,
    breakdown: {
      skills: skillScore,
      experience: expScore,
      recency: recencyScore,
      salary: salaryScore,
    },
  };
}

/**
 * Find matching jobs for a resume
 */
export async function findMatchingJobs(parsedResume, options = {}) {
  const startTime = Date.now();
  
  try {
    const {
      limit = 20,
      minMatchScore = 50,
      includeRemote = true,
      employmentType = null,
      generateAISummaries = true, // Only for top 3
      useEmbeddings = false, // NEW: Enable hybrid scoring with embeddings
    } = options;
    
    // Extract user data
    const userSkills = normalizeSkillsArray([
      ...(parsedResume.extracted_text?.skills || []),
      ...(parsedResume.parsed_data?.skills || []),
      ...(parsedResume.parsed_resume?.skills || []),
    ]);
    
    const userExperience = parsedResume.parsed_data?.experience || parsedResume.parsed_resume?.years_experience || 0;
    const userId = parsedResume.user_id || 'anonymous';
    const resumeId = parsedResume.resumeId || parsedResume._id?.toString();
    
    logger.info(`Finding jobs for resume ${resumeId}: ${userSkills.length} skills, ${userExperience} years exp`);
    
    // NEW: Check if we can use semantic matching
    let semanticMatches = null;
    let scoringMethod = 'classical';
    
    if (useEmbeddings && parsedResume.embedding && parsedResume.embedding.length > 0) {
      try {
        logger.info('Using hybrid scoring with embeddings');
        const semanticResult = await findSemanticMatches(resumeId, {
          limit: limit * 3, // Get more for hybrid ranking
          minSimilarity: 0.60, // Lower threshold for hybrid
          includeJobDetails: false,
        });
        
        if (semanticResult.success && semanticResult.matches.length > 0) {
          semanticMatches = new Map(
            semanticResult.matches.map(m => [m.jobId, m.semanticScore / 100]) // Normalize to 0-1
          );
          scoringMethod = 'hybrid';
          logger.info(`Semantic matching found ${semanticMatches.size} jobs`);
        }
      } catch (error) {
        logger.warn('Semantic matching failed, falling back to classical:', error.message);
      }
    }
    
    // Query jobs using MongoDB indexed search
    const queryOptions = {
      minMatchScore: minMatchScore,
      isRemote: includeRemote ? undefined : false,
      employmentType: employmentType,
      limit: limit * 2, // Fetch more for re-ranking
    };
    
    const jobs = await Job.findMatchingJobs(userSkills, queryOptions);
    
    if (jobs.length === 0) {
      return {
        matches: [],
        total: 0,
        message: 'No matching jobs found. Try lowering your minimum match score or updating your skills.',
        metadata: {
          processingTime: Date.now() - startTime,
          watsonCalls: 0,
          scoringMethod,
        },
      };
    }
    
    // Calculate composite scores and re-rank
    const enrichedJobs = jobs.map(job => {
      const skillBreakdown = job.getSkillBreakdown(userSkills);
      const compositeScores = calculateCompositeScore(job, userSkills, userExperience, options.preferences);
      
      // NEW: Hybrid scoring - combine classical and semantic
      let finalScore = compositeScores.composite;
      let semanticScore = null;
      
      if (scoringMethod === 'hybrid' && semanticMatches && semanticMatches.has(job.jobId)) {
        semanticScore = semanticMatches.get(job.jobId);
        // Hybrid formula: 70% semantic + 30% classical
        finalScore = (semanticScore * 100 * 0.70) + (compositeScores.composite * 0.30);
      }
      
      return {
        job: job,
        matchScore: finalScore,
        classicalScore: compositeScores.composite,
        semanticScore: semanticScore ? (semanticScore * 100).toFixed(2) : null,
        scoreBreakdown: compositeScores.breakdown,
        skillsMatched: skillBreakdown.matched,
        skillsMissing: skillBreakdown.missing,
        matchPercentage: ((skillBreakdown.matched.length / job.skills.allSkills.length) * 100).toFixed(1),
      };
    });
    
    // Sort by final score (hybrid or classical)
    enrichedJobs.sort((a, b) => b.matchScore - a.matchScore);
    
    // Take top matches
    const topMatches = enrichedJobs.slice(0, limit);
    
    // Generate AI summaries for top 10 jobs (increased from 3 for better UX)
    let watsonCallCount = 0;
    if (generateAISummaries && topMatches.length > 0) {
      const jobsToSummarize = topMatches.slice(0, Math.min(10, topMatches.length));
      
      logger.info(`Generating Watson summaries for ${jobsToSummarize.length} jobs`);
      
      for (const match of jobsToSummarize) {
        try {
          const summary = await generateJobSummary(match.job, userSkills, match.matchScore);
          if (summary) {
            match.aiSummary = summary;
            watsonCallCount++;
          }
          
          // Rate limiting - 200ms between calls
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.error(`Failed to generate summary for job ${match.job.jobId}:`, error);
          // Continue with next job even if this one fails
        }
      }
      
      logger.info(`Generated ${watsonCallCount} Watson summaries`);
    }
    
    // Save matches to database
    const savePromises = topMatches.map(match => 
      JobMatch.findOrCreate({
        userId: userId,
        resumeId: resumeId,
        jobId: match.job.jobId,
        matchScore: match.matchScore,
        classicalScore: match.classicalScore,
        semanticScore: match.semanticScore ? parseFloat(match.semanticScore) : null,
        matchedSkills: match.skillsMatched,
        missingSkills: match.skillsMissing,
        aiSummary: match.aiSummary || null,
      })
    );
    
    await Promise.all(savePromises);
    
    // Format response
    const result = {
      matches: topMatches.map(match => ({
        jobId: match.job.jobId,
        title: match.job.title,
        company: {
          name: match.job.company.name,
          logo: match.job.company.logo,
          website: match.job.company.website,
        },
        location: match.job.location,
        employmentType: match.job.employmentType,
        experienceLevel: match.job.experienceLevel,
        salary: match.job.salary,
        matchScore: parseFloat(match.matchScore.toFixed(1)),
        classicalScore: match.classicalScore ? parseFloat(match.classicalScore.toFixed(1)) : null,
        semanticScore: match.semanticScore,
        matchPercentage: match.matchPercentage,
        scoreBreakdown: match.scoreBreakdown,
        skillsMatched: match.skillsMatched,
        skillsMissing: match.skillsMissing,
        aiSummary: match.aiSummary,
        postedDate: match.job.postedDate,
        applicationUrl: match.job.applicationUrl,
      })),
      total: topMatches.length,
      metadata: {
        scoringMethod: scoringMethod,
        totalJobsEvaluated: jobs.length,
        semanticJobsFound: semanticMatches ? semanticMatches.size : 0,
        processingTime: Date.now() - startTime,
        watsonCalls: watsonCallCount,
        watsonUsagePercent: ((watsonCallCount / topMatches.length) * 100).toFixed(1),
        timestamp: new Date().toISOString(),
      },
    };
    
    logger.info(`Job matching complete: ${topMatches.length} jobs using ${scoringMethod} scoring, ${watsonCallCount} Watson calls (${result.metadata.watsonUsagePercent}%)`);
    return result;
    
  } catch (error) {
    logger.error('Job matching failed:', error);
    throw error;
  }
}

/**
 * Get job details with match information
 */
export async function getJobWithMatch(jobId, resumeId) {
  try {
    const job = await Job.findOne({ jobId: jobId, status: 'active' });
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Get match record if exists
    const match = await JobMatch.findOne({ resumeId: resumeId, jobId: jobId });
    
    return {
      job: job,
      match: match ? {
        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        aiSummary: match.aiSummary,
        viewed: match.viewed,
        applied: match.applied,
        saved: match.saved,
      } : null,
    };
  } catch (error) {
    logger.error('Failed to get job details:', error);
    throw error;
  }
}

/**
 * Track job interaction (view, apply, save)
 */
export async function trackJobInteraction(jobId, resumeId, action) {
  try {
    const match = await JobMatch.findOne({ resumeId: resumeId, jobId: jobId });
    
    if (!match) {
      throw new Error('Job match not found');
    }
    
    // Update based on action
    switch (action) {
      case 'view':
        await match.markAsViewed();
        // Increment job views
        await Job.findOneAndUpdate({ jobId: jobId }, { $inc: { views: 1 } });
        break;
        
      case 'apply':
        await match.markAsApplied();
        // Increment job applications
        await Job.findOneAndUpdate({ jobId: jobId }, { $inc: { applications: 1 } });
        break;
        
      case 'save':
        await match.toggleSaved();
        break;
        
      case 'dismiss':
        await match.dismiss();
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
    logger.info(`Job interaction tracked: ${action} for job ${jobId}`);
    return { success: true, action: action };
    
  } catch (error) {
    logger.error('Failed to track job interaction:', error);
    throw error;
  }
}

export default {
  findMatchingJobs,
  getJobWithMatch,
  trackJobInteraction,
};
