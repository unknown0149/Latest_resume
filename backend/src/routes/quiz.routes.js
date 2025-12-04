/**
 * Quiz API Routes
 * Endpoints for MCQ skill assessment
 */

import express from 'express';
import {
  generateMCQQuiz,
  startQuiz,
  submitQuiz,
  getQuizHistory,
  getQuiz,
  getSkillStats
} from '../services/quizService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/quiz/generate
 * Generate a new quiz for a skill
 * 
 * Body: {
 *   resumeId: string,
 *   skillName: string,
 *   difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
 *   questionCount: number (default: 5),
 *   timeLimit: number (default: 30 minutes)
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { resumeId, skillName, difficulty, questionCount, timeLimit, userId } = req.body;
    
    // Validation
    if (!resumeId || !skillName) {
      return res.status(400).json({
        success: false,
        error: 'resumeId and skillName are required'
      });
    }
    
    const result = await generateMCQQuiz(resumeId, skillName, {
      difficulty: difficulty || 'Intermediate',
      questionCount: questionCount || 5,
      timeLimit: timeLimit || 30,
      userId: userId
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Generate quiz API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/quiz/start/:quizId
 * Start a quiz (mark as in-progress)
 */
router.post('/start/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const result = await startQuiz(quizId);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Start quiz API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/quiz/submit/:quizId
 * Submit quiz answers
 * 
 * Body: {
 *   answers: [
 *     { questionId: number, selectedAnswer: number, timeSpent: number }
 *   ]
 * }
 */
router.post('/submit/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'answers array is required'
      });
    }
    
    const result = await submitQuiz(quizId, answers);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Submit quiz API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quiz/history/:resumeId
 * Get quiz history for a user
 * 
 * Query params:
 *   - limit: number (default: 10)
 *   - skillName: string (optional filter)
 */
router.get('/history/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { limit, skillName } = req.query;
    
    const result = await getQuizHistory(resumeId, {
      limit: limit ? parseInt(limit) : 10,
      skillName: skillName
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Quiz history API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quiz/:quizId
 * Get quiz details
 * 
 * Query params:
 *   - includeAnswers: boolean (default: false)
 */
router.get('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { includeAnswers } = req.query;
    
    const result = await getQuiz(
      quizId, 
      includeAnswers === 'true'
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('Get quiz API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quiz/stats/:resumeId/:skillName
 * Get skill statistics (average scores, improvement)
 */
router.get('/stats/:resumeId/:skillName', async (req, res) => {
  try {
    const { resumeId, skillName } = req.params;
    
    const result = await getSkillStats(resumeId, skillName);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Skill stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
