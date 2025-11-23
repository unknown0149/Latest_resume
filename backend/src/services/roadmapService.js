/**
 * Roadmap Generation Service
 * Creates 30/60/90 day learning roadmaps based on skill gaps and role requirements
 */

import { logger } from '../utils/logger.js';

/**
 * Generate a personalized 30/60/90 day roadmap
 */
export function generateRoadmap(skillsMissing, skillsHave, roleName) {
  try {
    // Prioritize skills by importance
    const requiredSkills = skillsMissing.filter(s => s.type === 'required');
    const preferredSkills = skillsMissing.filter(s => s.type === 'preferred');
    const highValueSkills = skillsMissing
      .filter(s => s.salaryBoost && s.priority > 60)
      .sort((a, b) => b.priority - a.priority);
    
    // Month 1 (Days 1-30): Foundation & Required Skills
    const month30 = {
      title: 'First 30 Days: Build Foundation',
      focus: 'Master core required skills and tools',
      goals: [],
      milestones: []
    };
    
    // Add top 3 required skills or high-priority skills
    const month1Skills = requiredSkills.length > 0 
      ? requiredSkills.slice(0, 3)
      : highValueSkills.slice(0, 3);
    
    month1Skills.forEach((skill, idx) => {
      month30.goals.push({
        id: `m1-${idx + 1}`,
        title: `Learn ${skill.skill} fundamentals`,
        description: `Complete beginner to intermediate ${skill.skill} courses and tutorials`,
        status: 'pending',
        priority: 'high',
        estimatedHours: 40,
        resources: [
          `${skill.skill} official documentation`,
          `Online course: ${skill.skill} for beginners`,
          `Practice exercises and coding challenges`
        ]
      });
    });
    
    month30.milestones.push({
      id: 'm1-milestone',
      title: 'Complete first project',
      description: `Build a small project using ${month1Skills.map(s => s.skill).join(', ')}`,
      dueDate: '30 days'
    });
    
    // Month 2 (Days 31-60): Intermediate Skills & Projects
    const month60 = {
      title: 'Days 31-60: Deepen Knowledge',
      focus: 'Apply skills in real projects and learn advanced concepts',
      goals: [],
      milestones: []
    };
    
    // Add next set of skills (mix of required and preferred)
    const month2Skills = [
      ...requiredSkills.slice(3, 5),
      ...preferredSkills.slice(0, 2)
    ].filter(Boolean).slice(0, 3);
    
    if (month2Skills.length === 0) {
      month2Skills.push(...highValueSkills.slice(3, 6));
    }
    
    month2Skills.forEach((skill, idx) => {
      month60.goals.push({
        id: `m2-${idx + 1}`,
        title: `Master ${skill.skill}`,
        description: `Build intermediate to advanced proficiency in ${skill.skill}`,
        status: 'pending',
        priority: 'high',
        estimatedHours: 50,
        resources: [
          `${skill.skill} advanced tutorials`,
          `Real-world project examples`,
          `Best practices and design patterns`
        ]
      });
    });
    
    month60.goals.push({
      id: 'm2-project',
      title: 'Portfolio project',
      description: 'Build a comprehensive project showcasing your new skills',
      status: 'pending',
      priority: 'high',
      estimatedHours: 60
    });
    
    month60.milestones.push({
      id: 'm2-milestone',
      title: 'Complete portfolio piece',
      description: 'Publish a production-ready project demonstrating your skills',
      dueDate: '60 days'
    });
    
    // Month 3 (Days 61-90): Polish & Job Preparation
    const month90 = {
      title: 'Days 61-90: Job Ready',
      focus: 'Polish portfolio, practice interviews, and apply to jobs',
      goals: [],
      milestones: []
    };
    
    // Add remaining preferred skills and job prep
    const month3Skills = preferredSkills.slice(2, 4);
    
    month3Skills.forEach((skill, idx) => {
      month90.goals.push({
        id: `m3-${idx + 1}`,
        title: `Learn ${skill.skill}`,
        description: `Add ${skill.skill} to enhance your skillset`,
        status: 'pending',
        priority: 'medium',
        estimatedHours: 30,
        resources: [
          `${skill.skill} quick start guide`,
          `Integration examples`,
          `Community resources`
        ]
      });
    });
    
    month90.goals.push(
      {
        id: 'm3-portfolio',
        title: 'Optimize portfolio',
        description: 'Polish GitHub profile, update LinkedIn, create resume website',
        status: 'pending',
        priority: 'high',
        estimatedHours: 20
      },
      {
        id: 'm3-interview',
        title: 'Interview preparation',
        description: 'Practice coding interviews, system design, and behavioral questions',
        status: 'pending',
        priority: 'high',
        estimatedHours: 40
      },
      {
        id: 'm3-apply',
        title: 'Job applications',
        description: `Apply to ${roleName} positions at target companies`,
        status: 'pending',
        priority: 'high',
        estimatedHours: 30
      }
    );
    
    month90.milestones.push(
      {
        id: 'm3-milestone-1',
        title: 'Portfolio complete',
        description: '3-5 production-ready projects showcasing all key skills',
        dueDate: '75 days'
      },
      {
        id: 'm3-milestone-2',
        title: 'Start interviewing',
        description: 'Schedule and complete first round of interviews',
        dueDate: '90 days'
      }
    );
    
    logger.info(`Generated roadmap for ${roleName} with ${month30.goals.length + month60.goals.length + month90.goals.length} total goals`);
    
    return {
      month30,
      month60,
      month90,
      totalGoals: month30.goals.length + month60.goals.length + month90.goals.length,
      estimatedTotalHours: calculateTotalHours(month30, month60, month90)
    };
    
  } catch (error) {
    logger.error('Roadmap generation failed:', error);
    return generateDefaultRoadmap();
  }
}

