/**
 * Seed Jobs Loader - Loads initial job data into MongoDB
 * Generates variations of tech jobs for MVP testing
 */

import Job from '../models/Job.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Additional job templates for variation generation
const jobTemplates = [
  {
    titleVariations: ["Senior Java Developer", "Java Backend Engineer", "Senior Backend Developer (Java)"],
    companyTypes: ["Enterprise", "Startup", "Consulting"],
    skills: {
      required: ["java", "spring boot", "microservices", "rest api", "sql"],
      preferred: ["kafka", "docker", "kubernetes", "redis", "aws", "mongodb"]
    },
    salaryRange: { min: 110000, max: 170000 },
    experienceRange: { min: 5, max: 10 },
    experienceLevel: "senior"
  },
  {
    titleVariations: ["Full Stack Developer", "MERN Stack Developer", "Full Stack Engineer"],
    companyTypes: ["Startup", "Tech Company", "E-commerce"],
    skills: {
      required: ["react", "node.js", "javascript", "rest api", "mongodb"],
      preferred: ["typescript", "express", "redux", "aws", "docker", "postgresql"]
    },
    salaryRange: { min: 85000, max: 135000 },
    experienceRange: { min: 3, max: 7 },
    experienceLevel: "mid"
  },
  {
    titleVariations: ["Frontend Developer", "React Developer", "UI Engineer"],
    companyTypes: ["Design Agency", "SaaS Company", "E-commerce"],
    skills: {
      required: ["react", "javascript", "html", "css", "redux"],
      preferred: ["typescript", "next.js", "tailwind css", "webpack", "jest"]
    },
    salaryRange: { min: 90000, max: 140000 },
    experienceRange: { min: 3, max: 7 },
    experienceLevel: "mid"
  },
  {
    titleVariations: ["DevOps Engineer", "Cloud Engineer", "SRE Engineer"],
    companyTypes: ["Cloud Provider", "Enterprise", "Fintech"],
    skills: {
      required: ["aws", "kubernetes", "docker", "terraform", "ci/cd"],
      preferred: ["jenkins", "python", "ansible", "prometheus", "linux"]
    },
    salaryRange: { min: 125000, max: 180000 },
    experienceRange: { min: 4, max: 10 },
    experienceLevel: "senior"
  },
  {
    titleVariations: ["Data Engineer", "Big Data Engineer", "ETL Developer"],
    companyTypes: ["Analytics Company", "E-commerce", "Fintech"],
    skills: {
      required: ["python", "sql", "spark", "etl", "data warehousing"],
      preferred: ["kafka", "airflow", "aws", "snowflake", "scala"]
    },
    salaryRange: { min: 105000, max: 155000 },
    experienceRange: { min: 4, max: 8 },
    experienceLevel: "mid"
  },
  {
    titleVariations: ["Mobile Developer (React Native)", "Cross-Platform Developer", "React Native Engineer"],
    companyTypes: ["Mobile App Company", "Startup", "E-commerce"],
    skills: {
      required: ["react native", "javascript", "mobile development", "ios", "android"],
      preferred: ["typescript", "redux", "firebase", "rest api", "git"]
    },
    salaryRange: { min: 95000, max: 145000 },
    experienceRange: { min: 3, max: 7 },
    experienceLevel: "mid"
  },
  {
    titleVariations: ["Machine Learning Engineer", "ML Engineer", "AI Engineer"],
    companyTypes: ["AI Company", "Research Lab", "Tech Giant"],
    skills: {
      required: ["python", "machine learning", "tensorflow", "pytorch", "deep learning"],
      preferred: ["nlp", "computer vision", "aws", "kubernetes", "spark"]
    },
    salaryRange: { min: 140000, max: 200000 },
    experienceRange: { min: 5, max: 10 },
    experienceLevel: "senior"
  },
  {
    titleVariations: ["Cloud Solutions Architect", "AWS Architect", "Cloud Architect"],
    companyTypes: ["Consulting Firm", "Cloud Provider", "Enterprise"],
    skills: {
      required: ["aws", "system design", "cloud architecture", "microservices", "terraform"],
      preferred: ["kubernetes", "serverless", "security", "cost optimization", "ci/cd"]
    },
    salaryRange: { min: 150000, max: 220000 },
    experienceRange: { min: 7, max: 15 },
    experienceLevel: "senior"
  },
  {
    titleVariations: ["QA Automation Engineer", "SDET", "Test Automation Engineer"],
    companyTypes: ["Software Company", "E-commerce", "Fintech"],
    skills: {
      required: ["selenium", "java", "test automation", "junit", "api testing"],
      preferred: ["cypress", "python", "ci/cd", "jenkins", "rest api"]
    },
    salaryRange: { min: 85000, max: 125000 },
    experienceRange: { min: 3, max: 7 },
    experienceLevel: "mid"
  },
  {
    titleVariations: ["Software Engineer", "Backend Engineer", "API Developer"],
    companyTypes: ["Tech Company", "Startup", "Enterprise"],
    skills: {
      required: ["java", "python", "rest api", "sql", "git"],
      preferred: ["docker", "kubernetes", "aws", "microservices", "mongodb"]
    },
    salaryRange: { min: 95000, max: 145000 },
    experienceRange: { min: 2, max: 6 },
    experienceLevel: "mid"
  }
];

const cities = [
  { city: "San Francisco", state: "CA", country: "USA" },
  { city: "Austin", state: "TX", country: "USA" },
  { city: "Seattle", state: "WA", country: "USA" },
  { city: "Boston", state: "MA", country: "USA" },
  { city: "New York", state: "NY", country: "USA" },
  { city: "Chicago", state: "IL", country: "USA" },
  { city: "Denver", state: "CO", country: "USA" },
  { city: "Portland", state: "OR", country: "USA" },
  { city: "Atlanta", state: "GA", country: "USA" },
  { city: "Los Angeles", state: "CA", country: "USA" }
];

