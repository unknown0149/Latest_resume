/**
 * Embedding Service
 * Generates vector embeddings for resumes and jobs using Google Gemini API
 * Supports mock embeddings for local development/testing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// Initialize Google Gemini (if API key available)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY?.trim();
let genAI = null;

try {
  if (GOOGLE_API_KEY && GOOGLE_API_KEY.length > 0) {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    logger.info('Google Gemini API initialized successfully');
  } else {
    logger.warn('Google API key not configured - using mock embeddings');
  }
} catch (error) {
  logger.error('Failed to initialize Google Gemini API:', error.message);
  genAI = null;
}

// LRU Cache for embeddings (max 1000 entries)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Rate limiting for Google API (1500/day = 62.5/hour ≈ 1/minute)
let apiCallCount = 0;
let apiCallResetTime = Date.now() + 3600000; // 1 hour from now

/**
 * Generate deterministic mock embedding from text (for testing without API)
 */
export function generateMockEmbedding(text, dimensions = 768) {
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
 * Check rate limit and update counter
 */
function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter every hour
  if (now > apiCallResetTime) {
    apiCallCount = 0;
    apiCallResetTime = now + 3600000;
  }
  
  // Check if we're approaching limit (1500/day = 62.5/hour)
  if (apiCallCount >= 60) {
    logger.warn(`Google API rate limit approaching: ${apiCallCount}/60 calls this hour`);
    return false;
  }
  
  return true;
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
 * Generate embedding using Google Gemini API
 */
async function generateRealEmbedding(text) {
  if (!genAI) {
    logger.debug('Google API not configured, using mock embedding');
    return {
      embedding: generateMockEmbedding(text),
      is_mock: true,
      reason: 'api_not_configured'
    };
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    logger.warn('Rate limit reached, falling back to mock embedding');
    return {
      embedding: generateMockEmbedding(text),
      is_mock: true,
      reason: 'rate_limit_exceeded'
    };
  }
  
  try {
    // Check cache first
    const textHash = crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
    const cached = getCachedEmbedding(textHash);
    if (cached) {
      logger.info('Embedding retrieved from cache');
      return {
        embedding: cached,
        is_mock: false,
        cached: true
      };
    }
    
    // Generate embedding with Gemini
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text.substring(0, 10000)); // Limit to 10K chars
    
    apiCallCount++;
    logger.info(`Google API call ${apiCallCount}/60 this hour`);
    
    const embedding = normalizeVector(result.embedding.values);
    
    // Cache the result
    cacheEmbedding(textHash, embedding);
    
    return {
      embedding,
      is_mock: false,
      cached: false
    };
    
  } catch (error) {
    logger.error('Google API embedding generation failed:', error.message);
    
    // Fallback to mock
    logger.warn('Falling back to mock embedding');
    return {
      embedding: generateMockEmbedding(text),
      is_mock: true,
      reason: 'api_error'
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
