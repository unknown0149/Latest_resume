import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, XCircle, Clock, Award, AlertCircle, Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import { resumeAPI } from '../../services/api'

const MCQVerificationModal = ({ isOpen, onClose, skill, resumeId, onVerificationComplete }) => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch MCQ questions when modal opens
  useEffect(() => {
    if (isOpen && skill) {
      fetchQuestions()
    }
  }, [isOpen, skill])

  // Timer countdown
  useEffect(() => {
    if (!isOpen || showResults || loading) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, showResults, loading])

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log(`Fetching MCQ questions for skill: ${skill}`)
      const response = await resumeAPI.generateMCQQuestions(skill, 5)
      console.log('MCQ Response:', response)
      
      if (response.success && response.questions && response.questions.length > 0) {
        setQuestions(response.questions)
        setTimeRemaining(300) // Reset timer to 5 minutes
      } else {
        throw new Error('No questions received from server')
      }
    } catch (err) {
      console.error('Error fetching MCQ questions:', err)
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to generate questions. This could be due to API limits or network issues.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    fetchQuestions()
  }

  const handleAnswer = (questionIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex,
    })
  }

  const handleSubmit = async () => {
    if (submitting || loading || !questions.length) {
      return
    }
    setSubmitting(true)
    try {
      let correctCount = 0
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++
        }
      })
      const finalScore = Math.round((correctCount / questions.length) * 100)
      setScore(finalScore)
      setShowResults(true)

      if (resumeId) {
        try {
          await resumeAPI.saveSkillVerification(resumeId, skill, finalScore, correctCount, questions.length)
        } catch (err) {
          console.error('Error saving verification:', err)
        }
      }

      if (onVerificationComplete) {
        onVerificationComplete(skill, finalScore)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleClose = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setScore(0)
    setTimeRemaining(300)
    setQuestions([])
    setSubmitting(false)
    onClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Skill Verification</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/90">Testing your knowledge of: <span className="font-semibold">{skill}</span></p>
              {!showResults && !loading && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-gray-600">Generating questions using Watson AI...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-900 font-semibold mb-2">Error Loading Questions</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchQuestions}>Retry</Button>
              </div>
            )}

            {!loading && !error && !showResults && questions.length > 0 && (
              <div>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                    <span>{Object.keys(answers).length} answered</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {questions[currentQuestion].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(currentQuestion, idx)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          answers[currentQuestion] === idx
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              answers[currentQuestion] === idx
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {answers[currentQuestion] === idx && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-gray-900">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={answers[currentQuestion] === undefined || submitting}
                  >
                    {currentQuestion === questions.length - 1 ? (submitting ? 'Submitting...' : 'Submit') : 'Next'}
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            {showResults && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
                    score >= 70
                      ? 'bg-green-100 text-green-600'
                      : score >= 50
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  <div className="text-4xl font-bold">{score}%</div>
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {score >= 70
                    ? '🎉 Congratulations!'
                    : score >= 50
                    ? '👍 Good Effort!'
                    : '📚 Keep Learning!'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {score >= 70
                    ? `You've successfully verified your ${skill} skills!`
                    : score >= 50
                    ? `You have a decent understanding of ${skill}. Keep practicing!`
                    : `Consider learning more about ${skill} to improve your skills.`}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Object.values(answers).filter((ans, idx) => ans === questions[idx].correctAnswer).length}
                      </div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {questions.length - Object.values(answers).filter((ans, idx) => ans === questions[idx].correctAnswer).length}
                      </div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default MCQVerificationModal
