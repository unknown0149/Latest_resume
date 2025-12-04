/**
 * Soft Skills Analysis Service
 * Analyzes resume text for soft skills using NLP patterns and keyword matching
 */

import natural from 'natural';
import { logger } from '../utils/logger.js';

const { SentimentAnalyzer, PorterStemmer } = natural;

// Soft skills categories with keywords and patterns
const softSkillsDatabase = {
  'Leadership': {
    keywords: ['led', 'lead', 'managed', 'supervised', 'directed', 'coordinated', 'headed', 'mentored', 'guided', 'trained', 'coached', 'delegated', 'oversaw', 'facilitated'],
    phrases: ['team lead', 'project lead', 'led team', 'managed team', 'led project', 'team leader', 'tech lead', 'lead developer', 'managed developers'],
    weight: 1.2
  },
  'Communication': {
    keywords: ['presented', 'communicated', 'documented', 'reported', 'explained', 'demonstrated', 'collaborated', 'discussed', 'negotiated', 'articulated'],
    phrases: ['stakeholder communication', 'cross-team collaboration', 'technical documentation', 'client communication', 'presented to', 'documented', 'code reviews'],
    weight: 1.0
  },
  'Problem Solving': {
    keywords: ['solved', 'resolved', 'debugged', 'troubleshot', 'optimized', 'improved', 'enhanced', 'fixed', 'analyzed', 'diagnosed', 'investigated'],
    phrases: ['problem solving', 'root cause analysis', 'troubleshooting', 'performance optimization', 'bug fixes', 'resolved issues', 'improved performance'],
    weight: 1.3
  },
  'Teamwork': {
    keywords: ['collaborated', 'cooperated', 'partnered', 'worked with', 'contributed', 'supported', 'assisted', 'paired', 'team', 'cross-functional'],
    phrases: ['team collaboration', 'cross-functional teams', 'agile team', 'scrum team', 'worked closely', 'pair programming', 'team player'],
    weight: 1.0
  },
  'Adaptability': {
    keywords: ['adapted', 'learned', 'transitioned', 'migrated', 'adopted', 'flexible', 'versatile', 'pivoted', 'adjusted'],
    phrases: ['quick learner', 'adapted to', 'learned new', 'transitioned to', 'flexible approach', 'diverse technologies'],
    weight: 0.9
  },
  'Time Management': {
    keywords: ['delivered', 'completed', 'scheduled', 'prioritized', 'planned', 'organized', 'coordinated', 'met deadline', 'on time'],
    phrases: ['met deadlines', 'delivered on time', 'time management', 'prioritized tasks', 'project planning', 'sprint planning'],
    weight: 0.8
  },
  'Critical Thinking': {
    keywords: ['analyzed', 'evaluated', 'assessed', 'researched', 'designed', 'architected', 'planned', 'strategized', 'reviewed'],
    phrases: ['system design', 'architecture design', 'code review', 'technical analysis', 'requirements analysis', 'strategic planning'],
    weight: 1.1
  },
  'Creativity': {
    keywords: ['designed', 'created', 'developed', 'innovated', 'built', 'engineered', 'implemented', 'crafted', 'invented'],
    phrases: ['innovative solutions', 'creative approach', 'designed from scratch', 'proof of concept', 'new features', 'prototype'],
    weight: 0.9
  },
  'Attention to Detail': {
    keywords: ['tested', 'validated', 'verified', 'reviewed', 'quality', 'accurate', 'precise', 'thorough', 'meticulous'],
    phrases: ['quality assurance', 'code quality', 'attention to detail', 'comprehensive testing', 'thorough review', 'unit testing'],
    weight: 0.8
  },
  'Initiative': {
    keywords: ['initiated', 'started', 'proposed', 'introduced', 'launched', 'pioneered', 'drove', 'championed', 'spearheaded'],
    phrases: ['took initiative', 'proactive approach', 'self-starter', 'independently', 'drove project', 'took ownership'],
    weight: 1.0
  }
};

/**
 * Analyze text for soft skills presence
 */
function analyzeSoftSkills(text) {
  const textLower = text.toLowerCase();
  const results = {};
  
  for (const [skill, data] of Object.entries(softSkillsDatabase)) {
    let score = 0;
    const evidence = [];
    
    // Check keywords
    data.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 1;
        // Find sentences containing this keyword
        const sentences = text.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(keyword) && evidence.length < 3) {
            evidence.push(sentence.trim());
          }
        });
      }
    });
    
    // Check phrases (weighted higher)
    data.phrases.forEach(phrase => {
      if (textLower.includes(phrase)) {
        score += 3 * data.weight;
        // Find sentences containing this phrase
        const sentences = text.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(phrase) && evidence.length < 3) {
            evidence.push(sentence.trim());
          }
        });
      }
    });
    
    // Apply skill weight
    score *= data.weight;
    
    if (score > 0) {
      results[skill] = {
        score,
        evidence: [...new Set(evidence)].slice(0, 3) // Unique evidence, max 3
      };
    }
  }
  
  return results;
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(score, maxScore = 20) {
  const confidence = Math.min(score / maxScore, 1);
  return Math.round(confidence * 100) / 100;
}

