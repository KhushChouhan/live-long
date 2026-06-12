const mongoose = require('mongoose');
const crypto = require('crypto');

const DoctorSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  isVerifiedBadge: {
    type: Boolean,
    default: false
  },
  consultationFee: {
    type: Number,
    default: 0.00
  },
  clinicAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate to fetch user information directly
DoctorSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Doctor', DoctorSchema);
