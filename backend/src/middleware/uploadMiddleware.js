import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads'
const uploadsPath = path.resolve(uploadDir)

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true })
  logger.info(`Created uploads directory: ${uploadsPath}`)
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    const basename = path.basename(file.originalname, ext)
    cb(null, `${basename}-${uniqueSuffix}${ext}`)
  },
})

// File filter to validate MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Allowed types: PDF, DOCX, PNG, JPG`
    )
    error.statusCode = 400
    cb(error, false)
  }
}

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760), // 10MB default
  },
})

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `File size exceeds the maximum allowed size of ${
          (parseInt(process.env.MAX_FILE_SIZE || 10485760) / 1048576).toFixed(1)
        }MB`,
        statusCode: 413,
      })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Unexpected file field. Use "file" as the field name.',
        statusCode: 400,
      })
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
      statusCode: 400,
    })
  }

  if (err) {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      error: 'Upload failed',
      message: err.message,
      statusCode,
    })
  }

  next()
}

export default upload
