import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { interviewAPI } from '../services/api'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const InterviewModal = ({ isOpen, onClose, resumeId, skills, onComplete, timeLimit = null }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)

  // Generate interview questions
  useEffect(() => {
    if (isOpen && resumeId && skills?.length > 0) {
      generateInterview()
    }
  }, [isOpen, resumeId, skills])

  // Timer countdown
  useEffect(() => {
    if (timeLimit && timeRemaining > 0 && !results) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit() // Auto-submit when time runs out
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLimit, timeRemaining, results])

  const generateInterview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await interviewAPI.generateInterview(resumeId, skills, {
        questionsPerSkill: 3,
        difficulty: { easy: 40, medium: 40, hard: 20 }
      })
      
      if (response.success) {
        setSessionId(response.sessionId)
        setQuestions(response.questions)
        setCurrentQuestionIndex(0)
        setAnswers({})
      } else {
        setError(response.message || 'Failed to generate interview questions')
      }
    } catch (err) {
      console.error('Error generating interview:', err)
      setError(err.response?.data?.message || 'Failed to generate interview questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)
      
      // Format answers for API
      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null
      }))

      const response = await interviewAPI.submitInterview(sessionId, formattedAnswers)
      
      if (response.success) {
        setResults(response.results)
        if (onComplete) {
          onComplete(response.results)
        }
      } else {
        setError(response.message || 'Failed to submit interview')
      }
    } catch (err) {
      console.error('Error submitting interview:', err)
      setError(err.response?.data?.message || 'Failed to submit interview')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (results || window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      setLoading(true)
      setError(null)
      setSessionId(null)
      setQuestions([])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResults(null)
      setTimeRemaining(timeLimit)
      onClose()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Skill Verification Interview</h2>
          {timeLimit && !results && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating interview questions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {results && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Complete!</h3>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {results.score}%
              </div>
              <p className="text-gray-700">
                {results.correctAnswers} out of {results.totalQuestions} correct
              </p>
            </div>

            {/* Credibility Score */}
            {results.credibilityScore !== undefined && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Credibility Score</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${results.credibilityScore}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {results.credibilityScore}
                  </span>
                </div>
                {results.badge && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      results.badge.color === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      results.badge.color === 'silver' ? 'bg-gray-100 text-gray-800' :
                      results.badge.color === 'bronze' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {results.badge.icon} {results.badge.label}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Verified Skills */}
            {results.verifiedSkills?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Verified Skills ({results.verifiedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.verifiedSkills.map((skill, idx) => (
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
            {results.questionableSkills?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Needs Improvement ({results.questionableSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.questionableSkills.map((skill, idx) => (
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

            {/* Action Button */}
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Question View */}
        {!loading && !error && !results && currentQuestion && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{getAnsweredCount()} answered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-blue-600">
                      {currentQuestion.skill}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentQuestion.question}
                  </h3>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const optionKey = ['A', 'B', 'C', 'D'][idx]
                  const isSelected = answers[currentQuestion.id] === optionKey
                  
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={optionKey}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(currentQuestion.id, optionKey)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">{optionKey}.</span>{' '}
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || getAnsweredCount() === 0}
                    className="min-w-32"
                  >
                    {submitting ? 'Submitting...' : 'Submit Interview'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
            </div>

            {/* Unanswered Warning */}
            {currentQuestionIndex === questions.length - 1 && getAnsweredCount() < questions.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ You have {questions.length - getAnsweredCount()} unanswered question(s). 
                  Unanswered questions will be marked as incorrect.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default InterviewModal
