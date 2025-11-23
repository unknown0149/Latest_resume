/**
 * LLM Parsing Service - Watson X.ai Integration
 * Uses IBM Granite model for structured resume extraction with normalization
 */

import { logger } from '../utils/logger.js';
import { canonicalizeSkills } from '../data/skillsCanonical.js';

// Watson X.ai configuration
const WATSON_API_KEY = process.env.IBM_API_KEY;
const WATSON_PROJECT_ID = process.env.IBM_PROJECT_ID;
const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';
const WATSON_API_URL = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';

// Cache IAM token (valid for 1 hour)
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
    
    logger.info('IAM token refreshed successfully');
    return cachedToken;
  } catch (error) {
    logger.error('Failed to get IAM token:', error);
    throw error;
  }
}

/**
 * Parse structured resume JSON using Watson X.ai
 * Returns canonical JSON format with all fields
 */
export async function parseResumeWithLLM(rawText) {
  const token = await getIAMToken();
  
  const prompt = `You are an expert resume parser. Extract structured data from the following resume text and return ONLY valid JSON.

Input Resume:
${rawText.substring(0, 8000)}

Task: Extract the following fields (return null or empty array if not found):
- name: Full name (string or null)
- emails: Array of email addresses
- phones: Array of phone numbers
- location: City, State/Country (string or null)
- current_title: Most recent job title (string or null)
- years_experience: Total years (number)
- skills: Array of technical skills (canonical names: React not reactjs, JavaScript not js)
- education: Array of {degree, institution, start, end}
- experience: Array of {company, title, start_date, end_date, bullets: []}
- projects: Array of {name, description, technologies: []}
- certifications: Array of certification names
- languages: Array of spoken languages
- links: Array of URLs (GitHub, LinkedIn, portfolio)

Normalization Rules:
1. Skills: Use canonical names (e.g., "React" not "reactjs", "JavaScript" not "js", "PostgreSQL" not "postgres")
2. Dates: Prefer YYYY-MM format. Convert "Present" or "Current" to null for end dates
3. Bullets: Split multi-line descriptions into array items
4. Remove duplicates from all arrays

Return ONLY valid JSON, no explanatory text:`;

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
          max_new_tokens: 2000,
          temperature: 0.2, // Low temperature for consistent extraction
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.results[0].generated_text.trim();
    
    // Clean up response (remove text before/after JSON)
    let jsonText = rawResponse;
    const jsonStart = rawResponse.indexOf('{');
    const jsonEnd = rawResponse.lastIndexOf('}');
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonText = rawResponse.slice(jsonStart, jsonEnd + 1);
    }
    
    // Parse JSON
    const parsed = JSON.parse(jsonText);
    
    // Post-processing: Canonicalize skills
    if (parsed.skills && Array.isArray(parsed.skills)) {
      parsed.skills = canonicalizeSkills(parsed.skills);
    }
    
    if (parsed.experience && Array.isArray(parsed.experience)) {
      for (const exp of parsed.experience) {
        // Convert "Present" end_date to null
        if (exp.end_date && (exp.end_date.toLowerCase() === 'present' || exp.end_date.toLowerCase() === 'current')) {
          exp.end_date = null;
        }
      }
    }
    
    logger.info('LLM parsing completed successfully');
    
    return {
      success: true,
      data: parsed,
      confidence: 0.85, // LLM confidence
      method: 'llm',
    };
    
  } catch (error) {
    logger.error('LLM parsing failed:', error);
    
    // Return fallback structure
    return {
      success: false,
      data: {
        name: null,
        emails: [],
        phones: [],
        location: null,
        current_title: null,
        years_experience: 0,
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        languages: [],
        links: [],
      },
      confidence: 0,
      method: 'llm_failed',
      error: error.message,
    };
  }
}

/**
 * Extract skills specifically using LLM (fallback when regex/NER fails)
 */
export async function extractSkillsWithLLM(rawText) {
  const token = await getIAMToken();
  
  const prompt = `Extract the top 15 technical skills from this resume. Return only a JSON array of canonical skill names.

Resume:
${rawText.substring(0, 4000)}

Use canonical names: React (not reactjs), JavaScript (not js), PostgreSQL (not postgres), Spring Boot (not springboot).

Return ONLY a JSON array like: ["Java", "Spring Boot", "React", "AWS"]`;

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
          max_new_tokens: 300,
          temperature: 0.3,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.results[0].generated_text.trim();
    
    // Extract JSON array
    let jsonText = rawResponse;
    const arrayStart = rawResponse.indexOf('[');
    const arrayEnd = rawResponse.lastIndexOf(']');
    
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      jsonText = rawResponse.slice(arrayStart, arrayEnd + 1);
    }
    
    const skills = JSON.parse(jsonText);
    const canonicalized = canonicalizeSkills(skills);
    
    return {
      success: true,
      skills: canonicalized,
      confidence: 0.80,
    };
    
  } catch (error) {
    logger.error('LLM skill extraction failed:', error);
    return {
      success: false,
      skills: [],
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Normalize experience section using LLM (extract bullets, clean formatting)
 */
export async function normalizeExperienceWithLLM(experienceText) {
  const token = await getIAMToken();
  
  const prompt = `Parse this work experience section into structured JSON. Extract company, title, dates, and bullet points.

Experience Text:
${experienceText.substring(0, 2000)}

Return ONLY valid JSON array:
[
  {
    "company": "Company Name",
    "title": "Job Title",
    "start_date": "YYYY-MM",
    "end_date": "YYYY-MM" or null for current,
    "bullets": ["achievement 1", "achievement 2"]
  }
]`;

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
          max_new_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.results[0].generated_text.trim();
    
    // Extract JSON array
    let jsonText = rawResponse;
    const arrayStart = rawResponse.indexOf('[');
    const arrayEnd = rawResponse.lastIndexOf(']');
    
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      jsonText = rawResponse.slice(arrayStart, arrayEnd + 1);
    }
    
    const experience = JSON.parse(jsonText);
    
    return {
      success: true,
      experience: experience,
      confidence: 0.82,
    };
    
  } catch (error) {
    logger.error('LLM experience normalization failed:', error);
    return {
      success: false,
      experience: [],
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Estimate years of experience using LLM (fallback)
 */
export async function estimateExperienceWithLLM(rawText) {
  const token = await getIAMToken();
  
  const prompt = `Based on this resume, estimate the total years of professional work experience. Return ONLY a number (e.g., 3.5 or 5.0).

Resume:
${rawText.substring(0, 2000)}

Return ONLY the number of years as a decimal:`;

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
          max_new_tokens: 50,
          temperature: 0.2,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.results[0].generated_text.trim();
    
    // Extract number
    const numberMatch = rawResponse.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      const years = parseFloat(numberMatch[1]);
      return {
        success: true,
        years: years,
        confidence: 0.70,
      };
    }
    
    throw new Error('Could not extract years from response');
    
  } catch (error) {
    logger.error('LLM experience estimation failed:', error);
    return {
      success: false,
      years: 0,
      confidence: 0,
      error: error.message,
    };
  }
}

export default {
  parseResumeWithLLM,
  extractSkillsWithLLM,
  normalizeExperienceWithLLM,
  estimateExperienceWithLLM,
};
