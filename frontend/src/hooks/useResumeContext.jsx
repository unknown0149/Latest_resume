import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const ResumeContext = createContext()

export const RESUME_CACHE_STORAGE_KEY = 'resume_cache_v1'
export const RESUME_CACHE_EVENT = 'resume:clear'

const readCachedResume = () => {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(RESUME_CACHE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn('Failed to parse cached resume state:', error)
    return {}
  }
}

export const useResumeContext = () => {
  const context = useContext(ResumeContext)
  if (!context) {
    throw new Error('useResumeContext must be used within ResumeProvider')
  }
  return context
}

export const ResumeProvider = ({ children }) => {
  const cachedState = useMemo(() => readCachedResume(), [])

  const [resumeId, setResumeId] = useState(cachedState.resumeId ?? null)
  const [uploadedResume, setUploadedResume] = useState(null)
  const [parsedResume, setParsedResume] = useState(cachedState.parsedResume ?? null)
  const [predictedRoles, setPredictedRoles] = useState(cachedState.predictedRoles ?? [])
  const [matchedJobs, setMatchedJobs] = useState(cachedState.matchedJobs ?? [])
  const [skillGaps, setSkillGaps] = useState(cachedState.skillGaps ?? [])
  const [roadmap, setRoadmap] = useState(cachedState.roadmap ?? null)
  const [resources, setResources] = useState(cachedState.resources ?? [])
  const [salaryBoost, setSalaryBoost] = useState(cachedState.salaryBoost ?? [])
  const [watsonSummary, setWatsonSummary] = useState(cachedState.watsonSummary ?? null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const clearResumeCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(RESUME_CACHE_STORAGE_KEY)
    }
  }, [])

  const resetAnalysis = useCallback(() => {
    setResumeId(null)
    setUploadedResume(null)
    setParsedResume(null)
    setPredictedRoles([])
    setMatchedJobs([])
    setSkillGaps([])
    setRoadmap(null)
    setResources([])
    setSalaryBoost([])
    setWatsonSummary(null)
    setIsAnalyzing(false)
    clearResumeCache()
  }, [clearResumeCache])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!parsedResume) return

    try {
      const snapshot = {
        resumeId,
        parsedResume,
        predictedRoles,
        matchedJobs,
        skillGaps,
        roadmap,
        resources,
        salaryBoost,
        watsonSummary
      }
      window.localStorage.setItem(RESUME_CACHE_STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.warn('Failed to cache resume state:', error)
    }
  }, [resumeId, parsedResume, predictedRoles, matchedJobs, skillGaps, roadmap, resources, salaryBoost, watsonSummary])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleClear = () => {
      resetAnalysis()
    }

    window.addEventListener(RESUME_CACHE_EVENT, handleClear)
    return () => window.removeEventListener(RESUME_CACHE_EVENT, handleClear)
  }, [resetAnalysis])

  const value = {
    resumeId,
    setResumeId,
    uploadedResume,
    setUploadedResume,
    parsedResume,
    setParsedResume,
    predictedRoles,
    setPredictedRoles,
    matchedJobs,
    setMatchedJobs,
    skillGaps,
    setSkillGaps,
    roadmap,
    setRoadmap,
    resources,
    setResources,
    salaryBoost,
    setSalaryBoost,
    watsonSummary,
    setWatsonSummary,
    isAnalyzing,
    setIsAnalyzing,
    resetAnalysis,
  }

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}
