/**
 * Interview Routes
 * Handles AI-powered skill verification interviews
 * Generates unique MCQ questions for any skill across all fields
 */

import express from 'express';
import Resume from '../models/Resume.js';
import { generateInterviewQuestions, verifyAnswers, calculateSkillVerification } from '../services/aiQuestionGeneratorService.js';
import { updateResumeCredibility } from '../services/credibilityService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// In-memory session storage (expires after 30 minutes)
// Structure: { sessionId: { questions, createdAt, resumeId, skills } }
if (!global.interviewSessions) {
  global.interviewSessions = new Map();
}

// Clean up expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  for (const [sessionId, session] of global.interviewSessions.entries()) {
    if (now - session.createdAt > THIRTY_MINUTES) {
      global.interviewSessions.delete(sessionId);
      logger.info(`Expired interview session: ${sessionId}`);
    }
  }
}, 10 * 60 * 1000);

/**
 * POST /api/interview/generate
 * Generate interview questions for resume skills
 * @body { resumeId, skills (optional - uses resume skills if not provided) }
 */
router.post('/generate', async (req, res) => {
  try {
    const { resumeId, skills } = req.body;
    
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId, isActive: true });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Get skills to test
    const parsedResume = Object.fromEntries(resume.parsed_resume || new Map());
    const skillsToTest = skills || parsedResume.skills || [];
    
    if (skillsToTest.length === 0) {
      return res.status(400).json({ error: 'No skills found to generate questions for' });
    }
    
    // Generate questions (3 per skill, mixed difficulties)
    const questions = generateInterviewQuestions(skillsToTest, {
      questionsPerSkill: 3,
      difficultyDistribution: { easy: 0.4, medium: 0.4, hard: 0.2 }
    });
    
    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    global.interviewSessions.set(sessionId, {
      questions: questions,
      createdAt: Date.now(),
      resumeId: resumeId,
      skills: skillsToTest
    });
    
    // Return questions WITHOUT correct answers
    const questionsForUser = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      skill: q.skill
    }));
    
    logger.info(`Generated ${questions.length} questions for resume ${resumeId}`);
    
    res.json({
      success: true,
      sessionId: sessionId,
      questions: questionsForUser,
      totalQuestions: questions.length,
      expiresIn: 30 * 60 * 1000, // 30 minutes
      skills: skillsToTest
    });
    
  } catch (error) {
    logger.error('Error generating interview:', error);
    res.status(500).json({ error: 'Failed to generate interview questions' });
  }
});

/**
 * POST /api/interview/submit
 * Submit interview answers and get results
 * @body { sessionId, answers: { questionId: 'A'|'B'|'C'|'D' } }
 */
router.post('/submit', async (req, res) => {
  try {
    const { sessionId, answers } = req.body;
    
    if (!sessionId || !answers) {
      return res.status(400).json({ error: 'Session ID and answers are required' });
    }
    
    // Get session
    const session = global.interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Interview session not found or expired' });
    }
    
    // Verify answers
    const verificationResult = verifyAnswers(session.questions, answers);
    
    // Calculate skill-level verification
    const { verifiedSkills, questionableSkills } = calculateSkillVerification(verificationResult.results);
    
    // Fetch resume and update credibility
    const resume = await Resume.findOne({ resumeId: session.resumeId, isActive: true });
    if (resume) {
      const credibilityAssessment = await updateResumeCredibility(resume, verificationResult);
      
      // ====================================================================
      // SYNC VERIFICATION TO BOTH LOCATIONS
      // ====================================================================
      
      // 1. Update parsed_resume.verification_status (for credibility system)
      const parsedResume = Object.fromEntries(resume.parsed_resume || new Map());
      parsedResume.verification_status = {
        ...parsedResume.verification_status,
        verifiedSkills: verifiedSkills,
        questionableSkills: questionableSkills
      };
      resume.parsed_resume = new Map(Object.entries(parsedResume));
      
      // 2. Update profile.skillVerifications (for skill analysis integration)
      if (!resume.profile) {
        resume.profile = {};
      }
      if (!Array.isArray(resume.profile.skillVerifications)) {
        resume.profile.skillVerifications = [];
      }
      
      // Helper function to determine badge
      const determineBadge = (score) => {
        if (score >= 85) return { level: 'gold', label: 'Gold Badge', color: '#fbbf24', icon: '🥇' };
        if (score >= 70) return { level: 'silver', label: 'Silver Badge', color: '#d1d5db', icon: '🥈' };
        if (score >= 50) return { level: 'bronze', label: 'Bronze Badge', color: '#fb923c', icon: '🥉' };
        return { level: 'none', label: 'Needs Practice', color: '#94a3b8', icon: '🎯' };
      };
      
      // Add verified skills to profile.skillVerifications
      for (const verifiedSkill of verifiedSkills) {
        const existingIndex = resume.profile.skillVerifications.findIndex(
          v => v.skill?.toLowerCase() === verifiedSkill.skill.toLowerCase()
        );
        
        const badge = determineBadge(verifiedSkill.score);
        const verificationData = {
          skill: verifiedSkill.skill,
          score: verifiedSkill.score,
          correct: Math.round(verifiedSkill.score / 100 * session.questions.length),
          total: session.questions.length,
          verified: verifiedSkill.score >= 70,
          lastVerifiedAt: new Date(),
          badge: {
            level: badge.level,
            label: badge.label,
            awardedAt: new Date()
          }
        };
        
        if (existingIndex >= 0) {
          resume.profile.skillVerifications[existingIndex] = verificationData;
        } else {
          resume.profile.skillVerifications.push(verificationData);
        }
      }
      
      resume.markModified('profile.skillVerifications');
      resume.markModified('parsed_resume');
      await resume.save();
      
      // Clean up session
      global.interviewSessions.delete(sessionId);
      
      logger.info(`Interview completed for resume ${session.resumeId}: ${verificationResult.score}%`);
      
      res.json({
        success: true,
        score: verificationResult.score,
        passed: verificationResult.passed,
        correctCount: verificationResult.correctCount,
        totalQuestions: verificationResult.totalQuestions,
        results: verificationResult.results,
        verifiedSkills: verifiedSkills,
        questionableSkills: questionableSkills,
        credibility: credibilityAssessment,
        message: verificationResult.passed 
          ? '✅ Congratulations! Skills verified successfully.' 
          : '❌ Interview incomplete. Please review and retake.'
      });
    } else {
      res.status(404).json({ error: 'Resume not found' });
    }
    
  } catch (error) {
    logger.error('Error submitting interview:', error);
    res.status(500).json({ error: 'Failed to submit interview answers' });
  }
});

