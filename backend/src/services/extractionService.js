import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'
import sharp from 'sharp'
import fs from 'fs/promises'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { logger } from '../utils/logger.js'
import { 
  normalizeText, 
  removeHeadersFooters, 
  calculateConfidence, 
  needsOCR 
} from '../utils/textProcessor.js'

/**
 * Extract text from PDF using pdfjs-dist (fallback method)
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, pages: number}>}
 */
const extractFromPDFWithPdfjs = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath)
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer })
    const pdfDocument = await loadingTask.promise
    
    let fullText = ''
    const numPages = pdfDocument.numPages
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }
    
    return {
      text: fullText,
      pages: numPages,
    }
  } catch (error) {
    logger.error(`PDF.js extraction failed: ${error.message}`)
    throw error
  }
}

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, pages: number}>}
 */
export const extractFromPDF = async (filePath) => {
  try {
    // Try primary method (pdf-parse)
    const dataBuffer = await fs.readFile(filePath)
    const data = await pdfParse(dataBuffer)

    return {
      text: data.text,
      pages: data.numpages,
    }
  } catch (error) {
    logger.warn(`Primary PDF extraction failed: ${error.message}, trying fallback method...`)
    
    try {
      // Fallback to pdfjs-dist
      return await extractFromPDFWithPdfjs(filePath)
    } catch (fallbackError) {
      logger.error(`All PDF extraction methods failed: ${fallbackError.message}`)
      throw new Error(`Failed to extract text from PDF: ${error.message}. Please ensure your PDF is not corrupted or password-protected.`)
    }
  }
}

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<{text: string, pages: number}>}
 */
export const extractFromDOCX = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer: dataBuffer })

    // Estimate pages (roughly 500 words per page)
    const wordCount = result.value.split(/\s+/).length
    const estimatedPages = Math.ceil(wordCount / 500)

    return {
      text: result.value,
      pages: estimatedPages,
    }
  } catch (error) {
    logger.error(`DOCX extraction failed: ${error.message}`)
    throw new Error(`Failed to extract text from DOCX: ${error.message}`)
  }
}

/**
 * Perform OCR on image file
 * @param {string} filePath - Path to image file
 * @returns {Promise<{text: string, confidence: number}>}
 */
export const performOCR = async (filePath) => {
  try {
    logger.info(`Starting OCR for file: ${filePath}`)

    // Preprocess image with sharp for better OCR results
    const processedImagePath = `${filePath}.processed.png`
    await sharp(filePath)
      .grayscale() // Convert to grayscale
      .normalize() // Normalize histogram
      .sharpen() // Sharpen image
      .toFile(processedImagePath)

    // Perform OCR
    const { data } = await Tesseract.recognize(processedImagePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    // Clean up processed image
    await fs.unlink(processedImagePath).catch(() => {})

    return {
      text: data.text,
      confidence: data.confidence,
    }
  } catch (error) {
    logger.error(`OCR failed: ${error.message}`)
    throw new Error(`Failed to perform OCR: ${error.message}`)
  }
}

/**
 * Main extraction service - orchestrates text extraction from any file type
 * @param {object} file - Multer file object
 * @returns {Promise<object>} - Extraction result
 */
export const extractText = async (file) => {
  const { path: filePath, mimetype, size, originalname } = file

  let rawText = ''
  let pages = 1
  let ocrNeeded = false
  let extractionConfidence = 0

  try {
    // Extract based on file type
    if (mimetype === 'application/pdf') {
      const result = await extractFromPDF(filePath)
      rawText = result.text
      pages = result.pages

      // Check if OCR is needed for scanned PDFs
      if (needsOCR(rawText)) {
        logger.info('PDF appears to be scanned, attempting OCR...')
        ocrNeeded = true
        // For scanned PDFs, we would need to convert PDF pages to images first
        // This is complex, so for MVP we'll just mark it and handle separately
      }
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await extractFromDOCX(filePath)
      rawText = result.text
      pages = result.pages
    } else if (mimetype.startsWith('image/')) {
      // Perform OCR on images
      const result = await performOCR(filePath)
      rawText = result.text
      ocrNeeded = true
      extractionConfidence = result.confidence
    } else {
      throw new Error(`Unsupported file type: ${mimetype}`)
    }

    // Normalize text
    rawText = normalizeText(rawText)

    // Remove headers/footers if multi-page document
    if (pages > 1) {
      rawText = removeHeadersFooters(rawText, pages)
    }

    // Calculate confidence if not already set by OCR
    if (!extractionConfidence) {
      extractionConfidence = calculateConfidence(rawText, size)
    }

    // Validate extraction quality
    if (rawText.length < 50) {
      logger.warn(`Low text extraction: only ${rawText.length} characters extracted`)
      return {
        raw_text: rawText,
        extractedChars: rawText.length,
        pages,
        ocrNeeded: true,
        extractionConfidence,
        status: 'low_quality',
        message: 'Extracted text is very short. File may be scanned or corrupted.',
      }
    }

    logger.info(`Successfully extracted ${rawText.length} characters from ${originalname}`)

    return {
      raw_text: rawText,
      extractedChars: rawText.length,
      pages,
      ocrNeeded,
      extractionConfidence,
      status: 'completed',
    }
  } catch (error) {
    logger.error(`Extraction service failed: ${error.message}`, { filePath })
    
    return {
      raw_text: '',
      extractedChars: 0,
      pages: 0,
      ocrNeeded: false,
      extractionConfidence: 0,
      status: 'failed',
      error: error.message,
    }
  }
}

/**
 * Validate page count
 * @param {number} pages - Number of pages
 * @param {number} maxPages - Maximum allowed pages
 * @throws {Error} if page count exceeds limit
 */
export const validatePageCount = (pages, maxPages = 30) => {
  if (pages > maxPages) {
    throw new Error(`Document has ${pages} pages, but maximum allowed is ${maxPages}`)
  }
}
