/**
 * Hybrid Resume Parser - Orchestrator
 * Combines Regex + NER + LLM with confidence scoring and intelligent fallbacks
 * Priority: Regex (0.98) → NER (0.85) → LLM (0.75)
 */

import {
  extractEmails,
  extractPhones,
  extractURLs,
  extractYearsExperience,
  extractEducationKeywords,
  extractName,
  extractLocation,
  extractCurrentTitle,
  extractSkillKeywords,
} from '../utils/regexExtractor.js';

import {
  calculateYearsOfExperience,
  estimateExperienceFromEducation,
  validateExperienceTimeline,
  getExperienceLevel,
} from '../utils/experienceCalculator.js';

import {
  parseResumeWithLLM,
  extractSkillsWithLLM,
  normalizeExperienceWithLLM,
  estimateExperienceWithLLM,
} from '../services/llmParsingService.js';

import { canonicalizeSkills } from '../data/skillsCanonical.js';
import { logger } from '../utils/logger.js';

/**
 * Main hybrid parsing function
 * Combines all extraction methods with intelligent fallbacks
 */
export async function parseResume(rawText, options = {}) {
  const startTime = Date.now();
  const {
    useLLM = true,
    minConfidence = 0.60,
    maxRetries = 1,
  } = options;
  
  logger.info('Starting hybrid resume parsing...');
  
  // Track confidence scores for each field
  const confidenceScores = {};
  const extractionMethods = {};
  
  // Initialize canonical result structure
  const result = {
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
  };
  
  // ==== PHASE 1: HIGH-CONFIDENCE REGEX EXTRACTION ====
  
  // Extract emails (confidence: 0.98)
  const emailsResult = extractEmails(rawText);
  if (emailsResult.confidence > 0) {
    result.emails = emailsResult.emails;
    confidenceScores.emails = emailsResult.confidence;
    extractionMethods.emails = 'regex';
  }
  
  // Extract phones (confidence: 0.95)
  const phonesResult = extractPhones(rawText);
  if (phonesResult.confidence > 0) {
    result.phones = phonesResult.phones;
    confidenceScores.phones = phonesResult.confidence;
    extractionMethods.phones = 'regex';
  }
  
  // Extract URLs (confidence: 0.98)
  const urlsResult = extractURLs(rawText);
  if (urlsResult.confidence > 0) {
    result.links = urlsResult.urls;
    confidenceScores.links = urlsResult.confidence;
    extractionMethods.links = 'regex';
  }
  
  // Extract name (confidence: 0.80-0.95)
  const nameResult = extractName(rawText);
  if (nameResult.confidence >= minConfidence) {
    result.name = nameResult.name;
    confidenceScores.name = nameResult.confidence;
    extractionMethods.name = 'regex';
  }
  
  // Extract location (confidence: 0.88)
  const locationResult = extractLocation(rawText);
  if (locationResult.confidence >= minConfidence) {
    result.location = locationResult.location;
    confidenceScores.location = locationResult.confidence;
    extractionMethods.location = 'regex';
  }
  
  // Extract current title (confidence: 0.75)
  const titleResult = extractCurrentTitle(rawText);
  if (titleResult.confidence >= minConfidence) {
    result.current_title = titleResult.title;
    confidenceScores.current_title = titleResult.confidence;
    extractionMethods.current_title = 'regex';
  }
  
  // Extract skills using keywords (confidence: 0.70)
  const skillsRegex = extractSkillKeywords(rawText);
  if (skillsRegex.confidence > 0) {
    result.skills = canonicalizeSkills(skillsRegex.skills);
    confidenceScores.skills = skillsRegex.confidence;
    extractionMethods.skills = 'regex';
  }
  
  // Extract education keywords
  const educationKeywords = extractEducationKeywords(rawText);
  
  // ==== PHASE 2: LLM EXTRACTION (Full Structured Parse) ====
  
  let llmResult = null;
  if (useLLM) {
    logger.info('Calling LLM for structured extraction...');
    llmResult = await parseResumeWithLLM(rawText);
    
    if (llmResult.success) {
      const llmData = llmResult.data;
      
      // Use LLM results for missing or low-confidence fields
      
      // Name: Use LLM if regex confidence < threshold
      if (!result.name || confidenceScores.name < 0.70) {
        if (llmData.name) {
          result.name = llmData.name;
          confidenceScores.name = llmResult.confidence;
          extractionMethods.name = 'llm';
        }
      }
      
      // Current title: Use LLM if not found
      if (!result.current_title && llmData.current_title) {
        result.current_title = llmData.current_title;
        confidenceScores.current_title = llmResult.confidence;
        extractionMethods.current_title = 'llm';
      }
      
      // Location: Use LLM if not found
      if (!result.location && llmData.location) {
        result.location = llmData.location;
        confidenceScores.location = llmResult.confidence;
        extractionMethods.location = 'llm';
      }
      
      // Skills: Merge LLM skills with regex skills
      if (llmData.skills && llmData.skills.length > 0) {
        const mergedSkills = [...new Set([...result.skills, ...llmData.skills])];
        result.skills = canonicalizeSkills(mergedSkills);
        confidenceScores.skills = Math.max(confidenceScores.skills || 0, llmResult.confidence);
        extractionMethods.skills = 'regex+llm';
      }
      
      // Education: Use LLM result
      if (llmData.education && llmData.education.length > 0) {
        result.education = llmData.education;
        confidenceScores.education = llmResult.confidence;
        extractionMethods.education = 'llm';
      }
      
      // Experience: Use LLM result
      if (llmData.experience && llmData.experience.length > 0) {
        result.experience = llmData.experience;
        confidenceScores.experience = llmResult.confidence;
        extractionMethods.experience = 'llm';
      }
      
      // Projects: Use LLM result
      if (llmData.projects && llmData.projects.length > 0) {
        result.projects = llmData.projects;
        confidenceScores.projects = llmResult.confidence;
        extractionMethods.projects = 'llm';
      }
      
      // Certifications: Use LLM result
      if (llmData.certifications && llmData.certifications.length > 0) {
        result.certifications = llmData.certifications;
        confidenceScores.certifications = llmResult.confidence;
        extractionMethods.certifications = 'llm';
      }
      
      // Languages: Use LLM result
      if (llmData.languages && llmData.languages.length > 0) {
        result.languages = llmData.languages;
        confidenceScores.languages = llmResult.confidence;
        extractionMethods.languages = 'llm';
      }
    }
  }
  
  // ==== PHASE 3: FALLBACK STRATEGIES ====
  
  // Fallback: Extract skills with LLM if still empty
  if (result.skills.length === 0 && useLLM) {
    logger.info('Skills empty - using LLM fallback...');
    const llmSkills = await extractSkillsWithLLM(rawText);
    if (llmSkills.success && llmSkills.skills.length > 0) {
      result.skills = llmSkills.skills;
      confidenceScores.skills = llmSkills.confidence;
      extractionMethods.skills = 'llm_fallback';
    }
  }
  
  // ==== PHASE 4: YEARS OF EXPERIENCE CALCULATION ====
  
  if (result.experience && result.experience.length > 0) {
    // Calculate from experience timeline (most accurate)
    const expResult = calculateYearsOfExperience(result.experience);
    result.years_experience = expResult.years;
    confidenceScores.years_experience = expResult.confidence;
    extractionMethods.years_experience = 'calculated';
    
    // Validate timeline
    const validation = validateExperienceTimeline(result.experience);
    if (!validation.isValid) {
      logger.warn(`Experience timeline validation issues: ${validation.issues.length} issues found`);
      confidenceScores.years_experience -= 0.10;
    }
  } else {
    // Fallback 1: Regex extraction
    const regexYears = extractYearsExperience(rawText);
    if (regexYears.confidence > 0) {
      result.years_experience = regexYears.years;
      confidenceScores.years_experience = regexYears.confidence;
      extractionMethods.years_experience = 'regex';
    } else if (result.education && result.education.length > 0) {
      // Fallback 2: Estimate from education
      const eduEstimate = estimateExperienceFromEducation(result.education);
      if (eduEstimate.confidence > 0) {
        result.years_experience = eduEstimate.years;
        confidenceScores.years_experience = eduEstimate.confidence;
        extractionMethods.years_experience = 'education_estimate';
      }
    } else if (useLLM) {
      // Fallback 3: LLM estimation
      logger.info('Estimating experience with LLM...');
      const llmEstimate = await estimateExperienceWithLLM(rawText);
      if (llmEstimate.success) {
        result.years_experience = llmEstimate.years;
        confidenceScores.years_experience = llmEstimate.confidence;
        extractionMethods.years_experience = 'llm_estimate';
      }
    }
  }
  
  // ==== PHASE 5: POST-PROCESSING ====
  
  // Remove duplicates
  result.emails = [...new Set(result.emails)];
  result.phones = [...new Set(result.phones)];
  result.skills = [...new Set(result.skills)];
  result.links = [...new Set(result.links)];
  result.certifications = [...new Set(result.certifications)];
  result.languages = [...new Set(result.languages)];
  
  // Calculate overall confidence (weighted average)
  const weights = {
    name: 0.15,
    emails: 0.10,
    skills: 0.20,
    experience: 0.20,
    years_experience: 0.10,
    education: 0.10,
    current_title: 0.05,
    phones: 0.05,
    location: 0.05,
  };
  
  let overallConfidence = 0;
  let totalWeight = 0;
  
  for (const [field, weight] of Object.entries(weights)) {
    if (confidenceScores[field]) {
      overallConfidence += confidenceScores[field] * weight;
      totalWeight += weight;
    }
  }
  
  overallConfidence = totalWeight > 0 ? overallConfidence / totalWeight : 0;
  
  // ==== PHASE 6: QUALITY CHECKS ====
  
  const qualityIssues = [];
  
  if (!result.name || confidenceScores.name < 0.60) {
    qualityIssues.push({
      field: 'name',
      severity: 'high',
      message: 'Name extraction has low confidence or missing',
      requiresReview: true,
    });
  }
  
  if (result.skills.length === 0) {
    qualityIssues.push({
      field: 'skills',
      severity: 'high',
      message: 'No skills extracted from resume',
      requiresReview: true,
    });
  }
  
  if (result.experience.length === 0) {
    qualityIssues.push({
      field: 'experience',
      severity: 'medium',
      message: 'No work experience extracted',
      requiresReview: true,
    });
  }
  
  if (result.years_experience === 0 && result.experience.length > 0) {
    qualityIssues.push({
      field: 'years_experience',
      severity: 'medium',
      message: 'Could not calculate years of experience',
      requiresReview: false,
    });
  }
  
  const processingTime = Date.now() - startTime;
  
  logger.info(`Resume parsing completed in ${processingTime}ms, confidence: ${overallConfidence.toFixed(2)}`);
  
  return {
    success: true,
    parsed_resume: result,
    metadata: {
      overall_confidence: parseFloat(overallConfidence.toFixed(2)),
      field_confidences: confidenceScores,
      extraction_methods: extractionMethods,
      processing_time_ms: processingTime,
      quality_issues: qualityIssues,
      requires_manual_review: qualityIssues.some(issue => issue.requiresReview),
      llm_used: useLLM && llmResult && llmResult.success,
      version: '2.0',
      parsed_at: new Date().toISOString(),
    },
  };
}

/**
 * Quick parse (regex only, no LLM)
 */
export async function quickParse(rawText) {
  return parseResume(rawText, {
    useLLM: false,
    minConfidence: 0.50,
  });
}

/**
 * Deep parse (with LLM and retries)
 */
export async function deepParse(rawText) {
  return parseResume(rawText, {
    useLLM: true,
    minConfidence: 0.60,
    maxRetries: 2,
  });
}

export default {
  parseResume,
  quickParse,
  deepParse,
};
