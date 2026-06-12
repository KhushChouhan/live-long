const mongoose = require('mongoose');
const crypto = require('crypto');

const OTPVerificationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  phone: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: false
  },
  requestId: {
    type: String,
    required: false
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'forgot_password'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OTPVerification', OTPVerificationSchema);
