/**
 * Skill Normalizer with Fuzzy Matching
 * Handles skill name variations and normalizes to canonical forms
 * Uses Levenshtein distance for fuzzy matching (distance < 3)
 */

import natural from 'natural';

const { LevenshteinDistance } = natural;

/**
 * Comprehensive skill dictionary mapping variations to canonical names
 * Covers 200+ common tech skills across frontend, backend, database, devops, mobile, etc.
 */
export const skillDictionary = {
  // JavaScript & TypeScript
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'java script': 'JavaScript',
  'ecmascript': 'JavaScript',
  'es6': 'JavaScript ES6',
  'es2015': 'JavaScript ES6',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  
  // Frontend Frameworks
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'react js': 'React',
  'react native': 'React Native',
  'reactnative': 'React Native',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'angular.js': 'Angular',
  'svelte': 'Svelte',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'next': 'Next.js',
  'nuxtjs': 'Nuxt.js',
  'nuxt': 'Nuxt.js',
  
  // Backend & Servers
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'nest': 'NestJS',
  'java': 'Java',
  'spring': 'Spring Framework',
  'spring framework': 'Spring Framework',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'spring-boot': 'Spring Boot',
  'hibernate': 'Hibernate',
  'python': 'Python',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'fast api': 'FastAPI',
  'php': 'PHP',
  'laravel': 'Laravel',
  'ruby': 'Ruby',
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'ror': 'Ruby on Rails',
  'go': 'Go',
  'golang': 'Go',
  'rust': 'Rust',
  'c#': 'C#',
  'csharp': 'C#',
  'c sharp': 'C#',
  '.net': '.NET',
  'dotnet': '.NET',
  'asp.net': 'ASP.NET',
  'aspnet': 'ASP.NET',
  
  // Databases
  'sql': 'SQL',
  'mysql': 'MySQL',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'pg': 'PostgreSQL',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'redis': 'Redis',
  'sqlite': 'SQLite',
  'oracle': 'Oracle Database',
  'mssql': 'Microsoft SQL Server',
  'sql server': 'Microsoft SQL Server',
  'cassandra': 'Apache Cassandra',
  'dynamodb': 'AWS DynamoDB',
  'dynamo': 'AWS DynamoDB',
  'elasticsearch': 'Elasticsearch',
  'elastic search': 'Elasticsearch',
  'firebase': 'Firebase',
  
  // Cloud Platforms
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'ec2': 'AWS EC2',
  's3': 'AWS S3',
  'lambda': 'AWS Lambda',
  'azure': 'Microsoft Azure',
  'gcp': 'Google Cloud Platform',
  'google cloud': 'Google Cloud Platform',
  'heroku': 'Heroku',
  'digitalocean': 'DigitalOcean',
  'digital ocean': 'DigitalOcean',
  
  // DevOps & Tools
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'jenkins': 'Jenkins',
  'gitlab': 'GitLab',
  'gitlab ci': 'GitLab CI/CD',
  'github actions': 'GitHub Actions',
  'circleci': 'CircleCI',
  'circle ci': 'CircleCI',
  'travis': 'Travis CI',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'puppet': 'Puppet',
  'chef': 'Chef',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'continuous integration': 'CI/CD',
  
  // Version Control
  'git': 'Git',
  'github': 'GitHub',
  'svn': 'SVN',
  'bitbucket': 'Bitbucket',
  
  // Testing
  'jest': 'Jest',
  'mocha': 'Mocha',
  'chai': 'Chai',
  'junit': 'JUnit',
  'pytest': 'PyTest',
  'selenium': 'Selenium',
  'cypress': 'Cypress',
  'testing library': 'React Testing Library',
  'enzyme': 'Enzyme',
  
  // Frontend Tech
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',
  'sass': 'SASS',
  'scss': 'SCSS',
  'less': 'LESS',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'material ui': 'Material-UI',
  'mui': 'Material-UI',
  'material-ui': 'Material-UI',
  'webpack': 'Webpack',
  'vite': 'Vite',
  'rollup': 'Rollup',
  'parcel': 'Parcel',
  
  // Mobile
  'react native': 'React Native',
  'flutter': 'Flutter',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'android': 'Android Development',
  'ios': 'iOS Development',
  'xamarin': 'Xamarin',
  
  // Data & ML
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'scikit-learn': 'Scikit-Learn',
  'sklearn': 'Scikit-Learn',
  'tensorflow': 'TensorFlow',
  'keras': 'Keras',
  'pytorch': 'PyTorch',
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'ai': 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  'data science': 'Data Science',
  'big data': 'Big Data',
  'spark': 'Apache Spark',
  'hadoop': 'Hadoop',
  'kafka': 'Apache Kafka',
  
  // Architecture & Patterns
  'microservices': 'Microservices',
  'micro services': 'Microservices',
  'rest': 'REST API',
  'rest api': 'REST API',
  'restful': 'REST API',
  'graphql': 'GraphQL',
  'grpc': 'gRPC',
  'soap': 'SOAP',
  'websocket': 'WebSocket',
  'websockets': 'WebSocket',
  
  // Other
  'agile': 'Agile',
  'scrum': 'Scrum',
  'jira': 'Jira',
  'confluence': 'Confluence',
  'slack': 'Slack',
  'linux': 'Linux',
  'unix': 'Unix',
  'bash': 'Bash',
  'powershell': 'PowerShell',
  'vim': 'Vim',
  'vscode': 'VS Code',
  'visual studio code': 'VS Code',
  'intellij': 'IntelliJ IDEA',
  'postman': 'Postman',
  'swagger': 'Swagger',
};

