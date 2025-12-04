import { useMemo, useState } from 'react'
import { ExternalLink, Star, Clock, DollarSign, Filter, Zap, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import Button from '../ui/Button'

const ResourceCard = ({ resource, index }) => {
  const priceLabel = resource.price || 'Free'
  const normalizedPrice = priceLabel.toLowerCase()
  const isFree = normalizedPrice === 'free'
  const durationLabel = resource.duration || 'Self-paced'
  const rating = Number(resource.rating)
  const progress = resource.progress ?? resource.completion ?? 0
  const skills = resource.skills || []

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        hover
        tone="light"
        className="h-full flex flex-col bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
      >
        {/* Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isFree 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-primary-50 text-primary-700 border border-primary-200'
          }`}>
            {resource.type}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold text-slate-900">
              {rating && !Number.isNaN(rating) ? rating.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        {/* Title & Provider */}
        <h4 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-2">
          {resource.title}
        </h4>
        <p className="text-sm text-slate-600 mb-4">{resource.provider}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md font-medium border border-primary-100"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{durationLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className={isFree ? 'text-emerald-600 font-semibold' : 'text-slate-900'}>
              {priceLabel}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(resource.url, '_blank')}
          >
            <span>View Course</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
};


const parseDurationHours = (duration = '') => {
  const match = duration.match(/(\d+)(?:-(\d+))?\s*(hour|hr|day|week)/i)
  if (!match) return 0
  const min = parseInt(match[1], 10)
  const unit = match[3]?.toLowerCase()
  if (unit?.startsWith('day')) return min * 8
  if (unit?.startsWith('week')) return min * 40
  return min
}

const ResourcesList = ({ resources = [] }) => {
  const [activeFilter, setActiveFilter] = useState('all')
  const hasResources = resources.length > 0

  if (!hasResources) {
    return (
      <Card tone="light">
        <p className="text-center text-slate-600 py-8">No learning resources available</p>
      </Card>
    )
  }

  const freeResources = useMemo(
    () => resources.filter((r) => ((r.price || 'free').toLowerCase()) === 'free'),
    [resources]
  )
  const paidResources = useMemo(
    () => resources.filter((r) => ((r.price || 'free').toLowerCase()) !== 'free'),
    [resources]
  )

  const quickWins = useMemo(
    () => resources.filter((r) => parseDurationHours(r.duration) <= 6),
    [resources]
  )

  const filteredResources = useMemo(() => {
    switch (activeFilter) {
      case 'free':
        return freeResources
      case 'premium':
        return paidResources
      case 'quick':
        return quickWins
      default:
        return resources
    }
  }, [activeFilter, resources, freeResources, paidResources, quickWins])

  const topSkillChips = useMemo(() => {
    const counter = resources.reduce((acc, resource) => {
      (resource.skills || []).forEach((skill) => {
        acc[skill] = (acc[skill] || 0) + 1
      })
      return acc
    }, {})

    return Object.entries(counter)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([skill, count]) => ({ skill, count }))
  }, [resources])

  const ratedResources = resources
    .map((resource) => Number(resource.rating))
    .filter((value) => !Number.isNaN(value) && value > 0)

  const stats = {
    total: resources.length,
    free: freeResources.length,
    premium: paidResources.length,
    avgRating: ratedResources.length
      ? (ratedResources.reduce((sum, value) => sum + value, 0) / ratedResources.length).toFixed(1)
      : '—',
  }

  return (
    <div className="space-y-6">
      <Card tone="light" className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-600">Learning cockpit</p>
            <h3 className="text-3xl font-semibold text-slate-900 mt-2">
              {stats.total} resources tuned to your gaps
            </h3>
            <p className="text-slate-600 mt-2">
              Track quick wins, premium masterclasses, and keep momentum without leaving the dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 min-w-[220px]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Free</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.free}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Premium</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.premium}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Avg rating</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.avgRating}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Quick wins</p>
              <p className="text-2xl font-semibold text-slate-900">{quickWins.length}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card tone="light">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-slate-600" />
          <p className="text-slate-900 font-semibold">Focus filters</p>
          <div className="flex flex-wrap gap-2 ml-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'free', label: 'Free' },
              { id: 'premium', label: 'Premium' },
              { id: 'quick', label: 'Quick wins' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-gradient-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        {topSkillChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topSkillChips.map(({ skill, count }) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs border border-primary-100"
              >
                <Target className="w-3 h-3" />
                {skill}
                <span className="text-primary-500">×{count}</span>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource, index) => (
          <ResourceCard key={resource.id || `${resource.title}-${index}`} resource={resource} index={index} />
        ))}
      </div>

      {quickWins.length > 0 && activeFilter !== 'quick' && (
        <Card tone="light" className="bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h4 className="text-slate-900 font-semibold">Quick win stack ({quickWins.length})</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {quickWins.slice(0, 4).map((resource, index) => (
              <div
                key={resource.id || `${resource.title}-quick-${index}`}
                className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{resource.title}</p>
                <p className="text-sm text-slate-600">
                  {resource.duration} • {resource.price}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  Launch
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default ResourcesList
