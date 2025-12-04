/**
 * Salary Boost Skills Database
 * Maps high-value skills to their market impact and salary boost potential
 * Used for recommending skills that can increase earning potential
 */

export const salaryBoostSkills = [
  // Cloud & Infrastructure - Highest Impact
  {
    skill: 'AWS',
    impact: {
      percentage: '20-30%',
      absoluteUSD: { min: 15000, max: 40000 }
    },
    demandLevel: 'Very High',
    category: 'Cloud',
    reasoning: 'AWS is the leading cloud platform with highest adoption. Critical for modern infrastructure.',
  },
  {
    skill: 'Kubernetes',
    impact: {
      percentage: '25-35%',
      absoluteUSD: { min: 20000, max: 50000 }
    },
    demandLevel: 'Very High',
    category: 'DevOps',
    reasoning: 'Container orchestration is essential for scalable applications. High demand, limited supply.',
  },
  {
    skill: 'Terraform',
    impact: {
      percentage: '20-25%',
      absoluteUSD: { min: 15000, max: 35000 }
    },
    demandLevel: 'High',
    category: 'DevOps',
    reasoning: 'Infrastructure as Code is critical for cloud deployments. Growing adoption.',
  },
  
  // Architecture & Design - High Impact
  {
    skill: 'Microservices',
    impact: {
      percentage: '30-40%',
      absoluteUSD: { min: 25000, max: 60000 }
    },
    demandLevel: 'Very High',
    category: 'Architecture',
    reasoning: 'Modern architecture pattern. Companies pay premium for microservices expertise.',
  },
  {
    skill: 'System Design',
    impact: {
      percentage: '35-45%',
      absoluteUSD: { min: 30000, max: 70000 }
    },
    demandLevel: 'Very High',
    category: 'Architecture',
    reasoning: 'Critical for senior roles. Differentiates mid from senior engineers.',
  },
  
  // AI/ML - Premium Skills
  {
    skill: 'Machine Learning',
    impact: {
      percentage: '40-50%',
      absoluteUSD: { min: 35000, max: 80000 }
    },
    demandLevel: 'Very High',
    category: 'AI/ML',
    reasoning: 'AI/ML engineers command top salaries. High demand across industries.',
  },
  {
    skill: 'Deep Learning',
    impact: {
      percentage: '45-55%',
      absoluteUSD: { min: 40000, max: 90000 }
    },
    demandLevel: 'Very High',
    category: 'AI/ML',
    reasoning: 'Specialized AI skill. Critical for computer vision, NLP, and advanced AI applications.',
  },
  {
    skill: 'TensorFlow',
    impact: {
      percentage: '35-45%',
      absoluteUSD: { min: 30000, max: 70000 }
    },
    demandLevel: 'High',
    category: 'AI/ML',
    reasoning: 'Leading ML framework. Essential for production ML systems.',
  },
  {
    skill: 'PyTorch',
    impact: {
      percentage: '35-45%',
      absoluteUSD: { min: 30000, max: 70000 }
    },
    demandLevel: 'High',
    category: 'AI/ML',
    reasoning: 'Preferred for research and increasingly for production. High growth.',
  },
  
  // Containers & DevOps
  {
    skill: 'Docker',
    impact: {
      percentage: '15-20%',
      absoluteUSD: { min: 10000, max: 25000 }
    },
    demandLevel: 'High',
    category: 'DevOps',
    reasoning: 'Industry standard for containerization. Expected skill for modern development.',
  },
  {
    skill: 'CI/CD',
    impact: {
      percentage: '18-25%',
      absoluteUSD: { min: 12000, max: 30000 }
    },
    demandLevel: 'High',
    category: 'DevOps',
    reasoning: 'Essential for modern development workflows. Reduces time-to-market.',
  },
  
  // Cloud Platforms
  {
    skill: 'Azure',
    impact: {
      percentage: '18-28%',
      absoluteUSD: { min: 13000, max: 35000 }
    },
    demandLevel: 'High',
    category: 'Cloud',
    reasoning: 'Second-largest cloud platform. Strong enterprise adoption.',
  },
  {
    skill: 'GCP',
    impact: {
      percentage: '18-25%',
      absoluteUSD: { min: 12000, max: 32000 }
    },
    demandLevel: 'Medium-High',
    category: 'Cloud',
    reasoning: 'Google Cloud growing rapidly. Strong for data and ML workloads.',
  },
  
  // Backend & Frameworks
  {
    skill: 'Spring Boot',
    impact: {
      percentage: '15-22%',
      absoluteUSD: { min: 10000, max: 28000 }
    },
    demandLevel: 'High',
    category: 'Backend',
    reasoning: 'Leading Java framework. High demand in enterprise.',
  },
  {
    skill: 'Node.js',
    impact: {
      percentage: '12-18%',
      absoluteUSD: { min: 8000, max: 22000 }
    },
    demandLevel: 'High',
    category: 'Backend',
    reasoning: 'JavaScript on backend. Popular for startups and full-stack development.',
  },
  
  // Frontend
  {
    skill: 'React',
    impact: {
      percentage: '10-15%',
      absoluteUSD: { min: 7000, max: 18000 }
    },
    demandLevel: 'Very High',
    category: 'Frontend',
    reasoning: 'Most popular frontend framework. High demand across company sizes.',
  },
  {
    skill: 'TypeScript',
    impact: {
      percentage: '12-18%',
      absoluteUSD: { min: 8000, max: 22000 }
    },
    demandLevel: 'High',
    category: 'Frontend',
    reasoning: 'Type safety for JavaScript. Increasingly required for production apps.',
  },
  {
    skill: 'Next.js',
    impact: {
      percentage: '15-20%',
      absoluteUSD: { min: 10000, max: 25000 }
    },
    demandLevel: 'Medium-High',
    category: 'Frontend',
    reasoning: 'React framework with SSR. Growing adoption for performance-critical apps.',
  },
  
  // Mobile
  {
    skill: 'React Native',
    impact: {
      percentage: '18-25%',
      absoluteUSD: { min: 12000, max: 30000 }
    },
    demandLevel: 'High',
    category: 'Mobile',
    reasoning: 'Cross-platform mobile development. Reduces development cost.',
  },
  {
    skill: 'Flutter',
    impact: {
      percentage: '18-25%',
      absoluteUSD: { min: 12000, max: 30000 }
    },
    demandLevel: 'Medium-High',
    category: 'Mobile',
    reasoning: 'Google\'s cross-platform framework. Growing rapidly.',
  },
  
  // Data & Databases
  {
    skill: 'PostgreSQL',
    impact: {
      percentage: '10-15%',
      absoluteUSD: { min: 7000, max: 18000 }
    },
    demandLevel: 'High',
    category: 'Database',
    reasoning: 'Leading open-source relational database. Preferred over MySQL.',
  },
  {
    skill: 'MongoDB',
    impact: {
      percentage: '12-18%',
      absoluteUSD: { min: 8000, max: 22000 }
    },
    demandLevel: 'High',
    category: 'Database',
    reasoning: 'Leading NoSQL database. Essential for modern web applications.',
  },
  {
    skill: 'Redis',
    impact: {
      percentage: '15-20%',
      absoluteUSD: { min: 10000, max: 25000 }
    },
    demandLevel: 'Medium-High',
    category: 'Database',
    reasoning: 'In-memory caching and data store. Critical for performance optimization.',
  },
  
  // Big Data
  {
    skill: 'Apache Spark',
    impact: {
      percentage: '30-40%',
      absoluteUSD: { min: 25000, max: 60000 }
    },
    demandLevel: 'Medium-High',
    category: 'Big Data',
    reasoning: 'Distributed data processing. Essential for big data engineering.',
  },
  {
    skill: 'Kafka',
    impact: {
      percentage: '25-35%',
      absoluteUSD: { min: 20000, max: 50000 }
    },
    demandLevel: 'High',
    category: 'Big Data',
    reasoning: 'Event streaming platform. Critical for real-time data pipelines.',
  },
  
  // Security
  {
    skill: 'Security',
    impact: {
      percentage: '25-35%',
      absoluteUSD: { min: 20000, max: 50000 }
    },
    demandLevel: 'Very High',
    category: 'Security',
    reasoning: 'Growing security threats. High demand for security expertise.',
  },
];

