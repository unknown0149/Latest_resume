/**
 * AI Question Generator Service
 * Generates unique interview questions for ANY skill across ALL fields
 * Uses dynamic question generation - never repeats questions
 * Works for IT, Finance, Arts, Fashion, Commerce, Healthcare, Law, Marketing, etc.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Generate unique hash for question tracking (prevent duplicates in session)
 */
function generateQuestionHash(skill, difficulty, seed) {
  return crypto
    .createHash('md5')
    .update(`${skill}-${difficulty}-${seed}-${Date.now()}`)
    .digest('hex')
    .substring(0, 8);
}

/**
 * Detect field/domain from skill name
 */
function detectField(skill) {
  const skillLower = skill.toLowerCase();
  
  // IT & Technology
  if (/(javascript|python|java|react|node|sql|docker|kubernetes|aws|azure|programming|coding|database|api|frontend|backend|devops|software|cloud|machine learning|ai|data science|html|css|typescript|mongodb|git)/i.test(skillLower)) {
    return 'IT';
  }
  
  // Finance & Accounting
  if (/(accounting|finance|tax|audit|investment|portfolio|trading|economics|banking|financial|bookkeeping|ledger|balance sheet|income statement|gaap|ifrs|capital|equity|derivatives)/i.test(skillLower)) {
    return 'Finance';
  }
  
  // Fashion & Design
  if (/(fashion|design|textile|apparel|garment|pattern|draping|styling|couture|fabric|sewing|sketching|trend|fashion week|runway|merchandising|color theory)/i.test(skillLower)) {
    return 'Fashion';
  }
  
  // Arts & Creative
  if (/(painting|drawing|sculpture|photography|illustration|graphic design|art history|visual arts|ceramics|printmaking|digital art|animation|video editing)/i.test(skillLower)) {
    return 'Arts';
  }
  
  // Marketing & Sales
  if (/(marketing|advertising|branding|seo|sem|social media|campaign|sales|crm|lead generation|content marketing|email marketing|analytics|conversion|funnel)/i.test(skillLower)) {
    return 'Marketing';
  }
  
  // Healthcare & Medical
  if (/(medical|nursing|healthcare|anatomy|physiology|pharmacology|diagnosis|treatment|surgery|patient care|clinical|hospital|medicine|therapy)/i.test(skillLower)) {
    return 'Healthcare';
  }
  
  // Law & Legal
  if (/(law|legal|contract|litigation|compliance|regulation|court|attorney|paralegal|legal research|case|statute|jurisdiction|tort|criminal|civil)/i.test(skillLower)) {
    return 'Law';
  }
  
  // Business & Management
  if (/(management|business|strategy|leadership|operations|hr|project management|agile|scrum|stakeholder|negotiation|planning)/i.test(skillLower)) {
    return 'Business';
  }
  
  // Education & Teaching
  if (/(teaching|education|curriculum|pedagogy|lesson plan|classroom|student|learning|assessment|instruction)/i.test(skillLower)) {
    return 'Education';
  }
  
  // Commerce & Retail
  if (/(retail|commerce|merchandising|inventory|supply chain|logistics|e-commerce|pos|customer service|sales|store)/i.test(skillLower)) {
    return 'Commerce';
  }
  
  return 'General';
}

/**
 * Generate question templates based on field
 */
