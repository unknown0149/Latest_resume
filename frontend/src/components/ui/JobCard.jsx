/**
 * Enhanced Job Card Component
 * Displays real-time job listings with skills, match score, and apply link
 */

import React from 'react';
import { ExternalLink, MapPin, Briefcase, Calendar, DollarSign, Award, TrendingUp, Target, CheckCircle, XCircle } from 'lucide-react';

const JobCard = ({ job, matchScore, matchedSkills = [], missingSkills = [], onApply }) => {
  // Calculate match level color
  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Partial Match';
  };

  // Format salary
  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    
    const formatAmount = (amount, currency) => {
      if (!amount) return null;
      if (currency === 'INR') {
        if (amount >= 100000) {
          return `₹${(amount / 100000).toFixed(1)}L`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
      }
      return `$${(amount / 1000).toFixed(0)}K`;
    };

    const min = formatAmount(salary.min, salary.currency);
    const max = formatAmount(salary.max, salary.currency);
    
    if (min && max) return `${min} - ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  };

  // Format location
  const formatLocation = (location) => {
    if (location.isRemote) return 'Remote';
    if (location.locationType === 'hybrid') return `${location.city || 'Hybrid'} (Hybrid)`;
    if (location.city && location.state) return `${location.city}, ${location.state}`;
    if (location.city) return location.city;
    return location.country || 'Location not specified';
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const salary = formatSalary(job.salary);
  const location = formatLocation(job.location);
  const postedDate = formatDate(job.postedDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {job.company.logo && (
              <img 
                src={job.company.logo} 
                alt={job.company.name}
                className="w-12 h-12 rounded-lg object-contain border border-gray-200"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                {job.title}
              </h3>
              <p className="text-gray-600 font-medium">{job.company.name}</p>
            </div>
          </div>
        </div>

        {/* Match Score Badge */}
        {matchScore && (
          <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${getMatchColor(matchScore)}`}>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="text-2xl font-bold">{matchScore}%</span>
            </div>
            <span className="text-xs font-medium">{getMatchLabel(matchScore)}</span>
          </div>
        )}
      </div>

      {/* Job Meta Information */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Briefcase className="w-4 h-4" />
          <span className="capitalize">{job.employmentType}</span>
        </div>
        {job.experienceLevel && (
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="capitalize">{job.experienceLevel} Level</span>
          </div>
        )}
        {salary && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{salary}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{postedDate}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.tag && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            {job.tag}
          </span>
        )}
        {job.location.isRemote && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Remote
          </span>
        )}
        {job.isVerified && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      {/* Skills Breakdown */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="mb-4 space-y-3">
          {/* Matched Skills */}
          {matchedSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Your Skills ({matchedSkills.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {matchedSkills.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    +{matchedSkills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {missingSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  Skills to Learn ({missingSkills.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingSkills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {missingSkills.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    +{missingSkills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Skills (if no match data) */}
      {(!matchedSkills || matchedSkills.length === 0) && job.skills.allSkills.length > 0 && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700 mb-2 block">Required Skills:</span>
          <div className="flex flex-wrap gap-2">
            {job.skills.allSkills.slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.allSkills.length > 6 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                +{job.skills.allSkills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{job.views || 0} views</span>
          {job.applications > 0 && <span>{job.applications} applications</span>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onApply && onApply(job)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View Details
          </button>
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
