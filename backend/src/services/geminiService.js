/**
 * Dual AI Service (Watson X.ai + Gemini)
 * Watson primary, Gemini fallback for learning resources & interview questions
 * Uses fetch API for both services with rate limiting
 */

import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Watson X.ai Configuration (Primary)
const WATSONX_API_KEY = process.env.WATSONX_API_KEY || 'hxc5jmpB4ayGh4zOTAl9ecnkMSR91iWR35gWxyixjGul';
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID || 'c16845a7-6cf1-408f-b6bf-5b684d165c3f';
const WATSONX_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const WATSONX_MODEL_ID = process.env.WATSONX_MODEL_ID || 'ibm/granite-3-8b-instruct';

// Google Gemini Configuration (Fallback)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDeZ38UOrh9oHXJ_-ClOUlZpqMrnFesrRQ';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// IAM Token cache for Watson
let watsonIAMToken = null;
let watsonTokenExpiry = null;

// Rate limiter: 10 requests per minute
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // 1 minute
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    
    // Remove requests older than time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      logger.info(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Recursively check again
      return this.waitForSlot();
    }
    
    // Add current request
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(10, 60000);

// In-memory cache to avoid duplicate requests
const resourceCache = new Map();

// Track AI provider usage statistics
const aiStats = {
  watson: { success: 0, failures: 0 },
  gemini: { success: 0, failures: 0 },
  fallback: 0
};

/**
 * Get IBM Cloud IAM token using API key
 */
async function getWatsonIAMToken() {
  // Return cached token if still valid
  if (watsonIAMToken && watsonTokenExpiry && Date.now() < watsonTokenExpiry) {
    return watsonIAMToken;
  }

  try {
    logger.info('[Watson] Getting IAM token...');
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSONX_API_KEY}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[Watson] IAM token error:', errorText);
      throw new Error(`Failed to get IAM token: ${response.status}`);
    }

    const data = await response.json();
    watsonIAMToken = data.access_token;
    // Token expires in 3600 seconds, refresh 5 minutes before
    watsonTokenExpiry = Date.now() + ((data.expires_in || 3600) - 300) * 1000;
    
    logger.info('[Watson] IAM token obtained successfully');
    return watsonIAMToken;
  } catch (error) {
    logger.error('[Watson] Failed to get IAM token:', error.message);
    throw error;
  }
}

/**
 * Call Watson X.ai API using fetch
 */