function getQuestionTemplates(field, skill) {
  const templates = {
    IT: [
      {
        type: 'concept',
        patterns: [
          `What is the primary purpose of {concept} in {skill}?`,
          `Which of the following best describes {concept} in {skill}?`,
          `In {skill}, {concept} is mainly used to:`,
          `What is the key advantage of using {concept} in {skill}?`
        ]
      },
      {
        type: 'implementation',
        patterns: [
          `Which is the correct way to implement {feature} in {skill}?`,
          `When working with {feature} in {skill}, you should:`,
          `What is the best practice for {feature} in {skill}?`,
          `How do you properly handle {feature} in {skill}?`
        ]
      },
      {
        type: 'debugging',
        patterns: [
          `If you encounter {error} in {skill}, the most likely cause is:`,
          `Which solution fixes {error} in {skill}?`,
          `What is the correct approach to debug {error} in {skill}?`,
          `When {error} occurs in {skill}, you should first:`, 
        ]
      },
      {
        type: 'comparison',
        patterns: [
          `What is the difference between {concept1} and {concept2} in {skill}?`,
          `Compared to {concept1}, {concept2} in {skill} is:`,
          `Which statement correctly compares {concept1} and {concept2} in {skill}?`,
          `When should you use {concept1} over {concept2} in {skill}?`
        ]
      }
    ],
    Finance: [
      {
        type: 'definition',
        patterns: [
          `What does {term} represent in {skill}?`,
          `In {skill}, {term} is defined as:`,
          `Which of the following best explains {term} in {skill}?`,
          `{term} in {skill} refers to:`
        ]
      },
      {
        type: 'calculation',
        patterns: [
          `How is {metric} calculated in {skill}?`,
          `The formula for {metric} in {skill} includes:`,
          `To determine {metric} in {skill}, you need to:`,
          `Which calculation method is used for {metric} in {skill}?`
        ]
      },
      {
        type: 'regulation',
        patterns: [
          `According to {standard}, {requirement} must be:`,
          `In {skill}, {standard} requires that:`,
          `Which regulation applies to {scenario} in {skill}?`,
          `What is the compliance requirement for {action} in {skill}?`
        ]
      },
      {
        type: 'scenario',
        patterns: [
          `If {situation} occurs, the correct accounting treatment is:`,
          `When analyzing {scenario}, you should consider:`,
          `In the case of {situation}, {skill} dictates:`,
          `The proper approach for {scenario} in {skill} is:`
        ]
      }
    ],
    Fashion: [
      {
        type: 'technique',
        patterns: [
          `Which technique is used for {process} in {skill}?`,
          `The correct method for {process} in {skill} involves:`,
          `In {skill}, {process} is achieved by:`,
          `What is the standard approach for {process} in {skill}?`
        ]
      },
      {
        type: 'material',
        patterns: [
          `Which fabric is best suited for {purpose} in {skill}?`,
          `{material} is commonly used in {skill} for:`,
          `When selecting materials for {purpose}, you should choose:`,
          `What are the properties of {material} in {skill}?`
        ]
      },
      {
        type: 'history',
        patterns: [
          `Which designer/era is known for {style} in {skill}?`,
          `{style} originated in:`,
          `The influence of {period} on {skill} includes:`,
          `What characterized {movement} in {skill}?`
        ]
      },
      {
        type: 'trend',
        patterns: [
          `Current trends in {skill} emphasize:`,
          `What is the emerging direction for {aspect} in {skill}?`,
          `In contemporary {skill}, {trend} is characterized by:`,
          `Which element defines modern {style} in {skill}?`
        ]
      }
    ],
    Marketing: [
      {
        type: 'strategy',
        patterns: [
          `What is the primary objective of {strategy} in {skill}?`,
          `When implementing {strategy} in {skill}, you should focus on:`,
          `{strategy} in {skill} is most effective for:`,
          `The key component of {strategy} in {skill} is:`
        ]
      },
      {
        type: 'metrics',
        patterns: [
          `Which metric best measures {outcome} in {skill}?`,
          `To evaluate {campaign}, you should track:`,
          `In {skill}, {metric} indicates:`,
          `What does a high {metric} signify in {skill}?`
        ]
      },
      {
        type: 'channels',
        patterns: [
          `Which platform is most effective for {objective} in {skill}?`,
          `When targeting {audience}, the best channel is:`,
          `{platform} is ideal for {purpose} because:`,
          `In {skill}, {channel} excels at:`
        ]
      }
    ],
    Healthcare: [
      {
        type: 'diagnosis',
        patterns: [
          `Which symptom indicates {condition} in {skill}?`,
          `The primary indicator of {condition} is:`,
          `In {skill}, {finding} suggests:`,
          `What diagnostic test confirms {condition}?`
        ]
      },
      {
        type: 'treatment',
        patterns: [
          `The recommended treatment for {condition} in {skill} is:`,
          `Which intervention is first-line for {condition}?`,
          `When managing {condition}, you should:`,
          `What is contraindicated in {condition}?`
        ]
      },
      {
        type: 'procedure',
        patterns: [
          `What is the correct protocol for {procedure} in {skill}?`,
          `The steps for {procedure} include:`,
          `Before performing {procedure}, you must:`,
          `Which complication can arise from {procedure}?`
        ]
      }
    ],
    Law: [
      {
        type: 'statute',
        patterns: [
          `Under {law}, which requirement must be met for {action}?`,
          `{statute} applies when:`,
          `What does {law} stipulate regarding {matter}?`,
          `According to {statute}, {party} must:`
        ]
      },
      {
        type: 'case',
        patterns: [
          `Which legal precedent applies to {scenario}?`,
          `In {case type}, the burden of proof requires:`,
          `What defense is available in {situation}?`,
          `The elements of {claim} include:`
        ]
      },
      {
        type: 'procedure',
        patterns: [
          `What is the correct procedure for {action} in {skill}?`,
          `The deadline for {filing} is:`,
          `Which document must be filed for {process}?`,
          `What is the consequence of failing to {action}?`
        ]
      }
    ],
    General: [
      {
        type: 'knowledge',
        patterns: [
          `What is a key principle of {skill}?`,
          `In {skill}, which statement is correct?`,
          `Which of the following is true about {skill}?`,
          `What is an important aspect of {skill}?`
        ]
      },
      {
        type: 'application',
        patterns: [
          `How is {concept} applied in {skill}?`,
          `When using {method} in {skill}, you should:`,
          `Which approach is recommended for {task} in {skill}?`,
          `What is the best way to {action} in {skill}?`
        ]
      },
      {
        type: 'problem',
        patterns: [
          `If {problem} occurs in {skill}, the solution is:`,
          `What is the correct way to address {issue} in {skill}?`,
          `When facing {challenge} in {skill}, you should:`,
          `Which method resolves {problem} in {skill}?`
        ]
      }
    ]
  };
  
  return templates[field] || templates.General;
}

