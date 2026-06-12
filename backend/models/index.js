const mongoose = require('mongoose');

const User = require('./user');
const Doctor = require('./doctor');
const Patient = require('./patient');
const OTPVerification = require('./otpVerification');
const AadhaarVerification = require('./aadhaarVerification');
const Session = require('./session');
const Appointment = require('./appointment');
const MedicalRecord = require('./medicalRecord');
const AuditLog = require('./auditLog');

module.exports = {
  mongoose,
  User,
  Doctor,
  Patient,
  OTPVerification,
  AadhaarVerification,
  Session,
  Appointment,
  MedicalRecord,
  AuditLog
};
