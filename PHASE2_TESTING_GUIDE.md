# Phase 2 Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Phase 2 implementation: AI-powered job role prediction, skill gap analysis, and job matching with minimal Watson usage (<5%).

## Prerequisites
- Backend server running on port 8000
- MongoDB connected
- Watson X.ai credentials configured in `.env`
- Dependencies installed (`natural`, `node-cron`, `compromise`)

## Testing Steps

### 1. Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
Server running on port 8000
Job scheduler started successfully
Schedules:
- Daily job refresh: 00:00 (midnight)
- Expired jobs cleanup: Every 6 hours
- Statistics update: Every hour
```

### 2. Load Seed Jobs
**Endpoint:** `POST http://localhost:8000/api/admin/seed-jobs`

```bash
curl -X POST http://localhost:8000/api/admin/seed-jobs
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Seed jobs loaded successfully",
  "count": 100
}
```

This generates 100 tech jobs across 10 roles:
- Senior Java Developer
- Full Stack Developer
- Frontend Developer
- DevOps Engineer
- Data Engineer
- Mobile Developer (React Native)
- Machine Learning Engineer
- Cloud Solutions Architect
- QA Automation Engineer
- Software Engineer

### 3. Upload Sample Resume
**Endpoint:** `POST http://localhost:8000/api/resume/upload`

Upload a PDF/DOCX resume with skills like: Java, Spring Boot, Microservices, REST API, SQL, Docker, Kubernetes

**Expected Response:**
```json
{
  "success": true,
  "resumeId": "unique-resume-id",
  "message": "Resume uploaded successfully"
}
```

### 4. Analyze Role and Skills
**Endpoint:** `POST http://localhost:8000/api/resume/:resumeId/analyze-role`

```bash
curl -X POST http://localhost:8000/api/resume/{resumeId}/analyze-role
```

**Expected Response:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "rolePrediction": {
      "primaryRole": {
        "name": "Backend Java Developer",
        "matchScore": 85.5,
        "confidence": 0.95,
        "reasoning": "Matched 5/5 required skills and 8/12 preferred skills"
      },
      "alternativeRoles": [
        {
          "name": "Full Stack Developer",
          "matchScore": 78.2,
          "reason": "4/5 core skills matched"
        },
        {
          "name": "Software Engineer",
          "matchScore": 72.8,
          "reason": "3/5 core skills matched"
        }
      ],
      "skillsSummary": {
        "totalSkills": 15,
        "experienceYears": 5
      },
      "metadata": {
        "watsonUsed": false,
        "processingTime": 234,
        "timestamp": "2024-01-18T10:30:00.000Z"
      }
    },
    "skillAnalysis": {
      "targetRole": {
        "name": "Backend Java Developer",
        "category": "Backend",
        "experienceRange": { "min": 3, "max": 8 },
        "salaryRange": {
          "USD": { "min": 90000, "max": 150000 },
          "INR": { "min": 800000, "max": 1500000 }
        }
      },
      "skillsSummary": {
        "totalHave": 13,
        "totalMissing": 7,
        "requiredHave": 5,
        "requiredMissing": 0,
        "preferredHave": 8,
        "preferredMissing": 7,
        "completeness": "100.0"
      },
      "skillsHave": [
        { "skill": "java", "type": "required", "level": "Advanced" },
        { "skill": "spring boot", "type": "required", "level": "Advanced" },
        { "skill": "microservices", "type": "required", "level": "Intermediate" }
      ],
      "skillsMissing": [
        {
          "skill": "kafka",
          "type": "preferred",
          "priority": 45,
          "reasons": ["Preferred for role", "+25% salary impact"],
          "salaryBoost": {
            "percentage": "20-30%",
            "absoluteUSD": { "min": 15000, "max": 25000 },
            "absoluteINR": { "min": 200000, "max": 400000 }
          }
        }
      ],
      "salaryBoostOpportunities": {
        "topOpportunities": [
          {
            "skill": "kafka",
            "type": "preferred",
            "impact": "20-30%",
            "potentialIncrease": {
              "USD": { "min": 15000, "max": 25000 },
              "INR": { "min": 200000, "max": 400000 }
            }
          }
        ],
        "totalPotentialIncrease": {
          "percentage": { "min": 50, "max": 80 },
          "absolute": {
            "USD": { "min": 45000, "max": 75000 },
            "INR": { "min": 600000, "max": 1000000 }
          }
        }
      },
      "recommendations": [
        {
          "priority": "MEDIUM",
          "title": "Expand with Preferred Skills",
          "description": "Strengthen your profile with: kafka, redis, mongodb",
          "estimatedTime": "7-14 months"
        }
      ]
    }
  }
}
```

**Key Validations:**
- ✅ `metadata.watsonUsed` should be `false` (backend logic used)
- ✅ `primaryRole.matchScore` should be >70% for good matches
- ✅ `skillsSummary.completeness` shows percentage of required skills matched
- ✅ `salaryBoostOpportunities` lists high-value skills to learn

### 5. Find Matching Jobs
**Endpoint:** `GET http://localhost:8000/api/jobs/match/:resumeId?limit=10&minMatchScore=50`

