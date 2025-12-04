/**
 * Credibility Service
 * Calculates credibility scores for resumes based on multiple factors
 * Field-agnostic - works for any industry or domain
 */

import { logger } from '../utils/logger.js';

/**
 * Calculate overall credibility score
 * @param {Object} resume - Resume document with parsed data
 * @param {Object} interviewResult - Interview verification result
 * @returns {Object} Credibility assessment
 */
export function calculateCredibilityScore(resume, interviewResult) {
  try {
    // Component scores
    const resumeQualityScore = assessResumeQuality(resume);
    const interviewScore = interviewResult?.score || 0;
    const verificationRate = calculateVerificationRate(resume);
    
    // Weighted calculation: 30% resume + 50% interview + 20% verification
    const credibilityScore = Math.round(
      (resumeQualityScore * 0.3) +
      (interviewScore * 0.5) +
      (verificationRate * 0.2)
    );
    
    // Determine badge level
    const badge = assignBadge(credibilityScore);
    
    // Generate insights
    const strengths = identifyStrengths(resume, interviewResult);
    const weaknesses = identifyWeaknesses(resume, interviewResult);
    const recommendations = generateRecommendations(credibilityScore, weaknesses);
    
    return {
      credibilityScore,
      badge,
      components: {
        resumeQuality: resumeQualityScore,
        interviewPerformance: interviewScore,
        verificationRate
      },
      strengths,
      weaknesses,
      recommendations,
      trustLevel: getTrustLevel(credibilityScore)
    };
    
  } catch (error) {
    logger.error('Error calculating credibility:', error);
    throw error;
  }
}

/**
 * Assess resume quality (0-100)
 */
