import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import upload, { handleUploadError } from '../middleware/uploadMiddleware.js'
import { authenticateToken } from '../middleware/authMiddleware.js'
import { extractText, parseResume, quickParse, deepParse } from '../services/resumeProcessingService.js'
import Resume from '../models/Resume.js'
import { logger, createLogger } from '../utils/logger.js'
import { queueResumeEmbedding } from '../services/embeddingQueueService.js'
import fs from 'fs/promises'

// ═══════════════════════════════════════════════════════════════════════
// RESUME UPLOAD & PARSING ROUTES (Using Unified Service)
// ═══════════════════════════════════════════════════════════════════════

// Helper: Validate page count
function validatePageCount(pages, maxPages) {
  if (pages > maxPages) {
    throw new Error(`Resume exceeds maximum page limit of ${maxPages} pages`);
  }
}

const router = express.Router()

/**
 * POST /api/resume/upload
 * Upload and extract text from resume file
 */
router.post(
  '/upload',
  authenticateToken, // Optional auth for Phase 1
  upload.single('file'),
  handleUploadError,
  async (req, res) => {
    const traceId = uuidv4()
    const requestLogger = createLogger({ traceId })

    try {
      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a file in the "file" field',
          statusCode: 400,
        })
      }

      const { file } = req
      const resumeId = uuidv4()
      
      requestLogger.info(`Processing resume upload: ${file.originalname}`, { resumeId })

      // Extract text from file
      const extractionResult = await extractText(file)

      // Check if extraction failed
      if (extractionResult.status === 'failed') {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {})

        return res.status(422).json({
          error: 'Extraction failed',
          message: extractionResult.error || 'Failed to extract text from file',
          statusCode: 422,
        })
      }

      // Validate page count
      try {
        const maxPages = parseInt(process.env.MAX_PAGES || 30)
        validatePageCount(extractionResult.pages, maxPages)
      } catch (error) {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {})

        return res.status(400).json({
          error: 'Page limit exceeded',
          message: error.message,
          statusCode: 400,
        })
      }

      // Prepare file metadata
      const file_metadata = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        pages: extractionResult.pages,
        extractedChars: extractionResult.extractedChars,
        uploadedAt: new Date(),
      }

      // Determine extraction status
      let extraction_status = 'completed'
      if (extractionResult.status === 'low_quality') {
        extraction_status = 'completed' // Still completed, but with warning
      }

      // Save to database
      const resume = new Resume({
        resumeId,
        userId: req.user?.userId || null, // Optional for Phase 1
        raw_text: extractionResult.raw_text,
        file_metadata,
        extraction_status,
        ocr_needed: extractionResult.ocrNeeded,
        extraction_confidence: extractionResult.extractionConfidence,
        errorMessage: extractionResult.message || null,
        filePath: file.path,
      })

      await resume.save()

      requestLogger.info(`Resume saved successfully`, { resumeId })

      // Prepare response
      const response = {
        resumeId,
        raw_text: extractionResult.raw_text,
        file_metadata: {
          filename: file_metadata.originalName,
          mimeType: file_metadata.mimeType,
          sizeBytes: file_metadata.sizeBytes,
          pages: file_metadata.pages,
          extractedChars: file_metadata.extractedChars,
        },
        extraction_status,
        ocr_needed: extractionResult.ocrNeeded,
        extraction_confidence: extractionResult.extractionConfidence,
      }

      // Add warning if low quality
      if (extractionResult.status === 'low_quality') {
        response.warning = extractionResult.message
      }

      res.status(201).json(response)
    } catch (error) {
      requestLogger.error(`Upload endpoint error: ${error.message}`)

      // Clean up file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {})
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while processing your resume',
        statusCode: 500,
      })
    }
  }
)

/**
 * GET /api/resume/:resumeId
 * Retrieve resume by ID
 */
router.get('/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params

    const resume = await Resume.findOne({ resumeId })

    if (!resume) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Resume not found',
        statusCode: 404,
      })
    }

    // Return resume data
    res.json({
      resumeId: resume.resumeId,
      raw_text: resume.raw_text,
      file_metadata: resume.file_metadata,
      extraction_status: resume.extraction_status,
      ocr_needed: resume.ocr_needed,
      extraction_confidence: resume.extraction_confidence,
      createdAt: resume.createdAt,
    })
  } catch (error) {
    logger.error(`Get resume error: ${error.message}`)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve resume',
      statusCode: 500,
    })
  }
})

/**
 * GET /api/resume/:resumeId/status
 * Check resume processing status (useful for async OCR)
 */
