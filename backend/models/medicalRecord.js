const mongoose = require('mongoose');
const crypto = require('crypto');

const MedicalRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  patientId: {
    type: String,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: String,
    ref: 'Doctor',
    default: null
  },
  recordType: {
    type: String,
    enum: ['prescription', 'diagnostic_report', 'discharge_summary', 'other'],
    default: 'other',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  recordDate: {
    type: String, // YYYY-MM-DD representation
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populates to fetch associated profiles directly
MedicalRecordSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

MedicalRecordSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
