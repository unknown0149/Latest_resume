import { useMemo } from 'react'
import { TrendingUp, ShieldCheck, Clock, Target, Zap, Layers, ArrowRight, Award } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const USD_TO_INR_RATE = Number(import.meta.env?.VITE_USD_TO_INR_RATE) || 83

const formatInrValue = (usdValue) => {
  if (usdValue === undefined || usdValue === null || Number.isNaN(Number(usdValue))) {
    return '₹0'
  }

  const inrValue = Number(usdValue) * USD_TO_INR_RATE

  if (inrValue >= 1e7) {
    return `₹${(inrValue / 1e7).toFixed(1)}Cr`
  }

  if (inrValue >= 1e5) {
    return `₹${(inrValue / 1e5).toFixed(1)}L`
  }

  return `₹${Math.round(inrValue).toLocaleString('en-IN')}`
}

const formatInrRange = ({ min = 0, max = 0 }) => {
  if (!min && !max) {
    return 'Calibrating'
  }

  if (Math.abs(max - min) < 1) {
    return formatInrValue(max || min)
  }

  return `${formatInrValue(min)} – ${formatInrValue(max)}`
}

const extractUsdRange = (absoluteUSD) => {
  if (!absoluteUSD) {
    return { min: 0, max: 0 }
  }

  if (typeof absoluteUSD === 'number') {
    return { min: absoluteUSD, max: absoluteUSD }
  }

  const min = absoluteUSD.min ?? absoluteUSD.max ?? 0
  const max = absoluteUSD.max ?? absoluteUSD.min ?? 0
  return { min, max: Math.max(min, max) }
}

const parseMonths = (timeframe) => {
  if (!timeframe) return 6
  const matches = timeframe.match(/(\d+)(?:\s*-\s*(\d+))?\s*month/i)
  if (!matches) return 6
  const low = parseInt(matches[1], 10)
  const high = matches[2] ? parseInt(matches[2], 10) : low
  return (low + high) / 2
}

const categorize = (opportunity) => opportunity.category || opportunity.type || 'General'

const deriveBaselineSalary = (parsedResume) => {
  if (!parsedResume) return null
  const profile = parsedResume?.parsed_resume?.profile || {}
  const fromProfile = profile.currentSalary || profile.expectedSalary || profile.targetSalary
  if (fromProfile) return fromProfile
  const metaComp = parsedResume?.parsed_resume?.compensation || parsedResume?.metadata?.compensation
  if (metaComp?.current) {
    return metaComp.current.base || metaComp.current.total || metaComp.current.amount
  }
  return null
}

const describeImpact = (suggestion) => {
  const range = extractUsdRange(suggestion?.salaryBoost?.absoluteUSD)
  if (range.max > 0 || range.min > 0) {
    return formatInrRange(range)
  }
  return suggestion?.impact || 'Calibrating'
}

