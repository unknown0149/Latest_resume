# Testing Guide for Resume Upload API

## Prerequisites

1. **MongoDB Running**
   - Make sure MongoDB is installed and running on `localhost:27017`
   - Check with: `mongosh` or `mongo`
   - Start MongoDB: `mongod` (on another terminal)

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Create .env file**
   - Copy from `.env.example` or use the provided `.env`

## Start the Server

```bash
cd backend
npm run dev
```

Server should start on `http://localhost:8000`

## Test Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 5.123,
  "mongodb": "connected"
}
```

### 2. Upload Resume (PDF)

**Using curl:**
```bash
curl -X POST http://localhost:8000/api/resume/upload \
  -F "file=@path/to/your/resume.pdf" \
  -H "Content-Type: multipart/form-data"
```

**Using Postman:**
- Method: POST
- URL: `http://localhost:8000/api/resume/upload`
- Body: form-data
- Key: `file` (type: File)
- Value: Select your PDF/DOCX file

**Expected response (201):**
```json
{
  "resumeId": "uuid-here",
  "raw_text": "John Doe\nSoftware Engineer...",
  "file_metadata": {
    "filename": "resume.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245678,
    "pages": 2,
    "extractedChars": 1234
  },
  "extraction_status": "completed",
  "ocr_needed": false,
  "extraction_confidence": 85
}
```

### 3. Get Resume by ID

```bash
curl http://localhost:8000/api/resume/:resumeId
```

### 4. Check Processing Status

```bash
curl http://localhost:8000/api/resume/:resumeId/status
```

## Test with Frontend

1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm run dev` (in frontend folder)
3. Open `http://localhost:3000`
4. Navigate to upload page
5. Upload a resume file
6. Check the response in browser DevTools

## Error Testing

### File Too Large (413)
Upload a file > 10MB

### Invalid File Type (400)
Upload a .txt or .exe file

### No File (400)
Send POST request without file

## MongoDB Verification

Check if resume was saved:
```bash
mongosh
use resume_analyzer
db.resumes.find().pretty()
```

## Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check MONGODB_URI in .env

2. **Port Already in Use**
   - Change PORT in .env
   - Kill process: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`

3. **Tesseract OCR Error**
   - Install Tesseract: https://github.com/tesseract-ocr/tesseract
   - Add to PATH

4. **Sharp Installation Error**
   - May need to rebuild: `npm rebuild sharp`
