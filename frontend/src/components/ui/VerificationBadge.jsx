import React, { useState } from 'react'
import { Award, CheckCircle, Info } from 'lucide-react'

const VerificationBadge = ({ 
  badge, 
  credibilityScore, 
  trustLevel, 
  showScore = true, 
  showTooltip = true,
  size = 'md' 
}) => {
  const [showInfo, setShowInfo] = useState(false)

  if (!badge || !badge.level || badge.level === 'none') {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getBadgeStyles = () => {
    switch (badge.level) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          text: 'text-yellow-900',
          border: 'border-yellow-600',
          glow: 'shadow-lg shadow-yellow-200'
        }
      case 'silver':
        return {
          bg: 'bg-gradient-to-r from-gray-300 to-gray-400',
          text: 'text-gray-900',
          border: 'border-gray-500',
          glow: 'shadow-lg shadow-gray-200'
        }
      case 'bronze':
        return {
          bg: 'bg-gradient-to-r from-orange-400 to-orange-500',
          text: 'text-orange-900',
          border: 'border-orange-600',
          glow: 'shadow-lg shadow-orange-200'
        }
      default:
        return {
          bg: 'bg-gray-200',
          text: 'text-gray-700',
          border: 'border-gray-400',
          glow: ''
        }
    }
  }

  const getTrustLevelInfo = () => {
    switch (trustLevel) {
      case 'excellent':
        return {
          description: 'Excellent credibility! Skills thoroughly verified.',
          recommendation: 'Your profile stands out to employers.'
        }
      case 'good':
        return {
          description: 'Good credibility with verified skills.',
          recommendation: 'Consider verifying more skills to improve further.'
        }
      case 'moderate':
        return {
          description: 'Moderate credibility. Some skills verified.',
          recommendation: 'Complete more skill verifications to boost your profile.'
        }
      case 'low':
        return {
          description: 'Low credibility. Few skills verified.',
          recommendation: 'Start skill verification interviews to improve credibility.'
        }
      default:
        return {
          description: 'Credibility not yet established.',
          recommendation: 'Complete skill verification to build trust.'
        }
    }
  }

  const styles = getBadgeStyles()
  const trustInfo = getTrustLevelInfo()

  return (
    <div className="relative inline-block">
      {/* Badge */}
      <div
        className={`
          inline-flex items-center gap-2 rounded-full
          ${styles.bg} ${styles.text} ${styles.glow}
          border-2 ${styles.border}
          ${sizeClasses[size]}
          font-semibold
          transition-all duration-300 hover:scale-105
        `}
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => showTooltip && setShowInfo(false)}
      >
        {/* Icon */}
        {badge.level === 'gold' && <Award className={iconSizes[size]} />}
        {badge.level === 'silver' && <Award className={iconSizes[size]} />}
        {badge.level === 'bronze' && <Award className={iconSizes[size]} />}
        
        {/* Label */}
        <span>{badge.label || `${badge.level.charAt(0).toUpperCase() + badge.level.slice(1)} Verified`}</span>
        
        {/* Verified Checkmark */}
        <CheckCircle className={iconSizes[size]} />
      </div>

      {/* Score Display */}
      {showScore && credibilityScore !== undefined && (
        <div className="mt-2 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {credibilityScore}
            <span className="text-sm text-gray-600">/100</span>
          </div>
          <div className="text-xs text-gray-600">Credibility Score</div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && showInfo && (
        <div className="absolute z-50 w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-xl -left-4 top-full mt-2">
          {/* Arrow */}
          <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          
          {/* Content */}
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2">
              <div className={`p-2 rounded-lg ${styles.bg}`}>
                <Award className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{badge.label}</h4>
                <p className="text-xs text-gray-600">Trust Level: {trustLevel || 'Unknown'}</p>
              </div>
            </div>

            {/* Score Progress */}
            {credibilityScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Credibility Score</span>
                  <span className="font-semibold text-gray-900">{credibilityScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${styles.bg} transition-all duration-500`}
                    style={{ width: `${credibilityScore}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{trustInfo.description}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-blue-800 text-xs">
                  💡 <strong>Tip:</strong> {trustInfo.recommendation}
                </p>
              </div>
            </div>

            {/* Badge Requirements */}
            <div className="pt-2 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-gray-700 mb-1">Badge Requirements</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={badge.level === 'gold' ? 'text-yellow-700 font-semibold' : ''}>
                  🥇 Gold: 85+ score
                </li>
                <li className={badge.level === 'silver' ? 'text-gray-700 font-semibold' : ''}>
                  🥈 Silver: 70-84 score
                </li>
                <li className={badge.level === 'bronze' ? 'text-orange-700 font-semibold' : ''}>
                  🥉 Bronze: 50-69 score
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline display
export const CompactVerificationBadge = ({ badge, credibilityScore }) => {
  if (!badge || !badge.level || badge.level === 'none') {
    return (
      <span className="text-xs text-gray-500 italic">Not verified</span>
    )
  }

  const getBadgeColor = () => {
    switch (badge.level) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()}`}>
      <CheckCircle className="h-3 w-3" />
      {badge.label}
      {credibilityScore !== undefined && (
        <span className="ml-1">({credibilityScore})</span>
      )}
    </span>
  )
}

export default VerificationBadge
