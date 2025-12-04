/**
 * Analytics Model - Track user behavior and system metrics
 * Used for insights, recommendations, and performance monitoring
 */

import mongoose from 'mongoose'

const analyticsSchema = new mongoose.Schema(
  {
    analyticsId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Event Type
    eventType: {
      type: String,
      enum: [
        // User Actions
        'user_registered',
        'user_login',
        'resume_uploaded',
        'resume_parsed',
        'job_viewed',
        'job_saved',
        'job_applied',
        'job_dismissed',
        'search_performed',
        'filter_applied',
        
        // Interview Events
        'interview_started',
        'interview_completed',
        'interview_abandoned',
        'badge_earned',
        'skill_verified',
        
        // System Events
        'api_call',
        'error_occurred',
        'watson_api_call',
        'embedding_generated',
        'job_matched',
      ],
      required: true,
      index: true,
    },
    
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    
    // Event Data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Performance Metrics
    duration: {
      type: Number, // milliseconds
      default: null,
    },
    
    // Request Info
    endpoint: String,
    method: String,
    statusCode: Number,
    
    // Error Info (if applicable)
    error: {
      message: String,
      stack: String,
      code: String,
    },
    
    // Device & Location
    userAgent: String,
    ipAddress: String,
    country: String,
    
    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
  }
)

// ===== INDEXES =====

// Compound indexes for common queries
analyticsSchema.index({ eventType: 1, timestamp: -1 })
analyticsSchema.index({ userId: 1, eventType: 1, timestamp: -1 })
analyticsSchema.index({ timestamp: -1, eventType: 1 })

// TTL Index - Auto-delete old analytics after 90 days
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // 90 days

// ===== STATIC METHODS =====

// Log an event
analyticsSchema.statics.logEvent = async function (eventData) {
  const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    await this.create({
      analyticsId,
      ...eventData,
    })
  } catch (error) {
    console.error('Analytics logging failed:', error.message)
    // Don't throw - analytics should never break the app
  }
}

// Get user activity summary
analyticsSchema.statics.getUserActivity = async function (userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ])
}

// Get system metrics
analyticsSchema.statics.getSystemMetrics = async function (hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          hour: { $hour: '$timestamp' },
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        errors: {
          $sum: {
            $cond: [{ $ifNull: ['$error', false] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { '_id.hour': 1 },
    },
  ])
}

// Get popular jobs
analyticsSchema.statics.getPopularJobs = async function (limit = 10, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return this.aggregate([
    {
      $match: {
        eventType: { $in: ['job_viewed', 'job_applied', 'job_saved'] },
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$metadata.jobId',
        views: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'job_viewed'] }, 1, 0],
          },
        },
        applications: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'job_applied'] }, 1, 0],
          },
        },
        saves: {
          $sum: {
            $cond: [{ $eq: ['$eventType', 'job_saved'] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { applications: -1, views: -1 },
    },
    {
      $limit: limit,
    },
  ])
}

// Get interview completion rate
analyticsSchema.statics.getInterviewStats = async function (days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const stats = await this.aggregate([
    {
      $match: {
        eventType: { $in: ['interview_started', 'interview_completed', 'interview_abandoned'] },
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
      },
    },
  ])
  
  const result = {
    started: 0,
    completed: 0,
    abandoned: 0,
    completionRate: 0,
  }
  
  stats.forEach(stat => {
    if (stat._id === 'interview_started') result.started = stat.count
    if (stat._id === 'interview_completed') result.completed = stat.count
    if (stat._id === 'interview_abandoned') result.abandoned = stat.count
  })
  
  if (result.started > 0) {
    result.completionRate = Math.round((result.completed / result.started) * 100)
  }
  
  return result
}

// Get error rate
analyticsSchema.statics.getErrorRate = async function (hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  const total = await this.countDocuments({
    eventType: 'api_call',
    timestamp: { $gte: startDate },
  })
  
  const errors = await this.countDocuments({
    eventType: 'error_occurred',
    timestamp: { $gte: startDate },
  })
  
  return {
    total,
    errors,
    errorRate: total > 0 ? Math.round((errors / total) * 10000) / 100 : 0,
  }
}

// Get Watson API usage
analyticsSchema.statics.getWatsonUsage = async function (days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return this.aggregate([
    {
      $match: {
        eventType: 'watson_api_call',
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ])
}

const Analytics = mongoose.model('Analytics', analyticsSchema)

export default Analytics
