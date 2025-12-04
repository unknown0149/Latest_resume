/**
 * ═══════════════════════════════════════════════════════════════════════
 * RESUME SUMMARY & ANALYSIS SERVICE (Watson-Powered)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Generates comprehensive resume insights including:
 * - Summary of strengths and areas to improve
 * - Missing skills that boost career prospects
 * - Salary-boosting skill recommendations
 * - Personalized roadmap with action items
 */

import { logger } from '../utils/logger.js'
import { salaryBoostSkills } from '../data/salaryBoostSkills.js'
import { getRoleByName } from '../data/roleSkillDatabase.js'

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

function buildSummaryPrompt(resume, predictedRole, skillGaps) {
  const skills = resume.parsed_resume?.skills || []
  const experience = resume.parsed_resume?.years_experience || 0
  const currentTitle = resume.parsed_resume?.current_title || 'Not specified'
  
  const roleData = getRoleByName(predictedRole?.name || predictedRole)
  const requiredSkills = roleData?.requiredSkills || []
  const missingSkills = skillGaps?.skillsMissing?.map(s => s.skill) || []
  
  return `You are an expert career advisor analyzing a resume.

Resume Details:
- Current Role: ${currentTitle}
- Years of Experience: ${experience}
- Skills: ${skills.join(', ')}
- Target Role: ${predictedRole?.name || predictedRole}
- Required Skills for Target Role: ${requiredSkills.join(', ')}
- Missing Skills: ${missingSkills.join(', ')}

Provide a comprehensive career analysis in JSON format:

{
  "summary": "2-3 sentence overview of the candidate's current standing",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasToImprove": ["area 1", "area 2", "area 3"],
  "careerImpactSkills": [
    {
      "skill": "skill name",
      "impact": "high|medium|low",
      "reason": "why this skill matters for career growth",
      "salaryIncrease": "estimated percentage or amount"
    }
  ],
  "quickWins": ["actionable item 1", "actionable item 2"],
  "roadmapItems": [
    {
      "title": "action item",
      "description": "what to do",
      "priority": "high|medium|low",
      "timeframe": "1-2 weeks | 1 month | 3 months",
      "category": "skill|project|certification|networking"
    }
  ]
}

Rules:
- Be specific and actionable
- Focus on skills that genuinely boost career prospects
- Consider current experience level
- Prioritize high-impact improvements
- Keep descriptions concise (under 200 chars)
- Return ONLY valid JSON`
}

export async function generateResumeSummaryWithWatson(resume, predictedRole, skillGaps) {
  if (!WATSON_API_KEY || !WATSON_PROJECT_ID) {
    logger.warn('Watson credentials missing; returning fallback summary')
    return generateFallbackSummary(resume, predictedRole, skillGaps)
  }

  try {
    const token = await getIAMToken()
    const prompt = buildSummaryPrompt(resume, predictedRole, skillGaps)

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
          max_new_tokens: 1500,
          temperature: 0.3,
          top_p: 0.9
        },
        project_id: WATSON_PROJECT_ID
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Watson summary error (${response.status}): ${text}`)
    }

    const data = await response.json()
    const raw = data.results?.[0]?.generated_text?.trim() || '{}'
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    const payload = start >= 0 && end > start ? raw.slice(start, end + 1) : '{}'
    const parsed = JSON.parse(payload)

    return {
      success: true,
      summary: parsed.summary || 'Your resume shows solid experience in your field.',
      strengths: parsed.strengths || [],
      areasToImprove: parsed.areasToImprove || [],
      careerImpactSkills: parsed.careerImpactSkills || [],
      quickWins: parsed.quickWins || [],
      roadmapItems: parsed.roadmapItems || [],
      watsonGenerated: true
    }
  } catch (error) {
    logger.error('Watson summary generation failed:', error)
    return generateFallbackSummary(resume, predictedRole, skillGaps)
  }
}

function generateFallbackSummary(resume, predictedRole, skillGaps) {
  const skills = resume.parsed_resume?.skills || []
  const experience = resume.parsed_resume?.years_experience || 0
  const missingSkills = skillGaps?.skillsMissing?.slice(0, 5) || []
  
  const careerImpactSkills = missingSkills.map(skillObj => {
    const boostData = salaryBoostSkills.find(b => 
      b.skill.toLowerCase() === skillObj.skill?.toLowerCase()
    )
    
    return {
      skill: skillObj.skill,
      impact: boostData ? 'high' : 'medium',
      reason: boostData?.reasoning || `Important for ${predictedRole?.name || 'your target role'}`,
      salaryIncrease: boostData?.impact?.percentage || '15-25%'
    }
  })

  const roadmapItems = missingSkills.slice(0, 3).map((skillObj, idx) => ({
    title: `Learn ${skillObj.skill}`,
    description: `Build proficiency in ${skillObj.skill} through online courses and hands-on projects`,
    priority: idx === 0 ? 'high' : 'medium',
    timeframe: '1-2 months',
    category: 'skill'
  }))

  return {
    success: true,
    summary: `With ${experience} years of experience and ${skills.length} skills, you're well-positioned for ${predictedRole?.name || 'career growth'}. Focus on closing key skill gaps to maximize opportunities.`,
    strengths: skills.slice(0, 3).map(s => `Strong ${s} skills`),
    areasToImprove: missingSkills.slice(0, 3).map(s => `Develop ${s.skill} expertise`),
    careerImpactSkills,
    quickWins: [
      'Update resume with quantified achievements',
      'Build a portfolio showcasing your projects',
      'Connect with professionals in your target role'
    ],
    roadmapItems,
    watsonGenerated: false
  }
}
