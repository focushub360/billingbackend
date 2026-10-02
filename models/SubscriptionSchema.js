const mongoose = require('mongoose');

// This schema matches the Subscription model from viewer module
// Used for authentication and subscription verification
const subscriptionSchema = new mongoose.Schema({
  subscriberId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  planName: {
    type: String,
    required: true
  },
  planDuration: {
    type: String,
    required: true,
    enum: ['1_month', '3_months', '6_months', '12_months']
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  subscriberPassword: {
    type: String,
    default: 'welcome123'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'queued', 'expired'],
    default: 'pending'
  },
  queuePosition: {
    type: Number,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = subscriptionSchema;