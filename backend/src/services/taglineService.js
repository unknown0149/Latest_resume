/**
 * Tagline Generation Service
 * Generates personalized professional taglines from resume analysis
 */

import { logger } from '../utils/logger.js';

// Tagline templates by role
const taglineTemplates = {
  'Full Stack Developer': [
    '{experience} Full Stack Developer | {topSkills}',
    'Building scalable web applications with {topSkills}',
    'Full Stack Engineer specializing in {topSkills}',
    '{experience} in crafting end-to-end solutions | {topSkills}',
    'Passionate Full Stack Developer | {topSkills} Expert'
  ],
  'Backend Developer': [
    '{experience} Backend Engineer | {topSkills}',
    'Architecting robust server-side solutions with {topSkills}',
    'Backend Developer specializing in {topSkills}',
    'Building scalable APIs and microservices | {topSkills}',
    '{experience} in server-side development | {topSkills}'
  ],
  'Frontend Developer': [
    '{experience} Frontend Engineer | {topSkills}',
    'Crafting beautiful user experiences with {topSkills}',
    'Frontend Developer specializing in {topSkills}',
    'Building responsive web applications | {topSkills}',
    'UI/UX-focused developer | {topSkills} Expert'
  ],
  'DevOps Engineer': [
    '{experience} DevOps Engineer | {topSkills}',
    'Automating infrastructure and CI/CD pipelines with {topSkills}',
    'Cloud & Infrastructure specialist | {topSkills}',
    'DevOps Engineer focused on {topSkills}',
    'Building reliable deployment systems | {topSkills}'
  ],
  'Data Engineer': [
    '{experience} Data Engineer | {topSkills}',
    'Building data pipelines and warehouses with {topSkills}',
    'Data Infrastructure specialist | {topSkills}',
    'Engineering scalable data solutions | {topSkills}',
    '{experience} in big data and analytics | {topSkills}'
  ],
  'Machine Learning Engineer': [
    '{experience} ML Engineer | {topSkills}',
    'Building AI-powered solutions with {topSkills}',
    'Machine Learning specialist | {topSkills}',
    'AI Engineer focused on {topSkills}',
    'Deploying intelligent systems | {topSkills}'
  ],
  'Mobile Developer': [
    '{experience} Mobile Developer | {topSkills}',
    'Crafting native mobile experiences with {topSkills}',
    'Mobile App Developer specializing in {topSkills}',
    'Building cross-platform applications | {topSkills}',
    '{experience} in mobile development | {topSkills}'
  ],
  'QA Engineer': [
    '{experience} QA Engineer | {topSkills}',
    'Ensuring software quality with {topSkills}',
    'Test Automation specialist | {topSkills}',
    'Quality Assurance Engineer | {topSkills}',
    'Building robust testing frameworks | {topSkills}'
  ],
  'Cloud Architect': [
    '{experience} Cloud Architect | {topSkills}',
    'Designing scalable cloud solutions with {topSkills}',
    'Cloud Infrastructure specialist | {topSkills}',
    'Architecting enterprise cloud systems | {topSkills}',
    '{experience} in cloud architecture | {topSkills}'
  ],
  'Software Engineer': [
    '{experience} Software Engineer | {topSkills}',
    'Building innovative software solutions with {topSkills}',
    'Software Developer specializing in {topSkills}',
    '{experience} in software development | {topSkills}',
    'Passionate Software Engineer | {topSkills}'
  ]
};

// Experience level descriptors
const experienceLevels = {
  0: 'Aspiring',
  1: 'Junior',
  2: 'Intermediate',
  3: 'Experienced',
  5: '5+ Year',
  7: 'Senior',
  10: '10+ Year',
  15: 'Principal'
};

/**
 * Get experience descriptor based on years
 */
function getExperienceDescriptor(years) {
  if (years === 0) return 'Aspiring';
  if (years === 1) return 'Junior';
  if (years <= 2) return 'Intermediate';
  if (years <= 4) return 'Experienced';
  if (years <= 6) return '5+ Year';
  if (years <= 9) return 'Senior';
  if (years <= 14) return '10+ Year';
  return 'Principal';
}

/**
 * Format skills list for tagline
 */
function formatSkills(skills, maxSkills = 3) {
  if (!skills || skills.length === 0) return 'Modern Technologies';
  
  const topSkills = skills.slice(0, maxSkills);
  
  if (topSkills.length === 1) return topSkills[0];
  if (topSkills.length === 2) return topSkills.join(' & ');
  if (topSkills.length === 3) return `${topSkills[0]}, ${topSkills[1]} & ${topSkills[2]}`;
  
  return topSkills.slice(0, -1).join(', ') + ' & ' + topSkills[topSkills.length - 1];
}

/**
 * Generate tagline from role analysis
 */
