/**
 * Real-Time Job Import Service
 * Imports jobs from JSON format (real-time website scraping)
 * Uses AI-powered skill extraction (HuggingFace NER + keyword matching)
 */

import Job from '../models/Job.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import { extractJobSkills, extractSkillsWithNER } from './aiRouter.js';

/**
 * Import jobs from JSON array
 * @param {Array} jobsData - Array of job objects from real-time source
 * @returns {Promise<Object>} - Import statistics
 */
export async function importRealTimeJobs(jobsData) {
  const stats = {
    total: jobsData.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  logger.info(`[RealTimeJobs] Starting import of ${stats.total} jobs...`);

  for (const jobData of jobsData) {
    try {
      // Generate unique jobId from application_url or title+company
      const jobId = jobData.application_url
        ? crypto.createHash('md5').update(jobData.application_url).digest('hex')
        : crypto.createHash('md5').update(`${jobData.title}-${jobData.company}-${jobData.posted_date}`).digest('hex');

      // Transform real-time job format to our schema (async for AI extraction)
      const transformedJob = await transformJobData(jobData, jobId);

      // Check if job already exists
      const existingJob = await Job.findOne({ jobId });

      if (existingJob) {
        // Update existing job
        Object.assign(existingJob, transformedJob);
        await existingJob.save();
        stats.updated++;
        logger.info(`[RealTimeJobs] Updated job: ${jobData.title} at ${jobData.company}`);
      } else {
        // Create new job
        await Job.create(transformedJob);
        stats.imported++;
        logger.info(`[RealTimeJobs] Imported new job: ${jobData.title} at ${jobData.company}`);
      }

    } catch (error) {
      stats.errors++;
      stats.errorDetails.push({
        job: jobData.title,
        error: error.message
      });
      logger.error(`[RealTimeJobs] Error importing job "${jobData.title}":`, error.message);
    }
  }

  logger.info('[RealTimeJobs] Import complete:', stats);
  return stats;
}

/**
 * Transform real-time job data to our Job schema format
 */
async function transformJobData(jobData, jobId) {
  // Parse location
  const location = parseLocation(jobData.location, jobData.is_remote);

  // Parse skills with AI-powered extraction
  const skills = await parseSkills(jobData.skills, jobData.requirements, jobData.description);

  // Parse salary
  const salary = parseSalary(jobData.salary_min, jobData.salary_max, jobData.currency);

  // Determine employment type
  const employmentType = determineEmploymentType(jobData.employment_type, jobData.tag);

  // Parse experience level
  const experienceLevel = parseExperienceLevel(jobData.experience_level);

  // Calculate expiry date (30 days from posted date or use application deadline)
  const postedDate = jobData.posted_date ? new Date(jobData.posted_date) : new Date();
  const expiresAt = jobData.application_deadline 
    ? new Date(jobData.application_deadline)
    : new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return {
    jobId,
    title: jobData.title,
    company: {
      name: jobData.company,
      logo: jobData.company_logo || null,
      website: jobData.company_website || null,
      size: jobData.company_size || null
    },
    location,
    description: jobData.description || 'No description provided',
    responsibilities: parseArray(jobData.responsibilities),
    requirements: parseArray(jobData.requirements),
    employmentType,
    experienceLevel,
    experienceYears: parseExperienceYears(jobData.experience_level),
    salary,
    skills: {
      required: skills.required,
      preferred: skills.preferred,
      allSkills: [...skills.required, ...skills.preferred]
    },
    source: {
      platform: jobData.source === 'real' ? 'real' : 'api',
      sourceUrl: jobData.application_url,
      sourceJobId: jobData.job_id || null
    },
    tag: jobData.tag || null,
    postedDate,
    expiresAt,
    applicationDeadline: jobData.application_deadline ? new Date(jobData.application_deadline) : null,
    status: 'active',
    isVerified: jobData.source === 'real',
    benefits: parseArray(jobData.benefits),
    applicationUrl: jobData.application_url,
    applicationEmail: jobData.application_email || null
  };
}

/**
 * Parse location string to location object
 */
function parseLocation(locationStr, isRemote) {
  // Handle Pan-India, Remote, depends, etc.
  const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere'];
  const isPanIndia = locationStr?.toLowerCase().includes('pan-india');
  
  let locationType = 'on-site';
  let isRemoteFlag = false;

  if (isRemote === 'yes' || isRemote === true) {
    locationType = 'remote';
    isRemoteFlag = true;
  } else if (isRemote === 'depends' || isRemote === 'hybrid') {
    locationType = 'hybrid';
  } else if (locationStr && remoteKeywords.some(kw => locationStr.toLowerCase().includes(kw))) {
    locationType = 'remote';
    isRemoteFlag = true;
  }

  // Parse city, state, country from location string
  let city = null, state = null, country = 'India';
  
  if (locationStr && !isPanIndia && !isRemoteFlag) {
    const parts = locationStr.split(',').map(p => p.trim());
    if (parts.length === 1) {
      city = parts[0];
    } else if (parts.length === 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length >= 3) {
      city = parts[0];
      state = parts[1];
      country = parts[2];
    }
  }

  return {
    city,
    state,
    country,
    isRemote: isRemoteFlag,
    locationType
  };
}

/**
 * Parse skills from skills string or requirements using AI-powered extraction
 */
async function parseSkills(skillsStr, requirementsStr, jobDescription) {
  const skillsArray = [];
  
  // Parse from skills field (if provided)
  if (skillsStr && skillsStr.trim()) {
    const skills = skillsStr.split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(s => s);
    skillsArray.push(...skills);
  }
  
  // AI-powered skill extraction from requirements and description
  const textToAnalyze = `${requirementsStr || ''} ${jobDescription || ''}`.trim();
  
  if (textToAnalyze && textToAnalyze.length > 50) {
    try {
      // Use HuggingFace for AI-powered extraction
      const aiResult = await extractJobSkills(textToAnalyze);
      
      if (aiResult.success && aiResult.extractedSkills) {
        const aiSkills = aiResult.extractedSkills.map(s => s.skill.toLowerCase());
        skillsArray.push(...aiSkills);
        logger.info(`[AI Extraction] Found ${aiSkills.length} skills using AI`);
      }
    } catch (error) {
      logger.warn('[AI Extraction] Failed, using fallback keyword extraction:', error.message);
    }
  }
  
  // Fallback: Extract skills from requirements using keyword matching
  if (requirementsStr) {
    const keywordSkills = extractTechSkills(requirementsStr);
    skillsArray.push(...keywordSkills);
  }

  // Remove duplicates and clean up
  const uniqueSkills = [...new Set(skillsArray)]
    .filter(s => s && s.length > 1)
    .map(s => s.trim());

  // Split into required (first 70%) and preferred (last 30%)
  const splitIndex = Math.ceil(uniqueSkills.length * 0.7);
  
  return {
    required: uniqueSkills.slice(0, splitIndex),
    preferred: uniqueSkills.slice(splitIndex)
  };
}

/**
 * Extract tech skills from text using common skill keywords
 */
function extractTechSkills(text) {
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'nodejs',
    'express', 'mongodb', 'sql', 'postgresql', 'mysql', 'aws', 'azure', 'docker',
    'kubernetes', 'git', 'html', 'css', 'typescript', 'graphql', 'rest', 'api',
    'django', 'flask', 'spring', 'springboot', 'hibernate', 'redux', 'nextjs',
    'tailwind', 'bootstrap', 'sass', 'webpack', 'babel', 'jest', 'testing',
    'ci/cd', 'devops', 'linux', 'bash', 'shell', 'redis', 'elasticsearch',
    'kafka', 'rabbitmq', 'microservices', 'agile', 'scrum', 'jira'
  ];

  const lowerText = text.toLowerCase();
  return commonSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Parse salary
 */
function parseSalary(minSalary, maxSalary, currency) {
  return {
    min: minSalary || null,
    max: maxSalary || null,
    currency: currency || 'INR',
    period: 'annually'
  };
}

/**
 * Determine employment type
 */
function determineEmploymentType(employmentType, tag) {
  if (employmentType && employmentType.toLowerCase() !== 'varies') {
    return employmentType.toLowerCase();
  }
  if (tag) {
    const tagMap = {
      'internship': 'internship',
      'full-time': 'full-time',
      'part-time': 'part-time',
      'contract': 'contract',
      'freelance': 'freelance'
    };
    return tagMap[tag.toLowerCase()] || 'full-time';
  }
  return 'full-time';
}

/**
 * Parse experience level
 */
function parseExperienceLevel(experienceLevelStr) {
  if (!experienceLevelStr || experienceLevelStr.toLowerCase() === 'varies') {
    return 'mid';
  }

  const levelMap = {
    'entry': 'entry',
    'junior': 'entry',
    'beginner': 'entry',
    'mid': 'mid',
    'middle': 'mid',
    'intermediate': 'mid',
    'senior': 'senior',
    'lead': 'lead',
    'principal': 'lead',
    'manager': 'lead',
    'director': 'executive',
    'executive': 'executive',
    'c-level': 'executive'
  };

  const normalized = experienceLevelStr.toLowerCase();
  for (const [key, value] of Object.entries(levelMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return 'mid';
}

/**
 * Parse experience years from level
 */
function parseExperienceYears(experienceLevelStr) {
  const levelYearsMap = {
    'entry': { min: 0, max: 2 },
    'mid': { min: 2, max: 5 },
    'senior': { min: 5, max: 10 },
    'lead': { min: 8, max: 15 },
    'executive': { min: 10, max: null }
  };

  const level = parseExperienceLevel(experienceLevelStr);
  return levelYearsMap[level] || { min: 0, max: null };
}

/**
 * Parse array from string or return array
 */
function parseArray(value) {
  if (Array.isArray(value)) {
    return value.filter(v => v);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,;|]/).map(v => v.trim()).filter(v => v);
  }
  return [];
}

/**
 * Import from JSON file
 */
export async function importJobsFromFile(filePath) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jobsData = JSON.parse(fileContent);
    
    return await importRealTimeJobs(jobsData);
  } catch (error) {
    logger.error('[RealTimeJobs] Error reading file:', error.message);
    throw error;
  }
}

export default {
  importRealTimeJobs,
  importJobsFromFile
};