/**
 * POST /api/interview/job-apply
 * Generate interview for specific job required skills
 * @body { resumeId, jobId, requiredSkills }
 */
router.post('/job-apply', async (req, res) => {
  try {
    const { resumeId, jobId, requiredSkills } = req.body;
    
    if (!resumeId || !requiredSkills || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'Resume ID and required skills are needed' });
    }
    
    // Fetch resume
    const resume = await Resume.findOne({ resumeId, isActive: true });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Check if user has these skills in resume
    const parsedResume = Object.fromEntries(resume.parsed_resume || new Map());
    const userSkills = parsedResume.skills || [];
    
    // Filter to only test skills that user claims to have
    const skillsToTest = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    if (skillsToTest.length === 0) {
      return res.status(400).json({ 
        error: 'None of the required job skills match your resume',
        requiredSkills: requiredSkills,
        yourSkills: userSkills
      });
    }
    
    // Generate questions (5 per skill for job application - more rigorous)
    const questions = generateInterviewQuestions(skillsToTest, {
      questionsPerSkill: 5,
      difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
    });
    
    // Create session
    const sessionId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    global.interviewSessions.set(sessionId, {
      questions: questions,
      createdAt: Date.now(),
      resumeId: resumeId,
      jobId: jobId,
      skills: skillsToTest,
      type: 'job-application'
    });
    
    // Return questions WITHOUT correct answers
    const questionsForUser = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      skill: q.skill
    }));
    
    logger.info(`Generated job application interview for resume ${resumeId}, job ${jobId}`);
    
    res.json({
      success: true,
      sessionId: sessionId,
      questions: questionsForUser,
      totalQuestions: questions.length,
      expiresIn: 30 * 60 * 1000,
      skills: skillsToTest,
      jobId: jobId,
      message: `Testing ${skillsToTest.length} skills required for this job`
    });
    
  } catch (error) {
    logger.error('Error generating job interview:', error);
    res.status(500).json({ error: 'Failed to generate job application interview' });
  }
});

/**
 * GET /api/interview/status/:resumeId
 * Get verification status for a resume
 */
router.get('/status/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const resume = await Resume.findOne({ resumeId: resumeId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    let parsedResume = {};
    const rawParsed = resume.parsed_resume;
    if (rawParsed instanceof Map) {
      parsedResume = Object.fromEntries(rawParsed);
    } else if (rawParsed && typeof rawParsed === 'object') {
      parsedResume = rawParsed;
    }
    const verification = parsedResume.verification_status || {};
    
    res.json({
      success: true,
      isVerified: verification.isVerified || false,
      credibilityScore: verification.credibilityScore || 0,
      badge: verification.badge || { level: 'none', label: 'Unverified' },
      verifiedSkills: verification.verifiedSkills || [],
      questionableSkills: verification.questionableSkills || [],
      interviewScore: verification.interviewScore || 0,
      totalInterviews: verification.totalInterviews || 0,
      lastInterviewAt: verification.lastInterviewAt || null,
      verifiedAt: verification.verifiedAt || null
    });
    
  } catch (error) {
    logger.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

export default router;
