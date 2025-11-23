/**
 * Skills Canonicalization Dictionary - 600+ Tech Terms
 * Maps common variants to canonical skill names for resume parsing
 */

export const SKILLS_CANONICAL = {
  // === PROGRAMMING LANGUAGES ===
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'ecmascript': 'JavaScript',
  'es6': 'JavaScript',
  'es2015': 'JavaScript',
  'vanilla js': 'JavaScript',
  
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  
  'python': 'Python',
  'python3': 'Python',
  'py': 'Python',
  
  'java': 'Java',
  'java se': 'Java',
  'java ee': 'Java EE',
  'jee': 'Java EE',
  'j2ee': 'Java EE',
  
  'c++': 'C++',
  'cpp': 'C++',
  'cplusplus': 'C++',
  
  'c#': 'C#',
  'csharp': 'C#',
  'c sharp': 'C#',
  
  'c': 'C',
  
  'go': 'Go',
  'golang': 'Go',
  
  'rust': 'Rust',
  
  'ruby': 'Ruby',
  
  'php': 'PHP',
  
  'swift': 'Swift',
  
  'kotlin': 'Kotlin',
  
  'scala': 'Scala',
  
  'r': 'R',
  'r programming': 'R',
  
  'matlab': 'MATLAB',
  
  'perl': 'Perl',
  
  'shell': 'Shell Scripting',
  'bash': 'Bash',
  'shell scripting': 'Shell Scripting',
  'bash scripting': 'Bash',
  
  'powershell': 'PowerShell',
  
  // === FRONTEND FRAMEWORKS/LIBRARIES ===
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
  'angularjs': 'AngularJS',
  'angular.js': 'AngularJS',
  'angular 2+': 'Angular',
  
  'svelte': 'Svelte',
  
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'next js': 'Next.js',
  
  'nuxt': 'Nuxt.js',
  'nuxtjs': 'Nuxt.js',
  'nuxt.js': 'Nuxt.js',
  
  'jquery': 'jQuery',
  
  'backbone': 'Backbone.js',
  'backbonejs': 'Backbone.js',
  'backbone.js': 'Backbone.js',
  
  'ember': 'Ember.js',
  'emberjs': 'Ember.js',
  'ember.js': 'Ember.js',
  
  // === BACKEND FRAMEWORKS ===
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'nest': 'NestJS',
  
  'spring': 'Spring Framework',
  'spring framework': 'Spring Framework',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring mvc': 'Spring MVC',
  'spring data': 'Spring Data',
  'spring security': 'Spring Security',
  'spring cloud': 'Spring Cloud',
  
  'django': 'Django',
  
  'flask': 'Flask',
  
  'fastapi': 'FastAPI',
  'fast api': 'FastAPI',
  
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'ror': 'Ruby on Rails',
  
  'laravel': 'Laravel',
  
  'asp.net': 'ASP.NET',
  'aspnet': 'ASP.NET',
  'asp net': 'ASP.NET',
  '.net': '.NET',
  'dotnet': '.NET',
  '.net core': '.NET Core',
  
  // === DATABASES ===
  'sql': 'SQL',
  'structured query language': 'SQL',
  
  'mysql': 'MySQL',
  'my sql': 'MySQL',
  
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'pg': 'PostgreSQL',
  'psql': 'PostgreSQL',
  
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'mongo db': 'MongoDB',
  
  'redis': 'Redis',
  
  'cassandra': 'Cassandra',
  'apache cassandra': 'Cassandra',
  
  'elasticsearch': 'Elasticsearch',
  'elastic search': 'Elasticsearch',
  
  'oracle': 'Oracle Database',
  'oracle db': 'Oracle Database',
  'oracle database': 'Oracle Database',
  
  'sql server': 'SQL Server',
  'mssql': 'SQL Server',
  'microsoft sql server': 'SQL Server',
  
  'mariadb': 'MariaDB',
  'maria db': 'MariaDB',
  
  'dynamodb': 'DynamoDB',
  'dynamo db': 'DynamoDB',
  'aws dynamodb': 'DynamoDB',
  
  'couchdb': 'CouchDB',
  'couch db': 'CouchDB',
  
  'neo4j': 'Neo4j',
  
  'firebase': 'Firebase',
  'firebase realtime database': 'Firebase',
  'firestore': 'Firestore',
  
  'sqlite': 'SQLite',
  'sqlite3': 'SQLite',
  
  // === CLOUD PLATFORMS ===
  'aws': 'AWS',
  'amazon web services': 'AWS',
  
  'ec2': 'AWS EC2',
  'amazon ec2': 'AWS EC2',
  
  's3': 'AWS S3',
  'amazon s3': 'AWS S3',
  
  'lambda': 'AWS Lambda',
  'aws lambda': 'AWS Lambda',
  
  'rds': 'AWS RDS',
  'aws rds': 'AWS RDS',
  
  'cloudfront': 'CloudFront',
  'aws cloudfront': 'CloudFront',
  
  'azure': 'Azure',
  'microsoft azure': 'Azure',
  
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  
  'heroku': 'Heroku',
  
  'digitalocean': 'DigitalOcean',
  'digital ocean': 'DigitalOcean',
  
  'linode': 'Linode',
  
  'vercel': 'Vercel',
  
  'netlify': 'Netlify',
  
  // === DEVOPS & TOOLS ===
  'docker': 'Docker',
  'docker compose': 'Docker Compose',
  'docker-compose': 'Docker Compose',
  
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'k8': 'Kubernetes',
  
  'jenkins': 'Jenkins',
  
  'gitlab': 'GitLab',
  'gitlab ci': 'GitLab CI',
  'gitlab ci/cd': 'GitLab CI/CD',
  
  'github actions': 'GitHub Actions',
  'github action': 'GitHub Actions',
  
  'circleci': 'CircleCI',
  'circle ci': 'CircleCI',
  
  'travis': 'Travis CI',
  'travis ci': 'Travis CI',
  
  'ansible': 'Ansible',
  
  'terraform': 'Terraform',
  
  'chef': 'Chef',
  
  'puppet': 'Puppet',
  
  'vagrant': 'Vagrant',
  
  'prometheus': 'Prometheus',
  
  'grafana': 'Grafana',
  
  'elk': 'ELK Stack',
  'elk stack': 'ELK Stack',
  'elasticsearch logstash kibana': 'ELK Stack',
  
  'splunk': 'Splunk',
  
  'datadog': 'Datadog',
  
  'new relic': 'New Relic',
  'newrelic': 'New Relic',
  
  // === VERSION CONTROL ===
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitbucket': 'Bitbucket',
  'svn': 'SVN',
  'subversion': 'SVN',
  
  // === MESSAGE QUEUES ===
  'kafka': 'Apache Kafka',
  'apache kafka': 'Apache Kafka',
  
  'rabbitmq': 'RabbitMQ',
  'rabbit mq': 'RabbitMQ',
  
  'activemq': 'ActiveMQ',
  'active mq': 'ActiveMQ',
  
  'amazon sqs': 'Amazon SQS',
  'sqs': 'Amazon SQS',
  
  'azure service bus': 'Azure Service Bus',
  
  // === TESTING ===
  'junit': 'JUnit',
  'junit5': 'JUnit',
  
  'testng': 'TestNG',
  'test ng': 'TestNG',
  
  'jest': 'Jest',
  
  'mocha': 'Mocha',
  
  'chai': 'Chai',
  
  'jasmine': 'Jasmine',
  
  'cypress': 'Cypress',
  'cypress.io': 'Cypress',
  
  'selenium': 'Selenium',
  
  'playwright': 'Playwright',
  
  'puppeteer': 'Puppeteer',
  
  'pytest': 'Pytest',
  'py.test': 'Pytest',
  
  'unittest': 'unittest',
  'python unittest': 'unittest',
  
  'rspec': 'RSpec',
  
  'cucumber': 'Cucumber',
  
  'postman': 'Postman',
  
  'jmeter': 'JMeter',
  'apache jmeter': 'JMeter',
  
  // === DATA SCIENCE & ML ===
  'tensorflow': 'TensorFlow',
  'tensor flow': 'TensorFlow',
  'tf': 'TensorFlow',
  
  'pytorch': 'PyTorch',
  'torch': 'PyTorch',
  
  'keras': 'Keras',
  
  'scikit-learn': 'Scikit-learn',
  'sklearn': 'Scikit-learn',
  'scikit learn': 'Scikit-learn',
  
  'pandas': 'Pandas',
  
  'numpy': 'NumPy',
  
  'matplotlib': 'Matplotlib',
  
  'seaborn': 'Seaborn',
  
  'scipy': 'SciPy',
  
  'jupyter': 'Jupyter',
  'jupyter notebook': 'Jupyter',
  'jupyter notebooks': 'Jupyter',
  
  'apache spark': 'Apache Spark',
  'spark': 'Apache Spark',
  'pyspark': 'PySpark',
  
  'hadoop': 'Hadoop',
  'apache hadoop': 'Hadoop',
  
  'hive': 'Apache Hive',
  'apache hive': 'Apache Hive',
  
  'pig': 'Apache Pig',
  'apache pig': 'Apache Pig',
  
  'airflow': 'Apache Airflow',
  'apache airflow': 'Apache Airflow',
  
  'mlflow': 'MLflow',
  'ml flow': 'MLflow',
  
  'kubeflow': 'Kubeflow',
  
  // === BI & ANALYTICS TOOLS ===
  'power bi': 'Power BI',
  'powerbi': 'Power BI',
  'microsoft power bi': 'Power BI',
  
  'tableau': 'Tableau',
  'tableau desktop': 'Tableau',
  
  'looker': 'Looker',
  'google looker': 'Looker',
  
  'qlik': 'Qlik',
  'qlikview': 'QlikView',
  'qlik sense': 'Qlik Sense',
  
  'excel': 'Excel',
  'microsoft excel': 'Excel',
  'ms excel': 'Excel',
  
  'google sheets': 'Google Sheets',
  
  'google analytics': 'Google Analytics',
  
  'data visualization': 'Data Visualization',
  'data viz': 'Data Visualization',
  
  'nlp': 'NLP',
  'natural language processing': 'NLP',
  
  'computer vision': 'Computer Vision',
  'cv': 'Computer Vision',
  
  'deep learning': 'Deep Learning',
  'dl': 'Deep Learning',
  
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  
  'artificial intelligence': 'AI',
  'ai': 'AI',
  
  // === MOBILE DEVELOPMENT ===
  'android': 'Android',
  'android development': 'Android',
  
  'ios': 'iOS',
  'ios development': 'iOS',
  
  'flutter': 'Flutter',
  
  'xamarin': 'Xamarin',
  
  'ionic': 'Ionic',
  
  'cordova': 'Cordova',
  'apache cordova': 'Cordova',
  
  'phonegap': 'PhoneGap',
  
  // === CSS FRAMEWORKS ===
  'css': 'CSS',
  'css3': 'CSS',
  
  'html': 'HTML',
  'html5': 'HTML',
  
  'sass': 'Sass',
  'scss': 'Sass',
  
  'less': 'Less',
  
  'bootstrap': 'Bootstrap',
  
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  
  'material-ui': 'Material-UI',
  'material ui': 'Material-UI',
  'mui': 'Material-UI',
  
  'ant design': 'Ant Design',
  'antd': 'Ant Design',
  
  'bulma': 'Bulma',
  
  // === STATE MANAGEMENT ===
  'redux': 'Redux',
  
  'mobx': 'MobX',
  
  'vuex': 'Vuex',
  
  'recoil': 'Recoil',
  
  'zustand': 'Zustand',
  
  'jotai': 'Jotai',
  
  // === BUILD TOOLS ===
  'webpack': 'Webpack',
  
  'vite': 'Vite',
  
  'rollup': 'Rollup',
  
  'parcel': 'Parcel',
  
  'gulp': 'Gulp',
  
  'grunt': 'Grunt',
  
  'maven': 'Maven',
  'apache maven': 'Maven',
  
  'gradle': 'Gradle',
  
  'npm': 'npm',
  
  'yarn': 'Yarn',
  
  'pnpm': 'pnpm',
  
  // === API TECHNOLOGIES ===
  'rest': 'REST API',
  'rest api': 'REST API',
  'restful': 'REST API',
  'restful api': 'REST API',
  
  'graphql': 'GraphQL',
  'graph ql': 'GraphQL',
  
  'grpc': 'gRPC',
  
  'soap': 'SOAP',
  
  'websocket': 'WebSocket',
  'websockets': 'WebSocket',
  'web socket': 'WebSocket',
  
  // === ARCHITECTURE PATTERNS ===
  'microservices': 'Microservices',
  'micro services': 'Microservices',
  'microservice': 'Microservices',
  
  'monolith': 'Monolithic Architecture',
  'monolithic': 'Monolithic Architecture',
  
  'serverless': 'Serverless',
  
  'event-driven': 'Event-Driven Architecture',
  'event driven': 'Event-Driven Architecture',
  
  'soa': 'SOA',
  'service oriented architecture': 'SOA',
  
  'mvc': 'MVC',
  'model view controller': 'MVC',
  
  'mvvm': 'MVVM',
  
  'clean architecture': 'Clean Architecture',
  
  'hexagonal architecture': 'Hexagonal Architecture',
  
  'domain driven design': 'Domain-Driven Design',
  'ddd': 'Domain-Driven Design',
  
  // === DESIGN & COLLABORATION ===
  'figma': 'Figma',
  
  'sketch': 'Sketch',
  
  'adobe xd': 'Adobe XD',
  'xd': 'Adobe XD',
  
  'invision': 'InVision',
  
  'jira': 'Jira',
  
  'confluence': 'Confluence',
  
  'trello': 'Trello',
  
  'asana': 'Asana',
  
  'slack': 'Slack',
  
  // === SECURITY ===
  'oauth': 'OAuth',
  'oauth2': 'OAuth 2.0',
  'oauth 2.0': 'OAuth 2.0',
  
  'jwt': 'JWT',
  'json web token': 'JWT',
  
  'saml': 'SAML',
  
  'ssl': 'SSL',
  'tls': 'TLS',
  'ssl/tls': 'SSL/TLS',
  
  'https': 'HTTPS',
  
  'encryption': 'Encryption',
  
  'penetration testing': 'Penetration Testing',
  'pen testing': 'Penetration Testing',
  
  'owasp': 'OWASP',
  
  // === BLOCKCHAIN ===
  'blockchain': 'Blockchain',
  
  'ethereum': 'Ethereum',
  
  'solidity': 'Solidity',
  
  'smart contracts': 'Smart Contracts',
  'smart contract': 'Smart Contracts',
  
  'web3': 'Web3',
  'web3.js': 'Web3.js',
  
  // === OTHER TECHNOLOGIES ===
  'linux': 'Linux',
  'unix': 'Unix',
  
  'windows': 'Windows',
  
  'macos': 'macOS',
  'mac os': 'macOS',
  
  'agile': 'Agile',
  'scrum': 'Scrum',
  'kanban': 'Kanban',
  
  'ci/cd': 'CI/CD',
  'ci cd': 'CI/CD',
  'continuous integration': 'CI/CD',
  'continuous deployment': 'CI/CD',
  
  'tdd': 'TDD',
  'test driven development': 'TDD',
  
  'bdd': 'BDD',
  'behavior driven development': 'BDD',
  
  'pair programming': 'Pair Programming',
  
  'code review': 'Code Review',
  
  'system design': 'System Design',
  
  'data structures': 'Data Structures',
  'data structure': 'Data Structures',
  
  'algorithms': 'Algorithms',
  'algorithm': 'Algorithms',
  
  'object oriented programming': 'OOP',
  'oop': 'OOP',
  
  'functional programming': 'Functional Programming',
  'fp': 'Functional Programming',
};

