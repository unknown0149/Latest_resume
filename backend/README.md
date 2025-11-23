# Resume Analyzer Backend

Node.js + Express backend for resume parsing and job role prediction.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env`

4. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:8000`

## API Endpoints

### Resume Upload
- **POST** `/api/resume/upload`
- Accepts: PDF, DOCX, Images (PNG, JPG)
- Max size: 10MB
- Returns: `{ resumeId, raw_text, file_metadata, extraction_status }`

## Tech Stack

- Express.js - Web framework
- MongoDB + Mongoose - Database
- Multer - File upload handling
- pdf-parse - PDF text extraction
- mammoth - DOCX parsing
- tesseract.js - OCR for scanned documents
