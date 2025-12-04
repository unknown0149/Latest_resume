import { extractSkillsWithNER } from './src/services/aiRouter.js';

const sampleText = `
John Doe
Full Stack Developer

TECHNICAL SKILLS:
JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, 
AWS, Docker, Kubernetes, Git, REST APIs, GraphQL, HTML, CSS, Python

EXPERIENCE:
Software Engineer at Tech Corp (2020-2023)
- Developed scalable web applications using React and Node.js
- Implemented microservices architecture with Docker and Kubernetes
- Built RESTful APIs and GraphQL endpoints
- Managed PostgreSQL and MongoDB databases
`;

console.log('Testing NER extraction...\n');

extractSkillsWithNER(sampleText)
  .then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log(`\nExtracted ${result.skills.length} skills`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