/**
 * Calculate total estimated hours
 */
function calculateTotalHours(month30, month60, month90) {
  const sum = (goals) => goals.reduce((total, goal) => total + (goal.estimatedHours || 0), 0);
  return sum(month30.goals) + sum(month60.goals) + sum(month90.goals);
}

/**
 * Generate a default roadmap when data is insufficient
 */
function generateDefaultRoadmap() {
  return {
    month30: {
      title: 'First 30 Days: Assess & Learn',
      focus: 'Identify skills gaps and start learning fundamentals',
      goals: [
        {
          id: 'm1-1',
          title: 'Complete skill assessment',
          description: 'Identify your current skill level and target role requirements',
          status: 'pending',
          priority: 'high',
          estimatedHours: 10
        },
        {
          id: 'm1-2',
          title: 'Start online courses',
          description: 'Enroll in courses for your target role',
          status: 'pending',
          priority: 'high',
          estimatedHours: 50
        }
      ],
      milestones: [
        {
          id: 'm1-milestone',
          title: 'Foundation established',
          description: 'Complete basic coursework and tutorials',
          dueDate: '30 days'
        }
      ]
    },
    month60: {
      title: 'Days 31-60: Build Projects',
      focus: 'Apply your knowledge through hands-on projects',
      goals: [
        {
          id: 'm2-1',
          title: 'Build first portfolio project',
          description: 'Create a project showcasing your new skills',
          status: 'pending',
          priority: 'high',
          estimatedHours: 60
        },
        {
          id: 'm2-2',
          title: 'Contribute to open source',
          description: 'Make contributions to relevant open source projects',
          status: 'pending',
          priority: 'medium',
          estimatedHours: 30
        }
      ],
      milestones: [
        {
          id: 'm2-milestone',
          title: 'Portfolio started',
          description: 'Have 2-3 projects on GitHub',
          dueDate: '60 days'
        }
      ]
    },
    month90: {
      title: 'Days 61-90: Job Ready',
      focus: 'Polish profile and start job applications',
      goals: [
        {
          id: 'm3-1',
          title: 'Optimize online presence',
          description: 'Update LinkedIn, GitHub, and personal website',
          status: 'pending',
          priority: 'high',
          estimatedHours: 20
        },
        {
          id: 'm3-2',
          title: 'Interview preparation',
          description: 'Practice technical and behavioral interviews',
          status: 'pending',
          priority: 'high',
          estimatedHours: 40
        },
        {
          id: 'm3-3',
          title: 'Apply to jobs',
          description: 'Submit applications to target companies',
          status: 'pending',
          priority: 'high',
          estimatedHours: 30
        }
      ],
      milestones: [
        {
          id: 'm3-milestone',
          title: 'Start interviewing',
          description: 'Complete first round of job interviews',
          dueDate: '90 days'
        }
      ]
    },
    totalGoals: 7,
    estimatedTotalHours: 240
  };
}

export default {
  generateRoadmap,
  generateDefaultRoadmap
};
