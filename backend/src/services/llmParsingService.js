/**
 * LLM Parsing Service - Watson X.ai Integration
 * Uses IBM Granite model for structured resume extraction with normalization
 */

import { logger } from '../utils/logger.js';
import { canonicalizeSkills } from '../data/skillsCanonical.js';

// Watson X.ai configuration (Updated credentials)
const WATSON_API_KEY = process.env.WATSONX_API_KEY || process.env.IBM_API_KEY;
const WATSON_PROJECT_ID = process.env.WATSONX_PROJECT_ID || process.env.IBM_PROJECT_ID;
const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';
const WATSON_API_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';

// Cache IAM token (valid for 1 hour)
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get IBM IAM token for Watson API authentication
 */
async function getIAMToken() {
  // Check if Watson API key is configured
  if (!WATSON_API_KEY) {
    throw new Error('Watson API key not configured');
  }

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

    const data = await response.json();
    
    if (!response.ok || data.errorMessage) {
      const errorMsg = data.errorMessage || `IAM token request failed with status ${response.status}`;
      logger.error('IAM token error:', { status: response.status, error: errorMsg });
      throw new Error(errorMsg);
    }

    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    logger.info('IAM token refreshed successfully');
    return cachedToken;
  } catch (error) {
    logger.error('Failed to get IAM token:', error.message);
    throw error;
  }
}

/**
 * Parse structured resume JSON using Watson X.ai
 * Returns canonical JSON format with all fields
 */
