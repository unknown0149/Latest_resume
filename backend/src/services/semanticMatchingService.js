/**
 * Semantic Matching Service
 * Computes cosine similarity between resume and job embeddings
 * Provides semantic job recommendations based on vector similarity
 */

import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import { logger } from '../utils/logger.js';

/**
 * Compute cosine similarity between two vectors
 * Formula: similarity = (A · B) / (||A|| × ||B||)
 */
export function computeCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB) {
    return 0;
  }
  
  if (vectorA.length !== vectorB.length) {
    throw new Error(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`);
  }
  
  // Dot product
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }
  
  // Magnitudes
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    magA += vectorA[i] * vectorA[i];
    magB += vectorB[i] * vectorB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  // Handle zero vectors
  if (magA === 0 || magB === 0) {
    return 0;
  }
  
  // Cosine similarity (between -1 and 1, normalize to 0-1)
  const similarity = dotProduct / (magA * magB);
  
  // Clamp to [0, 1] range (some floating point errors can cause values slightly outside)
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Classify similarity score into categories
 */
export function classifySimilarity(score) {
  if (score > 0.88) return { category: 'Very Similar', color: 'green', confidence: 'high' };
  if (score > 0.80) return { category: 'Similar', color: 'blue', confidence: 'medium-high' };
  if (score > 0.70) return { category: 'Weakly Similar', color: 'yellow', confidence: 'medium' };
  return { category: 'Not Similar', color: 'red', confidence: 'low' };
}

/**
 * Apply fuzzy skill adjustment to semantic score
 * Boosts score if skill overlap is high (compensates for embedding limitations)
 */
export function fuzzySkillAdjustment(semanticScore, skillOverlapPercent) {
  // Boost by up to 5% if skill overlap > 80%
  if (skillOverlapPercent > 80) {
    const boost = 0.05 * ((skillOverlapPercent - 80) / 20); // Linear boost from 0% to 5%
    return Math.min(1.0, semanticScore + boost);
  }
  
  return semanticScore;
}

/**
 * Find semantic matches for a resume using embeddings
 */
export async function findSemanticMatches(resumeId, options = {}) {
  const startTime = Date.now();
  
  try {
    const {
      limit = 20,
      minSimilarity = 0.70,
      includeJobDetails = true,
      applySkillAdjustment = true,
    } = options;
    
    // Fetch resume with embedding
    const resume = await Resume.findOne({ resumeId }).select('embedding parsed_resume skills');
    
    if (!resume) {
      throw new Error(`Resume not found: ${resumeId}`);
    }
    
    if (!resume.embedding || resume.embedding.length === 0) {
      return {
        success: false,
        error: 'Resume embedding not generated yet',
        message: 'Please generate embedding first using POST /api/resume/:resumeId/generate-embedding',
        matches: [],
      };
    }
    
    logger.info(`Finding semantic matches for resume ${resumeId}`);
    
    // Fetch all active jobs with embeddings
    const jobs = await Job.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).lean();
    
    if (jobs.length === 0) {
      return {
        success: false,
        error: 'No jobs with embeddings found',
        message: 'Please generate job embeddings first',
        matches: [],
      };
    }
    
    logger.info(`Computing similarities for ${jobs.length} jobs`);
    
    // Compute similarities for all jobs (in-memory for MVP)
    const similarities = jobs.map(job => {
      const similarity = computeCosineSimilarity(resume.embedding, job.embedding);
      
      // Calculate skill overlap for adjustment
      let skillOverlapPercent = 0;
      if (applySkillAdjustment) {
        const resumeSkills = resume.parsed_resume?.skills || resume.skills || [];
        const jobSkills = job.skills?.allSkills || [];
        
        if (resumeSkills.length > 0 && jobSkills.length > 0) {
          const overlappingSkills = resumeSkills.filter(skill => 
            jobSkills.includes(skill.toLowerCase())
          );
          skillOverlapPercent = (overlappingSkills.length / jobSkills.length) * 100;
        }
      }
      
      // Apply fuzzy skill adjustment
      const adjustedSimilarity = applySkillAdjustment 
        ? fuzzySkillAdjustment(similarity, skillOverlapPercent)
        : similarity;
      
      return {
        job,
        similarity: adjustedSimilarity,
        rawSimilarity: similarity,
        skillOverlapPercent: Math.round(skillOverlapPercent),
        similarityClass: classifySimilarity(adjustedSimilarity),
      };
    });
    
    // Filter by minimum similarity
    const filteredMatches = similarities.filter(m => m.similarity >= minSimilarity);
    
    // Sort by similarity descending
    filteredMatches.sort((a, b) => b.similarity - a.similarity);
    
    // Take top N matches
    const topMatches = filteredMatches.slice(0, limit);
    
    // Format response
    const matches = topMatches.map(match => {
      const baseMatch = {
        jobId: match.job.jobId,
        semanticScore: parseFloat((match.similarity * 100).toFixed(2)),
        rawSemanticScore: parseFloat((match.rawSimilarity * 100).toFixed(2)),
        skillOverlap: match.skillOverlapPercent,
        similarityCategory: match.similarityClass.category,
        confidence: match.similarityClass.confidence,
      };
      
      if (includeJobDetails) {
        baseMatch.title = match.job.title;
        baseMatch.company = {
          name: match.job.company.name,
          logo: match.job.company.logo,
        };
        baseMatch.location = match.job.location;
        baseMatch.salary = match.job.salary;
        baseMatch.experienceLevel = match.job.experienceLevel;
        baseMatch.matchedSkills = match.job.skills?.allSkills?.slice(0, 10) || [];
      }
      
      return baseMatch;
    });
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      matches,
      metadata: {
        totalJobsEvaluated: jobs.length,
        matchesFound: matches.length,
        minSimilarityThreshold: minSimilarity,
        processingTimeMs: processingTime,
        embeddingDimensions: resume.embedding.length,
        method: 'cosine_similarity',
      },
    };
    
  } catch (error) {
    logger.error('Semantic matching failed:', error);
    throw error;
  }
}

/**
 * Find similar jobs based on a job's embedding
 */
export async function findSimilarJobs(jobId, options = {}) {
  const startTime = Date.now();
  
  try {
    const { limit = 5, excludeJobId = true } = options;
    
    // Fetch job with embedding
    const job = await Job.findOne({ jobId }).select('embedding title');
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    if (!job.embedding || job.embedding.length === 0) {
      return {
        success: false,
        error: 'Job embedding not generated yet',
        matches: [],
      };
    }
    
    // Fetch all active jobs with embeddings (excluding this job)
    const query = {
      status: 'active',
      expiresAt: { $gt: new Date() },
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    };
    
    if (excludeJobId) {
      query.jobId = { $ne: jobId };
    }
    
    const jobs = await Job.find(query).lean();
    
    // Compute similarities
    const similarities = jobs.map(otherJob => ({
      job: otherJob,
      similarity: computeCosineSimilarity(job.embedding, otherJob.embedding),
    }));
    
    // Sort and take top N
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topMatches = similarities.slice(0, limit);
    
    const matches = topMatches.map(match => ({
      jobId: match.job.jobId,
      title: match.job.title,
      company: match.job.company.name,
      similarity: parseFloat((match.similarity * 100).toFixed(2)),
      similarityCategory: classifySimilarity(match.similarity).category,
    }));
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      sourceJobId: jobId,
      matches,
      metadata: {
        processingTimeMs: processingTime,
      },
    };
    
  } catch (error) {
    logger.error('Find similar jobs failed:', error);
    throw error;
  }
}

/**
 * Batch compute similarities (optimized for large datasets)
 */
export function batchComputeSimilarities(queryVector, jobVectors) {
  const startTime = Date.now();
  
  const similarities = jobVectors.map(({ jobId, vector }) => ({
    jobId,
    similarity: computeCosineSimilarity(queryVector, vector),
  }));
  
  const processingTime = Date.now() - startTime;
  
  logger.info(`Batch similarity computed for ${jobVectors.length} vectors in ${processingTime}ms`);
  
  return similarities;
}

export default {
  computeCosineSimilarity,
  classifySimilarity,
  fuzzySkillAdjustment,
  findSemanticMatches,
  findSimilarJobs,
  batchComputeSimilarities,
};
