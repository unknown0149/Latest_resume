/**
 * Role Prediction Service - Hybrid Approach
 * 1. Backend logic first: Match resume skills against role database (70/30 weighted)
 * 2. Watson fallback ONLY when:
 *    - Top 2 roles differ by <10% score
 *    - Ambiguous skills (similarity 0.5-0.7)
 *    - Need tiebreaker confidence boost
 */

import { normalizeSkillsArray, matchSkillsFuzzy, isAmbiguousMatch } from '../utils/skillNormalizer.js';
import { getAllRoles, calculateRoleMatch, findBestMatchingRoles } from '../data/roleSkillDatabase.js';
import { logger } from '../utils/logger.js';

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
  // Return cached token if still valid (with 5-minute buffer)
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
    tokenExpiry = Date.now() + (data.expires_in * 1000); // Convert seconds to milliseconds
    
    logger.info('IAM token refreshed successfully');
    return cachedToken;
  } catch (error) {
    logger.error('Failed to get IAM token:', error);
    throw error;
  }
}

/**
 * Call Watson X.ai for role tiebreaker decision
 */
async function callWatsonForRoleTiebreaker(resumeData, topRoles) {
  const token = await getIAMToken();
  
  const prompt = `You are an expert career counselor. Analyze this resume and choose the BEST matching role from the candidates provided.

Resume Summary:
- Skills: ${resumeData.skills.join(', ')}
- Experience: ${resumeData.experience} years
- Recent Projects: ${resumeData.projects || 'Not specified'}

Candidate Roles (with backend match scores):
${topRoles.map((r, i) => `${i + 1}. ${r.name} (${r.matchScore.toFixed(1)}% match)`).join('\n')}

Return ONLY a JSON object with this exact format:
{
  "bestRole": "exact role name from candidates",
  "confidence": 0.95,
  "reasoning": "brief explanation why this role fits best"
}`;

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
    const rawText = data.results[0].generated_text.trim();
    
    // Clean up response (sometimes Watson adds text before JSON)
    let jsonText = rawText;
    const jsonStart = rawText.indexOf('{');
    if (jsonStart > 0) {
      jsonText = rawText.slice(jsonStart);
    }
    
    const result = JSON.parse(jsonText);
    logger.info('Watson tiebreaker called successfully');
    
    return result;
  } catch (error) {
    logger.error('Watson API call failed:', error);
    // Return null to fall back to backend decision
    return null;
  }
}

/**
 * Extract skills from parsed resume
 */
function extractSkillsFromResume(parsedResume) {
  const skills = [];
  
  // From extracted_text.skills array
  if (parsedResume.extracted_text?.skills?.length) {
    skills.push(...parsedResume.extracted_text.skills);
  }
  
  // From parsed_data.skills array (if already processed)
  if (parsedResume.parsed_data?.skills?.length) {
    skills.push(...parsedResume.parsed_data.skills);
  }
  
  // Deduplicate and normalize
  const uniqueSkills = [...new Set(skills)];
  return normalizeSkillsArray(uniqueSkills);
}

/**
 * Calculate experience from resume
 */
