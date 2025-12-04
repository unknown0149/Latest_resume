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

function normalizeSkillList(skills = []) {
  const canonical = canonicalizeSkills(skills)
  return canonical
    .map((skill) => skill?.toLowerCase().trim())
    .filter((skill, idx, arr) => skill && arr.indexOf(skill) === idx)
}

function buildJobPrompt(jobPayload) {
  const { title, company, description, requirements = [], responsibilities = [], location } = jobPayload
  const requirementText = Array.isArray(requirements) ? requirements.join('\n- ') : requirements
  const responsibilityText = Array.isArray(responsibilities) ? responsibilities.join('\n- ') : responsibilities

  return `You are an expert technical recruiter.
Extract the realistic REQUIRED and PREFERRED technical skills for the following job posting.
Return ONLY valid JSON with this schema:
{
  "requiredSkills": ["skill"...],
  "preferredSkills": ["skill"...],
  "summary": "one sentence summary of the profile fit"
}

Rules:
- Use canonical skill names ("javascript" not "js", "react" not "reactjs")
- Include at least 5 required skills when possible
- Prefer hard technical skills (frameworks, languages, cloud tools, DevOps stack)
- If the posting does not specify skills, infer from the title + description
- Do not add soft skills
- Respond with lowercase skill names only.

Job Title: ${title}
Company: ${company}
Location: ${location}
Description: ${description?.slice(0, 1500) || 'N/A'}
Requirements:
- ${requirementText || 'N/A'}
Responsibilities:
- ${responsibilityText || 'N/A'}
`
}

export async function extractJobSkillsWithWatson(jobPayload) {
  if (!WATSON_API_KEY || !WATSON_PROJECT_ID) {
    logger.warn('Watson credentials missing. Cannot enrich job skills.')
    return { success: false, required: [], preferred: [], summary: null }
  }

  try {
    const token = await getIAMToken()
    const prompt = buildJobPrompt(jobPayload)

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
          max_new_tokens: 800,
          temperature: 0.25,
          top_p: 0.9
        },
        project_id: WATSON_PROJECT_ID
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Watson job skill extraction failed (${response.status}): ${text}`)
    }

    const data = await response.json()
    const raw = data.results?.[0]?.generated_text?.trim() || ''
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) {
      throw new Error('Watson response did not contain JSON payload')
    }

    const parsed = JSON.parse(raw.slice(start, end + 1))
    const required = normalizeSkillList(parsed.requiredSkills || parsed.skills || [])
    const preferred = normalizeSkillList(parsed.preferredSkills || [])

    return {
      success: required.length > 0 || preferred.length > 0,
      required,
      preferred,
      summary: parsed.summary || null
    }
  } catch (error) {
    logger.warn('Watson job skill extraction error:', error.message)
    return { success: false, required: [], preferred: [], summary: null, error: error.message }
  }
}

export function resetWatsonJobSkillCache() {
  cachedToken = null
  tokenExpiry = 0
}
