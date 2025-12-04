import { logger } from '../utils/logger.js'

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

/**
 * Generate comprehensive resume summary with Watson AI
 */
export async function generateResumeSummaryWithWatson(resume, predictedRole, skillGaps) {
  if (!WATSON_API_KEY || !WATSON_PROJECT_ID) {
    logger.warn('Watson not configured, using fallback summary')
    return generateFallbackSummary(resume, predictedRole, skillGaps)
  }

  try {
    const token = await getIAMToken()
    
    const prompt = `You are an expert career advisor and resume consultant. Analyze this resume and provide a comprehensive summary.

RESUME DATA:
Name: ${resume.parsed_resume?.name || 'Not provided'}
Current Role: ${resume.parsed_resume?.current_title || 'Not specified'}
Experience: ${resume.parsed_resume?.years_experience || 0} years
Skills: ${(resume.parsed_resume?.skills || []).join(', ')}
Summary: ${resume.parsed_resume?.summary || resume.parsed_resume?.professional_summary || 'N/A'}

PREDICTED BEST ROLE: ${predictedRole?.name || 'Not analyzed'}
MATCH SCORE: ${predictedRole?.matchScore || 0}%

SKILLS ANALYSIS:
- Skills Have: ${skillGaps?.skillsHave?.length || 0}
- Skills Missing: ${skillGaps?.skillsMissing?.length || 0}

Provide a JSON response with:
{
  "overallAssessment": "Brief 2-3 sentence assessment of the resume strength and career positioning",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2", "area3"],
  "careerAdvice": "Paragraph of career direction advice",
  "skillDevelopmentPriority": [
    {
      "skill": "skill name",
      "priority": "high|medium|low",
      "reason": "why this skill matters",
      "expectedImpact": "career or salary impact"
    }
  ],
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}

Be specific, actionable, and encouraging. Focus on practical career growth.`

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
          max_new_tokens: 1200,
          temperature: 0.7,
          top_p: 0.9
        },
        project_id: WATSON_PROJECT_ID
      })
    })

    if (!response.ok) {
      throw new Error(`Watson API error: ${response.status}`)
    }

    const data = await response.json()
    const raw = data.results?.[0]?.generated_text?.trim() || '{}'
    
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    const payload = start >= 0 && end > start ? raw.slice(start, end + 1) : '{}'
    const parsed = JSON.parse(payload)

    return {
      success: true,
      summary: parsed,
      source: 'watson'
    }
  } catch (error) {
    logger.error('Watson resume summary generation failed:', error.message)
    return generateFallbackSummary(resume, predictedRole, skillGaps)
  }
}

function generateFallbackSummary(resume, predictedRole, skillGaps) {
  const yearsExp = resume.parsed_resume?.years_experience || 0
  const skillsCount = resume.parsed_resume?.skills?.length || 0
  const missingCount = skillGaps?.skillsMissing?.length || 0

  return {
    success: true,
    summary: {
      overallAssessment: `Professional with ${yearsExp} years of experience and ${skillsCount} identified skills. ${missingCount > 0 ? `Focus on developing ${missingCount} key skills to strengthen profile.` : 'Strong skill foundation.'}`,
      strengths: [
        `${yearsExp}+ years of industry experience`,
        `Proficient in ${skillsCount} technical skills`,
        predictedRole?.name ? `Good match for ${predictedRole.name} roles` : 'Versatile skill set'
      ],
      areasToImprove: skillGaps?.skillsMissing?.slice(0, 3).map(s => s.skill) || ['Continue learning new technologies', 'Expand project portfolio', 'Build domain expertise'],
      careerAdvice: `Based on your experience and skill set, ${predictedRole?.name ? `pursuing ${predictedRole.name} positions` : 'continuing in your current domain'} is recommended. Focus on mastering in-demand skills and building a strong portfolio to increase marketability.`,
      skillDevelopmentPriority: skillGaps?.skillsMissing?.slice(0, 5).map(s => ({
        skill: s.skill,
        priority: s.priority >= 3 ? 'high' : s.priority >= 2 ? 'medium' : 'low',
        reason: s.type === 'required' ? 'Required for target roles' : 'Nice to have skill',
        expectedImpact: s.salaryBoost ? `${s.salaryBoost.percentage} salary increase potential` : 'Enhances employability'
      })) || [],
      nextSteps: [
        missingCount > 0 ? `Start learning ${skillGaps.skillsMissing[0].skill}` : 'Continue building projects',
        'Update resume with recent projects and achievements',
        'Apply to roles matching your skill profile'
      ]
    },
    source: 'fallback'
  }
}

export default {
  generateResumeSummaryWithWatson
}