/**
 * Skill similarity matrix for fuzzy matching
 * Maps related skills with similarity scores (0.0 - 1.0)
 */
export const skillSimilarity = {
  'React': { 'React Native': 0.85, 'Next.js': 0.75, 'Vue.js': 0.70 },
  'React Native': { 'React': 0.85, 'Flutter': 0.70 },
  'JavaScript': { 'TypeScript': 0.80, 'Node.js': 0.75 },
  'TypeScript': { 'JavaScript': 0.80 },
  'Node.js': { 'Express.js': 0.75, 'JavaScript': 0.75 },
  'Express.js': { 'Node.js': 0.85 },
  'PostgreSQL': { 'MySQL': 0.80, 'SQL': 0.85 },
  'MySQL': { 'PostgreSQL': 0.80, 'SQL': 0.85 },
  'MongoDB': { 'NoSQL': 0.90, 'Database': 0.70 },
  'Docker': { 'Kubernetes': 0.75, 'Docker Compose': 0.90 },
  'Kubernetes': { 'Docker': 0.75, 'K8s': 0.98 },
  'AWS': { 'Azure': 0.75, 'GCP': 0.75, 'Cloud': 0.85 },
  'Azure': { 'AWS': 0.75, 'GCP': 0.75, 'Cloud': 0.85 },
  'GCP': { 'AWS': 0.75, 'Azure': 0.75, 'Cloud': 0.85 },
  'Python': { 'Django': 0.70, 'Flask': 0.70, 'FastAPI': 0.70 },
  'Java': { 'Spring Boot': 0.75, 'Spring Framework': 0.75, 'Hibernate': 0.70 },
  'Spring Boot': { 'Java': 0.85, 'Spring Framework': 0.90 },
};

/**
 * Normalize a single skill to its canonical form
 * @param {string} skill - Raw skill name from resume
 * @returns {string} - Canonical skill name
 */
export const normalizeSkill = (skill) => {
  if (!skill || typeof skill !== 'string') return null;
  
  const trimmed = skill.trim().toLowerCase();
  
  // Direct dictionary lookup (fastest)
  if (skillDictionary[trimmed]) {
    return skillDictionary[trimmed];
  }
  
  // Fuzzy matching with Levenshtein distance
  // If distance < 3, consider it a match
  let bestMatch = null;
  let minDistance = 3; // Threshold
  
  for (const [variant, canonical] of Object.entries(skillDictionary)) {
    const distance = LevenshteinDistance(trimmed, variant);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = canonical;
    }
  }
  
  // Return fuzzy match or capitalized original
  return bestMatch || skill
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Normalize an array of skills
 * @param {string[]} skills - Array of raw skill names
 * @returns {string[]} - Array of canonical skill names (deduplicated)
 */
export const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  
  const normalized = skills
    .map(skill => normalizeSkill(skill))
    .filter(skill => skill !== null);
  
  // Deduplicate
  return [...new Set(normalized)];
};

/**
 * Calculate similarity between two skills
 * @param {string} skill1 - First skill (canonical)
 * @param {string} skill2 - Second skill (canonical)
 * @returns {number} - Similarity score 0.0-1.0
 */
export const getSkillSimilarity = (skill1, skill2) => {
  if (skill1 === skill2) return 1.0;
  
  // Check similarity matrix
  if (skillSimilarity[skill1]?.[skill2]) {
    return skillSimilarity[skill1][skill2];
  }
  
  // Fallback: Levenshtein-based similarity
  const maxLen = Math.max(skill1.length, skill2.length);
  const distance = LevenshteinDistance(skill1.toLowerCase(), skill2.toLowerCase());
  const similarity = 1 - (distance / maxLen);
  
  // Return 0 if too dissimilar (< 0.7)
  return similarity >= 0.7 ? similarity : 0;
};

/**
 * Find matching skills between resume and job with fuzzy matching
 * @param {string[]} resumeSkills - Candidate's skills (canonical)
 * @param {string[]} jobSkills - Job required skills (canonical)
 * @param {number} threshold - Minimum similarity score (default 0.75)
 * @returns {Object} - { matched: [], partialMatches: [], missing: [] }
 */
export const matchSkillsFuzzy = (resumeSkills, jobSkills, threshold = 0.75) => {
  const matched = [];
  const partialMatches = [];
  const missing = [];
  
  for (const jobSkill of jobSkills) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const resumeSkill of resumeSkills) {
      const similarity = getSkillSimilarity(jobSkill, resumeSkill);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = resumeSkill;
      }
    }
    
    if (bestScore >= 0.95) {
      // Exact or near-exact match
      matched.push({ jobSkill, resumeSkill: bestMatch, similarity: bestScore });
    } else if (bestScore >= threshold) {
      // Partial match (e.g., React vs React Native = 0.85)
      partialMatches.push({ jobSkill, resumeSkill: bestMatch, similarity: bestScore });
    } else {
      // No match - skill is missing
      missing.push(jobSkill);
    }
  }
  
  return { matched, partialMatches, missing };
};

/**
 * Check if a skill match is ambiguous (needs Watson clarification)
 * @param {number} similarity - Similarity score
 * @returns {boolean} - True if ambiguous (0.5 - 0.7 range)
 */
export const isAmbiguousMatch = (similarity) => {
  return similarity >= 0.5 && similarity <= 0.7;
};

// Export alias for backward compatibility
export const normalizeSkillsArray = normalizeSkills;

export default {
  normalizeSkill,
  normalizeSkills,
  normalizeSkillsArray: normalizeSkills,
  getSkillSimilarity,
  matchSkillsFuzzy,
  isAmbiguousMatch,
  skillDictionary,
  skillSimilarity,
};