```bash
curl "http://localhost:8000/api/jobs/match/{resumeId}?limit=10&minMatchScore=50&generateAISummaries=true"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "jobId": "JOB-001",
        "title": "Senior Java Backend Developer",
        "company": {
          "name": "TechCorp Solutions",
          "logo": "https://example.com/logos/techcorp.png"
        },
        "location": {
          "city": "San Francisco",
          "state": "CA",
          "country": "USA",
          "isRemote": true,
          "locationType": "hybrid"
        },
        "employmentType": "full-time",
        "experienceLevel": "senior",
        "salary": {
          "min": 120000,
          "max": 160000,
          "currency": "USD",
          "period": "yearly"
        },
        "matchScore": 92.5,
        "matchPercentage": "85.7",
        "scoreBreakdown": {
          "skills": 95.0,
          "experience": 100.0,
          "recency": 85.0,
          "salary": 75.0
        },
        "skillsMatched": ["java", "spring boot", "microservices", "rest api", "sql", "docker"],
        "skillsMissing": ["kafka", "kubernetes"],
        "aiSummary": "Your strong Java and Spring Boot background aligns perfectly with this role. The microservices experience you have is exactly what they're looking for, and learning Kafka would make you an even stronger candidate.",
        "postedDate": "2024-01-15T00:00:00Z",
        "applicationUrl": "https://techcorp.com/apply/001"
      }
    ],
    "total": 10,
    "metadata": {
      "processingTime": 1456,
      "watsonCalls": 3,
      "watsonUsagePercent": "30.0",
      "timestamp": "2024-01-18T10:35:00.000Z"
    }
  }
}
```

**Key Validations:**
- ✅ Watson summaries (`aiSummary`) generated ONLY for top 3 jobs
- ✅ `watsonUsagePercent` should be around 30% (3 out of 10 jobs)
- ✅ Jobs sorted by `matchScore` (composite score)
- ✅ `skillsMatched` and `skillsMissing` arrays populated
- ✅ `scoreBreakdown` shows weighted factors (skills 60%, experience 20%, recency 10%, salary 10%)

### 6. Track Job Interaction
**Endpoint:** `POST http://localhost:8000/api/jobs/:jobId/track`

```bash
curl -X POST http://localhost:8000/api/jobs/JOB-001/track \
  -H "Content-Type: application/json" \
  -d '{"resumeId": "{resumeId}", "action": "view"}'
```

**Actions:** `view`, `apply`, `save`, `dismiss`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "action": "view"
  }
}
```

### 7. Get Saved Jobs
**Endpoint:** `GET http://localhost:8000/api/jobs/saved/:resumeId`

### 8. Get Applied Jobs
**Endpoint:** `GET http://localhost:8000/api/jobs/applied/:resumeId`

### 9. Check Watson Usage Statistics
**Endpoint:** `GET http://localhost:8000/api/stats/watson-usage`

