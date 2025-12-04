import React, { useState, useEffect } from 'react'
import { User, Mail, MapPin, Briefcase, Calendar, Edit, Award, TrendingUp, FileText, Target, BookOpen, Clock } from 'lucide-react'
import Button from '../ui/Button'
import VerificationBadge from '../ui/VerificationBadge'
import { interviewAPI } from '../../services/api'

const ProfileCard = ({ user, resume }) => {
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [learningProgress, setLearningProgress] = useState({ completed: 0, total: 0, percentage: 0, currentGoals: [] })

  // Fetch verification status
  useEffect(() => {
    if (resume?.resumeId) {
      fetchVerificationStatus()
    }
  }, [resume?.resumeId])

  // Calculate learning progress from roadmap
  useEffect(() => {
    const calculateProgress = () => {
      const saved = localStorage.getItem('roadmap_progress')
      const completedGoals = saved ? JSON.parse(saved) : {}
      
      // Get roadmap data from resume
      const roadmap = resume?.job_analysis?.roadmap || resume?.roadmap
      
      if (!roadmap) {
        setLearningProgress({ completed: 0, total: 0, percentage: 0, currentGoals: [] })
        return
      }

      // Count total goals across all phases
      let totalGoals = 0
      let currentGoals = []
      
      const phases = [roadmap.month30, roadmap.month60, roadmap.month90].filter(Boolean)
      phases.forEach(phase => {
        if (phase.goals) {
          totalGoals += phase.goals.length
          // Get first 3 incomplete goals as current goals
          if (currentGoals.length < 3) {
            phase.goals.forEach(goal => {
              if (!completedGoals[goal.id] && currentGoals.length < 3) {
                currentGoals.push(goal)
              }
            })
          }
        }
      })
      
      const completedCount = Object.values(completedGoals).filter(Boolean).length
      const percentage = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0
      
      setLearningProgress({
        completed: completedCount,
        total: totalGoals,
        percentage,
        currentGoals
      })
    }
    
    calculateProgress()
    
    // Listen for storage changes (when goals are completed in roadmap tab)
    const handleStorageChange = () => calculateProgress()
    window.addEventListener('storage', handleStorageChange)
    
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [resume])

  // Fetch verification status
  useEffect(() => {
    if (resume?.resumeId) {
      fetchVerificationStatus()
    }
  }, [resume?.resumeId])

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true)
      const response = await interviewAPI.getVerificationStatus(resume.resumeId)
      if (response.success) {
        setVerificationStatus(response.verification)
      }
    } catch (error) {
      console.error('Error fetching verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProfileCompleteness = () => {
    let completeness = 0
    const fields = [
      user?.name,
      user?.email,
      user?.tagline,
      user?.bio,
      user?.location,
      user?.phone,
      user?.social_links?.linkedin,
      user?.social_links?.github,
      resume?.parsed_resume?.skills?.length > 0,
      resume?.parsed_resume?.experience?.length > 0
    ]
    
    fields.forEach(field => {
      if (field) completeness += 10
    })
    
    return Math.min(completeness, 100)
  }

  const profileCompleteness = getProfileCompleteness()

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden">
        <div className="p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-4xl font-bold">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                {verificationStatus?.isVerified && (
                  <div className="absolute -bottom-2 -right-2">
                    <div className="bg-white rounded-full p-1">
                      <Award className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div>
                <h2 className="text-3xl font-bold mb-2">{user?.name || 'User Name'}</h2>
                {user?.tagline && (
                  <p className="text-white/90 text-lg mb-3">{user.tagline}</p>
                )}
                <div className="flex flex-wrap gap-4 text-white/80">
                  {user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}
                  {user?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{user.location}</span>
                    </div>
                  )}
                  {resume?.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Joined {new Date(resume.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* Bio */}
          {user?.bio && (
            <p className="text-white/90 leading-relaxed max-w-3xl">
              {user.bio}
            </p>
          )}
        </div>

        {/* Profile Completeness */}
        <div className="bg-white/10 backdrop-blur-sm px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 font-medium">Profile Completeness</span>
            <span className="text-white font-bold">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Verification Status Card */}
      {verificationStatus && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Skill Verification</h3>
              <p className="text-gray-600">Your skills credibility assessment</p>
            </div>
            {verificationStatus.badge && (
              <VerificationBadge
                badge={verificationStatus.badge}
                credibilityScore={verificationStatus.credibilityScore}
                trustLevel={verificationStatus.trustLevel}
                showScore={false}
                size="lg"
              />
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {verificationStatus.credibilityScore || 0}
              </div>
              <div className="text-sm text-gray-600">Credibility Score</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {verificationStatus.verifiedSkills?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Verified Skills</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {verificationStatus.questionableSkills?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Needs Improvement</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {verificationStatus.totalInterviews || 0}
              </div>
              <div className="text-sm text-gray-600">Interviews Taken</div>
            </div>
          </div>

          {/* Verified Skills */}
          {verificationStatus.verifiedSkills?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Verified Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {verificationStatus.verifiedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {skill.skill} ({skill.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Questionable Skills */}
          {verificationStatus.questionableSkills?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-600" />
                Skills Needing Improvement
              </h4>
              <div className="flex flex-wrap gap-2">
                {verificationStatus.questionableSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                  >
                    {skill.skill} ({skill.score}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Interview */}
          {verificationStatus.lastInterviewAt && (
            <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
              Last interview: {new Date(verificationStatus.lastInterviewAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Activity & Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {user?.stats?.resumesUploaded || 0}
              </div>
              <div className="text-sm text-gray-600">Resumes Uploaded</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {user?.stats?.jobsApplied || 0}
              </div>
              <div className="text-sm text-gray-600">Jobs Applied</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {user?.stats?.jobsViewed || 0}
              </div>
              <div className="text-sm text-gray-600">Jobs Viewed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Progress Section */}
      {learningProgress.total > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Current Learning Progress</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Switch to Roadmap tab (assuming parent component handles tab switching)
                const event = new CustomEvent('switchTab', { detail: 'roadmap' })
                window.dispatchEvent(event)
              }}
            >
              View Full Roadmap
            </Button>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-indigo-600">
                {learningProgress.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${learningProgress.percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {learningProgress.completed} of {learningProgress.total} goals completed
            </div>
          </div>

          {/* Current Goals */}
          {learningProgress.currentGoals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-gray-900">Currently Studying</h4>
              </div>
              <div className="space-y-2">
                {learningProgress.currentGoals.map((goal, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {goal.description}
                        </p>
                      </div>
                      {goal.estimatedHours && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-3">
                          <Clock className="w-3 h-3" />
                          <span>{goal.estimatedHours}h</span>
                        </div>
                      )}
                    </div>
                    {goal.priority && (
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                          goal.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : goal.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {goal.priority} priority
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {learningProgress.currentGoals.length === 0 && learningProgress.total > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">🎉 All goals completed! Great job!</p>
            </div>
          )}
        </div>
      )}

      {/* Social Links Card */}
      {(user?.social_links?.linkedin || user?.social_links?.github || user?.social_links?.portfolio) && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Connect</h3>
          <div className="flex flex-wrap gap-4">
            {user.social_links.linkedin && (
              <a
                href={user.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {user.social_links.github && (
              <a
                href={user.social_links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            )}
            {user.social_links.portfolio && (
              <a
                href={user.social_links.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <User className="h-5 w-5" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileCard
