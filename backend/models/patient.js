const mongoose = require('mongoose');
const crypto = require('crypto');

const PatientSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  dateOfBirth: {
    type: String, // YYYY-MM-DD DATEONLY representation
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  bloodGroup: {
    type: String,
    default: null
  },
  emergencyContactName: {
    type: String,
    default: null
  },
  emergencyContactPhone: {
    type: String,
    default: null
  },
  allergies: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate to fetch user information directly
PatientSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Patient', PatientSchema);
