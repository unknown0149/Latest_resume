import { TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'

const getUsdRange = (absoluteUSD) => {
  if (!absoluteUSD) {
    return { min: 0, max: 0, label: '+$0k' }
  }
  if (typeof absoluteUSD === 'number') {
    const label = `+$${(absoluteUSD / 1000).toFixed(0)}k`
    return { min: absoluteUSD, max: absoluteUSD, label }
  }
  const min = absoluteUSD.min ?? absoluteUSD.max ?? 0
  const max = absoluteUSD.max ?? absoluteUSD.min ?? 0
  if (!min && !max) {
    return { min: 0, max: 0, label: '+$0k' }
  }
  const label = min && max && min !== max
    ? `+$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
    : `+$${(Math.max(min, max) / 1000).toFixed(0)}k`
  return { min, max: Math.max(min, max), label }
}

const SalaryBoostCard = ({ suggestion, index }) => {
  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/40'
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/15 text-rose-100 border border-rose-400/40'
      case 'medium':
        return 'bg-amber-400/15 text-amber-100 border border-amber-300/40'
      default:
        return 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/40'
    }
  }

  const usdStats = getUsdRange(suggestion.salaryBoost?.absoluteUSD)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hover tone="glass" className="group">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
                  {suggestion.title}
                </h4>
                {suggestion.category && (
                  <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
                    {suggestion.category}
                  </span>
                )}
              </div>
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getPriorityColor(suggestion.priority)}`}>
                {suggestion.priority || 'Medium'}
              </span>
            </div>

            <p className="text-slate-200 text-sm mb-3">
              {suggestion.description}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-emerald-200 font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>{suggestion.impact || usdStats.label}</span>
              </div>
              <div className="flex items-center gap-1 text-white/70">
                <Clock className="w-4 h-4" />
                <span>{suggestion.timeframe || '2-4 months'}</span>
              </div>
            </div>

            {(suggestion.leverageSkill || suggestion.recommendedHoursPerWeek) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
                {suggestion.leverageSkill && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <AlertCircle className="w-3 h-3" />
                    Leverage {suggestion.leverageSkill}
                  </span>
                )}
                {suggestion.recommendedHoursPerWeek && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <Clock className="w-3 h-3" />
                    {suggestion.recommendedHoursPerWeek} hrs/week focus
                  </span>
                )}
              </div>
            )}

            {suggestion.actionSteps && suggestion.actionSteps.length > 0 && (
              <ul className="mt-4 space-y-2 text-xs text-white/70">
                {suggestion.actionSteps.slice(0, 3).map((step, stepIdx) => (
                  <li key={stepIdx} className="flex gap-2">
                    <span className="text-white/40">{stepIdx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

const SalaryBoostList = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <Card tone="glass">
        <p className="text-center text-white/60 py-8">No salary boost suggestions available</p>
      </Card>
    )
  }

  const totalImpactUsd = suggestions.reduce((sum, suggestion) => {
    const { max } = getUsdRange(suggestion.salaryBoost?.absoluteUSD)
    return sum + (max || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card tone="glass" className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-white/15">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-white/30 to-white/5 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              Potential Increase: ${totalImpactUsd ? (totalImpactUsd / 1000).toFixed(0) : '0'}k+
            </h3>
            <p className="text-white/70">
              By completing these {suggestions.length} recommendations
            </p>
          </div>
        </div>
      </Card>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <SalaryBoostCard key={suggestion.id || suggestion.skill || index} suggestion={suggestion} index={index} />
        ))}
      </div>
    </div>
  )
}

export default SalaryBoostList