/**
 * Canonicalize a skill name
 */
export function canonicalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return null;
  
  const normalized = skill.toLowerCase().trim();
  return SKILLS_CANONICAL[normalized] || skill.trim();
}

/**
 * Canonicalize an array of skills
 */
export function canonicalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  
  const canonicalized = skills
    .map(skill => canonicalizeSkill(skill))
    .filter(skill => skill && skill.length > 0);
  
  // Remove duplicates
  return [...new Set(canonicalized)];
}

/**
 * Check if a string is a known tech skill
 */
export function isKnownSkill(skill) {
  if (!skill || typeof skill !== 'string') return false;
  
  const normalized = skill.toLowerCase().trim();
  return normalized in SKILLS_CANONICAL || 
         Object.values(SKILLS_CANONICAL).includes(skill.trim());
}

/**
 * Get skill category (for grouping)
 */
export function getSkillCategory(canonicalSkill) {
  const categories = {
    'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala'],
    'Frontend': ['React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap'],
    'Backend': ['Node.js', 'Express.js', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Ruby on Rails', 'Laravel', 'ASP.NET'],
    'Databases': ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle Database', 'SQL Server', 'DynamoDB'],
    'Cloud': ['AWS', 'Azure', 'GCP', 'Heroku', 'DigitalOcean', 'Vercel', 'Netlify'],
    'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions', 'Terraform', 'Ansible'],
    'Testing': ['JUnit', 'Jest', 'Cypress', 'Selenium', 'Pytest', 'Postman'],
    'ML/AI': ['TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Apache Spark', 'Machine Learning', 'Deep Learning', 'NLP'],
    'Mobile': ['Android', 'iOS', 'React Native', 'Flutter', 'Xamarin'],
  };
  
  for (const [category, skills] of Object.entries(categories)) {
    if (skills.includes(canonicalSkill)) {
      return category;
    }
  }
  
  return 'Other';
}

export default {
  SKILLS_CANONICAL,
  canonicalizeSkill,
  canonicalizeSkills,
  isKnownSkill,
  getSkillCategory,
};