async function callWatsonXAI(prompt, maxTokens = 2000, timeoutMs = 30000) {
  try {
    // Get IAM token with timeout
    const token = await withTimeout(
      getWatsonIAMToken(),
      10000,
      'Watson IAM token fetch'
    );
    
    logger.info('[Watson] Calling API...');
    const fetchPromise = fetch(WATSONX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model_id: WATSONX_MODEL_ID,
        input: prompt,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.1
        },
        project_id: WATSONX_PROJECT_ID
      })
    });

    // Apply timeout to fetch
    const response = await withTimeout(
      fetchPromise,
      timeoutMs,
      'Watson API call'
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[Watson] API response error:', errorText);
      throw new Error(`Watson API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    logger.info('[Watson] API response received');
    return data.results?.[0]?.generated_text || null;
  } catch (error) {
    logger.error('[Watson] API call failed:', error.message);
    throw error;
  }
}

/**
 * Call Google Gemini API using fetch
 */
async function callGeminiAI(prompt, maxTokens = 2000, timeoutMs = 30000) {
  try {
    logger.info('[Gemini] Calling API...');
    const fetchPromise = fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens
        }
      })
    });

    // Apply timeout to fetch
    const response = await withTimeout(
      fetchPromise,
      timeoutMs,
      'Gemini API call'
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[Gemini] API response error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    logger.info('[Gemini] API response received');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    logger.error('[Gemini] API call failed:', error.message);
    throw error;
  }
}

/**
 * Generate learning resources using Watson (primary) and Gemini (fallback)
 * @param {string} skillName - Name of the skill
 * @param {string} difficulty - Beginner/Intermediate/Advanced
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Array of learning resources
 */
export async function generateLearningResources(skillName, difficulty = 'Beginner', options = {}) {
  try {
    // Check cache first
    const cacheKey = `${skillName}-${difficulty}`;
    if (resourceCache.has(cacheKey)) {
      logger.info(`[Cache] Using cached resources for ${skillName}`);
      return resourceCache.get(cacheKey);
    }

    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    const prompt = `You are an expert learning resource curator. Generate the TOP 10 FREE learning resources for the skill "${skillName}" at ${difficulty} level.

Requirements:
1. Focus on HIGH-QUALITY, FREE resources only
2. Include a mix of:
   - YouTube tutorials/courses (4-5 resources)
   - Official documentation (1-2 resources)
   - Interactive platforms like freeCodeCamp, Scrimba, Codecademy (2-3 resources)
   - Articles/guides (1-2 resources)
3. Prefer resources from reputable sources (freeCodeCamp, Traversy Media, Fireship, The Net Ninja, official docs)
4. Each resource should include:
   - Type (video/documentation/interactive/article)
   - Title
   - URL (must be valid and accessible)
   - Platform name
   - Estimated duration

Format your response EXACTLY as JSON array (no markdown, no code blocks):
[
  {
    "type": "video",
    "title": "React Crash Course 2024",
    "url": "https://youtube.com/watch?v=example",
    "platform": "YouTube - Traversy Media",
    "duration": "2 hours"
  }
]

Generate 10 resources for "${skillName}" (${difficulty} level):`;

    let text = null;
    let usedProvider = null;

    // Try Watson X.ai first
    try {
      logger.info(`[Watson] Generating resources for ${skillName} (${difficulty})...`);
      text = await callWatsonXAI(prompt, 2000);
      if (text) {
        usedProvider = 'watson';
        aiStats.watson.success++;
        logger.info(`[Watson] ✓ Successfully generated resources for ${skillName}`);
      }
    } catch (watsonError) {
      aiStats.watson.failures++;
      logger.warn(`[Watson] Failed, trying Gemini fallback...`);
      
      // Fallback to Gemini
      try {
        logger.info(`[Gemini] Generating resources for ${skillName} (${difficulty})...`);
        text = await callGeminiAI(prompt, 2000);
        if (text) {
          usedProvider = 'gemini';
          aiStats.gemini.success++;
          logger.info(`[Gemini] ✓ Successfully generated resources for ${skillName}`);
        }
      } catch (geminiError) {
        aiStats.gemini.failures++;
        logger.error(`[Gemini] Failed as well`);
        throw new Error('Both Watson and Gemini failed');
      }
    }

    if (!text) {
      throw new Error('No response from AI providers');
    }

    // Clean and parse response
    text = text.trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let resources = [];
    try {
      resources = JSON.parse(text);
    } catch (parseError) {
      // Attempt to extract JSON from text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        resources = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from response');
      }
    }

    // Validate and normalize resources
    const validResources = resources
      .filter(r => r.url && r.title && r.type)
      .map(r => ({
        type: normalizeResourceType(r.type),
        title: r.title.substring(0, 200),
        url: r.url,
        platform: r.platform || 'Unknown',
        isPaid: false,
        duration: r.duration || 'Unknown'
      }))
      .slice(0, 10);

    logger.info(`[${usedProvider.toUpperCase()}] Generated ${validResources.length} resources for ${skillName}`);

    // Cache the result
    resourceCache.set(cacheKey, validResources);

    return validResources;

  } catch (error) {
    logger.error(`[AI] Error generating resources for ${skillName}:`, error.message);
    aiStats.fallback++;
    
    // Return fallback generic resources
    return getFallbackResources(skillName, difficulty);
  }
}

/**
 * Generate resources for multiple skills with rate limiting
 * @param {Array} skills - Array of skill objects {skillName, difficulty}
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Map>} - Map of skillName -> resources
 */
export async function generateResourcesForMultipleSkills(skills, onProgress = null) {
  const results = new Map();
  const total = skills.length;
  
  logger.info(`[AI] Starting batch generation for ${total} skills...`);

  for (let i = 0; i < skills.length; i++) {
    const { skillName, difficulty } = skills[i];
    
    try {
      const resources = await generateLearningResources(skillName, difficulty);
      results.set(skillName, resources);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          skillName,
          success: true,
          resourceCount: resources.length
        });
      }
      
      logger.info(`[AI] Progress: ${i + 1}/${total} - ${skillName} ✓`);
      
    } catch (error) {
      logger.error(`[AI] Failed for ${skillName}:`, error.message);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          skillName,
          success: false,
          error: error.message
        });
      }
    }
  }

  logger.info(`[AI] Batch generation complete. ${results.size}/${total} succeeded.`);
  logAIStats();
  return results;
}

/**
 * Generate interview questions for a skill using Watson/Gemini
 */
export async function generateInterviewQuestions(skillName, difficulty = 'Intermediate', count = 15) {
  try {
    const cacheKey = `interview-${skillName}-${difficulty}`;
    if (resourceCache.has(cacheKey)) {
      logger.info(`[Cache] Using cached interview questions for ${skillName}`);
      return resourceCache.get(cacheKey);
    }

    await rateLimiter.waitForSlot();

    const prompt = `You are an expert technical interviewer. Generate ${count} interview questions for "${skillName}" at ${difficulty} level.

Requirements:
1. Include different types: theoretical, practical, scenario-based, coding challenges
2. Questions should be realistic and asked in actual interviews
3. Range from easy to hard within the ${difficulty} level
4. Include follow-up questions where appropriate

Format your response EXACTLY as JSON array:
[
  {
    "question": "What is the virtual DOM in React?",
    "type": "theoretical",
    "difficulty": "easy",
    "answer": "Brief answer explaining the concept",
    "followUp": "Optional follow-up question"
  }
]

Generate ${count} questions for "${skillName}" (${difficulty}):`;

    let text = null;
    let usedProvider = null;

    // Try Watson first
    try {
      logger.info(`[Watson] Generating interview questions for ${skillName}...`);
      text = await callWatsonXAI(prompt, 3000);
      if (text) {
        usedProvider = 'watson';
        aiStats.watson.success++;
      }
    } catch (error) {
      aiStats.watson.failures++;
      // Try Gemini
      try {
        logger.info(`[Gemini] Generating interview questions for ${skillName}...`);
        text = await callGeminiAI(prompt, 3000);
        if (text) {
          usedProvider = 'gemini';
          aiStats.gemini.success++;
        }
      } catch (geminiError) {
        aiStats.gemini.failures++;
        throw new Error('Both AI providers failed for interview questions');
      }
    }

    // Parse response
    text = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    logger.info(`[${usedProvider.toUpperCase()}] Generated ${questions.length} interview questions for ${skillName}`);

    resourceCache.set(cacheKey, questions);
    return questions;

  } catch (error) {
    logger.error(`[AI] Error generating interview questions for ${skillName}:`, error.message);
    aiStats.fallback++;
    return getFallbackInterviewQuestions(skillName, difficulty, count);
  }
}

/**
 * Get AI usage statistics
 */
export function getAIStats() {
  return {
    ...aiStats,
    watsonSuccessRate: aiStats.watson.success / (aiStats.watson.success + aiStats.watson.failures) || 0,
    geminiSuccessRate: aiStats.gemini.success / (aiStats.gemini.success + aiStats.gemini.failures) || 0,
    totalRequests: aiStats.watson.success + aiStats.watson.failures + aiStats.gemini.success + aiStats.gemini.failures,
    cacheHits: resourceCache.size
  };
}

function logAIStats() {
  const stats = getAIStats();
  logger.info('[AI Stats]', {
    watson: `${stats.watson.success} success / ${stats.watson.failures} failures`,
    gemini: `${stats.gemini.success} success / ${stats.gemini.failures} failures`,
    fallback: stats.fallback,
    watsonRate: `${(stats.watsonSuccessRate * 100).toFixed(1)}%`,
    geminiRate: `${(stats.geminiSuccessRate * 100).toFixed(1)}%`,
    cached: stats.cacheHits
  });
}

/**
 * Normalize resource type to match schema enum
 */
function normalizeResourceType(type) {
  const typeMap = {
    'video': 'video',
    'youtube': 'video',
    'documentation': 'documentation',
    'docs': 'documentation',
    'article': 'article',
    'blog': 'article',
    'course': 'course',
    'interactive': 'interactive',
    'tutorial': 'interactive',
    'book': 'book'
  };
  
  const normalized = type.toLowerCase();
  return typeMap[normalized] || 'article';
}

/**
 * Get fallback resources when Gemini fails
 */
function getFallbackResources(skillName, difficulty) {
  const searchQuery = encodeURIComponent(`${skillName} ${difficulty} tutorial`);
  
  return [
    {
      type: 'video',
      title: `${skillName} Full Course for Beginners`,
      url: `https://www.youtube.com/results?search_query=${searchQuery}`,
      platform: 'YouTube',
      isPaid: false,
      duration: 'Varies'
    },
    {
      type: 'documentation',
      title: `${skillName} Official Documentation`,
      url: `https://www.google.com/search?q=${searchQuery}+official+documentation`,
      platform: 'Official Docs',
      isPaid: false,
      duration: 'Reference'
    },
    {
      type: 'interactive',
      title: `Learn ${skillName} on freeCodeCamp`,
      url: 'https://www.freecodecamp.org/',
      platform: 'freeCodeCamp',
      isPaid: false,
      duration: 'Self-paced'
    },
    {
      type: 'article',
      title: `${skillName} Tutorial and Guide`,
      url: `https://www.google.com/search?q=${searchQuery}`,
      platform: 'Various',
      isPaid: false,
      duration: '10-30 min'
    }
  ];
}

