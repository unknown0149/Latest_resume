import { logger } from '../utils/logger.js'
import { canonicalizeSkills } from '../data/skillsCanonical.js'

const WATSON_API_KEY = process.env.WATSONX_API_KEY || process.env.IBM_API_KEY
const WATSON_PROJECT_ID = process.env.WATSONX_PROJECT_ID || process.env.IBM_PROJECT_ID
const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token'
const WATSON_API_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29'

let cachedToken = null
let tokenExpiry = 0

async function getIAMToken() {
  if (!WATSON_API_KEY) {
    throw new Error('Watson API key not configured')
  }

  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken
  }

  const response = await fetch(IAM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSON_API_KEY}`
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.errorMessage || `IAM token request failed: ${response.status}`)
  }

  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000
  return cachedToken
}

function truncate(text, length = 1200) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

function buildCompatibilityPrompt(resumeProfile, job) {
  const resumeSkills = canonicalizeSkills(resumeProfile.skills || [])
  const resumeSummary = truncate(resumeProfile.summary || resumeProfile.fullText || '')

  const requirementText = Array.isArray(job.requirements) ? job.requirements.join('\n- ') : job.requirements
  const responsibilityText = Array.isArray(job.responsibilities) ? job.responsibilities.join('\n- ') : job.responsibilities

  return `You are an expert technical recruiter.
Decide if this resume is a strong match for the job. Return ONLY valid JSON.

Resume Summary:
${resumeSummary || 'N/A'}

Resume Skills:
${resumeSkills.join(', ') || 'N/A'}

Job Title: ${job.title}
Company: ${job.company?.name}
Location: ${job.location?.city}
Responsibilities:
- ${responsibilityText || 'N/A'}

Requirements:
- ${requirementText || 'N/A'}

Job Description:
${truncate(job.description, 1800) || 'N/A'}

Return JSON:
{
  "compatible": true|false,
  "confidence": 0-1,
  "matchedSkills": ["skill"...],
  "missingSkills": ["skill"...],
  "reason": "short explanation"
}

Rules:
- Only mark compatible if the resume summary AND skills satisfy the role requirements.
- Use lowercase skill names, canonical form.
- Keep reason under 200 characters.`
}

export async function evaluateJobCompatibilityWithWatson(resumeProfile, job) {
  if (!resumeProfile || !WATSON_API_KEY || !WATSON_PROJECT_ID) {
    return {
      compatible: true,
      confidence: 0.4,
      matchedSkills: [],
      missingSkills: [],
      reason: 'Watson unavailable; skipping compatibility check.'
    }
  }

  try {
    const token = await getIAMToken()
    const prompt = buildCompatibilityPrompt(resumeProfile, job)

    const response = await fetch(WATSON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.2,
          top_p: 0.9
        },
        project_id: WATSON_PROJECT_ID
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Watson compatibility error (${response.status}): ${text}`)
    }

    const data = await response.json()
    const raw = data.results?.[0]?.generated_text?.trim() || '{}'
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    const payload = start >= 0 && end > start ? raw.slice(start, end + 1) : '{}'
    const parsed = JSON.parse(payload)

    return {
      compatible: parsed.compatible !== false,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
      matchedSkills: canonicalizeSkills(parsed.matchedSkills || []),
      missingSkills: canonicalizeSkills(parsed.missingSkills || []),
      reason: parsed.reason || 'Compatibility verified by Watson.'
    }
  } catch (error) {
    logger.warn('Watson compatibility check failed:', error.message)
    return {
      compatible: true,
      confidence: 0.4,
      matchedSkills: [],
      missingSkills: [],
      reason: 'Watson unavailable; bypassed compatibility enforcement.'
    }
  }
}

export function mapResumeToProfile(resume) {
  if (!resume) return null
  const summary =
    resume.parsed_resume?.summary ||
    resume.parsed_resume?.professional_summary ||
    resume.parsed_resume?.profile?.summary ||
    resume.parsed_resume?.objective ||
    ''

  const skills = resume.parsed_resume?.skills || resume.parsed_resume?.profile?.skills || []
  const fullText = resume.parsed_resume?.extracted_text?.full_text || resume.raw_text || ''

  return {
    summary,
    skills,
    fullText
  }
}