export async function parseResumeWithLLM(rawText) {
  // Check if Watson is configured
  if (!WATSON_API_KEY) {
    logger.warn('Watson API key not configured - skipping LLM parsing');
    return {
      success: false,
      error: 'Watson API not configured',
      confidence: 0
    };
  }

  try {
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

/**
 * Generate MCQ questions for skill verification using Watson AI
 * @param {string} skill - The skill to generate questions for
 * @param {number} count - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateMCQQuestions(skill, count = 5) {
  // Validate Watson credentials first
  if (!WATSON_PROJECT_ID) {
    logger.warn('Watson Project ID not configured, using fallback questions');
    return generateFallbackMCQQuestions(skill, count);
  }

  try {
    const token = await getIAMToken();
    
    const prompt = `You are a technical interviewer creating a skill assessment test.

Generate ${count} multiple-choice questions to verify practical knowledge of ${skill}.

Requirements:
- Questions should test REAL, PRACTICAL knowledge that someone who has used ${skill} would know
- Mix of difficulty: 2 basic, 2 intermediate, 1 advanced
- Each question must have exactly 4 options with only ONE correct answer
- Questions should cover: syntax, best practices, common use cases, and problem-solving
- Avoid overly theoretical or trick questions
- Make distractors (wrong options) plausible but clearly incorrect to someone with experience

Return ONLY a valid JSON array (no markdown, no code blocks, no extra text):
[
  {
    "question": "What is the primary use of...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Option A is correct because...",
    "difficulty": "basic"
  }
]

Generate ${count} MCQ questions for ${skill}:`;

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
          temperature: 0.7,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Watson API error: ${response.status} - ${errorText}`);
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
    
    // Clean up JSON (remove markdown code blocks if present)
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const questions = JSON.parse(jsonText);
    
    logger.info(`Successfully generated ${questions.length} MCQ questions for ${skill}`);
    return questions;
    
  } catch (error) {
    logger.error('MCQ generation failed:', {
      error: error.message,
      skill,
      hasProjectId: !!WATSON_PROJECT_ID,
      stack: error.stack
    });
    // Return fallback questions if Watson fails
    logger.info(`Using fallback questions for ${skill}`);
    return generateFallbackMCQQuestions(skill, count);
  }
}

/**
 * Generate fallback MCQ questions when Watson AI is unavailable
 */
function generateFallbackMCQQuestions(skill, count = 5) {
  logger.warn(`Using fallback MCQ questions for ${skill}`);
  
  // Skill-specific question templates
  const templates = {
    javascript: [
      {
        question: `What is the output of: typeof null in ${skill}?`,
        options: ['"object"', '"null"', '"undefined"', '"number"'],
        correctAnswer: 0,
        explanation: 'In JavaScript, typeof null returns "object" due to a historical bug in the language.',
        difficulty: 'intermediate'
      },
      {
        question: `Which method is used to add elements to the end of an array in ${skill}?`,
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        explanation: 'push() adds one or more elements to the end of an array.',
        difficulty: 'basic'
      }
    ],
    python: [
      {
        question: `What is the correct way to create a list in ${skill}?`,
        options: ['[]', '{}', '()', '<>'],
        correctAnswer: 0,
        explanation: 'Square brackets [] are used to create lists in Python.',
        difficulty: 'basic'
      },
      {
        question: `Which keyword is used to define a function in ${skill}?`,
        options: ['def', 'function', 'func', 'define'],
        correctAnswer: 0,
        explanation: 'The "def" keyword is used to define functions in Python.',
        difficulty: 'basic'
      }
    ],
    react: [
      {
        question: `What hook is used to manage state in functional components in ${skill}?`,
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 0,
        explanation: 'useState is the primary hook for adding state to functional components.',
        difficulty: 'basic'
      },
      {
        question: `Which method is used to render a ${skill} component to the DOM?`,
        options: ['ReactDOM.render()', 'React.render()', 'render()', 'mount()'],
        correctAnswer: 0,
        explanation: 'ReactDOM.render() is used to render React components to the DOM.',
        difficulty: 'basic'
      }
    ],
    nodejs: [
      {
        question: `Which module is used to create a web server in ${skill}?`,
        options: ['http', 'server', 'web', 'express'],
        correctAnswer: 0,
        explanation: 'The "http" module is Node.js\'s built-in module for creating web servers.',
        difficulty: 'basic'
      },
      {
        question: `What command is used to initialize a new ${skill} project?`,
        options: ['npm init', 'npm start', 'npm create', 'npm new'],
        correctAnswer: 0,
        explanation: 'npm init creates a new package.json file and initializes a Node.js project.',
        difficulty: 'basic'
      }
    ]
  };
  
  // Get skill-specific questions or generate generic ones
  const skillLower = skill.toLowerCase().replace(/[^a-z]/g, '');
  const skillQuestions = templates[skillLower] || [];
  
  const questions = [];
  
  // Use skill-specific questions first
  for (let i = 0; i < count && i < skillQuestions.length; i++) {
    questions.push(skillQuestions[i]);
  }
  
  // Fill remaining with generic questions
  const remaining = count - questions.length;
  for (let i = 0; i < remaining; i++) {
    questions.push({
      question: `Which of the following is a key concept in ${skill}?`,
      options: [
        `Core functionality and syntax of ${skill}`,
        `Unrelated programming concept`,
        `A different technology or framework`,
        `A deprecated feature`
      ],
      correctAnswer: 0,
      explanation: `Understanding core functionality is essential for working with ${skill}.`,
      difficulty: 'basic'
    });
  }
  
  return questions;
}

/**
 * Generate learning resources for skills using Watson AI
 * @param {Array<string>} skills - Array of skills to generate resources for
 * @param {number} limit - Maximum resources per skill
 * @returns {Promise<Array>} Array of resource objects
 */
export async function generateLearningResources(skills, limit = 10) {
  const token = await getIAMToken();
  
  const skillsList = Array.isArray(skills) 
    ? skills.map(s => typeof s === 'string' ? s : s.skill).join(', ')
    : skills;
  
  const prompt = `Generate learning resources for these skills: ${skillsList}

For each skill, provide ${Math.ceil(limit / skills.length)} high-quality learning resources.
Return ONLY a JSON array in this exact format (no markdown, no extra text):
[
  {
    "skill": "Skill Name",
    "title": "Resource Title",
    "type": "course|tutorial|documentation|book|video",
    "provider": "Provider Name (e.g., Udemy, Coursera, YouTube, Official Docs)",
    "url": "https://example.com/resource",
    "description": "Brief description of what you'll learn",
    "level": "beginner|intermediate|advanced",
    "duration": "Estimated time (e.g., 10 hours, 2 weeks)"
  }
]

Generate resources for: ${skillsList}:`;

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
          max_new_tokens: 3000,
          temperature: 0.7,
          top_p: 0.9,
        },
        project_id: WATSON_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Watson API error: ${response.status} - ${errorText}`);
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
    
    // Clean up JSON
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const resources = JSON.parse(jsonText);
    
    logger.info(`Successfully generated ${resources.length} resources for ${skills.length} skills`);
    return resources.slice(0, limit);
    
  } catch (error) {
    logger.error('Resource generation failed:', error);
    // Return fallback resources if Watson fails
    return generateFallbackResources(skills, limit);
  }
}

/**
 * Generate fallback learning resources when Watson AI is unavailable
 */
function generateFallbackResources(skills, limit = 10) {
  logger.warn(`Using fallback resources for skills`);
  
  const resources = [];
  const skillsArray = Array.isArray(skills) 
    ? skills.map(s => typeof s === 'string' ? s : s.skill)
    : [skills];
  
  skillsArray.forEach(skill => {
    resources.push(
      {
        skill,
        title: `${skill} - Official Documentation`,
        type: 'documentation',
        provider: 'Official Docs',
        url: `https://www.google.com/search?q=${encodeURIComponent(skill)}+official+documentation`,
        description: `Comprehensive official documentation for ${skill}`,
        level: 'beginner',
        duration: 'Self-paced'
      },
      {
        skill,
        title: `Learn ${skill} - Complete Course`,
        type: 'course',
        provider: 'Udemy',
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`,
        description: `Comprehensive course covering ${skill} fundamentals and advanced concepts`,
        level: 'intermediate',
        duration: '20-40 hours'
      },
      {
        skill,
        title: `${skill} Tutorial for Beginners`,
        type: 'tutorial',
        provider: 'YouTube',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}+tutorial`,
        description: `Step-by-step video tutorial for getting started with ${skill}`,
        level: 'beginner',
        duration: '2-4 hours'
      }
    );
  });
  
  return resources.slice(0, limit);
}

export default {
  parseResumeWithLLM,
  extractSkillsWithLLM,
  normalizeExperienceWithLLM,
  estimateExperienceWithLLM,
  generateMCQQuestions,
  generateLearningResources,
};
