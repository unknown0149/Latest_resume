import { MapPin, Briefcase, DollarSign, ExternalLink } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const formatSalary = (min, max, currency) => {
  if (!min && !max) return 'Not specified'
  const formatValue = (value) => {
    if (currency === 'INR') {
      return value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${value}`
    }
    return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
  }

  if (min && max) return `${formatValue(min)} - ${formatValue(max)}`
  if (min) return `From ${formatValue(min)}`
  return `Up to ${formatValue(max)}`
}

const CsvJobCardList = ({ jobs = [], isLoading = false, error = '' }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-6 animate-pulse border border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-20 bg-gray-200 rounded mb-4" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-10">
        <p className="text-red-600 font-medium">{error}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-primary-100">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">From jobs.csv</p>
          <h3 className="text-2xl font-bold text-gray-900">50 curated roles directly from your dataset</h3>
          <p className="text-gray-600">
            These cards are rendered straight from <code>backend/jobs.csv</code> so you can preview the raw feed even
            before database seeding completes.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{job.title}</h4>
                  <p className="text-primary-600 font-medium">{job.company}</p>
                </div>
                {job.tag && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 capitalize">
                    {job.tag}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location || 'Pan-India'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="capitalize">{job.employmentType}</span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{job.experienceLevel}</div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{job.description}</p>

              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 6).map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 6 && (
                    <span className="text-xs text-gray-500">+{job.skills.length - 6} more</span>
                  )}
                </div>
              )}
            </div>

            <a href={job.applicationUrl || '#'} target="_blank" rel="noopener noreferrer" className="mt-auto">
              <Button className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Listing
              </Button>
            </a>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CsvJobCardList