/**
 * Get salary boost info for a specific skill
 * @param {string} skillName - Skill name
 * @returns {Object|null} - Salary boost info or null
 */
export const getSalaryBoostForSkill = (skillName) => {
  return salaryBoostSkills.find(
    s => s.skill.toLowerCase() === skillName.toLowerCase()
  ) || null;
};

/**
 * Get top salary boost opportunities from missing skills
 * @param {string[]} missingSkills - Skills user doesn't have
 * @param {number} limit - Maximum recommendations
 * @returns {Array} - Top boost skills sorted by impact
 */
export const getTopSalaryBoostOpportunities = (missingSkills, limit = 5) => {
  const opportunities = missingSkills
    .map(skill => getSalaryBoostForSkill(skill))
    .filter(boost => boost !== null)
    .sort((a, b) => {
      // Sort by impact percentage (parse the range and use max)
      const getMaxImpact = (percentStr) => {
        const match = percentStr.match(/(\d+)-(\d+)%/);
        return match ? parseInt(match[2]) : 0;
      };
      return getMaxImpact(b.impact.percentage) - getMaxImpact(a.impact.percentage);
    });
  
  return opportunities.slice(0, limit);
};

/**
 * Calculate potential salary increase
 * @param {number} currentSalary - Current salary
 * @param {string[]} skillsToLearn - Skills to learn
 * @param {string} currency - Preferred currency code (defaults to USD; falls back to USD when unavailable)
 * @returns {Object} - Estimated increase info
 */
