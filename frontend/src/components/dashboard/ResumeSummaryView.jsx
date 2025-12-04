import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Brain, TrendingUp, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import Card from '../ui/Card'

const ResumeSummaryView = ({ resume, watsonSummary }) => {
  if (!resume) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">No resume data available. Please upload and parse your resume first.</p>
      </Card>
    )
  }

  // Handle different resume data structures
  const resumeData = resume.parsed_resume || resume || {}
  const name = resumeData.name || resumeData.full_name || 'Name Not Provided'
  const email = resumeData.email || resumeData.contact_info?.email || null
  const phone = resumeData.phone || resumeData.contact_info?.phone || resumeData.contact_info?.mobile || null
  const location = resumeData.location || resumeData.contact_info?.location || null
  const summary = resumeData.summary || resumeData.professional_summary || null
  const experience = resumeData.experience || resumeData.work_experience || []
  const education = resumeData.education || []
  const skills = resumeData.skills || resumeData.technical_skills || []

  return (
    <div className="space-y-6">
      {/* Watson AI Summary - NEW */}
      {watsonSummary && watsonSummary.summary && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Career Analysis</h3>
            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {watsonSummary.source === 'watson' ? 'Watson X.ai' : 'Analysis'}
            </span>
          </div>

          {/* Overall Assessment */}
          <div className="mb-4 p-4 bg-white rounded-lg">
            <p className="text-gray-800 leading-relaxed">{watsonSummary.summary.overallAssessment}</p>
          </div>

          {/* Strengths & Areas to Improve */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Your Strengths</h4>
              </div>
              <ul className="space-y-2">
                {watsonSummary.summary.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">Areas to Improve</h4>
              </div>
              <ul className="space-y-2">
                {watsonSummary.summary.areasToImprove?.map((area, idx) => (
                  <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Career Advice */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Career Direction</h4>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">{watsonSummary.summary.careerAdvice}</p>
          </div>

          {/* Skill Development Priority */}
          {watsonSummary.summary.skillDevelopmentPriority && watsonSummary.summary.skillDevelopmentPriority.length > 0 && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-900">Skill Development Priorities</h4>
              </div>
              <div className="space-y-3">
                {watsonSummary.summary.skillDevelopmentPriority.map((skillItem, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{skillItem.skill}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        skillItem.priority === 'high' ? 'bg-red-100 text-red-700' :
                        skillItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {skillItem.priority?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{skillItem.reason}</p>
                    <p className="text-xs text-green-600 font-medium">{skillItem.expectedImpact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {watsonSummary.summary.nextSteps && watsonSummary.summary.nextSteps.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Recommended Next Steps</h4>
              <ol className="space-y-2">
                {watsonSummary.summary.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                    <span className="font-bold text-purple-600">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      )}

      {/* Resume Summary Card */}
      <Card>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Resume Summary</h3>
            <p className="text-gray-600">Parsed information from your resume</p>
          </div>

          {/* Personal Info */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">{name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Professional Summary</h5>
              <p className="text-gray-600 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </h5>
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div key={idx} className="border-l-4 border-primary-500 pl-4">
                    <h6 className="font-semibold text-gray-900">{exp.position || exp.title || exp.role}</h6>
                    <p className="text-sm text-gray-600">{exp.company || exp.organization} • {exp.duration || exp.period || exp.dates}</p>
                    {(exp.description || exp.responsibilities) && (
                      <p className="text-sm text-gray-600 mt-1">{exp.description || exp.responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </h5>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="border-l-4 border-secondary-400 pl-4">
                    <h6 className="font-semibold text-gray-900">{edu.degree || edu.qualification}</h6>
                    <p className="text-sm text-gray-600">{edu.school || edu.institution || edu.university} • {edu.year || edu.graduation_year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Skills</h5>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gradient-primary text-white rounded-full text-sm font-medium"
                  >
                    {typeof skill === 'string' ? skill : skill.name || skill.skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResumeSummaryView
