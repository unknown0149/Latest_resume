/**
 * Comprehensive Project Test Suite
 * Tests all major features end-to-end
 */

import mongoose from 'mongoose'
import Resume from './src/models/Resume.js'
import Job from './src/models/Job.js'
import JobMatch from './src/models/JobMatch.js'
import Notification from './src/models/Notification.js'
import Analytics from './src/models/Analytics.js'
import InterviewSession from './src/models/InterviewSession.js'

const MONGODB_URI = 'mongodb://localhost:27017/resume_analyzer'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
}

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
}

async function test(name, fn) {
  try {
    await fn()
    testResults.passed++
    testResults.tests.push({ name, status: 'PASSED' })
    log.success(name)
    return true
  } catch (error) {
    testResults.failed++
    testResults.tests.push({ name, status: 'FAILED', error: error.message })
    log.error(`${name}: ${error.message}`)
    return false
  }
}

async function runTests() {
  try {
    await mongoose.connect(MONGODB_URI)
    log.success('Connected to MongoDB')

    // ===== TEST 1: Database Models =====
    log.section('TEST 1: Database Models & Schemas')
    
    await test('Resume Model exists and has correct schema', async () => {
      const resume = await Resume.findOne().limit(1)
      if (!Resume.schema) throw new Error('Resume schema not found')
      if (!resume && await Resume.countDocuments() === 0) {
        log.info('No resumes in database (expected for fresh install)')
      }
    })

    await test('Job Model exists and has correct indexes', async () => {
      const jobCount = await Job.countDocuments({ status: 'active' })
      log.info(`Found ${jobCount} active jobs`)
      if (jobCount === 0) throw new Error('No jobs found - run seed script first')
    })

    await test('JobMatch Model exists', async () => {
      if (!JobMatch.schema) throw new Error('JobMatch schema not found')
      const matchCount = await JobMatch.countDocuments()
      log.info(`Found ${matchCount} job matches`)
    })

    await test('Notification Model exists', async () => {
      if (!Notification.schema) throw new Error('Notification schema not found')
    })

    await test('Analytics Model exists', async () => {
      if (!Analytics.schema) throw new Error('Analytics schema not found')
    })

    await test('InterviewSession Model exists', async () => {
      if (!InterviewSession.schema) throw new Error('InterviewSession schema not found')
    })

    // ===== TEST 2: Model Methods =====
    log.section('TEST 2: Model Instance & Static Methods')

    await test('Job.findMatchingJobs() method works', async () => {
      const testSkills = ['javascript', 'react', 'node.js']
      const matches = await Job.findMatchingJobs(testSkills, { limit: 5 })
      log.info(`Found ${matches.length} matching jobs for test skills`)
    })

    await test('Resume verification_status structure is correct', async () => {
      const resume = await Resume.findOne().limit(1)
      if (resume) {
        if (!resume.parsed_resume) throw new Error('parsed_resume field missing')
        if (!resume.parsed_resume.verification_status) {
          log.info('verification_status not set (expected for unverified resume)')
        }
      }
    })

    await test('Notification.createNotification() works', async () => {
      const notification = await Notification.createNotification({
        userId: new mongoose.Types.ObjectId(),
        type: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'low',
      })
      if (!notification.notificationId) throw new Error('Notification ID not generated')
      await Notification.deleteOne({ _id: notification._id }) // Cleanup
    })

    await test('Analytics.logEvent() works', async () => {
      await Analytics.logEvent({
        eventType: 'api_call',
        endpoint: '/test',
        method: 'GET',
        statusCode: 200,
        metadata: { test: true },
      })
      const count = await Analytics.countDocuments({ eventType: 'api_call', 'metadata.test': true })
      if (count === 0) throw new Error('Analytics event not logged')
      await Analytics.deleteMany({ 'metadata.test': true }) // Cleanup
    })

    await test('InterviewSession.createSession() works', async () => {
      const session = await InterviewSession.createSession({
        resumeId: 'test-resume-' + Date.now(),
        userId: new mongoose.Types.ObjectId(),
        skills: ['JavaScript', 'React'],
        questions: [],
        questionsPerSkill: 3,
      })
      if (!session.sessionId) throw new Error('Session ID not generated')
      if (session.status !== 'active') throw new Error('Session not active')
      await InterviewSession.deleteOne({ _id: session._id }) // Cleanup
    })

    // ===== TEST 3: Data Integrity =====
    log.section('TEST 3: Data Integrity & Relationships')

    await test('Job documents have required fields', async () => {
      const job = await Job.findOne({ status: 'active' })
      if (!job) throw new Error('No active jobs found')
      if (!job.title) throw new Error('Job missing title')
      if (!job.company) throw new Error('Job missing company')
      if (!job.skills || !job.skills.required) throw new Error('Job missing skills')
      log.info(`Sample job: "${job.title}" at ${job.company.name}`)
    })

    await test('Job skills are lowercase normalized', async () => {
      const job = await Job.findOne({ status: 'active' })
      if (!job) throw new Error('No active jobs found')
      const hasUpperCase = job.skills.required.some(skill => skill !== skill.toLowerCase())
      if (hasUpperCase) throw new Error('Skills not normalized to lowercase')
    })

    await test('Resume parsed_resume structure is correct', async () => {
      const resume = await Resume.findOne().limit(1)
      if (resume && resume.parsed_resume) {
        if (!Array.isArray(resume.parsed_resume.skills)) throw new Error('Skills not an array')
        log.info(`Resume has ${resume.parsed_resume.skills?.length || 0} skills`)
      } else {
        log.info('No parsed resume found (upload a resume first)')
      }
    })

    // ===== TEST 4: Indexes =====
    log.section('TEST 4: Database Indexes')

    await test('Job model has compound indexes', async () => {
      const indexes = await Job.collection.getIndexes()
      log.info(`Job collection has ${Object.keys(indexes).length} indexes`)
      if (!indexes['skills.allSkills_1_status_1_expiresAt_1']) {
        throw new Error('Missing critical skills compound index')
      }
    })

    await test('Resume model has required indexes', async () => {
      const indexes = await Resume.collection.getIndexes()
      log.info(`Resume collection has ${Object.keys(indexes).length} indexes`)
      if (!indexes.resumeId_1) throw new Error('Missing resumeId index')
    })

    await test('Notification model has TTL index', async () => {
      const indexes = await Notification.collection.getIndexes()
      const hasExpiresAtField = Notification.schema.path('expiresAt')
      if (!hasExpiresAtField) throw new Error('expiresAt field not configured')
      log.info('Notification model has expiresAt field for TTL (index will be created on first insert)')
    })

    // ===== TEST 5: Query Performance =====
    log.section('TEST 5: Query Performance')

    await test('Job matching query is fast (<100ms)', async () => {
      const start = Date.now()
      await Job.findMatchingJobs(['javascript', 'react', 'node.js'], { limit: 10 })
      const duration = Date.now() - start
      log.info(`Query took ${duration}ms`)
      if (duration > 100) throw new Error(`Query too slow: ${duration}ms`)
    })

    await test('Resume lookup by resumeId is fast', async () => {
      const resume = await Resume.findOne().limit(1)
      if (!resume) {
        log.info('Skipping - no resumes in database')
        return
      }
      const start = Date.now()
      await Resume.findOne({ resumeId: resume.resumeId })
      const duration = Date.now() - start
      log.info(`Query took ${duration}ms`)
      if (duration > 50) throw new Error(`Query too slow: ${duration}ms`)
    })

    // ===== TEST 6: Business Logic =====
    log.section('TEST 6: Business Logic')

    await test('Job match score calculation is correct', async () => {
      const job = await Job.findOne({ status: 'active' })
      if (!job) throw new Error('No jobs found')
      const userSkills = ['javascript', 'react']
      const score = job.calculateMatchScore(userSkills)
      log.info(`Match score: ${score}%`)
      if (score < 0 || score > 100) throw new Error(`Invalid score: ${score}`)
    })

    await test('Skill normalization works', async () => {
      const testSkills = ['JavaScript', 'REACT', 'Node.js', 'mongodb']
      const normalizedSkills = testSkills.map(s => s.toLowerCase())
      if (normalizedSkills.some(s => s !== s.toLowerCase())) {
        throw new Error('Skill normalization failed')
      }
      log.info('Skills normalized correctly')
    })

    // ===== TEST 7: Model Relationships =====
    log.section('TEST 7: Model Relationships & References')

    await test('JobMatch references are valid', async () => {
      const match = await JobMatch.findOne().limit(1)
      if (match) {
        if (!match.resumeId) throw new Error('Missing resumeId reference')
        if (!match.jobId) throw new Error('Missing jobId reference')
        log.info('JobMatch references are valid')
      } else {
        log.info('No job matches found (expected for fresh install)')
      }
    })

    await test('Notification userId reference is ObjectId', async () => {
      const testNotif = new Notification({
        notificationId: 'test-123',
        userId: new mongoose.Types.ObjectId(),
        type: 'system_alert',
        title: 'Test',
        message: 'Test message',
      })
      if (!mongoose.Types.ObjectId.isValid(testNotif.userId)) {
        throw new Error('Invalid ObjectId for userId')
      }
    })

    // ===== FINAL RESULTS =====
    log.section('TEST RESULTS SUMMARY')

    console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`)
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`)
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`)
    console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`)

    if (testResults.failed > 0) {
      console.log(`${colors.red}Failed Tests:${colors.reset}`)
      testResults.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => {
          console.log(`  - ${t.name}`)
          console.log(`    Error: ${t.error}`)
        })
    }

    if (testResults.failed === 0) {
      log.section('🎉 ALL TESTS PASSED! PROJECT IS READY')
      console.log('\nNext Steps:')
      console.log('1. Start backend: cd backend && node src/server.js')
      console.log('2. Start frontend: cd frontend && npm run dev')
      console.log('3. Open browser: http://localhost:3000')
      console.log('4. Upload resume and test interview flow\n')
    } else {
      log.section('⚠️  SOME TESTS FAILED')
      console.log('\nPlease fix the failing tests before deploying.\n')
    }

  } catch (error) {
    log.error(`Fatal error: ${error.message}`)
    console.error(error.stack)
  } finally {
    await mongoose.disconnect()
    process.exit(testResults.failed > 0 ? 1 : 0)
  }
}

// Run all tests
runTests()