```bash
curl http://localhost:8000/api/stats/watson-usage
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalResumes": 5,
    "resumesUsingWatson": 1,
    "totalWatsonCalls": 4,
    "watsonUsagePercent": 20.0,
    "targetUsagePercent": 5.0
  }
}
```

**Key Validation:**
- ✅ `watsonUsagePercent` should be <5% in production (20% acceptable during testing with small sample size)
- ✅ Watson called only for: tiebreaker scenarios (<10% score difference) + top 3 job summaries

## Watson Usage Scenarios

### When Watson IS Called:
1. **Role Prediction Tiebreaker:** Top 2 roles differ by <10% match score
   - Example: Backend Java (82.5%) vs Full Stack (78.2%) → 4.3% difference → Watson called
2. **Job Summaries:** Top 3 matched jobs get AI-generated 2-sentence summaries

### When Watson IS NOT Called:
1. **Clear Role Winner:** Top role has >10% lead over second place
   - Example: Backend Java (85.5%) vs Full Stack (72.8%) → 12.7% difference → Backend logic used
2. **Skill Matching:** All skill normalization and fuzzy matching done via backend
3. **Job Matching:** Composite scoring (60% skills, 20% experience, 10% recency, 10% salary) done via backend

## Expected Watson Usage Breakdown

For 100 resumes tested:
- **Role Prediction:** ~5-10 Watson calls (5-10% of cases where tiebreaker needed)
- **Job Matching:** 300 Watson calls (100 resumes × top 3 jobs)
- **Total:** ~310 Watson calls for 100 resumes = **3.1 calls per resume**

## Performance Benchmarks

- **Role Prediction:** <500ms (backend), <2000ms (with Watson)
- **Skill Analysis:** <300ms
- **Job Matching (20 jobs):** <1500ms (backend), <5000ms (with AI summaries for top 3)
- **Total End-to-End:** <6 seconds for complete analysis + job matching

## Testing Checklist

- [ ] Backend server starts successfully
- [ ] Cron scheduler initialized (logs show 3 scheduled tasks)
- [ ] Seed jobs loaded (100 jobs across 10 roles)
- [ ] Resume upload works (PDF/DOCX/OCR)
- [ ] Role prediction returns primary + 2 alternative roles
- [ ] Skill analysis identifies gaps and salary boost opportunities
- [ ] Job matching returns sorted results with match scores
- [ ] Watson summaries generated ONLY for top 3 jobs
- [ ] Watson usage <5% for role prediction (tiebreaker scenarios only)
- [ ] Job interactions tracked (view, apply, save, dismiss)
- [ ] Saved/applied jobs retrievable
- [ ] MongoDB indexes used (check with `.explain()`)
- [ ] Watson usage statistics endpoint working

## Troubleshooting

### Watson API Errors
- Check IAM token is valid (expires after 1 hour, auto-refreshed)
- Verify `WATSON_API_KEY` and `WATSON_PROJECT_ID` in `.env`
- Check Watson endpoint URL: `https://us-south.ml.cloud.ibm.com`

### Low Match Scores
- Check skill normalization working (e.g., "reactjs" → "react")
- Verify fuzzy matching threshold (0.75 for partial matches)
- Review role-skill database mappings

### MongoDB Performance
- Ensure compound indexes created: `db.jobs.getIndexes()`
- Check TTL index for auto-cleanup: `expiresAt` field
- Verify indexed queries: `db.jobs.find({...}).explain("executionStats")`

### Seed Jobs Not Loading
- Check if already loaded: `GET /api/admin/seed-jobs` returns existing count
- Clear and reload: `DELETE /api/admin/seed-jobs` then `POST /api/admin/seed-jobs`

## Success Criteria

✅ **Phase 2 Complete When:**
1. Watson usage consistently <5% for role prediction
2. Job matching returns >50% match scores for relevant jobs
3. AI summaries generated for top 3 jobs only
4. All endpoints respond within performance benchmarks
5. Cron scheduler runs without errors for 24 hours
6. MongoDB indexes improve query performance by >10x

---

**Next Steps:** After successful testing, integrate frontend components for dashboard display of role predictions, skill gaps, and job recommendations.