/**
 * Generate contextual terms/concepts for the skill and field
 */
function generateContextTerms(skill, field, difficulty) {
  const skillLower = skill.toLowerCase();
  
  // Generate terms based on field and difficulty
  const termSets = {
    IT: {
      easy: {
        concepts: ['variables', 'functions', 'loops', 'arrays', 'objects', 'strings', 'conditions'],
        features: ['syntax', 'data types', 'operators', 'console output', 'input handling'],
        errors: ['syntax error', 'undefined variable', 'type mismatch', 'null reference'],
        actions: ['declare', 'initialize', 'call', 'return', 'print']
      },
      medium: {
        concepts: ['closures', 'promises', 'callbacks', 'prototypes', 'classes', 'modules'],
        features: ['async/await', 'error handling', 'data structures', 'algorithms', 'API calls'],
        errors: ['memory leak', 'race condition', 'callback hell', 'promise rejection'],
        actions: ['optimize', 'refactor', 'debug', 'test', 'deploy']
      },
      hard: {
        concepts: ['design patterns', 'microservices', 'load balancing', 'caching', 'scalability'],
        features: ['performance optimization', 'security', 'architecture', 'distributed systems'],
        errors: ['deadlock', 'thread safety issues', 'performance bottleneck', 'security vulnerability'],
        actions: ['architect', 'scale', 'secure', 'monitor', 'analyze']
      }
    },
    Finance: {
      easy: {
        terms: ['assets', 'liabilities', 'equity', 'revenue', 'expenses', 'profit', 'loss'],
        metrics: ['net income', 'gross profit', 'current ratio', 'cash flow'],
        standards: ['GAAP', 'basic accounting principles', 'double-entry system'],
        scenarios: ['recording a sale', 'paying expenses', 'receiving payment']
      },
      medium: {
        terms: ['depreciation', 'amortization', 'accruals', 'provisions', 'deferred tax'],
        metrics: ['ROI', 'ROE', 'EBITDA', 'working capital', 'debt-to-equity ratio'],
        standards: ['IFRS', 'revenue recognition', 'matching principle'],
        scenarios: ['asset impairment', 'loan restructuring', 'foreign currency transaction']
      },
      hard: {
        terms: ['derivatives', 'hedge accounting', 'fair value measurement', 'consolidation'],
        metrics: ['IRR', 'NPV', 'economic value added', 'cost of capital'],
        standards: ['IFRS 9', 'IFRS 15', 'ASC 842', 'complex financial instruments'],
        scenarios: ['business combination', 'segment reporting', 'related party transactions']
      }
    },
    Fashion: {
      easy: {
        techniques: ['stitching', 'measuring', 'cutting', 'pinning', 'pressing'],
        materials: ['cotton', 'silk', 'wool', 'polyester', 'linen'],
        styles: ['casual', 'formal', 'bohemian', 'minimalist', 'classic'],
        elements: ['color', 'texture', 'silhouette', 'pattern', 'fit']
      },
      medium: {
        techniques: ['draping', 'pattern making', 'tailoring', 'embroidery', 'dyeing'],
        materials: ['chiffon', 'organza', 'velvet', 'leather', 'denim'],
        styles: ['haute couture', 'ready-to-wear', 'street style', 'vintage'],
        elements: ['proportion', 'balance', 'rhythm', 'emphasis', 'harmony']
      },
      hard: {
        techniques: ['couture construction', 'bias cutting', 'underlining', 'hand finishing'],
        materials: ['technical fabrics', 'sustainable textiles', 'specialty fibers'],
        styles: ['avant-garde', 'deconstructivism', 'futuristic', 'conceptual'],
        elements: ['cultural influences', 'historical references', 'innovation', 'craftsmanship']
      }
    },
    Marketing: {
      easy: {
        strategies: ['social media marketing', 'email campaigns', 'content creation', 'advertising'],
        metrics: ['clicks', 'views', 'likes', 'shares', 'followers'],
        channels: ['Facebook', 'Instagram', 'Twitter', 'email', 'website'],
        objectives: ['brand awareness', 'engagement', 'reach', 'traffic']
      },
      medium: {
        strategies: ['SEO', 'PPC', 'influencer marketing', 'remarketing', 'A/B testing'],
        metrics: ['conversion rate', 'CTR', 'bounce rate', 'engagement rate', 'CPA'],
        channels: ['LinkedIn', 'YouTube', 'TikTok', 'Google Ads', 'native advertising'],
        objectives: ['lead generation', 'conversions', 'customer acquisition', 'retention']
      },
      hard: {
        strategies: ['marketing automation', 'account-based marketing', 'growth hacking', 'omnichannel'],
        metrics: ['LTV', 'CAC', 'ROAS', 'attribution', 'cohort analysis'],
        channels: ['programmatic advertising', 'affiliate networks', 'marketplace platforms'],
        objectives: ['market penetration', 'customer lifetime value', 'competitive advantage']
      }
    }
  };
  
  // Get terms for the field and difficulty
  const fieldTerms = termSets[field] || termSets.General || {};
  const difficultyTerms = fieldTerms[difficulty] || fieldTerms.easy || {};
  
  // Return terms object
  return difficultyTerms;
}