/**
 * Get fallback interview questions
 */
function getFallbackInterviewQuestions(skillName, difficulty, count) {
  const questions = [
    {
      question: `What are the key concepts of ${skillName}?`,
      type: 'theoretical',
      difficulty: 'easy',
      answer: `Explain the fundamental concepts and principles of ${skillName}.`
    },
    {
      question: `How would you implement a basic project using ${skillName}?`,
      type: 'practical',
      difficulty: 'medium',
      answer: `Describe the project structure, key components, and implementation steps.`
    },
    {
      question: `What are common challenges when working with ${skillName}?`,
      type: 'scenario',
      difficulty: 'medium',
      answer: `Discuss typical problems and their solutions.`
    },
    {
      question: `Explain the best practices for ${skillName}.`,
      type: 'theoretical',
      difficulty: 'medium',
      answer: `Cover industry standards, performance optimization, and maintainability.`
    },
    {
      question: `How does ${skillName} compare to similar technologies?`,
      type: 'theoretical',
      difficulty: 'hard',
      answer: `Compare features, use cases, pros and cons.`
    }
  ];
  
  return questions.slice(0, count);
}

/**
 * Clear resource cache (useful for testing)
 */
export function clearResourceCache() {
  resourceCache.clear();
  logger.info('[AI] Resource cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: resourceCache.size,
    keys: Array.from(resourceCache.keys())
  };
}

export default {
  generateLearningResources,
  generateResourcesForMultipleSkills,
  generateInterviewQuestions,
  getAIStats,
  clearResourceCache,
  getCacheStats
};