export function generateTagline(parsedResume, roleAnalysis) {
  try {
    const role = roleAnalysis?.predictedRole?.name || 'Software Engineer';
    const years = parsedResume?.years_experience || 0;
    const skills = parsedResume?.skills || [];
    
    // Get top skills (prioritize high-impact skills)
    const topSkills = skills.slice(0, 5);
    
    // Get templates for role
    const templates = taglineTemplates[role] || taglineTemplates['Software Engineer'];
    
    // Select template (use index based on skills length for variety)
    const templateIndex = topSkills.length % templates.length;
    let template = templates[templateIndex];
    
    // Fill in variables
    const experienceDesc = getExperienceDescriptor(years);
    const skillsFormatted = formatSkills(topSkills, 3);
    
    const tagline = template
      .replace('{experience}', experienceDesc)
      .replace('{topSkills}', skillsFormatted);
    
    logger.debug(`Generated tagline: "${tagline}" for role: ${role}`);
    
    return tagline;
    
  } catch (error) {
    logger.error('Tagline generation error:', error);
    return 'Passionate Software Engineer';
  }
}

/**
 * Generate multiple tagline options
 */
export function generateTaglineOptions(parsedResume, roleAnalysis, count = 5) {
  try {
    const role = roleAnalysis?.predictedRole?.name || 'Software Engineer';
    const years = parsedResume?.years_experience || 0;
    const skills = parsedResume?.skills || [];
    
    const templates = taglineTemplates[role] || taglineTemplates['Software Engineer'];
    const experienceDesc = getExperienceDescriptor(years);
    
    const options = templates.slice(0, count).map(template => {
      // Vary skill combinations for different options
      const skillCount = 2 + (Math.random() > 0.5 ? 1 : 0); // 2 or 3 skills
      const skillsFormatted = formatSkills(skills, skillCount);
      
      return template
        .replace('{experience}', experienceDesc)
        .replace('{topSkills}', skillsFormatted);
    });
    
    return options;
    
  } catch (error) {
    logger.error('Tagline options generation error:', error);
    return ['Passionate Software Engineer'];
  }
}

/**
 * Generate tagline with AI enhancement (optional)
 */
export function generateEnhancedTagline(parsedResume, roleAnalysis, softSkills = []) {
  try {
    const baseTagline = generateTagline(parsedResume, roleAnalysis);
    
    // If soft skills are available, enhance tagline
    if (softSkills && softSkills.length > 0) {
      const topSoftSkill = softSkills[0]?.skill;
      
      const enhancements = {
        'Leadership': ' & Team Leader',
        'Communication': ' & Effective Communicator',
        'Problem Solving': ' & Problem Solver',
        'Teamwork': ' & Collaborative Team Player',
        'Adaptability': ' & Quick Learner',
        'Creativity': ' & Creative Thinker',
        'Time Management': ' & Efficient Planner',
        'Critical Thinking': ' & Analytical Thinker'
      };
      
      const enhancement = enhancements[topSoftSkill];
      if (enhancement) {
        return baseTagline + enhancement;
      }
    }
    
    return baseTagline;
    
  } catch (error) {
    logger.error('Enhanced tagline generation error:', error);
    return generateTagline(parsedResume, roleAnalysis);
  }
}

/**
 * Generate short bio from resume data
 */
export function generateBio(parsedResume, roleAnalysis) {
  try {
    const name = parsedResume?.name || 'Professional';
    const role = roleAnalysis?.predictedRole?.name || 'Software Engineer';
    const years = parsedResume?.years_experience || 0;
    const skills = parsedResume?.skills || [];
    const education = parsedResume?.education?.[0];
    const location = parsedResume?.location || '';
    
    const experienceDesc = getExperienceDescriptor(years);
    const topSkills = formatSkills(skills, 4);
    
    let bio = `${experienceDesc} ${role}`;
    
    if (years > 0) {
      bio += ` with ${years}+ year${years > 1 ? 's' : ''} of experience`;
    }
    
    bio += ` specializing in ${topSkills}.`;
    
    if (education?.degree) {
      bio += ` Holds a ${education.degree}`;
      if (education.institution) {
        bio += ` from ${education.institution}`;
      }
      bio += '.';
    }
    
    if (location) {
      bio += ` Based in ${location}.`;
    }
    
    // Add passion statement
    const passionStatements = [
      ' Passionate about building innovative solutions and staying current with emerging technologies.',
      ' Dedicated to writing clean, maintainable code and delivering high-quality software.',
      ' Committed to continuous learning and contributing to impactful projects.',
      ' Focused on creating user-centric solutions and driving technical excellence.',
      ' Enthusiastic about solving complex problems and collaborating with talented teams.'
    ];
    
    const randomPassion = passionStatements[Math.floor(Math.random() * passionStatements.length)];
    bio += randomPassion;
    
    return bio;
    
  } catch (error) {
    logger.error('Bio generation error:', error);
    return 'Passionate software professional dedicated to building innovative solutions.';
  }
}

export default {
  generateTagline,
  generateTaglineOptions,
  generateEnhancedTagline,
  generateBio
};
