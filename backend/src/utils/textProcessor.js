/**
 * Normalize extracted text by removing artifacts and cleaning whitespace
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned and normalized text
 */
export const normalizeText = (text) => {
  if (!text) return ''

  let normalized = text

  // Remove multiple successive whitespace (spaces, tabs, etc.)
  normalized = normalized.replace(/[ \t]+/g, ' ')

  // Replace common Unicode bullet artifacts with dashes
  normalized = normalized
    .replace(/\uf0b7/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/•/g, '-')
    .replace(/◦/g, '-')
    .replace(/▪/g, '-')
    .replace(/‣/g, '-')

  // Convert smart quotes to ASCII
  normalized = normalized
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2013/g, '-') // En dash
    .replace(/\u2014/g, '--') // Em dash
    .replace(/\u2026/g, '...') // Ellipsis

  // Remove other common Unicode artifacts
  normalized = normalized
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/\uFEFF/g, '') // Zero-width no-break space

  // Normalize line breaks (convert Windows/Mac line breaks to Unix)
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Remove excessive line breaks (more than 2 consecutive)
  normalized = normalized.replace(/\n{3,}/g, '\n\n')

  // Trim whitespace from each line
  normalized = normalized
    .split('\n')
    .map(line => line.trim())
    .join('\n')

  // Remove leading/trailing whitespace
  normalized = normalized.trim()

  return normalized
}

/**
 * Detect and remove repeated headers/footers that appear on multiple pages
 * @param {string} text - Normalized text
 * @param {number} pageCount - Number of pages in document
 * @returns {string} - Text with headers/footers removed
 */
export const removeHeadersFooters = (text, pageCount = 1) => {
  if (pageCount <= 1) return text

  const lines = text.split('\n')
  const lineFrequency = {}

  // Count frequency of each line
  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed.length > 0 && trimmed.length < 100) { // Only consider short lines
      lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1
    }
  })

  // Find lines that appear more than once (potential headers/footers)
  const repeatedLines = new Set(
    Object.entries(lineFrequency)
      .filter(([_, count]) => count > 1)
      .map(([line]) => line)
  )

  // Remove repeated lines from text
  const filtered = lines.filter(line => {
    const trimmed = line.trim()
    return !repeatedLines.has(trimmed)
  })

  return filtered.join('\n')
}

/**
 * Calculate extraction confidence score based on text quality
 * @param {string} text - Extracted text
 * @param {number} fileSize - Original file size in bytes
 * @returns {number} - Confidence score (0-100)
 */
export const calculateConfidence = (text, fileSize) => {
  if (!text || text.length === 0) return 0

  let confidence = 50 // Base confidence

  // Factor 1: Text length relative to file size
  const charToByteRatio = text.length / fileSize
  if (charToByteRatio > 0.01) confidence += 20
  else if (charToByteRatio > 0.005) confidence += 10

  // Factor 2: Presence of common resume keywords
  const keywords = [
    'experience', 'education', 'skills', 'work', 'university',
    'project', 'email', 'phone', 'address', 'summary'
  ]
  const keywordMatches = keywords.filter(kw => 
    text.toLowerCase().includes(kw)
  ).length
  confidence += Math.min(keywordMatches * 3, 20)

  // Factor 3: Reasonable amount of text (not too short, not just garbage)
  if (text.length > 200 && text.length < 50000) confidence += 10

  return Math.min(confidence, 100)
}

/**
 * Detect if text needs OCR (low quality extraction)
 * @param {string} text - Extracted text
 * @returns {boolean} - True if OCR is needed
 */
export const needsOCR = (text) => {
  if (!text) return true
  
  // If text is too short, likely a scanned document
  if (text.trim().length < 30) return true
  
  // Check for high ratio of non-alphabetic characters (could indicate extraction issues)
  const alphaChars = text.match(/[a-zA-Z]/g)?.length || 0
  const alphaRatio = alphaChars / text.length
  
  if (alphaRatio < 0.3) return true
  
  return false
}

/**
 * Extract basic metadata from text (email, phone, etc.)
 * @param {string} text - Normalized text
 * @returns {object} - Extracted metadata
 */
export const extractMetadata = (text) => {
  const metadata = {}

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) metadata.email = emailMatch[0]

  // Extract phone number (various formats)
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) metadata.phone = phoneMatch[0]

  return metadata
}
