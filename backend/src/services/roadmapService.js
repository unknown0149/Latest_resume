/**
 * Roadmap Generation Service
 * Creates 30/60/90 day learning roadmaps based on skill gaps and role requirements
 */

import { logger } from '../utils/logger.js';

const PHASE_CONFIG = {
  foundation: { idPrefix: 'm1', estimatedHours: 36, due: 'Day 30', label: 'First 30 Days: Build Foundation' },
  depth: { idPrefix: 'm2', estimatedHours: 48, due: 'Day 60', label: 'Days 31-60: Deepen Expertise' },
  polish: { idPrefix: 'm3', estimatedHours: 28, due: 'Day 90', label: 'Days 61-90: Job Ready' }
};

const PRIORITY_MAP = { 3: 'high', 2: 'medium', 1: 'low' };

const canonicalize = (skill) => (skill || '').toLowerCase().trim();

const parseImpact = (percentage) => {
  if (!percentage) return 0;
  const match = percentage.match(/(\d+)(?:-(\d+))?/);
  if (!match) return 0;
  const [, min, max] = match;
  return parseInt(max || min, 10);
};

const buildResources = (skill, actions = [], stage = 'foundation') => {
  const baseResources = [
    `${skill} official documentation` ,
    `${skill} ${stage === 'foundation' ? 'fundamentals' : stage === 'depth' ? 'project-based' : 'interview prep'} course (Udemy / Coursera)`,
    `GitHub: star a reference project built with ${skill}`
  ];

  const actionResources = actions
    .filter(Boolean)
    .map(action => action.replace(/^Why now:\s*/i, '').trim());

  return Array.from(new Set([...baseResources, ...actionResources])).slice(0, 4);
};

const buildGoal = (skill, stageConfig, stageKey) => {
  const { idPrefix, estimatedHours } = stageConfig;
  const plan = skill.plan;
  const leverage = skill.leverage;
  const priority = PRIORITY_MAP[skill.priority] || (skill.type === 'required' ? 'high' : 'medium');
  const slugBase = skill.canonical || canonicalize(skill.skill);
  const slug = `${idPrefix}-${slugBase}`
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || `${idPrefix}-${Math.random().toString(36).slice(2, 8)}`;

  let description = stageKey === 'foundation'
    ? `Establish strong ${skill.skill} fundamentals with guided learning sprints.`
    : stageKey === 'depth'
      ? `Apply ${skill.skill} in a production-style project and document best practices.`
      : `Polish advanced ${skill.skill} skills and package outcomes for interviews.`;

  if (plan?.actions?.length) {
    description += ` ${plan.actions[0]}`;
  }

  if (leverage?.skill) {
    description += ` Lean on your ${leverage.skill} (${leverage.level || 'existing experience'}) to ramp faster.`;
  }

  const timeline = plan?.timeframe || stageConfig.due;
  const actions = plan?.actions || [];

  return {
    id: slug,
    title: stageKey === 'foundation'
      ? `Build ${skill.skill} fundamentals`
      : stageKey === 'depth'
        ? `Ship ${skill.skill} project`
        : `Demonstrate ${skill.skill} expertise`,
    description: description.trim(),
    status: 'pending',
    priority,
    estimatedHours,
    resources: buildResources(skill.skill, actions, stageKey),
    timeline
  };
};

const buildMilestone = (id, title, description, dueDate) => ({ id, title, description, dueDate });

const enrichSkills = (skillsMissing = [], alignedRecommendations = [], careerPlan = []) => {
  const recommendationMap = new Map(alignedRecommendations.map(item => [canonicalize(item.targetSkill), item]));
  const planMap = new Map(careerPlan.map(item => [canonicalize(item.skill), item]));

  return skillsMissing.map(skill => {
    const canonicalSkill = canonicalize(skill.skill);
    const plan = planMap.get(canonicalSkill);
    const aligned = recommendationMap.get(canonicalSkill);
    const leverage = plan?.leverage || aligned?.alignedWith?.[0] || null;
    const salaryImpactScore = parseImpact(skill.salaryBoost?.percentage || skill.salaryBoost?.impact?.percentage);
    const priorityWeight = (skill.priority || 1) * 60 + (skill.type === 'required' ? 40 : 10);
    const leverageScore = leverage ? (leverage.proficiency || 0) : 0;

    return {
      ...skill,
      canonical: canonicalSkill || `skill-${Math.random().toString(36).slice(2)}`,
      plan,
      aligned,
      leverage,
      score: priorityWeight + salaryImpactScore + leverageScore,
    };
  }).sort((a, b) => b.score - a.score);
};

const buildFocus = (skills, fallback, roleName) => {
  if (!skills || skills.length === 0) return fallback;
  const list = skills.map(s => s.skill).join(', ');
  return `Close gaps in ${list} to accelerate readiness for ${roleName} opportunities.`;
};

