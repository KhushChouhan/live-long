const { User, Patient, Doctor, MedicalRecord, AuditLog } = require('../models');
const { success, error } = require('../utils/response');

const normalizePhone = (phone) => {
  if (!phone) return phone;
  let p = phone.trim();
  if (p.length === 10 && /^\d+$/.test(p)) {
    return `+91${p}`;
  }
  return p;
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password')
      .populate('doctorProfile')
      .populate('patientProfile');

    return success(res, 'User profile retrieved successfully', user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let { name, email, phone, ...profileData } = req.body;
    phone = normalizePhone(phone);

    // Update core User entry
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 'User not found', null, 404);
    }
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    // Update role profile entry
    if (role === 'doctor') {
      const { specialization, experienceYears, consultationFee, clinicAddress } = profileData;
      await Doctor.updateOne(
        { userId },
        {
          specialization,
          experienceYears,
          consultationFee,
          clinicAddress
        }
      );
    } else if (role === 'patient') {
      const { dateOfBirth, gender, bloodGroup, emergencyContactName, emergencyContactPhone, allergies } = profileData;
      await Patient.updateOne(
        { userId },
        {
          dateOfBirth,
          gender,
          bloodGroup,
          emergencyContactName,
          emergencyContactPhone,
          allergies
        }
      );
    }

    // Write audit log entry
    await AuditLog.create({
      userId,
      action: 'USER_PROFILE_UPDATED',
      details: 'User updated profile information',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Fetch fresh user
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('doctorProfile')
      .populate('patientProfile');

    return success(res, 'Profile updated successfully', updatedUser);
  } catch (err) {
    next(err);
  }
};

const uploadMedicalRecord = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No document file provided', null, 400);
    }

    const { title, recordType, description, patientId, doctorId } = req.body;

    if (!title || !recordType) {
      return error(res, 'Document title and recordType are required', null, 400);
    }

    // Determine targets
    let targetPatientId = patientId;
    let targetDoctorId = doctorId || null;

    // If patient is uploading their own document
    if (req.user.role === 'patient') {
      if (!req.user.patientProfile) {
        return error(res, 'Patient profile not established', null, 400);
      }
      targetPatientId = req.user.patientProfile.id;
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const record = await MedicalRecord.create({
      patientId: targetPatientId,
      doctorId: targetDoctorId,
      recordType,
      title,
      description,
      fileUrl,
      recordDate: new Date()
    });

    // Write audit log entry
    await AuditLog.create({
      userId: req.user.id,
      action: 'MEDICAL_RECORD_UPLOADED',
      details: `Title: ${title}, FilePath: ${fileUrl}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return success(res, 'Medical record document uploaded successfully', record, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadMedicalRecord
};