const SalaryInsightsPanel = ({ suggestions = [], skillGaps, parsedResume, onVerifySkill }) => {
  const baselineSalary = deriveBaselineSalary(parsedResume)

  const totals = useMemo(() => {
    return suggestions.reduce(
      (acc, suggestion) => {
        const range = extractUsdRange(suggestion.salaryBoost?.absoluteUSD)
        acc.min += range.min
        acc.max += range.max
        return acc
      },
      { min: 0, max: 0 }
    )
  }, [suggestions])

  const grouped = useMemo(() => {
    return suggestions.reduce((acc, suggestion) => {
      const key = categorize(suggestion)
      if (!acc[key]) {
        acc[key] = { count: 0, impact: 0 }
      }
      const range = extractUsdRange(suggestion.salaryBoost?.absoluteUSD)
      acc[key].count += 1
      acc[key].impact += range.max
      return acc
    }, {})
  }, [suggestions])

  const quickWins = useMemo(() => suggestions.filter((item) => parseMonths(item.timeframe) <= 3), [suggestions])
  const strategicBets = useMemo(() => suggestions.filter((item) => parseMonths(item.timeframe) > 3), [suggestions])

  const verifiedSkills = useMemo(() => {
    return (skillGaps?.skillsHave || []).filter((skill) => skill.verified)
  }, [skillGaps])

  const nextVerificationCandidate = useMemo(() => {
    const missing = skillGaps?.skillsMissing || []
    return missing.find((skill) => !skill.verified) || missing[0]
  }, [skillGaps])

  if (!suggestions.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Salary Boost Opportunities</h3>
        <p>Upload a resume or refresh your analysis to see personalized compensation plays.</p>
      </div>
    )
  }

  const heroSkill = suggestions[0]
  const summaryImpact = totals.max ? formatInrValue(totals.max) : describeImpact(heroSkill)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card gradient className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_rgba(0,0,0,0))]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Salary Trajectory</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Unlock {summaryImpact}+ by leveling up {heroSkill?.title || heroSkill?.skill}
            </h2>
            <p className="mt-3 text-sm text-white/80 max-w-2xl">
              Based on your resume signal, these plays generate premium offers in <span className="font-semibold">{heroSkill?.timeframe || '3-5 months'}</span>.
              We align each recommendation with verified skills, Watson rationales, and roadmap steps.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="rounded-2xl border border-white/20 px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-[0.35em]">Potential Increase</p>
                <p className="text-white text-2xl font-semibold">{summaryImpact}</p>
              </div>
              <div className="rounded-2xl border border-white/20 px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-[0.35em]">Recommendations</p>
                <p className="text-white text-2xl font-semibold">{suggestions.length}</p>
              </div>
              <div className="rounded-2xl border border-white/20 px-4 py-3">
                <p className="text-white/60 text-xs uppercase tracking-[0.35em]">Baseline Salary</p>
                <p className="text-white text-2xl font-semibold">{baselineSalary ? formatInrValue(baselineSalary) : 'Add salary'}</p>
              </div>
            </div>
          </div>
          <Card tone="light" className="bg-white/90 border-white/30 text-slate-900 w-full lg:w-80 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Top play</p>
                <p className="text-lg font-semibold">{heroSkill?.title || heroSkill?.skill}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {heroSkill?.priority || 'High'} priority impact
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                {heroSkill?.timeframe || '3-5 months'} sprints
              </li>
              <li className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                {describeImpact(heroSkill)}
              </li>
            </ul>
          </Card>
        </div>
      </Card>

      {/* Category heatmap */}
      {Object.keys(grouped).length > 0 && (
        <Card tone="light">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Where the boost lives</p>
              <h3 className="text-2xl font-semibold text-slate-900">Impact by theme</h3>
            </div>
            <div className="text-sm text-slate-500">Sorted by cumulative INR upside</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(grouped)
              .sort(([, a], [, b]) => b.impact - a.impact)
              .map(([category, data]) => (
                <div key={category} className="rounded-2xl border border-slate-200 p-5 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900">{category}</p>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{formatInrValue(data.impact)}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{data.count} plays</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Action playbooks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} tone="light" hover className="h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{categorize(suggestion)}</p>
                <h4 className="text-xl font-semibold text-slate-900 mt-1">{suggestion.title || `Level up ${suggestion.skill}`}</h4>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {suggestion.priority || 'Medium'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-3 flex-1">{suggestion.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-400 uppercase tracking-[0.25em]">Impact</p>
                <p className="text-lg font-semibold text-slate-900">{describeImpact(suggestion)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-400 uppercase tracking-[0.25em]">Timeframe</p>
                <p className="text-lg font-semibold text-slate-900">{suggestion.timeframe || '3-5 months'}</p>
              </div>
            </div>
            {suggestion.actionSteps?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {suggestion.actionSteps.slice(0, 3).map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-xs text-slate-400 mt-1">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="sm" onClick={() => onVerifySkill?.(suggestion.skill || suggestion.title)}>
                Verify skill
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {suggestion.leverageSkill && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-xs text-slate-500">
                  <Zap className="w-3 h-3" />
                  Leverage {suggestion.leverageSkill}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick wins vs strategic bets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="light" className="bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Quick wins</p>
              <h4 className="text-xl font-semibold text-emerald-900">0-3 month plays</h4>
            </div>
          </div>
          <div className="space-y-3">
            {quickWins.length ? quickWins.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{item.title || item.skill}</p>
                  <p className="text-xs text-emerald-600">{item.timeframe}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-700">{describeImpact(item)}</p>
              </div>
            )) : <p className="text-sm text-emerald-700">No speedy boosts detected—focus on strategic bets.</p>}
          </div>
        </Card>
        <Card tone="light" className="bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-600">Strategic bets</p>
              <h4 className="text-xl font-semibold text-indigo-900">3-12 month horizon</h4>
            </div>
          </div>
          <div className="space-y-3">
            {strategicBets.length ? strategicBets.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">{item.title || item.skill}</p>
                  <p className="text-xs text-indigo-600">{item.timeframe}</p>
                </div>
                <p className="text-sm font-semibold text-indigo-700">{describeImpact(item)}</p>
              </div>
            )) : <p className="text-sm text-indigo-700">All plays are fast movers right now.</p>}
          </div>
        </Card>
      </div>

      {/* Verification CTA */}
      {nextVerificationCandidate && (
        <Card tone="light" className="border-dashed border-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lock the badge</p>
              <h4 className="text-2xl font-semibold text-slate-900">Verify {nextVerificationCandidate.skill} to boost credibility</h4>
              <p className="text-sm text-slate-500 mt-2">
                {verifiedSkills.length ? `${verifiedSkills.length} skills already verified. Add another badge to climb the leaderboard.` : 'No verified skills yet. Kick off your first badge now.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button onClick={() => onVerifySkill?.(nextVerificationCandidate)} className="justify-center">
                Launch verification
                <ShieldCheck className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                <Award className="w-4 h-4 text-amber-500" />
                Earned badges appear on your profile immediately
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SalaryInsightsPanel