export function generateRoadmap(skillsMissing, skillsHave, roleName, options = {}) {
  try {
    const {
      alignedRecommendations = [],
      careerPlan = [],
      strengths = [],
      watsonAdvice = ''
    } = options;

    if (!Array.isArray(skillsMissing) || skillsMissing.length === 0) {
      logger.warn('No missing skills found, using default roadmap');
      return generateDefaultRoadmap();
    }

    const enriched = enrichSkills(skillsMissing, alignedRecommendations, careerPlan);

    const foundationSkills = enriched.slice(0, Math.min(3, enriched.length));
    const depthSkills = enriched.slice(foundationSkills.length, foundationSkills.length + Math.min(3, enriched.length - foundationSkills.length));
    const polishSkills = enriched.slice(foundationSkills.length + depthSkills.length, foundationSkills.length + depthSkills.length + Math.min(3, enriched.length - foundationSkills.length - depthSkills.length));

    const topStrengths = (strengths && strengths.length ? strengths : skillsHave)
      .filter(s => (s.proficiency || 0) >= 65)
      .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
      .slice(0, 2);

    const month30 = {
      title: PHASE_CONFIG.foundation.label,
      focus: buildFocus(foundationSkills, `Master core ${roleName} skills and tools`, roleName),
      goals: foundationSkills.map(skill => buildGoal(skill, PHASE_CONFIG.foundation, 'foundation')),
      milestones: foundationSkills.length ? [
        buildMilestone(
          'm1-milestone',
          'Ship a fundamentals project',
          `Deliver a mini-project demonstrating ${foundationSkills.map(s => s.skill).join(', ')} basics`,
          careerPlan.find(plan => canonicalize(plan.skill) === foundationSkills[0]?.canonical)?.timeframe || PHASE_CONFIG.foundation.due
        )
      ] : []
    };

    const month60Goals = depthSkills.map(skill => buildGoal(skill, PHASE_CONFIG.depth, 'depth'));
    if (month60Goals.length === 0 && enriched.length > foundationSkills.length) {
      const fallbackSkill = enriched[foundationSkills.length];
      month60Goals.push(buildGoal(fallbackSkill, PHASE_CONFIG.depth, 'depth'));
    }
    month60Goals.push({
      id: `${PHASE_CONFIG.depth.idPrefix}-capstone`,
      title: 'Build a production-style capstone',
      description: `Create a portfolio-ready project combining ${[...foundationSkills, ...depthSkills].map(s => s.skill).slice(0, 4).join(', ')}`,
      status: 'pending',
      priority: 'high',
      estimatedHours: 60,
      resources: buildResources('Capstone', depthSkills.map(skill => skill.plan?.actions?.[1]).filter(Boolean), 'depth')
    });

    const month60 = {
      title: PHASE_CONFIG.depth.label,
      focus: depthSkills.length
        ? `Apply ${depthSkills.map(s => s.skill).join(', ')} in production-style projects`
        : 'Scale from fundamentals into intermediate project work',
      goals: month60Goals,
      milestones: [
        buildMilestone(
          'm2-milestone',
          'Publish your capstone',
          'Deploy and document a project that you can reference in interviews',
          PHASE_CONFIG.depth.due
        )
      ]
    };

    const month90Goals = polishSkills.map(skill => buildGoal(skill, PHASE_CONFIG.polish, 'polish'));
    if (month90Goals.length === 0) {
      polishSkills.push(...enriched.slice(foundationSkills.length + depthSkills.length, foundationSkills.length + depthSkills.length + 1));
      if (polishSkills[0]) {
        month90Goals.push(buildGoal(polishSkills[0], PHASE_CONFIG.polish, 'polish'));
      }
    }

    month90Goals.push(
      {
        id: `${PHASE_CONFIG.polish.idPrefix}-portfolio`,
        title: 'Polish portfolio and narrative',
        description: topStrengths.length
          ? `Highlight projects using ${topStrengths.map(s => s.skill).join(' & ')} and align stories to ${roleName} interviews.`
          : `Curate your top 3 projects and craft STAR stories tailored to ${roleName} interviews.`,
        status: 'pending',
        priority: 'high',
        estimatedHours: 24,
        resources: [
          'Refresh LinkedIn & GitHub showcase',
          'Document project case studies',
          'Schedule peer review of portfolio'
        ]
      },
      {
        id: `${PHASE_CONFIG.polish.idPrefix}-interviews`,
        title: 'Interview prep sprints',
        description: 'Run weekly mock interviews (technical + behavioral) and refine system design playbook.',
        status: 'pending',
        priority: 'high',
        estimatedHours: 32,
        resources: [
          'LeetCode / HackerRank weekly plan',
          'System design frameworks (Grokking, Exponent)',
          'Behavioral question bank'
        ]
      },
      {
        id: `${PHASE_CONFIG.polish.idPrefix}-applications`,
        title: 'Targeted job outreach',
        description: `Apply to curated ${roleName} roles and network with 2-3 managers per week.`,
        status: 'pending',
        priority: 'high',
        estimatedHours: 18,
        resources: [
          'Create a personalized outreach template',
          'Track applications in Notion / Airtable'
        ]
      }
    );

    const month90 = {
      title: PHASE_CONFIG.polish.label,
      focus: polishSkills.length
        ? `Translate ${polishSkills.map(s => s.skill).join(', ')} into interview-ready stories`
        : 'Consolidate wins, polish personal brand, and move into interviews',
      goals: month90Goals,
      milestones: [
        buildMilestone('m3-milestone-1', 'Portfolio narrative locked', 'Have 3 story-driven projects ready for interviews', 'Day 75'),
        buildMilestone('m3-milestone-2', 'Begin interview loop', 'Complete first round of interviews with target companies', 'Day 90')
      ]
    };

    const totalGoals = month30.goals.length + month60.goals.length + month90.goals.length;
    const estimatedTotalHours = calculateTotalHours(month30, month60, month90);

    logger.info(`Generated roadmap for ${roleName}: ${totalGoals} goals, ${estimatedTotalHours} hrs`);

    return {
      month30,
      month60,
      month90,
      totalGoals,
      estimatedTotalHours,
      narrative: watsonAdvice || ''
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
