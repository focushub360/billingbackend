const mongoose = require('mongoose')
const dbManager = require('./dbManager')

const DEFAULT_URI = 'mongodb+srv://littleflowerschool:Focus123engineering@cluster0.gmxndg9.mongodb.net/billingmaindb?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 
      (process.env.DB_CLUSTER_BASE ? `${process.env.DB_CLUSTER_BASE}/${process.env.MAIN_DB_NAME || 'billingmaindb'}?retryWrites=true&w=majority` : DEFAULT_URI);

    console.log('📡 Connecting default Mongoose instance to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully!');

    // Connect dbManager to main database
    await dbManager.connectToMainDB().catch(err => {
      console.warn('Main database manager connection warning:', err.message);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
}

module.exports = connectDB
