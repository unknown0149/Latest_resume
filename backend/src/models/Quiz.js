/**
 * Quiz Model - MCQ Skill Assessment
 * Stores quiz history and results for skill validation
 */

import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resumeId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  skillName: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  questions: [{
    id: Number,
    question: String,
    options: [String],
    correctAnswer: Number, // Index of correct option (0-3)
    explanation: String,
    difficulty: String,
    userAnswer: Number, // User's selected answer index
    isCorrect: Boolean,
    timeSpent: Number // Seconds spent on this question
  }],
  score: {
    type: Number, 
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    default: 5
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number, // Minutes
    default: 30
  },
  timeSpent: {
    type: Number, // Actual seconds spent
    default: 0
  },
  status: {
    type: String,
    enum: ['generated', 'in-progress', 'completed', 'abandoned'],
    default: 'generated'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }
  },
  metadata: {
    provider: String, // Which AI generated the questions
    model: String,
    questionsFrom: String, // 'ai', 'rule-based', 'cached'
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
quizSchema.index({ resumeId: 1, skillName: 1 });
quizSchema.index({ status: 1, completedAt: -1 });
quizSchema.index({ createdAt: -1 });

/**
 * Calculate quiz score and feedback
 */
quizSchema.methods.calculateResults = function() {
  const correctCount = this.questions.filter(q => q.isCorrect).length;
  const totalQuestions = this.questions.length;
  
  this.correctAnswers = correctCount;
  this.score = Math.round((correctCount / totalQuestions) * 100);
  
  // Determine proficiency level based on score
  let proficiencyLevel = 'Beginner';
  if (this.score >= 90) proficiencyLevel = 'Expert';
  else if (this.score >= 75) proficiencyLevel = 'Advanced';
  else if (this.score >= 50) proficiencyLevel = 'Intermediate';
  
  // Generate feedback
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];
  
  if (this.score >= 80) {
    strengths.push(`Strong understanding of ${this.skillName}`);
    recommendations.push(`Consider learning advanced ${this.skillName} patterns`);
  } else if (this.score >= 60) {
    strengths.push(`Good foundation in ${this.skillName}`);
    weaknesses.push('Some concepts need reinforcement');
    recommendations.push(`Practice more ${this.skillName} problems`);
  } else {
    weaknesses.push(`Basic concepts of ${this.skillName} need work`);
    recommendations.push(`Start with ${this.skillName} fundamentals course`);
    recommendations.push('Practice daily for 30 minutes');
  }
  
  // Analyze time spent
  const avgTimePerQuestion = this.timeSpent / totalQuestions;
  if (avgTimePerQuestion < 30) {
    recommendations.push('Take more time to read questions carefully');
  }
  
  this.feedback = {
    strengths,
    weaknesses,
    recommendations,
    proficiencyLevel
  };
  
  return this.feedback;
};

/**
 * Get quiz history for a user
 */
quizSchema.statics.getHistory = async function(resumeId, options = {}) {
  const { limit = 10, skillName = null } = options;
  
  const query = { resumeId, status: 'completed' };
  if (skillName) query.skillName = skillName;
  
  return this.find(query)
    .sort({ completedAt: -1 })
    .limit(limit)
    .select('-questions.userAnswer -questions.isCorrect'); // Hide answers for privacy
};

/**
 * Get average score for a skill
 */
quizSchema.statics.getAverageScore = async function(resumeId, skillName) {
  const quizzes = await this.find({ 
    resumeId, 
    skillName, 
    status: 'completed' 
  });
  
  if (quizzes.length === 0) return null;
  
  const avgScore = quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length;
  const latestScore = quizzes[0].score;
  const improvement = quizzes.length > 1 
    ? latestScore - quizzes[quizzes.length - 1].score 
    : 0;
  
  return {
    averageScore: Math.round(avgScore),
    latestScore: latestScore,
    improvement: improvement,
    totalAttempts: quizzes.length
  };
};

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