function assessResumeQuality(resume) {
  let score = 0;
  const parsed = resume.parsed_resume || {};
  
  // Completeness (40 points)
  if (parsed.name) score += 5;
  if (parsed.email) score += 5;
  if (parsed.phone) score += 5;
  if (parsed.skills && parsed.skills.length > 5) score += 10;
  if (parsed.experience && parsed.experience.length > 0) score += 10;
  if (parsed.education && parsed.education.length > 0) score += 5;
  
  // Content Quality (30 points)
  const skillCount = parsed.skills?.length || 0;
  if (skillCount > 10) score += 10;
  else if (skillCount > 5) score += 5;
  
  const expYears = parsed.total_experience_years || 0;
  if (expYears > 5) score += 10;
  else if (expYears > 2) score += 5;
  else if (expYears > 0) score += 2;
  
  if (parsed.projects && parsed.projects.length > 0) score += 10;
  
  // Skills Depth (30 points)
  if (parsed.technical_skills && parsed.technical_skills.length > 0) score += 10;
  if (parsed.soft_skills && parsed.soft_skills.length > 0) score += 10;
  if (parsed.certifications && parsed.certifications.length > 0) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate verification rate based on verified vs total skills
 */
function calculateVerificationRate(resume) {
  const parsed = resume.parsed_resume || {};
  const verification = parsed.verification_status || {};
  
  const totalSkills = parsed.skills?.length || 0;
  const verifiedSkills = verification.verifiedSkills?.length || 0;
  
  if (totalSkills === 0) return 0;
  
  return Math.round((verifiedSkills / totalSkills) * 100);
}

/**
 * Assign badge based on credibility score
 */
function assignBadge(score) {
  if (score >= 85) {
    return {
      level: 'gold',
      label: 'Highly Verified',
      color: '#FFD700',
      icon: '🏆'
    };
  } else if (score >= 70) {
    return {
      level: 'silver',
      label: 'Verified',
      color: '#C0C0C0',
      icon: '⭐'
    };
  } else if (score >= 50) {
    return {
      level: 'bronze',
      label: 'Partially Verified',
      color: '#CD7F32',
      icon: '🥉'
    };
  } else {
    return {
      level: 'none',
      label: 'Unverified',
      color: '#808080',
      icon: '❓'
    };
  }
}

/**
 * Get trust level description
 */
function getTrustLevel(score) {
  if (score >= 85) return 'Excellent - Highly trustworthy profile with verified skills';
  if (score >= 70) return 'Good - Reliable profile with verified core competencies';
  if (score >= 50) return 'Fair - Profile has some verified information';
  return 'Limited - Insufficient verification to establish trust';
}

/**
 * Identify candidate strengths
 */
function identifyStrengths(resume, interviewResult) {
  const strengths = [];
  const parsed = resume.parsed_resume || {};
  
  // High experience
  const expYears = parsed.total_experience_years || 0;
  if (expYears > 5) {
    strengths.push(`${expYears}+ years of professional experience`);
  }
  
  // Diverse skill set
  const skillCount = parsed.skills?.length || 0;
  if (skillCount > 15) {
    strengths.push(`Broad skill set with ${skillCount} competencies`);
  }
  
  // Strong interview performance
  if (interviewResult && interviewResult.score >= 80) {
    strengths.push(`Excellent interview performance (${interviewResult.score}%)`);
  }
  
  // Verified skills
  const verifiedSkills = parsed.verification_status?.verifiedSkills || [];
  if (verifiedSkills.length > 0) {
    strengths.push(`${verifiedSkills.length} skills independently verified`);
  }
  
  // Education
  if (parsed.education && parsed.education.length > 1) {
    strengths.push('Multiple educational qualifications');
  }
  
  // Projects
  if (parsed.projects && parsed.projects.length > 3) {
    strengths.push(`${parsed.projects.length} documented projects`);
  }
  
  return strengths;
}

/**
 * Identify areas for improvement
 */
function identifyWeaknesses(resume, interviewResult) {
  const weaknesses = [];
  const parsed = resume.parsed_resume || {};
  
  // Low experience
  const expYears = parsed.total_experience_years || 0;
  if (expYears < 2) {
    weaknesses.push('Limited professional experience');
  }
  
  // Few skills
  const skillCount = parsed.skills?.length || 0;
  if (skillCount < 5) {
    weaknesses.push('Limited skill diversity');
  }
  
  // Poor interview performance
  if (interviewResult && interviewResult.score < 60) {
    weaknesses.push(`Interview performance below threshold (${interviewResult.score}%)`);
  }
  
  // Unverified skills
  const questionableSkills = parsed.verification_status?.questionableSkills || [];
  if (questionableSkills.length > 0) {
    weaknesses.push(`${questionableSkills.length} skills could not be verified`);
  }
  
  // Missing sections
  if (!parsed.education || parsed.education.length === 0) {
    weaknesses.push('No educational background provided');
  }
  
  if (!parsed.projects || parsed.projects.length === 0) {
    weaknesses.push('No projects or portfolio items');
  }
  
  if (!parsed.certifications || parsed.certifications.length === 0) {
    weaknesses.push('No professional certifications');
  }
  
  return weaknesses;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(score, weaknesses) {
  const recommendations = [];
  
  if (score < 85) {
    recommendations.push('Complete skill verification interview to boost credibility');
  }
  
  if (weaknesses.some(w => w.includes('interview performance'))) {
    recommendations.push('Review fundamental concepts and retake assessment');
  }
  
  if (weaknesses.some(w => w.includes('could not be verified'))) {
    recommendations.push('Focus on strengthening core skills before re-verification');
  }
  
  if (weaknesses.some(w => w.includes('Limited skill diversity'))) {
    recommendations.push('Expand skill set with relevant courses or certifications');
  }
  
  if (weaknesses.some(w => w.includes('projects or portfolio'))) {
    recommendations.push('Add projects to demonstrate practical application of skills');
  }
  
  if (weaknesses.some(w => w.includes('educational background'))) {
    recommendations.push('Include education details for comprehensive profile');
  }
  
  if (score >= 85) {
    recommendations.push('Maintain your excellent profile with regular skill updates');
  }
  
  return recommendations;
}

/**
 * Update resume with credibility assessment
 */
export async function updateResumeCredibility(resume, interviewResult) {
  try {
    const assessment = calculateCredibilityScore(resume, interviewResult);
    
    // Update verification_status in resume
    resume.parsed_resume.verification_status = {
      ...resume.parsed_resume.verification_status,
      isVerified: assessment.credibilityScore >= 70,
      verifiedAt: new Date(),
      credibilityScore: assessment.credibilityScore,
      badge: assessment.badge,
      interviewScore: interviewResult.score,
      totalInterviews: (resume.parsed_resume.verification_status?.totalInterviews || 0) + 1,
      lastInterviewAt: new Date(),
      trustLevel: assessment.trustLevel
    };
    
    await resume.save();
    
    logger.info(`Updated credibility for resume ${resume._id}: ${assessment.credibilityScore}/100`);
    
    return assessment;
    
  } catch (error) {
    logger.error('Error updating resume credibility:', error);
    throw error;
  }
}

export default {
  calculateCredibilityScore,
  updateResumeCredibility,
  assessResumeQuality,
  assignBadge
};
