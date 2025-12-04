# Manual Testing Guide - Interview System

## Prerequisites
1. MongoDB running on localhost:27017
2. Backend server running on port 8000
3. Have a resume uploaded and parsed

## Test Steps

### 1. Start Backend Server
```bash
cd backend
node src/server.js
```

Wait for:
- ✅ "Server running on port 8000"
- ✅ "MongoDB Connected: localhost"
- ✅ "95 active seed jobs found"

### 2. Test Interview API Endpoints

#### A. Generate Interview Questions
```bash
curl -X POST http://localhost:8000/api/interview/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"resumeId\":\"test-resume-001\",\"skills\":[\"JavaScript\",\"React\",\"Node.js\"],\"questionsPerSkill\":3}"
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "session_...",
  "questions": [
    {
      "id": "q_...",
      "skill": "JavaScript",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "difficulty": "easy"
    }
  ],
  "expiresAt": "..."
}
```

#### B. Submit Interview Answers
```bash
curl -X POST http://localhost:8000/api/interview/submit ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"SESSION_ID_FROM_STEP_A\",\"answers\":[{\"questionId\":\"q_1\",\"selectedOption\":\"A\"}]}"
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "score": 66,
    "correctAnswers": 6,
    "totalQuestions": 9,
    "credibilityScore": 75,
    "badge": {
      "level": "silver",
      "label": "Silver Verified",
      "color": "silver",
      "icon": "🥈"
    },
    "verifiedSkills": [...],
    "questionableSkills": [...]
  }
}
```

#### C. Get Verification Status
```bash
curl http://localhost:8000/api/interview/status/test-resume-001
```

**Expected Response:**
```json
{
  "success": true,
  "verification": {
    "isVerified": true,
    "credibilityScore": 75,
    "badge": {...},
    "verifiedSkills": [...],
    "totalInterviews": 1,
    "lastInterviewAt": "..."
  }
}
```

### 3. Test Frontend Integration

#### A. Start Frontend
```bash
cd frontend
npm run dev
```

#### B. Test Flow in Browser
1. Go to http://localhost:3000
2. Login/Register
3. Upload Resume
4. Navigate to Dashboard → Profile tab
5. Should see "Skill Verification" section
6. Click "Verify Skills" button (needs to be added)
7. InterviewModal should open with questions
8. Answer questions
9. Submit interview
10. See results with badge
11. Badge should appear in Profile tab

## Success Criteria
- ✅ Backend server starts without errors
- ✅ All API endpoints return 200 status
- ✅ Questions generated for multiple fields (IT, Finance, Fashion, etc.)
- ✅ Interview submission updates resume verification_status
- ✅ Badge displayed correctly based on score
- ✅ Profile tab shows verification badge
- ✅ InterviewModal works end-to-end

## Known Issues
- Server keeps getting interrupted during tests (use separate PowerShell window)
- Test script has connection reset issues (use manual curl instead)