export const calculatePotentialIncrease = (currentSalary, skillsToLearn, currency = 'USD') => {
  let totalPercentageMin = 0;
  let totalPercentageMax = 0;
  let totalAbsoluteMin = 0;
  let totalAbsoluteMax = 0;
  const requestedCurrency = (currency || 'USD').toUpperCase();
  
  const boosts = skillsToLearn.map(skill => getSalaryBoostForSkill(skill)).filter(b => b);
  
  for (const boost of boosts) {
    // Parse percentage range
    const match = boost.impact.percentage.match(/(\d+)-(\d+)%/);
    if (match) {
      totalPercentageMin += parseInt(match[1]);
      totalPercentageMax += parseInt(match[2]);
    }
    
    // Add absolute values
    const absoluteRange = boost.impact[`absolute${requestedCurrency}`] || boost.impact.absoluteUSD;
    if (absoluteRange) {
      totalAbsoluteMin += absoluteRange.min;
      totalAbsoluteMax += absoluteRange.max;
    }
  }
  
  // Calculate estimate (cap percentage at 100%)
  const percentageMin = Math.min(totalPercentageMin, 100);
  const percentageMax = Math.min(totalPercentageMax, 100);
  
  const percentageIncrease = {
    min: currentSalary * (percentageMin / 100),
    max: currentSalary * (percentageMax / 100),
  };
  
  const estimatedIncrease = {
    min: Math.max(percentageIncrease.min, totalAbsoluteMin),
    max: Math.max(percentageIncrease.max, totalAbsoluteMax),
  };
  
  return {
    currentSalary,
    currency: boosts.every(boost => boost.impact[`absolute${requestedCurrency}`])
      ? requestedCurrency
      : 'USD',
    percentageRange: `${percentageMin}-${percentageMax}%`,
    estimatedIncrease,
    newSalaryRange: {
      min: currentSalary + estimatedIncrease.min,
      max: currentSalary + estimatedIncrease.max,
    },
    skillsConsidered: boosts.map(b => b.skill),
  };
};

export default {
  salaryBoostSkills,
  getSalaryBoostForSkill,
  getTopSalaryBoostOpportunities,
  calculatePotentialIncrease,
};
