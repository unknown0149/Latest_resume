import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger.js'

/**
 * Middleware to verify JWT token from Authorization header
 * For Phase 1, this is optional - can be enabled later
 */
export const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  // For Phase 1, make authentication optional
  if (!token) {
    logger.warn('No authentication token provided, proceeding without auth')
    req.user = null
    return next()
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    req.user = user
    next()
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      statusCode: 401,
    })
  }
}

/**
 * Middleware to require authentication (strict mode)
 * Use this when authentication is mandatory
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
      statusCode: 401,
    })
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    req.user = user
    next()
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      statusCode: 401,
    })
  }
}

/**
 * Generate JWT token for user
 * @param {object} payload - User data to encode
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}
