/**
 * ═══════════════════════════════════════════════════════════════════════
 * INTELLIGENT JOB MATCHING SERVICE (UNIFIED)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Consolidates:
 *   - rolePredictionService.js (AI role prediction)
 *   - skillAnalysisService.js (skill gap analysis)
 *   - jobMatchingService.js (hybrid scoring)
 *   - semanticMatchingService.js (embedding similarity)
 * 
 * Complete workflow: Role Prediction → Skill Gap → Job Ranking → AI Summaries
 */

import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import { logger } from '../utils/logger.js';
import { roles, getRoleByName } from '../data/roleSkillDatabase.js';
import { salaryBoostSkills } from '../data/salaryBoostSkills.js';
import { predictRoleWithWatson, generateJobSummary } from './resumeProcessingService.js';
import { generateCandidateEmbedding, generateJobEmbedding } from './embeddingService.js';

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: ROLE PREDICTION (AI-Powered)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Predict best job role for candidate using Watson X.ai
 * 
 * Process:
 * 1. Match skills against role database (heuristic scoring)
 * 2. Use Watson X.ai to predict top 3 roles
 * 3. Return primary role + alternatives
 */
export async function predictBestRole(resume) {
  try {
    const { skills = [], years_experience = 0, current_title } = resume.parsed_resume || {};
    
    if (!skills || skills.length === 0) {
      throw new Error('Resume must have skills to predict role');
    }
    
    logger.info(`Predicting role for resume with ${skills.length} skills`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Heuristic Scoring (fast baseline)
    // ─────────────────────────────────────────────────────────────────────
    
    const roleScores = [];
    
    for (const roleData of roles) {
      const { role: roleName, requiredSkills: core_skills = [], preferredSkills: optional_skills = [], experienceRange = {} } = roleData;
      const min_experience = experienceRange.min || 0;
      
      // Skip if candidate doesn't meet min experience
      if (years_experience < min_experience) continue;
      
      // Calculate skill match score
      const coreMatches = core_skills.filter(skill => 
        skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || 
                        skill.toLowerCase().includes(s.toLowerCase()))
      );
      
      const optionalMatches = optional_skills.filter(skill =>
        skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) ||
                        skill.toLowerCase().includes(s.toLowerCase()))
      );
      
      const coreScore = (coreMatches.length / core_skills.length) * 100;
      const optionalScore = (optionalMatches.length / optional_skills.length) * 50;
      const totalScore = coreScore + optionalScore;
      
      roleScores.push({
        name: roleName,
        score: totalScore,
        coreMatches: coreMatches.length,
        totalCore: core_skills.length,
        optionalMatches: optionalMatches.length
      });
    }
    
    // Sort by score
    roleScores.sort((a, b) => b.score - a.score);
    const topRoles = roleScores.slice(0, 3);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Watson X.ai Role Prediction (AI enhancement)
    // ─────────────────────────────────────────────────────────────────────
    
    let watsonUsed = false;
    let aiRoles = [];
    
    try {
      const watsonResult = await predictRoleWithWatson(skills, years_experience, current_title);
      
      if (watsonResult.success && watsonResult.roles.length > 0) {
        watsonUsed = true;
        aiRoles = watsonResult.roles;
        logger.info(`Watson predicted roles: ${aiRoles.join(', ')}`);
      }
    } catch (error) {
      logger.warn(`Watson role prediction failed: ${error.message}`);
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Combine Heuristic + AI Results
    // ─────────────────────────────────────────────────────────────────────
    
    let finalRoles = topRoles;
    
    // If Watson provided results, boost those roles in ranking
    if (watsonUsed && aiRoles.length > 0) {
      const primaryAIRole = aiRoles[0];
      
      // Check if Watson's primary role matches our top roles
      const matchIndex = topRoles.findIndex(r => 
        r.name.toLowerCase().includes(primaryAIRole.toLowerCase()) ||
        primaryAIRole.toLowerCase().includes(r.name.toLowerCase())
      );
      
      if (matchIndex >= 0) {
        // Watson confirmed our prediction - boost confidence
        finalRoles = topRoles;
      } else {
        // Watson suggests different role - add it as primary
        const roleData = getRoleByName(primaryAIRole) || roles.find(r => r.role === topRoles[0].name);
        
        finalRoles = [
          {
            name: primaryAIRole,
            score: 85,
            coreMatches: 0,
            totalCore: roleData?.requiredSkills?.length || 0,
            optionalMatches: 0,
            source: 'watson'
          },
          ...topRoles.slice(0, 2)
        ];
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Build Response
    // ─────────────────────────────────────────────────────────────────────
    
    const primaryRole = finalRoles[0];
    const primaryRoleData = getRoleByName(primaryRole.name);
    
    if (!primaryRoleData) {
      throw new Error(`Role data not found for: ${primaryRole.name}`);
    }
    
    return {
      primaryRole: {
        name: primaryRole.name,
        matchScore: primaryRole.score,
        matchPercentage: Math.round(primaryRole.score),
        coreSkillsMatched: `${primaryRole.coreMatches}/${primaryRole.totalCore}`,
        description: primaryRoleData.description,
        avgSalaryRange: primaryRoleData.salaryRange?.INR || { min: 500000, max: 2000000 },
        minExperience: primaryRoleData.experienceRange?.min || 0
      },
      alternativeRoles: finalRoles.slice(1, 3).map(role => {
        const roleData = getRoleByName(role.name) || {};
        return {
          name: role.name,
          matchScore: role.score,
          matchPercentage: Math.round(role.score),
          description: roleData.description || 'No description available'
        };
      }),
      metadata: {
        watsonUsed: watsonUsed,
        aiSuggestedRoles: aiRoles,
        totalRolesEvaluated: roleScores.length,
        confidence: watsonUsed ? 0.85 : 0.75
      }
    };
    
  } catch (error) {
    logger.error('Role prediction failed:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: SKILL GAP ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Analyze skill gaps for a specific role
 * Returns: skills candidate has, missing skills, salary boost opportunities
 */
export async function analyzeSkills(resume, targetRole) {
  try {
    const candidateSkills = resume.parsed_resume?.skills || [];
    const roleData = getRoleByName(targetRole);
    
    if (!roleData) {
      throw new Error(`Unknown role: ${targetRole}`);
    }
    
    const { requiredSkills: core_skills = [], preferredSkills: optional_skills = [] } = roleData;
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Identify Skills Have vs Missing
    // ─────────────────────────────────────────────────────────────────────
    
    const skillsHave = [];
    const skillsMissing = [];
    
    // Check core skills
    for (const requiredSkill of core_skills) {
      const hasSkill = candidateSkills.some(candidateSkill =>
        candidateSkill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(candidateSkill.toLowerCase())
      );
      
      if (hasSkill) {
        skillsHave.push({
          skill: requiredSkill,
          type: 'required',
          level: 'Intermediate' // Capitalized to match enum
        });
      } else {
        skillsMissing.push({
          skill: requiredSkill,
          type: 'required',
          priority: 3, // High priority as number
          reasons: ['Required for role'],
          salaryBoost: {
            percentage: '20-30%',
            absoluteUSD: { min: 5000, max: 15000 },
            absoluteINR: { min: 400000, max: 1200000 }
          }
        });
      }
    }
    
    // Check optional skills
    for (const optionalSkill of optional_skills) {
      const hasSkill = candidateSkills.some(candidateSkill =>
        candidateSkill.toLowerCase().includes(optionalSkill.toLowerCase()) ||
        optionalSkill.toLowerCase().includes(candidateSkill.toLowerCase())
      );
      
      if (hasSkill) {
        skillsHave.push({
          skill: optionalSkill,
          type: 'preferred',
          level: 'Intermediate' // Capitalized to match enum
        });
      } else {
        skillsMissing.push({
          skill: optionalSkill,
          type: 'preferred',
          priority: 2, // Medium priority as number
          reasons: ['Nice to have'],
          salaryBoost: {
            percentage: '10-20%',
            absoluteUSD: { min: 3000, max: 10000 },
            absoluteINR: { min: 240000, max: 800000 }
          }
        });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Salary Boost Opportunities
    // ─────────────────────────────────────────────────────────────────────
    
    const salaryBoostOpportunities = [];
    
    for (const boostSkill of salaryBoostSkills) {
      // Check if candidate is missing this high-impact skill
      const isMissing = !candidateSkills.some(s =>
        s.toLowerCase().includes(boostSkill.skill.toLowerCase())
      );
      
      if (isMissing) {
        salaryBoostOpportunities.push({
          skill: boostSkill.skill,
          type: boostSkill.category,
          impact: boostSkill.impact?.percentage || '20-30%',
          potentialIncrease: {
            USD: {
              min: 5000,
              max: 15000
            },
            INR: {
              min: 400000,
              max: 1200000
            }
          }
        });
      }
    }
    
    // Sort by impact (simple alphabetic for now since we removed demandLevel)
    salaryBoostOpportunities.sort((a, b) => {
      // Higher percentage impact first
      return b.impact.localeCompare(a.impact);
    });
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Generate Recommendations
    // ─────────────────────────────────────────────────────────────────────
    
    const coreSkillsGap = skillsMissing.filter(s => s.type === 'required').length;
    const totalCoreSkills = core_skills.length;
    const coreSkillMatch = ((totalCoreSkills - coreSkillsGap) / totalCoreSkills) * 100;
    
    const recommendations = [];
    
    if (coreSkillsGap > 0) {
      recommendations.push({
        type: 'urgent',
        message: `You're missing ${coreSkillsGap} core skills for ${targetRole}. Focus on: ${skillsMissing.filter(s => s.type === 'required').slice(0, 3).map(s => s.skill).join(', ')}`
      });
    }
    
    if (coreSkillMatch >= 80) {
      recommendations.push({
        type: 'positive',
        message: `Great match! You have ${Math.round(coreSkillMatch)}% of core skills. Consider learning optional skills to stand out.`
      });
    }
    
    if (salaryBoostOpportunities.length > 0) {
      const topBoost = salaryBoostOpportunities[0];
      recommendations.push({
        type: 'opportunity',
        message: `Learning ${topBoost.skill} can boost your salary by ${topBoost.impact}!`
      });
    }
    
    return {
      targetRole: targetRole,
      skillsHave: skillsHave,
      skillsMissing: skillsMissing,
      skillGapSummary: {
        coreSkillsHave: totalCoreSkills - coreSkillsGap,
        coreSkillsTotal: totalCoreSkills,
        coreSkillMatch: Math.round(coreSkillMatch),
        missingCoreSkills: coreSkillsGap,
        missingOptionalSkills: skillsMissing.filter(s => s.type === 'preferred').length
      },
      salaryBoostOpportunities: salaryBoostOpportunities.slice(0, 5),
      recommendations: recommendations
    };
    
  } catch (error) {
    logger.error('Skill analysis failed:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: JOB MATCHING & RANKING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Cosine similarity between two embedding vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find matching jobs with hybrid scoring (embeddings + classical)
 * 
 * Scoring Formula:
 * compositeScore = 0.7 * embeddingSimilarity + 0.3 * classicalScore
 * classicalScore = 0.6 * skillMatch + 0.2 * experienceMatch + 0.1 * recency + 0.1 * salaryMatch
 */
export async function findMatchingJobs(resume, options = {}) {
  const {
    limit = 20,
    minMatchScore = 50,
    includeRemote = true,
    employmentType = null,
    generateAISummaries = true,
    useEmbeddings = false,
    preferences = {}
  } = options;
  
  try {
    const candidateSkills = resume.parsed_resume?.skills || [];
    const candidateExperience = resume.parsed_resume?.years_experience || 0;
    const candidateEmbedding = resume.embedding || null;
    
    logger.info(`Matching jobs for resume (embeddings: ${useEmbeddings}, AI summaries: ${generateAISummaries})`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Fetch Active Jobs
    // ─────────────────────────────────────────────────────────────────────
    
    const query = { status: 'active' };
    if (employmentType) query.employmentType = employmentType;
    if (!includeRemote) query['location.isRemote'] = false;
    
    const jobs = await Job.find(query).limit(500); // Get larger pool for filtering
    
    logger.info(`Fetched ${jobs.length} jobs from database with query: ${JSON.stringify(query)}`);
    
    if (jobs.length === 0) {
      return {
        matches: [],
        totalMatches: 0,
        metadata: {
          searchCriteria: options,
          resultsFound: 0
        }
      };
    }
    
    logger.info(`Found ${jobs.length} active jobs to evaluate`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Calculate Match Scores
    // ─────────────────────────────────────────────────────────────────────
    
    const jobMatches = [];
    
    for (const job of jobs) {
      // ───────────────────────────────────────────────────────────────────
      // Classical Scoring (always calculated)
      // ───────────────────────────────────────────────────────────────────
      
      const requiredSkills = job.skills?.required || [];
      const optionalSkills = job.skills?.preferred || [];
      
      // Skill match
      const matchedSkills = requiredSkills.filter(reqSkill =>
        candidateSkills.some(candSkill =>
          candSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
          reqSkill.toLowerCase().includes(candSkill.toLowerCase())
        )
      );
      
      const matchedOptional = optionalSkills.filter(optSkill =>
        candidateSkills.some(candSkill =>
          candSkill.toLowerCase().includes(optSkill.toLowerCase()) ||
          optSkill.toLowerCase().includes(candSkill.toLowerCase())
        )
      );
      
      const missingSkills = requiredSkills.filter(reqSkill =>
        !matchedSkills.some(matched => matched === reqSkill)
      );
      
      const skillMatchScore = requiredSkills.length > 0
        ? (matchedSkills.length / requiredSkills.length) * 100
        : 50;
      
      // Experience match
      const minExp = job.experienceYears?.min || job.experience?.min || 0;
      const maxExp = job.experienceYears?.max || job.experience?.max || 10;
      const expMatch = candidateExperience >= minExp && candidateExperience <= maxExp;
      const experienceScore = expMatch ? 100 : Math.max(0, 100 - Math.abs(candidateExperience - minExp) * 10);
      
      // Recency (jobs posted recently get higher score)
      const daysSincePosted = (Date.now() - new Date(job.postedDate || job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 100 - daysSincePosted * 2);
      
      // Salary match
      const minSalary = preferences.minSalary || 0;
      const salaryMatch = job.salary?.min >= minSalary;
      const salaryScore = salaryMatch ? 100 : 50;
      
      // Classical composite score
      const classicalScore = 
        0.6 * skillMatchScore +
        0.2 * experienceScore +
        0.1 * recencyScore +
        0.1 * salaryScore;
      
      // ───────────────────────────────────────────────────────────────────
      // Embedding Similarity (if enabled and available)
      // ───────────────────────────────────────────────────────────────────
      
      let embeddingSimilarity = 0;
      let finalScore = classicalScore;
      
      if (useEmbeddings && candidateEmbedding && job.embedding) {
        embeddingSimilarity = cosineSimilarity(candidateEmbedding, job.embedding);
        
        // Hybrid scoring: 70% embedding + 30% classical
        finalScore = 0.7 * (embeddingSimilarity * 100) + 0.3 * classicalScore;
      }
      
      // ───────────────────────────────────────────────────────────────────
      // Filter by minimum match score
      // ───────────────────────────────────────────────────────────────────
      
      if (finalScore < minMatchScore) continue;
      
      jobMatches.push({
        job: job,
        matchScore: Math.round(finalScore),
        embeddingSimilarity: embeddingSimilarity,
        classicalScore: Math.round(classicalScore),
        skillMatchPercentage: Math.round(skillMatchScore),
        matchedSkills: matchedSkills,
        matchedOptionalSkills: matchedOptional,
        missingSkills: missingSkills,
        experienceMatch: expMatch,
        salaryMatch: salaryMatch
      });
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Sort by Match Score
    // ─────────────────────────────────────────────────────────────────────
    
    jobMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit results
    const topMatches = jobMatches.slice(0, limit);
    
    logger.info(`Found ${jobMatches.length} matches, returning top ${topMatches.length}`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Generate Rule-Based Summaries (Watson disabled)
    // ─────────────────────────────────────────────────────────────────────
    
    if (generateAISummaries && topMatches.length > 0) {
      logger.info(`Generating rule-based summaries for top ${Math.min(10, topMatches.length)} jobs`);
      
      const jobsToSummarize = topMatches.slice(0, Math.min(10, topMatches.length));
      
      for (const match of jobsToSummarize) {
        try {
          // Generate simple but effective summary
          const matchPercent = Math.round(match.matchScore);
          const matchedCount = match.matchedSkills?.length || 0;
          const missingCount = match.missingSkills?.length || 0;
          
          let summary = `${matchPercent}% match for this ${match.job.title} position at ${match.job.company.name}. `;
          
          if (matchedCount > 0) {
            summary += `You have ${matchedCount} matching skills. `;
          }
          
          if (missingCount > 0 && missingCount <= 3) {
            summary += `To strengthen your profile, consider learning: ${match.missingSkills.slice(0, 3).join(', ')}.`;
          } else if (missingCount > 3) {
            summary += `Focus on developing ${missingCount} additional skills for this role.`;
          } else {
            summary += `Excellent fit - you have all required skills!`;
          }
          
          match.aiSummary = summary;
        } catch (error) {
          logger.warn(`Failed to generate summary for job ${match.job.jobId}: ${error.message}`);
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Return Results
    // ─────────────────────────────────────────────────────────────────────
    
    return {
      matches: topMatches,
      totalMatches: jobMatches.length,
      metadata: {
        searchCriteria: options,
        resultsFound: topMatches.length,
        useEmbeddings: useEmbeddings,
        aiSummariesGenerated: generateAISummaries ? topMatches.filter(m => m.aiSummary).length : 0
      }
    };
    
  } catch (error) {
    logger.error('Job matching failed:', error);
    throw error;
  }
}

/**
 * Find semantically similar jobs using embeddings only
 */
export async function findSemanticMatches(resumeId, options = {}) {
  const {
    minSimilarity = 0.70,
    limit = 20,
    includeJobDetails = true,
    applySkillAdjustment = true
  } = options;
  
  try {
    // Get resume with embedding
    const resume = await Resume.findOne({ resumeId: resumeId });
    
    if (!resume || !resume.embedding) {
      throw new Error('Resume or embedding not found');
    }
    
    // Get all jobs with embeddings
    const jobs = await Job.find({ 
      status: 'active',
      embedding: { $exists: true, $ne: null }
    });
    
    logger.info(`Computing semantic similarity for ${jobs.length} jobs`);
    
    const matches = [];
    
    for (const job of jobs) {
      const similarity = cosineSimilarity(resume.embedding, job.embedding);
      
      if (similarity >= minSimilarity) {
        matches.push({
          job: includeJobDetails ? job : { jobId: job.jobId, title: job.title, company: job.company },
          similarity: parseFloat(similarity.toFixed(4)),
          matchScore: Math.round(similarity * 100)
        });
      }
    }
    
    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return {
      success: true,
      matches: matches.slice(0, limit),
      metadata: {
        totalEvaluated: jobs.length,
        totalMatches: matches.length,
        minSimilarity: minSimilarity,
        averageSimilarity: matches.length > 0
          ? (matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length).toFixed(4)
          : 0
      }
    };
    
  } catch (error) {
    logger.error('Semantic matching failed:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
}

/**
 * Find similar jobs to a reference job
 */
export async function findSimilarJobs(jobId, options = {}) {
  const { limit = 5, includeJobDetails = true } = options;
  
  try {
    // Get reference job
    const referenceJob = await Job.findOne({ jobId: jobId });
    
    if (!referenceJob || !referenceJob.embedding) {
      throw new Error('Job or embedding not found');
    }
    
    // Get all other jobs
    const jobs = await Job.find({
      jobId: { $ne: jobId },
      status: 'active',
      embedding: { $exists: true, $ne: null }
    });
    
    const matches = [];
    
    for (const job of jobs) {
      const similarity = cosineSimilarity(referenceJob.embedding, job.embedding);
      
      matches.push({
        job: includeJobDetails ? job : { jobId: job.jobId, title: job.title, company: job.company },
        similarity: parseFloat(similarity.toFixed(4))
      });
    }
    
    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return {
      success: true,
      referenceJob: {
        jobId: referenceJob.jobId,
        title: referenceJob.title,
        company: referenceJob.company
      },
      matches: matches.slice(0, limit),
      metadata: {
        totalEvaluated: jobs.length
      }
    };
    
  } catch (error) {
    logger.error('Similar jobs search failed:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: JOB INTERACTION TRACKING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Track job interaction (view, apply, save, dismiss)
 */
export async function trackJobInteraction(jobId, resumeId, action) {
  try {
    const actionMap = {
      view: { viewCount: 1 },
      apply: { applied: true, appliedAt: new Date() },
      save: { saved: true, savedAt: new Date() },
      dismiss: { dismissed: true, dismissedAt: new Date() }
    };
    
    const updateFields = actionMap[action];
    if (!updateFields) {
      throw new Error(`Invalid action: ${action}`);
    }
    
    // Update or create JobMatch
    const match = await JobMatch.findOneAndUpdate(
      { jobId: jobId, resumeId: resumeId },
      { $set: updateFields, $inc: { viewCount: action === 'view' ? 1 : 0 } },
      { upsert: true, new: true }
    );
    
    logger.info(`Tracked ${action} for job ${jobId} by resume ${resumeId}`);
    
    return {
      success: true,
      action: action,
      jobId: jobId,
      resumeId: resumeId,
      timestamp: new Date()
    };
    
  } catch (error) {
    logger.error('Failed to track interaction:', error);
    throw error;
  }
}

/**
 * Get job with match information
 */
export async function getJobWithMatch(jobId, resumeId) {
  try {
    const job = await Job.findOne({ jobId: jobId, status: 'active' });
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    const match = await JobMatch.findOne({ jobId: jobId, resumeId: resumeId });
    
    return {
      job: job,
      match: match || null
    };
    
  } catch (error) {
    logger.error('Failed to get job with match:', error);
    throw error;
  }
}
