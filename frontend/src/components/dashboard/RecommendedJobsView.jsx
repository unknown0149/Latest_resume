import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, MapPin, DollarSign, Clock, ExternalLink, 
  TrendingUp, Award, Building2, CheckCircle, Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'
import api from '../../services/api'

const RecommendedJobsView = ({ resumeId }) => {
  const [matchedJobs, setMatchedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (resumeId) {
      fetchMatchedJobs()
    }
  }, [resumeId])

  const fetchMatchedJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/match/${resumeId}?limit=10&useEmbeddings=true&generateAISummaries=true`)
      setMatchedJobs(response.data?.data?.matches || [])
    } catch (error) {
      console.error('Failed to fetch matched jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min, max, currency) => {
    if (!min && !max) return 'Not specified'
    const format = (val) => {
      if (currency === 'INR') {
        return val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val}`
      }
      return val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
    }
    if (min && max) return `${format(min)} - ${format(max)}`
    if (min) return `From ${format(min)}`
    if (max) return `Up to ${format(max)}`
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    if (score >= 60) return 'text-teal-700 bg-teal-50 border border-teal-200'
    if (score >= 40) return 'text-amber-700 bg-amber-50 border border-amber-200'
    return 'text-slate-600 bg-slate-100 border border-slate-200'
  }

  if (loading) {
    return (
      <Card tone="light">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Jobs Matched to Your Profile</h3>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-20 bg-slate-200 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded w-20"></div>
                <div className="h-6 bg-slate-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (matchedJobs.length === 0) {
    return (
      <Card tone="light">
        <div className="text-center py-12 text-slate-500">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Matching Jobs Yet</h3>
          <p className="text-slate-600 mb-6">
            We couldn't find jobs matching your profile at the moment. Check back soon or tweak your resume focus.
          </p>
          <Button onClick={() => navigate('/jobs?matched=true')} variant="outline" className="px-8">
            Browse All Jobs
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card tone="light">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.35em] uppercase text-slate-400">Matches</p>
            <h3 className="text-3xl font-semibold text-slate-900 mt-2">Jobs matched to your profile</h3>
            <p className="text-slate-500">
              {matchedJobs.length} precision-matched roles streaming from the hiring graph
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/jobs?matched=true')} className="px-6">
            View All Jobs
          </Button>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {matchedJobs.map((match, index) => {
            const job = match.job || {}
            const jobLocation = job.location || {}
            const salary = job.salary || {}
            const companyName = job.company?.name || 'Company confidential'
            const employmentLabel = job.employmentType ? job.employmentType.replace('-', ' ') : 'Not specified'
            const experienceLabel = job.experienceLevel ? job.experienceLevel : 'Experience flexible'
            const applyUrl = job.applicationUrl || job.source?.sourceUrl || '#'
            const matchingSkills = match.matchedSkills || []
            const missingSkills = match.missingSkills || []

            return (
              <motion.div
                key={job.jobId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-semibold text-slate-900">{job.title || 'Role details coming soon'}</h4>
                      {match.matchScore >= 75 && (
                        <Star className="w-5 h-5 text-amber-400 fill-amber-200" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Building2 className="w-4 h-4" />
                      <span>{companyName}</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-semibold text-lg ${getMatchScoreColor(match.matchScore)}`}>
                    {Math.round(match.matchScore)}%
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{jobLocation.city || 'Location TBD'}</span>
                    {jobLocation.isRemote && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">Remote</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>{formatSalary(salary.min, salary.max, salary.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{employmentLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{experienceLabel}</span>
                  </div>
                </div>

                {/* AI Summary */}
                {match.aiSummary && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 mb-4">
                    <p className="text-sm text-teal-900">{match.aiSummary}</p>
                  </div>
                )}

                {/* Matching Skills */}
                {matchingSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      You have {matchingSkills.length} matching skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchingSkills.slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100"
                        >
                          {skill}
                        </span>
                      ))}
                      {matchingSkills.length > 8 && (
                        <span className="px-3 py-1 text-slate-500 text-sm">
                          +{matchingSkills.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {missingSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Skills to improve:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm border border-amber-100"
                        >
                          {skill}
                        </span>
                      ))}
                      {missingSkills.length > 5 && (
                        <span className="px-3 py-1 text-slate-500 text-sm">
                          +{missingSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </a>
                  {missingSkills.length > 0 && (
                    <Button 
                      onClick={() => navigate('/roadmap')} 
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      Learn Skills
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* View More */}
        {matchedJobs.length >= 10 && (
          <div className="text-center pt-4">
            <Button onClick={() => navigate('/jobs?matched=true')} size="lg" variant="outline" className="px-8">
              View All {matchedJobs.length}+ Matching Jobs
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default RecommendedJobsView