router.get('/:resumeId/status', async (req, res) => {
  try {
    const { resumeId } = req.params

    const resume = await Resume.findOne({ resumeId }).select(
      'resumeId extraction_status ocr_needed extraction_confidence errorMessage'
    )

    if (!resume) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Resume not found',
        statusCode: 404,
      })
    }

    res.json({
      resumeId: resume.resumeId,
      status: resume.extraction_status,
      ocr_needed: resume.ocr_needed,
      confidence: resume.extraction_confidence,
      error: resume.errorMessage,
    })
  } catch (error) {
    logger.error(`Get status error: ${error.message}`)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve status',
      statusCode: 500,
    })
  }
})

/**
 * POST /api/resume/:resumeId/parse
 * Parse resume using hybrid approach (regex + LLM)
 * Extracts structured data: name, skills, experience, education, etc.
 */
router.post('/:resumeId/parse', async (req, res) => {
  const traceId = uuidv4()
  const requestLogger = createLogger({ traceId })

  try {
    const { resumeId } = req.params
    const { mode = 'deep' } = req.body // 'quick', 'deep', or 'standard'

    requestLogger.info(`Parsing resume ${resumeId} with mode: ${mode}`)

    // Fetch resume from database
    const resume = await Resume.findOne({ resumeId })

    if (!resume) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Resume not found',
        statusCode: 404,
      })
    }

    if (!resume.raw_text) {
      return res.status(400).json({
        error: 'Invalid resume',
        message: 'Resume has no extracted text',
        statusCode: 400,
      })
    }

    // Choose parsing strategy based on mode
    let parseResult
    if (mode === 'quick') {
      parseResult = await quickParse(resume.raw_text)
    } else if (mode === 'deep') {
      parseResult = await deepParse(resume.raw_text)
    } else {
      parseResult = await parseResume(resume.raw_text)
    }

    if (!parseResult.success) {
      requestLogger.error(`Parsing failed for resume ${resumeId}`)
      return res.status(500).json({
        error: 'Parsing failed',
        message: 'Failed to parse resume',
        statusCode: 500,
      })
    }

    // Update resume with parsed data
    resume.parsed_resume = parseResult.parsed_resume
    resume.extraction_metadata = {
      version: parseResult.metadata.version,
      parsed_at: parseResult.metadata.parsed_at,
      overall_confidence: parseResult.metadata.overall_confidence,
      field_confidences: parseResult.metadata.field_confidences,
      extraction_methods: parseResult.metadata.extraction_methods,
      processing_time_ms: parseResult.metadata.processing_time_ms,
      llm_used: parseResult.metadata.llm_used,
      requires_manual_review: parseResult.metadata.requires_manual_review,
      flagged_fields: parseResult.metadata.missing_fields?.map(field => ({
        field: field,
        severity: 'low',
        message: `${field} could not be extracted`,
      })) || [],
    }

    await resume.save()

    requestLogger.info(`Resume ${resumeId} parsed successfully`, {
      confidence: parseResult.metadata.overall_confidence,
      requiresReview: parseResult.metadata.requires_manual_review,
    })

    // Queue embedding generation (Phase 3)
    let embeddingQueued = false
    let queuePosition = null
    try {
      const queueResult = queueResumeEmbedding(resumeId, 'normal')
      embeddingQueued = queueResult.queued
      queuePosition = queueResult.position
      requestLogger.info(`Queued embedding generation for resume ${resumeId} at position ${queuePosition}`)
    } catch (error) {
      requestLogger.warn(`Failed to queue embedding generation: ${error.message}`)
    }

    // Return parsed data
    res.json({
      resumeId,
      parsed_resume: parseResult.parsed_resume,
      metadata: parseResult.metadata,
      embedding_queued: embeddingQueued,
      queue_position: queuePosition,
    })
  } catch (error) {
    requestLogger.error(`Parse endpoint error: ${error.message}`)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while parsing resume',
      statusCode: 500,
    })
  }
})

/**
 * GET /api/resume/:resumeId/parsed
 * Retrieve parsed resume data
 */
router.get('/:resumeId/parsed', async (req, res) => {
  try {
    const { resumeId } = req.params

    const resume = await Resume.findOne({ resumeId }).select(
      'resumeId parsed_resume extraction_metadata'
    )

    if (!resume) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Resume not found',
        statusCode: 404,
      })
    }

    if (!resume.parsed_resume) {
      return res.status(404).json({
        error: 'Not parsed',
        message: 'Resume has not been parsed yet. Call POST /api/resume/:resumeId/parse first.',
        statusCode: 404,
      })
    }

    res.json({
      resumeId,
      parsed_resume: resume.parsed_resume,
      metadata: resume.extraction_metadata,
    })
  } catch (error) {
    logger.error(`Get parsed resume error: ${error.message}`)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve parsed resume',
      statusCode: 500,
    })
  }
})

export default router
