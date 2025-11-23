# Quick Test Guide - Resume Upload Flow

## What's Fixed:

### ✅ Issue 1: Dashboard showing mock data (John Doe)
**Solution**: Dashboard now checks if resume data exists. If not, it redirects to upload page.

### ✅ Issue 2: Upload not extracting real data
**Solution**: 
- Backend extracts text from PDF/DOCX/Images
- Frontend parses extracted text into structured resume data
- Your actual name, email, phone, skills are extracted from the document

## How to Test:

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
**Expected**: Server starts on http://localhost:8000

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**Expected**: Opens http://localhost:3000

### 3. Start MongoDB (Terminal 3)
```bash
mongod
```
**Expected**: MongoDB running on localhost:27017

### 4. Test Upload Flow

1. **Go to**: http://localhost:3000
2. **Click**: "Get Started" or "Upload Resume"
3. **Upload**: Your resume (PDF, DOCX, PNG, or JPG)
4. **Click**: "Analyze with AI"
5. **Wait**: 3-5 seconds for backend to extract text
6. **Result**: Dashboard shows YOUR data, not John Doe

### 5. What Gets Extracted:

From your resume, the system extracts:
- ✅ Your name (from first line)
- ✅ Email address
- ✅ Phone number
- ✅ Location (City, State)
- ✅ Skills (matches against 30+ common tech skills)
- ✅ Experience years
- ✅ Education

### 6. Check Browser Console

Open DevTools (F12) → Console tab to see:
```javascript
Upload response: {
  resumeId: "uuid-here",
  raw_text: "Your extracted text...",
  extraction_status: "completed",
  extraction_confidence: 85
}

Parsed resume: {
  id: "uuid",
  name: "YOUR NAME",
  email: "your@email.com",
  skills: ["JavaScript", "React", ...],
  ...
}
```

### 7. Verify in MongoDB

```bash
mongosh
use resume_analyzer
db.resumes.find().pretty()
```

You should see your uploaded resume stored with extracted text.

## Common Issues:

### "Failed to upload resume"
- ❌ Backend not running → Start with `npm run dev` in backend folder
- ❌ MongoDB not running → Start with `mongod`
- ❌ File too large → Max 10MB

### "Dashboard is blank"
- ❌ No resume uploaded → Go back and upload first
- ❌ Upload failed → Check console for errors

### "Still shows John Doe"
- ❌ Old data in context → Refresh page (F5)
- ❌ Using old build → Restart frontend dev server

## Data Flow:

```
1. Upload PDF/DOCX → Backend
2. Backend extracts text → Returns raw_text
3. Frontend parses text → Structured data
4. Context stores data → Dashboard displays
```

## Next Steps (Future Phases):

- Phase 2: Use IBM Watson X.ai to better parse resumes
- Phase 3: Real job role prediction with AI
- Phase 4: Real skill gap analysis
- Phase 5: Generate career roadmap

For now, job roles and other analysis use mock data, but your resume data is REAL!
