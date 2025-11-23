# Resume Genie - COMPLETE SETUP GUIDE

## 🚨 IMPORTANT: Follow These Steps EXACTLY

### Step 1: Install Dependencies

**Open PowerShell or CMD in the project root folder:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Check MongoDB

Make sure MongoDB is installed:
- Download from: https://www.mongodb.com/try/download/community
- Or check if installed: `mongod --version`

### Step 3: Start Everything

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🎯 HOW IT WORKS NOW

### 1. Registration Required
- You MUST register first before using the app
- No more direct access to dashboard without login
- No more John Doe mock data

### 2. Complete Flow:
```
Register → Login → Upload Resume → Dashboard (YOUR DATA)
```

### 3. What's Fixed:

✅ **Authentication System**
- Login page works
- Register page works
- Protected routes (can't access upload/dashboard without login)

✅ **Resume Upload & Extraction**
- Upload PDF/DOCX/PNG/JPG
- Backend extracts text
- Frontend parses YOUR actual data
- No more mock data showing

✅ **Dashboard Protection**
- Can't see dashboard without uploading resume first
- Shows YOUR name, not John Doe
- Redirects to upload if no data

## 📝 STEP-BY-STEP USAGE

### First Time User:

1. **Go to**: http://localhost:3000
2. **Click**: "Get Started" or "Register"
3. **Fill form**:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 6 chars)
4. **Click**: "Create Account"
5. **Auto redirect to**: Upload page
6. **Upload your resume** (PDF, DOCX, PNG, JPG)
7. **Click**: "Analyze with AI"
8. **Wait**: Backend extracts text (3-5 seconds)
9. **See**: YOUR dashboard with YOUR data

### Returning User:

1. **Go to**: http://localhost:3000
2. **Click**: "Login"
3. **Enter**: Email and password
4. **Click**: "Sign In"
5. **Upload resume** if haven't yet
6. **View dashboard** with your data

## 🐛 TROUBLESHOOTING

### "Failed to upload resume"
**Problem**: Backend not running or MongoDB not started
**Solution**:
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm run dev
```

### "Please register first"
**Problem**: Trying to login without registering
**Solution**: Click "Create one" to register first

### "Backend dependencies not installed"
**Problem**: `node_modules` folder missing in backend
**Solution**:
```bash
cd backend
npm install
```

### Still seeing John Doe
**Problem**: Old localStorage data or didn't upload resume
**Solution**:
1. Open DevTools (F12)
2. Go to Application tab → Storage → Clear storage
3. Refresh page
4. Register again
5. Upload YOUR resume

### Can't access dashboard
**Problem**: Not logged in or no resume uploaded
**Solution**: Complete the flow: Register → Login → Upload → Dashboard

## 🎨 FEATURES NOW WORKING

### Phase 1 ✅ COMPLETE:
- User Registration
- User Login
- Resume Upload (PDF/DOCX/Images)
- Text Extraction (Backend)
- Data Parsing (Frontend)
- Protected Routes
- User-specific Dashboard

### Coming Next (Phase 2):
- IBM Watson X.ai Integration
- Real job role prediction
- Real skill gap analysis
- AI-powered career recommendations

## 📁 What Was Created:

```
frontend/
  src/
    pages/
      LoginPage.jsx        ← NEW: Login page
      RegisterPage.jsx     ← NEW: Register page
      UploadPage.jsx       ← UPDATED: Auth protection
      DashboardPage.jsx    ← UPDATED: Auth protection
    utils/
      resumeParser.js      ← NEW: Parses extracted text

backend/
  ← All backend files from before
```

## 🔐 Security Notes:

- Passwords stored in localStorage (MVP only)
- In production, use real backend authentication
- JWT tokens for API calls
- Encrypted password storage
- Session management

## 🚀 Quick Start Command:

**Windows (PowerShell):**
```powershell
# Run from project root
.\setup.bat
```

This will:
1. Install all dependencies
2. Show you how to start services
3. Display usage instructions

---

**NOW YOUR APP HAS A COMPLETE AUTHENTICATION FLOW WITH REAL DATA EXTRACTION!** 🎉
