import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = winston.format

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, resumeId, traceId }) => {
  let log = `${timestamp} [${level}]`
  
  if (traceId) log += ` [TraceId: ${traceId}]`
  if (resumeId) log += ` [ResumeId: ${resumeId}]`
  
  log += `: ${stack || message}`
  
  return log
})

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

// Export a function to create child logger with context
export const createLogger = (context) => {
  return logger.child(context)
}