/**
 * Analyze resume for soft skills
 */
export function analyzeSoftSkillsFromResume(parsedResume) {
  try {
    // Collect all text from resume
    const textParts = [];
    
    // Experience bullets
    if (parsedResume.experience) {
      parsedResume.experience.forEach(exp => {
        if (exp.bullets) {
          textParts.push(...exp.bullets);
        }
      });
    }
    
    // Project descriptions
    if (parsedResume.projects) {
      parsedResume.projects.forEach(proj => {
        if (proj.description) {
          textParts.push(proj.description);
        }
      });
    }
    
    // Summary (if available from raw text)
    const fullText = textParts.join(' ');
    
    if (fullText.length < 50) {
      logger.warn('Insufficient text for soft skills analysis');
      return [];
    }
    
    // Analyze
    const skillScores = analyzeSoftSkills(fullText);
    
    // Convert to array and sort by score
    const softSkills = Object.entries(skillScores)
      .map(([skill, data]) => ({
        skill,
        confidence: calculateConfidence(data.score),
        evidence: data.evidence,
        score: data.score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10
    
    logger.info(`Identified ${softSkills.length} soft skills from resume`);
    
    return softSkills;
    
  } catch (error) {
    logger.error('Soft skills analysis error:', error);
    return [];
  }
}

/**
 * Get top soft skills
 */
export function getTopSoftSkills(softSkills, count = 5) {
  return softSkills
    .filter(skill => skill.confidence >= 0.3) // Only confident predictions
    .slice(0, count);
}

/**
 * Generate soft skills summary
 */
export function generateSoftSkillsSummary(softSkills) {
  const topSkills = getTopSoftSkills(softSkills, 3);
  
  if (topSkills.length === 0) {
    return 'Demonstrates professional competencies across various dimensions.';
  }
  
  const skillNames = topSkills.map(s => s.skill);
  
  let summary = 'Demonstrates strong ';
  
  if (skillNames.length === 1) {
    summary += skillNames[0].toLowerCase();
  } else if (skillNames.length === 2) {
    summary += `${skillNames[0].toLowerCase()} and ${skillNames[1].toLowerCase()}`;
  } else {
    summary += `${skillNames.slice(0, -1).join(', ').toLowerCase()}, and ${skillNames[skillNames.length - 1].toLowerCase()}`;
  }
  
  summary += ' skills';
  
  // Add evidence-based detail
  if (topSkills[0].evidence.length > 0) {
    summary += ', with proven experience in ';
    const firstEvidence = topSkills[0].evidence[0].substring(0, 80);
    summary += `"${firstEvidence}..."`;
  }
  
  return summary;
}

/**
 * Analyze strengths from skills and experience
 */
export function analyzeStrengths(parsedResume, roleAnalysis, softSkills) {
  const strengths = [];
  
  try {
    // Technical strength
    const skillsHave = roleAnalysis?.skillsHave || [];
    const advancedSkills = skillsHave.filter(s => s.level === 'Advanced');
    
    if (advancedSkills.length >= 3) {
      strengths.push(`Advanced expertise in ${advancedSkills.slice(0, 3).map(s => s.skill).join(', ')}`);
    } else if (skillsHave.length >= 5) {
      strengths.push(`Proficient in ${skillsHave.slice(0, 5).map(s => s.skill).join(', ')}`);
    }
    
    // Experience strength
    const years = parsedResume?.years_experience || 0;
    if (years >= 5) {
      strengths.push(`${years}+ years of professional experience`);
    }
    
    // Soft skills strength
    const topSoftSkills = getTopSoftSkills(softSkills, 2);
    if (topSoftSkills.length > 0) {
      strengths.push(topSoftSkills.map(s => s.skill).join(' and '));
    }
    
    // Education strength
    const education = parsedResume?.education?.[0];
    if (education?.degree) {
      if (education.degree.toLowerCase().includes('master') || education.degree.toLowerCase().includes('phd')) {
        strengths.push(`Advanced degree (${education.degree})`);
      } else if (education.degree.toLowerCase().includes('bachelor')) {
        strengths.push(`Strong educational foundation (${education.degree})`);
      }
    }
    
    // Project diversity
    const projects = parsedResume?.projects || [];
    if (projects.length >= 5) {
      strengths.push(`Diverse project portfolio (${projects.length}+ projects)`);
    }
    
    // Certifications
    const certifications = parsedResume?.certifications || [];
    if (certifications.length >= 2) {
      strengths.push(`Professional certifications (${certifications.length})`);
    }
    
    return strengths.slice(0, 6); // Max 6 strengths
    
  } catch (error) {
    logger.error('Strengths analysis error:', error);
    return [];
  }
}

export default {
  analyzeSoftSkillsFromResume,
  getTopSoftSkills,
  generateSoftSkillsSummary,
  analyzeStrengths
};
