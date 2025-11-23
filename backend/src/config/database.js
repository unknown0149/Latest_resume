import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

const connectDB = async () => {
  try {
    // Remove deprecated options (not needed in Node.js Driver v4.0+)
    const conn = await mongoose.connect(process.env.MONGODB_URI)

    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err}`)
})

export default connectDB
