const mongoose = require('mongoose');
const crypto = require('crypto');

const AppointmentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  doctorId: {
    type: String,
    ref: 'Doctor',
    required: true
  },
  patientId: {
    type: String,
    ref: 'Patient',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'clinic'],
    default: 'video',
    required: true
  },
  symptoms: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populates to fetch associated profiles directly
AppointmentSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

AppointmentSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
