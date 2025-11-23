/**
 * Experience Timeline Calculator
 * Calculates total years of experience with overlap handling
 */

/**
 * Parse date string to Date object
 * Handles formats: "2019-05", "2019", "Present"
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const str = dateStr.toString().toLowerCase().trim();
  
  // Handle "Present" or "Current"
  if (str === 'present' || str === 'current') {
    return new Date();
  }
  
  // Handle YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(str)) {
    return new Date(str + '-01');
  }
  
  // Handle YYYY format
  if (/^\d{4}$/.test(str)) {
    return new Date(str + '-01-01');
  }
  
  // Try standard date parsing
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convert date to months since epoch (for easy calculation)
 */
function dateToMonths(date) {
  if (!date) return null;
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * Merge overlapping time intervals
 * Input: [{start: months, end: months}, ...]
 * Output: [{start: months, end: months}, ...] (non-overlapping)
 */
function mergeIntervals(intervals) {
  if (!intervals || intervals.length === 0) return [];
  
  // Sort by start time
  const sorted = intervals
    .filter(interval => interval.start !== null && interval.end !== null)
    .sort((a, b) => a.start - b.start);
  
  if (sorted.length === 0) return [];
  
  const merged = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    // Check for overlap or adjacency
    if (current.start <= last.end + 1) {
      // Merge intervals
      last.end = Math.max(last.end, current.end);
    } else {
      // No overlap, add new interval
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Calculate total months from merged intervals
 */
function calculateTotalMonths(intervals) {
  return intervals.reduce((total, interval) => {
    return total + (interval.end - interval.start + 1);
  }, 0);
}

/**
 * Main function: Calculate years of experience from experience array
 * Handles overlaps and returns years with one decimal place
 * 
 * @param {Array} experiences - Array of experience objects with start_date and end_date
 * @returns {Object} { years: 3.4, months: 41, intervals: [...], confidence: 0.95 }
 */
export function calculateYearsOfExperience(experiences) {
  if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
    return {
      years: 0,
      months: 0,
      intervals: [],
      confidence: 0,
    };
  }
  
  // Convert experiences to month intervals
  const intervals = [];
  let hasInvalidDates = false;
  
  for (const exp of experiences) {
    const startDate = parseDate(exp.start_date || exp.start);
    const endDate = parseDate(exp.end_date || exp.end || 'Present');
    
    if (startDate && endDate) {
      const startMonths = dateToMonths(startDate);
      const endMonths = dateToMonths(endDate);
      
      if (startMonths !== null && endMonths !== null && endMonths >= startMonths) {
        intervals.push({
          start: startMonths,
          end: endMonths,
          company: exp.company,
          title: exp.title,
        });
      } else {
        hasInvalidDates = true;
      }
    } else {
      hasInvalidDates = true;
    }
  }
  
  if (intervals.length === 0) {
    return {
      years: 0,
      months: 0,
      intervals: [],
      confidence: 0,
    };
  }
  
  // Merge overlapping intervals
  const mergedIntervals = mergeIntervals(intervals);
  
  // Calculate total months
  const totalMonths = calculateTotalMonths(mergedIntervals);
  
  // Convert to years (with one decimal place)
  const years = Math.round((totalMonths / 12) * 10) / 10;
  
  // Determine confidence
  let confidence = 0.95;
  if (hasInvalidDates) confidence -= 0.10;
  if (intervals.length !== mergedIntervals.length) confidence -= 0.05; // Had overlaps
  
  return {
    years: years,
    months: totalMonths,
    intervals: mergedIntervals,
    confidence: Math.max(confidence, 0.70),
  };
}

/**
 * Estimate years of experience from education graduation date
 * Fallback when experience array is empty or unreliable
 */
export function estimateExperienceFromEducation(educationArray) {
  if (!educationArray || !Array.isArray(educationArray) || educationArray.length === 0) {
    return { years: 0, confidence: 0 };
  }
  
  // Find most recent graduation year
  let latestYear = null;
  
  for (const edu of educationArray) {
    const endYear = parseInt(edu.end_year || edu.end || edu.year);
    if (!isNaN(endYear)) {
      if (latestYear === null || endYear > latestYear) {
        latestYear = endYear;
      }
    }
  }
  
  if (latestYear === null) {
    return { years: 0, confidence: 0 };
  }
  
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = currentYear - latestYear;
  
  // Estimate: assume started working immediately after graduation
  // But cap at reasonable values
  const estimatedYears = Math.max(0, Math.min(yearsSinceGraduation, 50));
  
  return {
    years: estimatedYears,
    confidence: 0.60, // Lower confidence for estimates
  };
}

/**
 * Validate experience timeline for logical consistency
 * Flags issues like: future dates, extremely long tenures, gaps
 */
export function validateExperienceTimeline(experiences) {
  const issues = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  
  for (const exp of experiences) {
    const startDate = parseDate(exp.start_date || exp.start);
    const endDate = parseDate(exp.end_date || exp.end || 'Present');
    
    // Check for future dates
    if (startDate && startDate > now) {
      issues.push({
        type: 'future_start',
        company: exp.company,
        message: 'Start date is in the future',
      });
    }
    
    // Check for extremely long tenure (>15 years)
    if (startDate && endDate) {
      const monthsDiff = dateToMonths(endDate) - dateToMonths(startDate);
      if (monthsDiff > 180) { // 15 years
        issues.push({
          type: 'long_tenure',
          company: exp.company,
          months: monthsDiff,
          message: `Unusually long tenure: ${Math.round(monthsDiff / 12)} years`,
        });
      }
      
      // Check for negative duration
      if (monthsDiff < 0) {
        issues.push({
          type: 'negative_duration',
          company: exp.company,
          message: 'End date is before start date',
        });
      }
    }
    
    // Check for extremely old dates (before 1970)
    if (startDate && startDate.getFullYear() < 1970) {
      issues.push({
        type: 'old_date',
        company: exp.company,
        message: 'Start date is before 1970',
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues,
  };
}

/**
 * Format experience duration for display
 * Example: 3.4 years → "3 years 5 months"
 */
export function formatExperienceDuration(years) {
  if (!years || years === 0) return '0 months';
  
  const wholeYears = Math.floor(years);
  const remainingMonths = Math.round((years - wholeYears) * 12);
  
  const parts = [];
  if (wholeYears > 0) {
    parts.push(`${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
  }
  
  return parts.join(' ');
}

/**
 * Get experience level based on years
 */
export function getExperienceLevel(years) {
  if (years < 1) return 'entry';
  if (years < 3) return 'junior';
  if (years < 5) return 'mid';
  if (years < 8) return 'senior';
  return 'expert';
}

export default {
  calculateYearsOfExperience,
  estimateExperienceFromEducation,
  validateExperienceTimeline,
  formatExperienceDuration,
  getExperienceLevel,
  parseDate,
  dateToMonths,
};