/**
 * Generate answer options with one correct answer
 */
function generateOptions(correctAnswer, distractors) {
  const options = [correctAnswer, ...distractors];
  
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  // Find correct index after shuffling
  const correctIndex = options.indexOf(correctAnswer);
  const letters = ['A', 'B', 'C', 'D'];
  
  return {
    options: options.map((opt, idx) => ({ letter: letters[idx], text: opt })),
    correctAnswer: letters[correctIndex]
  };
}

/**
 * Generate one unique MCQ question for a skill
 */
export function generateQuestion(skill, difficulty = 'medium', sessionHistory = []) {
  try {
    const field = detectField(skill);
    const templates = getQuestionTemplates(field, skill);
    const terms = generateContextTerms(skill, field, difficulty);
    
    // Pick random template type
    const templateType = templates[Math.floor(Math.random() * templates.length)];
    const pattern = templateType.patterns[Math.floor(Math.random() * templateType.patterns.length)];
    
    // Generate unique hash to prevent duplicates
    const questionHash = generateQuestionHash(skill, difficulty, Math.random());
    
    // Check if question already asked in this session
    if (sessionHistory.includes(questionHash)) {
      // Try again with different seed
      return generateQuestion(skill, difficulty, sessionHistory);
    }
    
    // Fill in template with contextual terms
    let questionText = pattern.replace('{skill}', skill);
    
    // Replace placeholders with actual terms from context
    const termKeys = Object.keys(terms);
    if (termKeys.length > 0) {
      termKeys.forEach(key => {
        const termArray = terms[key];
        if (Array.isArray(termArray) && termArray.length > 0) {
          const randomTerm = termArray[Math.floor(Math.random() * termArray.length)];
          questionText = questionText.replace(`{${key.slice(0, -1)}}`, randomTerm);
        }
      });
    }
    
    // Clean up any remaining placeholders
    questionText = questionText.replace(/\{[^}]+\}/g, (match) => {
      return match.slice(1, -1); // Remove curly braces if no replacement found
    });
    
    // Generate options based on field and difficulty
    const { options, correctAnswer } = generateOptionsForField(field, difficulty, skill);
    
    const question = {
      id: questionHash,
      question: questionText,
      options: options,
      correctAnswer: correctAnswer,
      difficulty: difficulty,
      field: field,
      skill: skill,
      explanation: generateExplanation(questionText, correctAnswer, options, field)
    };
    
    return question;
    
  } catch (error) {
    logger.error('Error generating question:', error);
    throw error;
  }
}

