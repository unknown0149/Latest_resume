/**
 * Embedding Service
 * Generates vector embeddings for resumes and jobs using Hugging Face models
 * Uses @xenova/transformers for local inference
 */

import { pipeline } from '@xenova/transformers';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// Initialize Hugging Face embedding model
let embedder = null;
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'; // 384 dimensions, fast and accurate
const EMBEDDING_DIMENSIONS = 384;

// Initialize model on startup
(async () => {
  try {
    embedder = await pipeline('feature-extraction', EMBEDDING_MODEL);
    logger.info(`Hugging Face embedding model loaded: ${EMBEDDING_MODEL}`);
  } catch (error) {
    logger.error('Failed to load Hugging Face embedding model:', error.message);
  }
})();

// LRU Cache for embeddings (max 1000 entries)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Generate deterministic mock embedding from text (fallback)
 */
export function generateMockEmbedding(text, dimensions = EMBEDDING_DIMENSIONS) {
  // Create hash from text
  const hash = crypto.createHash('sha256').update(text.toLowerCase()).digest();
  
  // Generate pseudo-random but deterministic vector
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    // Use hash bytes to seed values between -1 and 1
    const byteIndex = i % hash.length;
    const value = (hash[byteIndex] / 255) * 2 - 1;
    vector.push(value);
  }
  
  // Normalize to unit vector
  return normalizeVector(vector);
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(val => val / magnitude);
}

/**
 * Get embedding from cache
 */
function getCachedEmbedding(textHash) {
  return embeddingCache.get(textHash);
}

/**
 * Store embedding in cache with LRU eviction
 */
function cacheEmbedding(textHash, embedding) {
  // LRU eviction: remove oldest entry if cache is full
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
  
  embeddingCache.set(textHash, embedding);
}

/**
 * Generate embedding using Hugging Face model
 */
async function generateRealEmbedding(text) {
  if (!embedder) {
    logger.debug('Embedding model not loaded, using fallback');
    return {
      embedding: generateMockEmbedding(text),
      is_mock: true,
      reason: 'model_not_loaded'
    };
  }
  
  try {
    // Check cache first
    const textHash = crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
    const cached = getCachedEmbedding(textHash);
    if (cached) {
      logger.debug('Embedding retrieved from cache');
      return {
        embedding: cached,
        is_mock: false,
        cached: true
      };
    }
    
    // Generate embedding with Hugging Face
    const result = await embedder(text.substring(0, 5000), { 
      pooling: 'mean', 
      normalize: true 
    });
    
    const embedding = Array.from(result.data);
    
    // Cache the result
    cacheEmbedding(textHash, embedding);
    
    return {
      embedding,
      is_mock: false,
      cached: false
    };
    
  } catch (error) {
    logger.error('Hugging Face embedding generation failed:', error.message);
    
    // Fallback to mock
    logger.warn('Falling back to mock embedding');
    return {
      embedding: generateMockEmbedding(text),
      is_mock: true,
      reason: 'generation_error'
    };
  }
}

/**
 * Generate candidate embedding from parsed resume
 */
export async function generateCandidateEmbedding(parsedResume, useMock = false) {
  const startTime = Date.now();
  
  try {
    // Build text template
    const title = parsedResume.current_title || parsedResume.parsed_resume?.current_title || 'Software Engineer';
    const skills = parsedResume.skills || parsedResume.parsed_resume?.skills || [];
    const experience = parsedResume.experience || parsedResume.parsed_resume?.experience || [];
    
    // Take first 6 experience bullets
    const experienceBullets = experience
      .slice(0, 6)
      .map(exp => (exp.bullets || []).join(' '))
      .join(' ');
    
    const text = `${title}. Skills: ${skills.join(', ')}. Experience: ${experienceBullets}`.substring(0, 10000);
    
    // Generate embedding
    let result;
    if (useMock) {
      const embedding = generateMockEmbedding(text);
      result = { embedding, is_mock: true, reason: 'manual_mock' };
    } else {
      result = await generateRealEmbedding(text);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      embedding: result.embedding,
      metadata: {
        model: result.is_mock ? 'mock-deterministic' : 'text-embedding-004',
        dimensions: result.embedding.length,
        generated_at: new Date(),
        text_hash: crypto.createHash('sha256').update(text).digest('hex').substring(0, 16),
        is_mock: result.is_mock,
        cached: result.cached || false,
        processing_time_ms: processingTime,
      }
    };
    
  } catch (error) {
    logger.error('Candidate embedding generation failed:', error);
    throw error;
  }
}

/**
 * Generate job embedding from job posting
 */
export async function generateJobEmbedding(job, useMock = false) {
  const startTime = Date.now();
  
  try {
    // Build text template
    const title = job.title || 'Software Engineer';
    const description = job.description || '';
    const requiredSkills = job.skills?.required || [];
    const preferredSkills = job.skills?.preferred || [];
    
    const text = `${title}. ${description}. Required: ${requiredSkills.join(', ')}. Preferred: ${preferredSkills.join(', ')}`.substring(0, 10000);
    
    // Generate embedding
    let result;
    if (useMock) {
      const embedding = generateMockEmbedding(text);
      result = { embedding, is_mock: true, reason: 'manual_mock' };
    } else {
      result = await generateRealEmbedding(text);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      embedding: result.embedding,
      metadata: {
        model: result.is_mock ? 'mock-deterministic' : 'text-embedding-004',
        dimensions: result.embedding.length,
        generated_at: new Date(),
        text_hash: crypto.createHash('sha256').update(text).digest('hex').substring(0, 16),
        is_mock: result.is_mock,
        cached: result.cached || false,
        processing_time_ms: processingTime,
      }
    };
    
  } catch (error) {
    logger.error('Job embedding generation failed:', error);
    throw error;
  }
}

/**
 * Get API usage statistics
 */
export function getAPIUsageStats() {
  const timeUntilReset = Math.max(0, apiCallResetTime - Date.now());
  
  return {
    apiCallsThisHour: apiCallCount,
    hourlyLimit: 60,
    percentUsed: ((apiCallCount / 60) * 100).toFixed(1),
    timeUntilReset: Math.ceil(timeUntilReset / 60000), // minutes
    cacheSize: embeddingCache.size,
    cacheLimit: MAX_CACHE_SIZE,
  };
}

/**
 * Clear embedding cache (for testing)
 */
export function clearCache() {
  embeddingCache.clear();
  logger.info('Embedding cache cleared');
}

export default {
  generateCandidateEmbedding,
  generateJobEmbedding,
  generateMockEmbedding,
  normalizeVector,
  getAPIUsageStats,
  clearCache,
};
