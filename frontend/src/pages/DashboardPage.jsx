import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, TrendingUp, BookOpen, Map, BarChart3, Upload, User, MapPin, Clock, Briefcase, ArrowRight, ShieldCheck, Award } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import JobRoleCard from '../components/dashboard/JobRoleCard'
import SkillGapChart from '../components/dashboard/SkillGapChart'
import SalaryInsightsPanel from '../components/dashboard/SalaryInsightsPanel'
import RoadmapTimeline from '../components/dashboard/RoadmapTimeline'
import ResourcesList from '../components/dashboard/ResourcesList'
import ResumeSummaryView from '../components/dashboard/ResumeSummaryView'
import MCQVerificationModal from '../components/dashboard/MCQVerificationModal'
import { useResumeContext } from '../hooks/useResumeContext'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/ui/Modal'
import api from '../services/api'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [mcqModalOpen, setMcqModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [showResumeSummary, setShowResumeSummary] = useState(false)
  const { 
    parsedResume, 
    predictedRoles, 
    matchedJobs,
    setMatchedJobs,
    skillGaps, 
    salaryBoost, 
    roadmap, 
    resources,
    resumeId,
    watsonSummary
  } = useResumeContext()

  // Redirect to upload if no resume data, or to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    // Only redirect if we're sure there's no resume data
    // Check after a short delay to allow state to propagate
    const checkTimer = setTimeout(() => {
      if (!parsedResume && !resumeId) {
        console.log('⚠️ No resume data found, redirecting to upload')
        navigate('/upload')
      }
    }, 500)
    
    return () => clearTimeout(checkTimer)
  }, [isAuthenticated, parsedResume, resumeId, navigate])

  useEffect(() => {
    const fetchMatchedJobs = async () => {
      if (!resumeId) return
      try {
        const response = await api.get(`/jobs/match/${resumeId}?limit=10&useEmbeddings=true&generateAISummaries=true`)
        const matches = response.data?.data?.matches || []
        if (matches.length) {
          setMatchedJobs(matches)
        }
      } catch (error) {
        console.warn('Unable to refresh matched jobs:', error)
      }
    }

    if (resumeId && (!matchedJobs || matchedJobs.length === 0)) {
      fetchMatchedJobs()
    }
  }, [resumeId, matchedJobs, setMatchedJobs])

  const handleVerifyClick = (skill) => {
    if (!skill) return
    setSelectedSkill(skill)
    setMcqModalOpen(true)
  }

  const handleVerificationComplete = (skill, score) => {
    console.log(`Skill ${skill} verified with score: ${score}%`)
    // Optionally refresh skills data to show verified status
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'roles', label: 'Job Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'skills', label: 'Skill Gaps', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'salary', label: 'Salary Boost', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-4 h-4" /> },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
  ]

  const averageMatch = matchedJobs?.length
    ? Math.round(matchedJobs.reduce((sum, j) => sum + (j.matchScore || 0), 0) / matchedJobs.length)
    : 0

  const topJobMatch = matchedJobs && matchedJobs.length > 0 ? matchedJobs[0] : null
  const topMissingSkills = (skillGaps?.skillsMissing || []).slice(0, 3)
  const moreMissingSkills = (skillGaps?.skillsMissing?.length || 0) - topMissingSkills.length
  const topSalaryBoost = (salaryBoost || []).slice(0, 2)
  const predictedRoleList = Array.isArray(predictedRoles)
    ? predictedRoles
    : [predictedRoles?.primaryRole, ...(predictedRoles?.alternativeRoles || [])].filter(Boolean)

  const normalizedSkillInventory = useMemo(() => {
    const skills = skillGaps?.skillsHave || []
    return skills
      .map((skill, idx) => {
        const rawName = skill.skill ?? skill.name ?? skill.title ?? `Skill ${idx + 1}`
        const name = typeof rawName === 'string' ? rawName : rawName?.name || rawName?.skill || `Skill ${idx + 1}`
        return {
          name,
          verified: Boolean(skill.verified),
          score: skill.score ?? skill.level ?? 0,
          badge: skill.badge,
        }
      })
      .filter((entry) => Boolean(entry.name))
  }, [skillGaps])

  const verifiedSkills = useMemo(() => normalizedSkillInventory.filter((skill) => skill.verified), [normalizedSkillInventory])
  const pendingSkills = useMemo(() => normalizedSkillInventory.filter((skill) => !skill.verified), [normalizedSkillInventory])

  const overviewStats = [
    {
      id: 'matches',
      label: 'Matching roles',
      value: matchedJobs?.length || 0,
      hint: 'ready for review',
    },
    {
      id: 'avgMatch',
      label: 'Average match',
      value: `${averageMatch}%`,
      hint: 'blended score',
    },
    {
      id: 'skills',
      label: 'Skills to strengthen',
      value: skillGaps?.skillsMissing?.length || 0,
      hint: 'priority focus',
    },
    {
      id: 'resources',
      label: 'Learning resources',
      value: resources?.length || 0,
      hint: 'curated picks',
    },
    {
      id: 'verifiedSkills',
      label: 'Verified skills',
      value: normalizedSkillInventory.length ? `${verifiedSkills.length}/${normalizedSkillInventory.length}` : '0',
      hint: 'MCQ badges live',
    },
  ]

  const handleRoleClick = (role) => {
    navigate(`/job-role/${role.id}`, { state: { role } })
  }

  // Show loading or empty state if no data
  if (!parsedResume) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[var(--rg-bg)] text-[var(--rg-text-primary)]">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <section className="px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white text-slate-900 shadow-[0_25px_65px_rgba(15,23,42,0.08)]"
            >
              <div className="absolute inset-y-0 -right-10 hidden lg:block">
                <div className="h-full w-56 rotate-6 bg-gradient-to-b from-[#d1a054]/20 to-transparent" />
              </div>
              <div className="relative z-10 p-8 lg:p-10 flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Career Control Room</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-snug">
                      Welcome back, {parsedResume?.name || 'professional'}
                    </h1>
                    <p className="mt-3 text-lg text-slate-500">
                      Your resume insights, role matches, and next steps are refreshed and ready.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <Button onClick={() => navigate('/upload')} className="justify-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload new resume
                    </Button>
                    <Button variant="outline" onClick={() => setShowResumeSummary(true)} className="justify-center">
                      Review summary
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
                    <User className="w-4 h-4 text-[#0f7a74]" />
                    {parsedResume?.current_title || 'Role focus pending'}
                  </span>
                  {parsedResume?.location && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
                      <MapPin className="w-4 h-4 text-[#0f7a74]" />
                      {parsedResume.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
                    <Clock className="w-4 h-4 text-[#0f7a74]" />
                    {parsedResume?.years_experience ? `${parsedResume.years_experience}+ yrs exp` : 'Experience syncing'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-16 z-40 mt-10 border-y border-slate-200/60 bg-[var(--rg-bg)]/85 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 py-4 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                      : 'bg-transparent text-slate-500 border-transparent hover:border-slate-200 hover:text-slate-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                {overviewStats.map((stat) => (
                  <Card key={stat.id} tone="light" className="h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                      {stat.id === 'matches' && <Users className="w-5 h-5 text-[#0f7a74]" />}
                      {stat.id === 'avgMatch' && <TrendingUp className="w-5 h-5 text-[#0f7a74]" />}
                      {stat.id === 'skills' && <BarChart3 className="w-5 h-5 text-[#0f7a74]" />}
                      {stat.id === 'resources' && <BookOpen className="w-5 h-5 text-[#0f7a74]" />}
                    </div>
                    <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 capitalize">{stat.hint}</p>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card tone="light" className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Top match</p>
                      <h3 className="text-2xl font-semibold text-slate-900 mt-2">Your strongest role right now</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('roles')}>
                      View roles
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {topJobMatch ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div>
                            <h4 className="text-xl font-semibold text-slate-900">{topJobMatch.job?.title || 'Role match coming soon'}</h4>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              {topJobMatch.job?.company?.name || 'Company confidential'}
                            </p>
                          </div>
                          <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {Math.round(topJobMatch.matchScore || 0)}% match
                          </span>
                        </div>
                        {topJobMatch.aiSummary && (
                          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            {topJobMatch.aiSummary}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(topJobMatch.matchedSkills || []).slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {(topJobMatch.missingSkills || []).slice(0, 2).map((skill, idx) => (
                            <span key={`missing-${idx}`} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                              Improve: {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setActiveTab('roles')}>
                          See matching roles
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/jobs?matched=true')}>
                          Browse full list
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      We do not have personalised matches yet. Run a fresh analysis or adjust your resume focus to see tailored roles.
                    </div>
                  )}
                </Card>

                <Card tone="light" className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Skill focus</p>
                      <h3 className="text-2xl font-semibold text-slate-900 mt-2">Next capabilities to level up</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('skills')}>
                      View all gaps
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {topMissingSkills.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {topMissingSkills.map((skill, idx) => (
                          <div key={skill.skill || skill.name || idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-semibold text-slate-900">{skill.skill || skill.name || 'Skill'}</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                (skill.priority || 1) >= 3 ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                (skill.priority || 1) >= 2 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                Priority {(skill.priority || 1) >= 3 ? 'High' : (skill.priority || 1) >= 2 ? 'Medium' : 'Low'}
                              </span>
                            </div>
                            {skill.reasons && skill.reasons.length > 0 && (
                              <p className="text-sm text-slate-600 mt-2">{skill.reasons[0]}</p>
                            )}
                            {skill.alignedWith && skill.alignedWith.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">Leverage: {skill.alignedWith[0].skill}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {moreMissingSkills > 0 && (
                        <p className="text-sm text-slate-500">+ {moreMissingSkills} more opportunities in Skill Gaps.</p>
                      )}
                      {topSalaryBoost.length > 0 && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-sm font-semibold text-emerald-900 mb-2">Quick salary wins</p>
                          <ul className="space-y-2 text-sm text-emerald-800">
                            {topSalaryBoost.map((boost) => (
                              <li key={boost.id}>{boost.title || boost.skill}: {boost.impact}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setActiveTab('roadmap')} variant="outline">
                          Check roadmap
                        </Button>
                        <Button onClick={() => handleVerifyClick(topMissingSkills[0])} disabled={topMissingSkills.length === 0}>
                          Verify progress
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      Great news — no major gaps detected. Explore the roadmap for stretch goals.
                    </div>
                  )}
                </Card>

                <Card tone="light" className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Skill verification</p>
                      <h3 className="text-2xl font-semibold text-slate-900 mt-2">Your badge status</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {verifiedSkills.length} verified • {pendingSkills.length} pending
                      </p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  {normalizedSkillInventory.length ? (
                    <div className="space-y-3">
                      {normalizedSkillInventory.slice(0, 5).map((skill, idx) => (
                        <div key={`${skill.name}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                            <p className="text-xs text-slate-500">
                              {skill.verified ? 'Verified badge active' : 'Pending verification'} · {Math.round(skill.score) || 0}% proficiency
                            </p>
                          </div>
                          <button
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                              skill.verified
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            onClick={() => handleVerifyClick(skill.name)}
                          >
                            {skill.verified ? <ShieldCheck className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                            {skill.verified ? 'Verified' : 'Verify'}
                          </button>
                        </div>
                      ))}
                      {normalizedSkillInventory.length > 5 && (
                        <p className="text-xs text-slate-500">+{normalizedSkillInventory.length - 5} more skills tracked</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No skills detected yet. Upload a resume or complete analysis to start tracking badges.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>
                      Open profile
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab('skills')}>
                      Manage skills
                    </Button>
                  </div>
                </Card>
              </div>

              {skillGaps?.skillGapSummary && (
                <Card tone="light">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Skill Gap Summary</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">Core skills covered</p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {skillGaps.skillGapSummary.coreSkillsHave} / {skillGaps.skillGapSummary.coreSkillsTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Match confidence</p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {skillGaps.skillGapSummary.coreSkillMatch}%
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Matched Job Listings</h2>
              {predictedRoleList.length > 0 && (
                <Card tone="light" className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI predictions</p>
                      <h3 className="text-xl font-semibold text-slate-900 mt-1">Roles your profile already aligns with</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('roadmap')}>
                      Align roadmap
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {predictedRoleList.slice(0, 3).map((role, idx) => (
                      <div key={role?.name || role?.title || idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">#{idx + 1}</p>
                        <h4 className="text-lg font-semibold text-slate-900 mt-2">{role?.name || role?.role || role?.title || 'Role insight'}</h4>
                        <p className="text-sm text-slate-600 mt-1">Fit score: {Math.round(role?.matchPercentage || role?.matchScore || role?.score || 0)}%</p>
                        {role?.description && (
                          <p className="text-xs text-slate-500 mt-2">{role.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {matchedJobs?.length ? (
                  matchedJobs.map((job, index) => (
                    <JobRoleCard 
                      key={job.job?._id || job.jobId || index} 
                      role={job} 
                      index={index}
                      onClick={() => handleRoleClick(job)}
                    />
                  ))
                ) : (
                  <Card tone="light" className="col-span-full text-center py-16 text-slate-500">
                    <p className="text-lg font-semibold text-slate-700 mb-2">No matching roles yet</p>
                    <p className="mb-4">Run the resume analysis again or broaden your filters to see tailored opportunities.</p>
                    <Button onClick={() => navigate('/jobs')}>
                      Browse job marketplace
                    </Button>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {skillGaps?.chartData && (
                <>
                  <SkillGapChart data={skillGaps.chartData} type="bar" />
                  <SkillGapChart data={skillGaps.chartData} type="radar" />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'salary' && (
            <motion.div
              key="salary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SalaryInsightsPanel 
                suggestions={salaryBoost || []}
                skillGaps={skillGaps}
                parsedResume={parsedResume}
                onVerifySkill={handleVerifyClick}
              />
            </motion.div>
          )}

          {activeTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <RoadmapTimeline roadmap={roadmap} />
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {!resources || resources.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No Learning Resources</h3>
                  <p className="mb-4">Resources will be generated based on your skill gaps</p>
                  <p className="text-sm">Complete your resume analysis to see personalized learning resources</p>
                </div>
              ) : (
                <ResourcesList resources={resources} />
              )}
            </motion.div>
          )}

        </div>
      </div>

      {/* MCQ Verification Modal */}
      <MCQVerificationModal 
        isOpen={mcqModalOpen}
        onClose={() => setMcqModalOpen(false)}
        skill={selectedSkill}
        resumeId={resumeId || parsedResume?.resumeId}
        onVerificationComplete={handleVerificationComplete}
      />

        <Modal
          isOpen={showResumeSummary}
          onClose={() => setShowResumeSummary(false)}
          title="Resume & AI Summary"
          size="xl"
        >
          <ResumeSummaryView resume={parsedResume} watsonSummary={watsonSummary} />
        </Modal>

      <Footer />
    </div>
  )
}

export default DashboardPage