function calculateExperience(parsedResume) {
  if (parsedResume.parsed_data?.experience) {
    return parsedResume.parsed_data.experience;
  }
  
  // Try to extract from extracted_text
  const text = parsedResume.extracted_text?.full_text || '';
  const experienceMatch = text.match(/(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?experience/i);
  
  return experienceMatch ? parseInt(experienceMatch[1], 10) : 0;
}

/**
 * Main role prediction function
 */
export async function predictBestRole(parsedResume) {
  const startTime = Date.now();
  let watsonUsed = false;
  
  try {
    // Step 1: Extract and normalize skills
    const normalizedSkills = extractSkillsFromResume(parsedResume);
    const experienceYears = calculateExperience(parsedResume);
    
    logger.info(`Role prediction for ${normalizedSkills.length} skills, ${experienceYears} years exp`);
    
    // Step 2: Calculate match scores for all roles (backend logic)
    const allRoles = getAllRoles();
    const roleMatches = allRoles.map(role => {
      const matchResult = calculateRoleMatch(role, normalizedSkills);
      return {
        name: role.name,
        matchScore: matchResult.matchScore,
        matchedRequired: matchResult.matchedRequired,
        matchedPreferred: matchResult.matchedPreferred,
        totalRequired: matchResult.totalRequired,
        totalPreferred: matchResult.totalPreferred,
        experienceMatch: experienceYears >= role.experienceRange.min && 
                        experienceYears <= role.experienceRange.max,
        demandScore: role.demandScore,
      };
    });
    
    // Sort by match score, then demand
    roleMatches.sort((a, b) => {
      if (Math.abs(a.matchScore - b.matchScore) < 0.1) {
        return b.demandScore - a.demandScore;
      }
      return b.matchScore - a.matchScore;
    });
    
    const topRole = roleMatches[0];
    const secondRole = roleMatches[1];
    const thirdRole = roleMatches[2];
    
    // Step 3: ALWAYS use Watson X.ai for intelligent role selection
    logger.info('Calling Watson X.ai for AI-powered role prediction');
    
    let finalRole = topRole.name;
    let confidence = topRole.matchScore / 100;
    let reasoning = `Matched ${topRole.matchedRequired}/${topRole.totalRequired} required skills and ${topRole.matchedPreferred}/${topRole.totalPreferred} preferred skills`;
    let watsonResult = null;
    
    try {
      watsonResult = await callWatsonForRoleTiebreaker(
        {
          skills: normalizedSkills,
          experience: experienceYears,
          projects: parsedResume.extracted_text?.full_text?.substring(0, 300),
        },
        [topRole, secondRole, thirdRole]
      );
      
      if (watsonResult) {
        watsonUsed = true;
        finalRole = watsonResult.bestRole;
        confidence = watsonResult.confidence;
        reasoning = watsonResult.reasoning;
        logger.info(`Watson selected: ${finalRole} (confidence: ${confidence})`);
      }
    } catch (error) {
      logger.warn('Watson call failed, using backend prediction:', error.message);
      // Fallback to backend prediction if Watson fails
    }
    
    // Step 5: Prepare response
    const result = {
      primaryRole: {
        name: finalRole,
        matchScore: roleMatches.find(r => r.name === finalRole)?.matchScore || topRole.matchScore,
        confidence: confidence,
        reasoning: reasoning,
      },
      alternativeRoles: [
        {
          name: secondRole.name,
          matchScore: secondRole.matchScore,
          reason: `${secondRole.matchedRequired}/${secondRole.totalRequired} core skills matched`,
        },
        {
          name: thirdRole.name,
          matchScore: thirdRole.matchScore,
          reason: `${thirdRole.matchedRequired}/${thirdRole.totalRequired} core skills matched`,
        },
      ],
      skillsSummary: {
        totalSkills: normalizedSkills.length,
        experienceYears: experienceYears,
      },
      metadata: {
        watsonUsed: watsonUsed,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
    
    logger.info(`Role prediction complete: ${finalRole} (${confidence.toFixed(2)} confidence, Watson: ${watsonUsed})`);
    return result;
    
  } catch (error) {
    logger.error('Role prediction failed:', error);
    throw error;
  }
}

/**
 * Batch predict roles for multiple resumes (admin function)
 */
export async function batchPredictRoles(parsedResumes) {
  const results = [];
  let watsonCallCount = 0;
  
  for (const resume of parsedResumes) {
    try {
      const prediction = await predictBestRole(resume);
      results.push({
        resumeId: resume._id,
        prediction: prediction,
      });
      
      if (prediction.metadata.watsonUsed) {
        watsonCallCount++;
      }
      
      // Rate limiting - wait 100ms between Watson calls
      if (prediction.metadata.watsonUsed) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error(`Batch prediction failed for resume ${resume._id}:`, error);
      results.push({
        resumeId: resume._id,
        error: error.message,
      });
    }
  }
  
  const watsonUsagePercent = (watsonCallCount / parsedResumes.length) * 100;
  logger.info(`Batch prediction complete: ${watsonCallCount}/${parsedResumes.length} used Watson (${watsonUsagePercent.toFixed(1)}%)`);
  
  return {
    results: results,
    stats: {
      total: parsedResumes.length,
      successful: results.filter(r => !r.error).length,
      watsonCalls: watsonCallCount,
      watsonUsagePercent: watsonUsagePercent,
    },
  };
}

export default {
  predictBestRole,
  batchPredictRoles,
};
