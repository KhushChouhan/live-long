const aadhaarService = require('../services/aadhaarService');
const { AadhaarVerification, AuditLog } = require('../models');
const { success, error } = require('../utils/response');

const sendOTP = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.body;
    const userId = req.user.id;

    const result = await aadhaarService.sendAadhaarOTP(userId, aadhaarNumber);
    return success(res, 'Aadhaar OTP sent successfully', result);
  } catch (err) {
    next(err);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { transactionId, otp } = req.body;
    const userId = req.user.id;

    const result = await aadhaarService.verifyAadhaarOTP(userId, transactionId, otp);

    if (!result.success) {
      return error(res, result.message, null, 400);
    }

    // Log the successful Aadhaar verification
    await AuditLog.create({
      userId,
      action: 'USER_AADHAAR_VERIFIED',
      details: `Transaction ID: ${transactionId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return success(res, result.message, result.details);
  } catch (err) {
    next(err);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const verification = await AadhaarVerification.findOne({ userId, status: 'verified' })
      .sort({ createdAt: -1 });

    return success(res, 'Verification status retrieved', {
      isVerified: !!verification,
      verifiedAt: verification ? verification.verifiedAt : null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getVerificationStatus
};
