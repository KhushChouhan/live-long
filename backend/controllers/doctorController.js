const { Doctor, User, Appointment, Patient, AuditLog } = require('../models');
const { success, error } = require('../utils/response');

const toggleVerificationBadge = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { isVerified } = req.body;

    if (isVerified === undefined) {
      return error(res, 'isVerified boolean field is required', null, 400);
    }

    const doctor = await Doctor.findById(doctorId).populate('user');

    if (!doctor) {
      return error(res, 'Doctor not found', null, 404);
    }

    // Toggle verified status
    doctor.isVerifiedBadge = isVerified;
    await doctor.save();

    // Log the verification action
    await AuditLog.create({
      userId: req.user.id, // Admin doing the action
      action: 'DOCTOR_VERIFIED_TOGGLE',
      details: `Doctor ID: ${doctorId}, Name: ${doctor.user ? doctor.user.name : 'Unknown'}, Verified: ${isVerified}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return success(res, `Doctor verification badge status set to ${isVerified}`, {
      doctorId: doctor.id || doctor._id,
      isVerifiedBadge: doctor.isVerifiedBadge
    });
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    if (!req.user.doctorProfile) {
      return error(res, 'Doctor profile not found for this account', null, 400);
    }

    const doctorId = req.user.doctorProfile.id || req.user.doctorProfile._id;

    // Fetch scheduled and completed appointments
    const appointments = await Appointment.find({ doctorId })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .sort({ appointmentDate: 1 });

    // Extract unique patients treated by this doctor
    const patientMap = new Map();
    appointments.forEach((appt) => {
      if (appt.patient && appt.patient.user) {
        const pId = appt.patient.id || appt.patient._id;
        patientMap.set(pId, {
          id: pId,
          name: appt.patient.user.name,
          email: appt.patient.user.email,
          phone: appt.patient.user.phone,
          bloodGroup: appt.patient.bloodGroup,
          allergies: appt.patient.allergies
        });
      }
    });

    return success(res, 'Doctor dashboard metrics retrieved successfully', {
      totalAppointments: appointments.length,
      patientsCount: patientMap.size,
      appointments,
      patients: Array.from(patientMap.values())
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleVerificationBadge,
  getDashboard
};