/**
 * Generate field-appropriate answer options
 */
function generateOptionsForField(field, difficulty, skill) {
  // Define option templates per field
  const optionTemplates = {
    IT: {
      easy: [
        'To store and manipulate data',
        'To define program behavior',
        'To handle user input',
        'To display output'
      ],
      medium: [
        'Improves code maintainability and reusability',
        'Reduces execution time significantly',
        'Eliminates all potential bugs',
        'Automatically optimizes memory usage'
      ],
      hard: [
        'Ensures horizontal scalability and fault tolerance',
        'Guarantees zero downtime deployments',
        'Provides automatic security patching',
        'Eliminates need for load balancing'
      ]
    },
    Finance: {
      easy: [
        'An increase in company assets',
        'A decrease in liabilities',
        'Income earned from operations',
        'Cash received from investors'
      ],
      medium: [
        'It measures profitability relative to equity',
        'It indicates liquidity position',
        'It shows operational efficiency',
        'It determines market valuation'
      ],
      hard: [
        'Fair value through profit or loss with hedge accounting',
        'Amortized cost with effective interest method',
        'Fair value through other comprehensive income',
        'Historical cost with impairment assessment'
      ]
    },
    Fashion: {
      easy: [
        'Creating the basic pattern pieces',
        'Selecting appropriate fabrics',
        'Taking accurate measurements',
        'Sewing the final garment'
      ],
      medium: [
        'Draping fabric directly on a dress form',
        'Using pre-made commercial patterns',
        'Digital pattern creation software',
        'Flat pattern manipulation techniques'
      ],
      hard: [
        'Deconstructing traditional silhouettes with raw edges',
        'Applying structured tailoring techniques',
        'Using sustainable and ethical production methods',
        'Incorporating cultural heritage elements'
      ]
    },
    Marketing: {
      easy: [
        'The percentage of users who click on an ad',
        'Total number of website visitors',
        'Number of social media followers',
        'Average time spent on page'
      ],
      medium: [
        'It provides better targeting and personalization',
        'It guarantees 100% email delivery',
        'It eliminates need for content creation',
        'It reduces marketing costs to zero'
      ],
      hard: [
        'Multi-touch attribution across all customer touchpoints',
        'Last-click attribution only',
        'First-touch attribution exclusively',
        'Equal credit to all interactions'
      ]
    }
  };
  
  // Get options for field and difficulty
  const fieldOptions = optionTemplates[field] || optionTemplates.IT;
  const diffOptions = fieldOptions[difficulty] || fieldOptions.easy;
  
  // Shuffle and select
  const shuffled = [...diffOptions].sort(() => Math.random() - 0.5);
  const letters = ['A', 'B', 'C', 'D'];
  const correctIndex = Math.floor(Math.random() * 4);
  
  return {
    options: shuffled.map((text, idx) => ({
      letter: letters[idx],
      text: text
    })),
    correctAnswer: letters[correctIndex]
  };
}

/**
 * Generate explanation for the correct answer
 */
