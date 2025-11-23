/**
 * JobMatch Model - Tracks user-job interactions and match history
 * Used for analytics, personalization, and tracking application status
 */

import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    resumeId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Match Information
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedSkills: [{
      type: String,
      lowercase: true,
    }],
    missingSkills: [{
      type: String,
      lowercase: true,
    }],
    
    // User Interactions
    viewed: {
      type: Boolean,
      default: false,
    },
    viewedAt: Date,
    
    applied: {
      type: Boolean,
      default: false,
    },
    appliedAt: Date,
    
    saved: {
      type: Boolean,
      default: false,
    },
    savedAt: Date,
    
    dismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: Date,
    
    // AI-Generated Summary (from Watson)
    aiSummary: {
      type: String,
      default: null,
    },
    aiSummaryGeneratedAt: Date,
    
    // Application Status Tracking
    applicationStatus: {
      type: String,
      enum: ['not_applied', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
      default: 'not_applied',
    },
    
    // Feedback
    userFeedback: {
      helpful: {
        type: Boolean,
        default: null,
      },
      notes: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ===== COMPOUND INDEXES =====

// Unique constraint - one match record per user-resume-job combination
jobMatchSchema.index({ userId: 1, resumeId: 1, jobId: 1 }, { unique: true });

// For fetching user's matches sorted by score
jobMatchSchema.index({ userId: 1, matchScore: -1 });

// For fetching resume-specific matches
jobMatchSchema.index({ resumeId: 1, matchScore: -1 });

// For tracking applications
jobMatchSchema.index({ userId: 1, applied: 1, appliedAt: -1 });

// For saved jobs
jobMatchSchema.index({ userId: 1, saved: 1, savedAt: -1 });

// ===== INSTANCE METHODS =====

// Mark as viewed
jobMatchSchema.methods.markAsViewed = function () {
  if (!this.viewed) {
    this.viewed = true;
    this.viewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Mark as applied
jobMatchSchema.methods.markAsApplied = function () {
  if (!this.applied) {
    this.applied = true;
    this.appliedAt = new Date();
    this.applicationStatus = 'applied';
    return this.save();
  }
  return Promise.resolve(this);
};

// Toggle saved status
jobMatchSchema.methods.toggleSaved = function () {
  this.saved = !this.saved;
  this.savedAt = this.saved ? new Date() : null;
  return this.save();
};

// Dismiss match
jobMatchSchema.methods.dismiss = function () {
  this.dismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

// Update application status
jobMatchSchema.methods.updateApplicationStatus = function (status) {
  this.applicationStatus = status;
  return this.save();
};

// Add AI summary
jobMatchSchema.methods.addAISummary = function (summary) {
  this.aiSummary = summary;
  this.aiSummaryGeneratedAt = new Date();
  return this.save();
};

// ===== STATIC METHODS =====

// Get matches for a resume
jobMatchSchema.statics.getMatchesForResume = async function (resumeId, options = {}) {
  const {
    limit = 20,
    minScore = 0,
    onlySaved = false,
    excludeDismissed = true,
  } = options;
  
  const query = { resumeId };
  if (minScore > 0) query.matchScore = { $gte: minScore };
  if (onlySaved) query.saved = true;
  if (excludeDismissed) query.dismissed = { $ne: true };
  
  return this.find(query)
    .sort({ matchScore: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Get applied jobs for a user
jobMatchSchema.statics.getAppliedJobs = async function (userId) {
  return this.find({ userId, applied: true })
    .sort({ appliedAt: -1 })
    .lean();
};

// Get saved jobs for a user
jobMatchSchema.statics.getSavedJobs = async function (userId) {
  return this.find({ userId, saved: true })
    .sort({ savedAt: -1 })
    .lean();
};

// Get match statistics for a user
jobMatchSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalMatches: { $sum: 1 },
        avgMatchScore: { $avg: '$matchScore' },
        viewedCount: { $sum: { $cond: ['$viewed', 1, 0] } },
        appliedCount: { $sum: { $cond: ['$applied', 1, 0] } },
        savedCount: { $sum: { $cond: ['$saved', 1, 0] } },
        dismissedCount: { $sum: { $cond: ['$dismissed', 1, 0] } },
      },
    },
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalMatches: 0,
    avgMatchScore: 0,
    viewedCount: 0,
    appliedCount: 0,
    savedCount: 0,
    dismissedCount: 0,
  };
};

// Find or create a match
jobMatchSchema.statics.findOrCreate = async function (matchData) {
  const existing = await this.findOne({
    userId: matchData.userId,
    resumeId: matchData.resumeId,
    jobId: matchData.jobId,
  });
  
  if (existing) {
    // Update match score if it changed
    if (existing.matchScore !== matchData.matchScore) {
      existing.matchScore = matchData.matchScore;
      existing.matchedSkills = matchData.matchedSkills;
      existing.missingSkills = matchData.missingSkills;
      await existing.save();
    }
    return existing;
  }
  
  return this.create(matchData);
};

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

export default JobMatch;
