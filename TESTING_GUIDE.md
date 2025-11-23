# 🚀 QUICK START GUIDE - Testing the Full Workflow

## Prerequisites
- Backend server running on port 8000
- Frontend server running on port 3000
- MongoDB running on localhost:27017

---

## Step-by-Step Testing

### 1️⃣ **Start Backend Server** (if not running)
```bash
cd C:\Users\admin\Desktop\finalmini\backend
npm run dev
```

**Expected output:**
```
Server running on port 8000
MongoDB Connected: localhost
Embedding queue worker started
```

### 2️⃣ **Start Frontend Server** (if not running)
```bash
cd C:\Users\admin\Desktop\finalmini\frontend
npm run dev
```

**Expected output:**
```
VITE ready in 500ms
Local:   http://localhost:3000
```

### 3️⃣ **Load Seed Jobs** (First time only)
Open browser console and run:
```javascript
fetch('http://localhost:8000/api/admin/seed-jobs', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('✅ Loaded', d.jobsLoaded, 'jobs'))
```

Or use curl/PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/admin/seed-jobs" -Method POST
```

**Expected:** `✅ 100 jobs loaded successfully`

---

## 🧪 Test the Full Workflow

### **Option A: Using Frontend (Recommended)**

1. Open browser: `http://localhost:3000`

2. **Register/Login:**
   - Click "Get Started" or "Register"
   - Fill in details and register
   - You'll be auto-logged in

3. **Upload Resume:**
   - Click "Upload Resume" or navigate to `/upload`
   - Upload a PDF/DOC resume (max 10MB, 30 pages)
   - Click "Analyze with AI"

4. **Wait for Analysis:**
   - ⏱️ Takes 10-20 seconds for complete analysis
   - You'll see progress indicators:
     - 📤 Uploading resume...
     - 🔍 Parsing resume...
     - 🎯 Analyzing role...
     - 💼 Finding matching jobs...

5. **View Dashboard:**
   - Automatically redirected to dashboard
   - See: Predicted roles, skill gaps, job matches, salary tips

---

### **Option B: Using Test Script**

If you get a network error, test the backend directly:

```bash
cd C:\Users\admin\Desktop\finalmini\backend
node test-analyze.js <your-resume-id>
```

This will show exactly where the process fails.

---

### **Option C: Manual API Testing**

**Step 1: Upload Resume**
```powershell
$file = "C:\path\to\your\resume.pdf"
$form = @{ file = Get-Item -Path $file }
Invoke-RestMethod -Uri "http://localhost:8000/api/resume/upload" -Method POST -Form $form
```

**Response:**
```json
{
  "resumeId": "abc-123-def",
  "raw_text": "Your resume text...",
  "extraction_status": "completed"
}
```

**Step 2: Parse Resume**
```powershell
$resumeId = "abc-123-def"  # From step 1
$body = @{ mode = "deep" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/api/resume/$resumeId/parse" -Method POST -Body $body -ContentType "application/json"
```

**Step 3: Analyze Role**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/resume/$resumeId/analyze-role" -Method POST -ContentType "application/json"
```

**Step 4: Get Job Matches**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/jobs/match/$resumeId?useEmbeddings=true&generateAISummaries=true" -Method GET
```

---

## 🐛 Common Errors & Solutions

### ❌ **"Network Error" in Frontend**

**Cause:** Backend not running or CORS issue

**Solution:**
1. Check backend is running: `netstat -ano | findstr :8000`
2. Check frontend .env: `VITE_API_URL=http://localhost:8000/api`
3. Restart both servers

---

### ❌ **"Resume not found"**

**Cause:** Invalid resumeId or resume not in database

**Solution:**
1. Check MongoDB: `db.resumes.find().count()`
2. Re-upload resume from frontend
3. Verify resumeId in browser console logs

---

### ❌ **"Watson IAM token failed: 400"**

**Cause:** Invalid IBM API credentials

**Solution:**
1. Check backend .env has correct credentials:
   ```
   IBM_API_KEY=EcgZwcDB5l3cJdUYjWBZVHskBwPyoIW4dRXaqEepH6D4
   IBM_PROJECT_ID=cb12597c-abad-4915-915b-60bfa9146595
   ```
2. Restart backend server
3. Test Watson: Run parse with `mode=quick` to skip Watson

---

### ❌ **"Job matching returns 0 results"**

**Cause:** No seed jobs in database

**Solution:**
```javascript
// Load 100 seed jobs
fetch('http://localhost:8000/api/admin/seed-jobs', { method: 'POST' })
```

---

### ❌ **"Module not found" errors**

**Cause:** Old service imports still cached

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules
npm install
npm run dev

# Frontend  
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📊 Expected Results

After successful analysis, you should see:

**1. Role Prediction:**
- Primary role (e.g., "Backend Java Developer")
- Match score (e.g., 85%)
- Alternative roles (2-3 options)

**2. Skill Analysis:**
- Skills you have (with levels)
- Missing core skills (high priority)
- Missing optional skills (nice to have)

**3. Salary Boost Opportunities:**
- Top 5 high-impact skills
- Salary increase potential (e.g., "Kubernetes: +25-35%")
- Demand level (Very High/High/Medium)

**4. Job Matches:**
- 20 best-matching jobs
- Match scores (50-100%)
- AI-generated summaries (top 10)
- Matched/missing skills per job

---

## 🎯 Success Criteria

✅ Backend server starts without errors  
✅ Frontend connects to backend  
✅ Resume uploads successfully  
✅ Parsing completes with >70% confidence  
✅ Role prediction returns primary role  
✅ At least 10 job matches found  
✅ Watson usage < 10% of requests  
✅ Dashboard shows all data correctly  

---

## 🔍 Debug Checklist

If "Analyze with AI" fails:

1. **Check browser console** - Look for red errors
2. **Check Network tab** - See which API call failed (Status 404/500?)
3. **Check backend terminal** - Any error logs?
4. **Verify data flow:**
   - Was upload successful? (Check resumeId in localStorage)
   - Was parsing successful? (Check `parsed_resume` in response)
   - Does MongoDB have the resume? (Check with MongoDB Compass)

5. **Test individual endpoints:**
   - Upload: `POST /api/resume/upload` ✅
   - Parse: `POST /api/resume/:id/parse` ✅  
   - Analyze: `POST /api/resume/:id/analyze-role` ❌ (failing here?)
   - Match: `GET /api/jobs/match/:id` ✅

6. **Use test script:**
   ```bash
   cd backend
   node test-analyze.js <resumeId>
   ```

This will pinpoint the exact error!

---

## 📞 Need Help?

**Check logs:**
- Backend: Look at terminal output
- Frontend: Open browser DevTools → Console tab
- MongoDB: Use MongoDB Compass to view data

**Common log locations:**
- Backend: `backend/logs/`
- Frontend: Browser console
- MongoDB: Default data directory

---

## ✨ Pro Tips

1. **Use deep parse mode** for best results (slower but more accurate)
2. **Enable Watson summaries** for job matches (adds 5-10s)
3. **Use embedding matching** for semantic similarity (requires embeddings generated)
4. **Check Watson usage stats:** `GET /api/stats/watson-usage`

Enjoy your AI-powered resume analyzer! 🚀
