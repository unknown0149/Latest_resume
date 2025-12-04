/**
 * InterviewSession Model - Track interview sessions and answers
 * Stores detailed interview attempts for audit and improvement
 */

import mongoose from 'mongoose'

const interviewSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    resumeId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    
    // Interview Configuration
    jobId: {
      type: String,
      default: null,
      index: true,
    },
    skills: [{
      type: String,
      required: true,
    }],
    questionsPerSkill: {
      type: Number,
      default: 3,
    },
    
    // Questions Generated
    questions: [{
      id: String,
      skill: String,
      question: String,
      options: [String],
      correctAnswer: String, // Stored but never sent to client
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
      },
      field: String, // IT, Finance, Fashion, etc.
    }],
    
    // User Answers
    answers: [{
      questionId: String,
      selectedOption: String,
      isCorrect: Boolean,
      answeredAt: Date,
    }],
    
    // Results
    results: {
      score: Number, // 0-100
      correctAnswers: Number,
      totalQuestions: Number,
      timeSpent: Number, // seconds
      skillBreakdown: [{
        skill: String,
        score: Number,
        questionsAsked: Number,
        questionsCorrect: Number,
        status: {
          type: String,
          enum: ['verified', 'questionable', 'failed'],
        },
      }],
      credibilityScore: Number, // Overall resume credibility (0-100)
      badge: {
        level: String,
        label: String,
        color: String,
        icon: String,
      },
    },
    
    // Session Status
    status: {
      type: String,
      enum: ['active', 'completed', 'expired', 'abandoned'],
      default: 'active',
      index: true,
    },
    
    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Metadata
    metadata: {
      userAgent: String,
      ipAddress: String,
      timeLimitSeconds: Number,
      autoSubmitted: Boolean, // True if submitted due to timeout
    },
  },
  {
    timestamps: true,
  }
)

// ===== INDEXES =====

// Compound index for user's interview history
interviewSessionSchema.index({ userId: 1, status: 1, startedAt: -1 })
interviewSessionSchema.index({ resumeId: 1, status: 1, startedAt: -1 })

// TTL Index - Auto-delete expired sessions
interviewSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// ===== INSTANCE METHODS =====

// Mark as completed
interviewSessionSchema.methods.complete = function (results) {
  this.status = 'completed'
  this.completedAt = new Date()
  this.results = results
  return this.save()
}

// Mark as abandoned
interviewSessionSchema.methods.abandon = function () {
  if (this.status === 'active') {
    this.status = 'abandoned'
    return this.save()
  }
  return Promise.resolve(this)
}

// Get progress
interviewSessionSchema.methods.getProgress = function () {
  const answeredCount = this.answers.length
  const totalQuestions = this.questions.length
  
  return {
    answered: answeredCount,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
    remaining: totalQuestions - answeredCount,
  }
}

// ===== STATIC METHODS =====

// Create new session
interviewSessionSchema.statics.createSession = async function (sessionData) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  
  return this.create({
    sessionId,
    expiresAt,
    ...sessionData,
  })
}

// Get active session for resume
interviewSessionSchema.statics.getActiveSession = async function (resumeId) {
  return this.findOne({
    resumeId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  }).sort({ startedAt: -1 })
}

// Get user's interview history
interviewSessionSchema.statics.getUserHistory = async function (userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    status = 'completed',
  } = options
  
  return this.find({
    userId,
    status,
  })
    .sort({ startedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-questions.correctAnswer') // Don't expose correct answers
    .lean()
}

// Get user interview stats
interviewSessionSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalInterviews: { $sum: 1 },
        avgScore: { $avg: '$results.score' },
        highestScore: { $max: '$results.score' },
        lowestScore: { $min: '$results.score' },
        totalTimeSpent: { $sum: '$results.timeSpent' },
      },
    },
  ])
  
  return stats[0] || {
    totalInterviews: 0,
    avgScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalTimeSpent: 0,
  }
}

// Get skill performance across all interviews
interviewSessionSchema.statics.getSkillPerformance = async function (userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
      },
    },
    {
      $unwind: '$results.skillBreakdown',
    },
    {
      $group: {
        _id: '$results.skillBreakdown.skill',
        avgScore: { $avg: '$results.skillBreakdown.score' },
        timesAsked: { $sum: 1 },
        verifiedCount: {
          $sum: {
            $cond: [
              { $eq: ['$results.skillBreakdown.status', 'verified'] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { avgScore: -1 },
    },
  ])
}

// Clean up expired sessions
interviewSessionSchema.statics.cleanupExpired = async function () {
  return this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  )
}

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema)

export default InterviewSession
