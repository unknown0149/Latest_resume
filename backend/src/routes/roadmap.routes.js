import express from 'express';
import { generateLearningResources } from '../services/aiRouter.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/roadmap/:skillName
 * Generate learning roadmap for a skill
 */
router.get('/roadmap/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;
    const { difficulty = 'Beginner' } = req.query;
    
    logger.info(`Generating roadmap for ${skillName} (${difficulty})`);
    
    const resources = await generateLearningResources(skillName, difficulty);
    
    res.json({
      success: true,
      skill: skillName,
      difficulty: difficulty,
      resources: resources,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Roadmap generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/roadmap/batch
 * Generate roadmaps for multiple skills
 */
router.post('/roadmap/batch', async (req, res) => {
  try {
    const { skills, difficulty = 'Beginner' } = req.body;
    
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        error: 'Skills array is required'
      });
    }
    
    logger.info(`Generating roadmaps for ${skills.length} skills`);
    
    const roadmaps = await Promise.all(
      skills.map(async (skill) => {
        try {
          const resources = await generateLearningResources(skill, difficulty);
          return {
            skill: skill,
            success: true,
            resources: resources
          };
        } catch (error) {
          return {
            skill: skill,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      difficulty: difficulty,
      roadmaps: roadmaps,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Batch roadmap generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;