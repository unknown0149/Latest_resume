import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import Card from '../ui/Card'

const PRIMARY_COLOR = '#2563eb'
const SECONDARY_COLOR = '#34d399'
const GRID_COLOR = '#e2e8f0'

const SkillGapChart = ({ data, type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">No skill gap data available</p>
      </Card>
    )
  }

  const categorizedSkills = useMemo(() => {
    const strong = []
    const focus = []

    data.forEach((skill) => {
      if (skill.current >= skill.required * 0.7) {
        strong.push(skill)
      } else {
        focus.push(skill)
      }
    })

    return { strong, focus }
  }, [data])

  return (
    <Card className="bg-[var(--rg-surface,white)]">
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Skill Gap Analysis</h3>
        <p className="text-sm text-slate-500">
          Levels are estimated from resume mentions, years of experience, and where each skill appears in your projects/responsibilities.
        </p>
      </div>
      
      {type === 'bar' ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
            />
            <Legend formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} />
            <Bar dataKey="current" fill={PRIMARY_COLOR} name="Your Level" radius={[6, 6, 0, 0]} />
            <Bar dataKey="required" fill={SECONDARY_COLOR} name="Required Level" radius={[6, 6, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid stroke={GRID_COLOR} />
            <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar name="Your Level" dataKey="current" stroke={PRIMARY_COLOR} fill={PRIMARY_COLOR} fillOpacity={0.55} />
            <Radar name="Required Level" dataKey="required" stroke={SECONDARY_COLOR} fill={SECONDARY_COLOR} fillOpacity={0.4} />
            <Legend formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* Skill Details */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Skills You Have
          </h4>
          <ul className="space-y-2">
            {categorizedSkills.strong.map((skill, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {skill.skill}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            Skills to Improve
          </h4>
          <ul className="space-y-2">
            {categorizedSkills.focus.map((skill, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                {skill.skill}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Tip: scores are heuristic—mentioning a skill near the top of your resume, pairing it with concrete experience, or listing recent projects will raise your "current" level.
      </p>
    </Card>
  )
}

export default SkillGapChart