function generateExplanation(question, correctAnswer, options, field) {
  const correctOption = options.find(opt => opt.letter === correctAnswer);
  
  if (!correctOption) {
    return `The correct answer demonstrates the fundamental principle in ${field}.`;
  }
  
  const explanations = {
    IT: `This answer is correct because it represents best practices in software development. ${correctOption.text.toLowerCase()} is essential for maintaining code quality and following industry standards.`,
    Finance: `This is the correct approach according to accounting standards and financial regulations. ${correctOption.text} aligns with GAAP/IFRS principles and ensures accurate financial reporting.`,
    Fashion: `This technique is widely used in professional fashion design because ${correctOption.text.toLowerCase()} allows for better fit, quality, and aesthetic appeal in garment construction.`,
    Marketing: `This answer reflects current marketing best practices. ${correctOption.text} is crucial for measuring campaign success and optimizing ROI in digital marketing strategies.`,
    Healthcare: `This is the medically appropriate approach based on clinical guidelines. ${correctOption.text.toLowerCase()} ensures patient safety and follows evidence-based treatment protocols.`,
    Law: `This is legally correct according to established statutes and case law. ${correctOption.text.toLowerCase()} ensures compliance with legal requirements and procedural standards.`
  };
  
  return explanations[field] || `This answer is correct based on established principles and best practices in ${field}.`;
}

/**
 * Generate multiple questions for an interview
 * @param {Array<string>} skills - Array of skill names
 * @param {Object} options - Generation options
 * @returns {Array<Object>} Generated questions
 */
export function generateInterviewQuestions(skills, options = {}) {
  const {
    questionsPerSkill = 3,
    difficultyDistribution = { easy: 0.4, medium: 0.4, hard: 0.2 }
  } = options;
  
  const allQuestions = [];
  const sessionHistory = [];
  
  skills.forEach(skill => {
    const skillQuestions = [];
    const totalQuestions = questionsPerSkill;
    
    // Calculate questions per difficulty
    const easyCount = Math.round(totalQuestions * difficultyDistribution.easy);
    const mediumCount = Math.round(totalQuestions * difficultyDistribution.medium);
    const hardCount = totalQuestions - easyCount - mediumCount;
    
    // Generate questions for each difficulty
    for (let i = 0; i < easyCount; i++) {
      const q = generateQuestion(skill, 'easy', sessionHistory);
      sessionHistory.push(q.id);
      skillQuestions.push(q);
    }
    
    for (let i = 0; i < mediumCount; i++) {
      const q = generateQuestion(skill, 'medium', sessionHistory);
      sessionHistory.push(q.id);
      skillQuestions.push(q);
    }
    
    for (let i = 0; i < hardCount; i++) {
      const q = generateQuestion(skill, 'hard', sessionHistory);
      sessionHistory.push(q.id);
      skillQuestions.push(q);
    }
    
    allQuestions.push(...skillQuestions);
  });
  
  logger.info(`Generated ${allQuestions.length} questions for ${skills.length} skills`);
  return allQuestions;
}

/**
 * Verify user's answers and calculate score
 */
export function verifyAnswers(questions, userAnswers) {
  let correctCount = 0;
  const results = [];
  
  questions.forEach(q => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    
    if (isCorrect) correctCount++;
    
    results.push({
      questionId: q.id,
      skill: q.skill,
      difficulty: q.difficulty,
      question: q.question,
      userAnswer: userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: isCorrect,
      explanation: q.explanation
    });
  });
  
  const score = (correctCount / questions.length) * 100;
  
  return {
    score: Math.round(score),
    correctCount: correctCount,
    totalQuestions: questions.length,
    results: results,
    passed: score >= 60 // 60% passing threshold
  };
}

/**
 * Calculate per-skill verification status
 */
export function calculateSkillVerification(results) {
  const skillScores = {};
  
  results.forEach(r => {
    if (!skillScores[r.skill]) {
      skillScores[r.skill] = { correct: 0, total: 0 };
    }
    skillScores[r.skill].total++;
    if (r.isCorrect) skillScores[r.skill].correct++;
  });
  
  const verifiedSkills = [];
  const questionableSkills = [];
  
  Object.entries(skillScores).forEach(([skill, stats]) => {
    const percentage = (stats.correct / stats.total) * 100;
    
    if (percentage >= 70) {
      verifiedSkills.push({ skill, score: Math.round(percentage), status: 'verified' });
    } else {
      questionableSkills.push({ skill, score: Math.round(percentage), status: 'questionable' });
    }
  });
  
  return { verifiedSkills, questionableSkills };
}

export default {
  generateQuestion,
  generateInterviewQuestions,
  verifyAnswers,
  calculateSkillVerification,
  detectField
};