const companies = [
  { name: "TechCorp Solutions", size: "1001-5000" },
  { name: "StartupHub Inc", size: "51-200" },
  { name: "DesignTech Studios", size: "201-500" },
  { name: "CloudNative Systems", size: "501-1000" },
  { name: "DataFlow Analytics", size: "201-500" },
  { name: "InnovateTech", size: "201-500" },
  { name: "DigitalFirst", size: "501-1000" },
  { name: "CodeCraft Solutions", size: "51-200" },
  { name: "NextGen Software", size: "201-500" },
  { name: "ByteWorks Inc", size: "201-500" }
];

/**
 * Generate job variations from templates
 */
function generateJobs(count = 100) {
  const jobs = [];
  const today = new Date();
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  
  for (let i = 0; i < count; i++) {
    const template = jobTemplates[i % jobTemplates.length];
    const titleIndex = i % template.titleVariations.length;
    const companyIndex = i % companies.length;
    const cityIndex = i % cities.length;
    
    const isRemote = i % 3 === 0; // 33% remote
    const locationType = isRemote ? "remote" : (i % 2 === 0 ? "hybrid" : "on-site");
    
    // Vary salary by ±10%
    const salaryVariation = 0.9 + (Math.random() * 0.2);
    const minSalary = Math.floor(template.salaryRange.min * salaryVariation);
    const maxSalary = Math.floor(template.salaryRange.max * salaryVariation);
    
    const job = {
      jobId: `JOB-${String(i + 1).padStart(3, '0')}`,
      title: template.titleVariations[titleIndex],
      company: {
        name: companies[companyIndex].name,
        logo: `https://example.com/logos/${companies[companyIndex].name.toLowerCase().replace(/\s/g, '')}.png`,
        website: `https://${companies[companyIndex].name.toLowerCase().replace(/\s/g, '')}.com`,
        size: companies[companyIndex].size
      },
      location: {
        ...cities[cityIndex],
        isRemote: isRemote,
        locationType: locationType
      },
      description: `We are seeking a talented ${template.titleVariations[titleIndex]} to join our growing team. This is an excellent opportunity to work on challenging projects with modern technologies.`,
      responsibilities: [
        `Develop and maintain applications using ${template.skills.required.slice(0, 3).join(', ')}`,
        "Collaborate with cross-functional teams",
        "Write clean, maintainable code and documentation",
        "Participate in code reviews and technical discussions",
        "Contribute to architecture and design decisions"
      ],
      requirements: [
        `${template.experienceRange.min}+ years of software development experience`,
        `Strong knowledge of ${template.skills.required.join(', ')}`,
        "Excellent problem-solving skills",
        "Good communication and teamwork abilities",
        "Bachelor's degree in Computer Science or related field"
      ],
      employmentType: "full-time",
      experienceLevel: template.experienceLevel,
      experienceYears: template.experienceRange,
      salary: {
        min: minSalary,
        max: maxSalary,
        currency: "USD",
        period: "annually"
      },
      skills: {
        required: template.skills.required,
        preferred: template.skills.preferred
      },
      source: {
        platform: "seed",
        sourceUrl: `https://example.com/jobs/${String(i + 1).padStart(3, '0')}`,
        sourceJobId: `SEED-${String(i + 1).padStart(3, '0')}`
      },
      postedDate: new Date(today.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random within last 7 days
      expiresAt: oneMonthLater,
      status: "active",
      views: 0,
      applications: 0,
      benefits: ["Health Insurance", "401k", isRemote ? "Remote Work" : "Office Perks", "Learning Budget"],
      applicationUrl: `https://${companies[companyIndex].name.toLowerCase().replace(/\s/g, '')}.com/careers/${String(i + 1).padStart(3, '0')}`
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Load seed jobs into database
 */
export async function loadSeedJobs() {
  try {
    logger.info('Starting seed job loading process...');
    
    // Check if jobs already exist
    const existingCount = await Job.countDocuments({ 'source.platform': 'seed' });
    if (existingCount > 0) {
      logger.info(`${existingCount} seed jobs already exist. Skipping load.`);
      return {
        success: true,
        message: 'Seed jobs already loaded',
        count: existingCount
      };
    }
    
    // Load base seed jobs from JSON file
    const seedJobsPath = path.join(__dirname, 'seedJobs.json');
    let baseJobs = [];
    
    if (fs.existsSync(seedJobsPath)) {
      const fileContent = fs.readFileSync(seedJobsPath, 'utf-8');
      baseJobs = JSON.parse(fileContent);
      logger.info(`Loaded ${baseJobs.length} base jobs from seedJobs.json`);
    }
    
    // Generate additional jobs to reach 100 total
    const additionalJobs = generateJobs(95); // Generate 95 more (5 from JSON + 95 = 100)
    const allJobs = [...baseJobs, ...additionalJobs];
    
    // Insert all jobs
    const result = await Job.insertMany(allJobs);
    
    logger.info(`Successfully loaded ${result.length} seed jobs into database`);
    
    return {
      success: true,
      message: 'Seed jobs loaded successfully',
      count: result.length
    };
    
  } catch (error) {
    logger.error('Failed to load seed jobs:', error);
    throw error;
  }
}

/**
 * Clear all seed jobs from database
 */
export async function clearSeedJobs() {
  try {
    const result = await Job.deleteMany({ 'source.platform': 'seed' });
    logger.info(`Deleted ${result.deletedCount} seed jobs`);
    
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    logger.error('Failed to clear seed jobs:', error);
    throw error;
  }
}

export default {
  loadSeedJobs,
  clearSeedJobs,
  generateJobs
};
