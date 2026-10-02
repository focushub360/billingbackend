const mongoose = require('mongoose')
const dbManager = require('./dbManager')

const connectDB = async () => {
  try {
    // Connect to main database for authentication and subscription management
    await dbManager.connectToMainDB().catch(err => {
      console.warn('Main database connection warning:', err.message)
    })
    console.log('Main database connection attempted')
    
    // Also maintain default connection for backward compatibility
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI).catch(err => {
        console.warn('Default MongoDB connection warning:', err.message)
      })
      console.log('Default MongoDB connection attempted')
    }
  } catch (error) {
    console.warn('MongoDB connection error:', error.message)
  }
}

module.exports = connectDB
