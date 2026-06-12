const mongoose = require('mongoose');
const crypto = require('crypto');

const AadhaarVerificationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  aadhaarHash: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: String,
    required: true
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'verified'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AadhaarVerification', AadhaarVerificationSchema);
