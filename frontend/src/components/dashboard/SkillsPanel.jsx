import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, TrendingUp, Award, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'

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

const formatSalaryBoost = (salaryBoost = {}) => {
  const absolute = salaryBoost.absoluteUSD
  if (typeof absolute === 'number') {
    return formatInrValue(absolute)
  }

  if (absolute && typeof absolute === 'object') {
    const min = absolute.min ?? absolute.max
    const max = absolute.max ?? absolute.min ?? min

    if (min && max && min !== max) {
      return `${formatInrValue(min)} – ${formatInrValue(max)}`
    }

    if (max) {
      return formatInrValue(max)
    }
  }

  if (typeof salaryBoost.impact === 'string') {
    return salaryBoost.impact.replace(/\$/g, '₹')
  }

  return '₹0'
}

const SkillsPanel = ({ skillsHave = [], skillsMissing = [], onVerifyClick }) => {
  const [activeTab, setActiveTab] = useState('have')

  const getProficiencyLabel = (score) => {
    if (score >= 80) return 'Expert'
    if (score >= 60) return 'Advanced'
    if (score >= 40) return 'Intermediate'
    return 'Beginner'
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      1: 'bg-[#1d1d1f] text-white border border-[#0f0f11]',
      2: 'bg-[#f7f7f8] text-[#1d1d1f] border border-[#d4d4d8]',
      3: 'bg-transparent text-[#52525b] border border-dashed border-[#d4d4d8]'
    }
    return badges[priority] || badges[2]
  }

  return (
    <Card tone="light" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Skill Intelligence</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">Your Skills</h2>
        </div>
        <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setActiveTab('have')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'have' ? 'bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.08)]' : 'text-slate-500'
            }`}
          >
            Have ({skillsHave.length})
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'missing' ? 'bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.08)]' : 'text-slate-500'
            }`}
          >
            To Learn ({skillsMissing.length})
          </button>
        </div>
      </div>

      {activeTab === 'have' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {skillsHave.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p>No skills extracted yet</p>
            </div>
          ) : (
            skillsHave.map((skillObj, idx) => {
              const rawSkill = skillObj.skill ?? skillObj.name ?? skillObj
              const skill = typeof rawSkill === 'string' ? rawSkill : rawSkill?.name || rawSkill?.skill || `Skill ${idx + 1}`
              const proficiency = skillObj.proficiency || 50
              const verified = skillObj.verified || false
              const badgeLevel = skillObj.badge?.level
              const badgeLabel = skillObj.badge?.label

              return (
                <div
                  key={`${skill}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">{skill}</h3>
                        {verified && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {badgeLevel && badgeLevel !== 'none' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                            <Award className="w-3 h-3" />
                            {badgeLabel || badgeLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{skillObj.level || getProficiencyLabel(proficiency)}</p>
                    </div>
                    <Button size="sm" variant={verified ? 'outline' : 'primary'} onClick={() => onVerifyClick?.(skill)}>
                      <Award className="w-4 h-4 mr-1" />
                      {verified ? 'Re-verify' : 'Verify'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Proficiency</span>
                      <span className="font-semibold text-slate-900">{proficiency}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${proficiency}%` }}
                        transition={{ duration: 0.7, delay: idx * 0.05 }}
                        className="h-full rounded-full bg-[#0f7a74]"
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </motion.div>
      )}

      {activeTab === 'missing' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {skillsMissing.length === 0 ? (
            <div className="text-center py-12 text-emerald-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" />
              <p>No skill gaps identified</p>
              <p className="text-sm text-slate-500 mt-2">You're well-equipped for your target role!</p>
            </div>
          ) : (
            skillsMissing.map((skillObj, idx) => {
              const rawSkill = skillObj.skill ?? skillObj.name ?? skillObj
              const skill = typeof rawSkill === 'string' ? rawSkill : rawSkill?.name || rawSkill?.skill || `Skill Gap ${idx + 1}`
              const priority = skillObj.priority || 2
              const type = skillObj.type || 'skill'
              const boostLabel = skillObj.salaryBoost ? formatSalaryBoost(skillObj.salaryBoost) : null

              return (
                <div
                  key={`${skill}-missing-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{skill}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadge(priority)}`}>
                          {priority === 1 ? 'High' : priority === 3 ? 'Low' : 'Medium'} Priority
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 capitalize">{type}</span>
                      </div>
                      {skillObj.salaryBoost && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <TrendingUp className="w-4 h-4 text-[#0f7a74]" />
                          <span>+{boostLabel} potential salary boost</span>
                        </div>
                      )}
                    </div>
                    <XCircle className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              )
            })
          )}
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-center">
        <div>
          <p className="text-3xl font-semibold text-slate-900">{skillsHave.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">Skills Owned</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-slate-900">{skillsMissing.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">To Learn</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-slate-900">
            {skillsHave.length > 0
              ? Math.round((skillsHave.length / (skillsHave.length + skillsMissing.length)) * 100)
              : 0}%
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">Skill Match</p>
        </div>
      </div>
    </Card>
  )
}

export default SkillsPanel
