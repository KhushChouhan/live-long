const crypto = require('crypto');
const { AadhaarVerification, User } = require('../models');
const logger = require('../utils/logger');

// Local in-memory store for active Aadhaar OTP sessions (simulates a GSP callback token)
const activeAadhaarSessions = new Map();

// Helper to calculate SHA-256 hash
const hashAadhaar = (aadhaarNumber) => {
  return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
};

const sendAadhaarOTP = async (userId, aadhaarNumber) => {
  const transactionId = `TXN-AADHAAR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const mockOtp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Cache verification session data
  activeAadhaarSessions.set(transactionId, {
    userId,
    aadhaarNumber,
    otp: mockOtp,
    expiresAt
  });

  // Simulating Government GSP / UIDAI OTP Dispatch
  logger.info(`[UIDAI Mock GSP] Generated OTP ${mockOtp} for Aadhaar card XXXX-XXXX-${aadhaarNumber.slice(-4)}. Transaction ID: ${transactionId}`);

  return {
    transactionId,
    message: 'OTP sent successfully to your Aadhaar-registered mobile number'
  };
};

const verifyAadhaarOTP = async (userId, transactionId, otp) => {
  const session = activeAadhaarSessions.get(transactionId);

  if (!session) {
    return { success: false, message: 'Invalid or expired transaction ID' };
  }

  if (session.userId !== userId) {
    return { success: false, message: 'Unauthorized transaction scope' };
  }

  if (Date.now() > session.expiresAt) {
    activeAadhaarSessions.delete(transactionId);
    return { success: false, message: 'OTP has expired. Please request a new Aadhaar verification link' };
  }

  // UIDAI OTP validation
  if (session.otp !== otp) {
    return { success: false, message: 'Invalid Aadhaar OTP code' };
  }

  const aadhaarHash = hashAadhaar(session.aadhaarNumber);

  try {
    // Check if Aadhaar is already registered to another user
    const existingVerification = await AadhaarVerification.findOne({ aadhaarHash });

    if (existingVerification && existingVerification.userId !== userId) {
      return { success: false, message: 'This Aadhaar card is already linked to another account' };
    }

    // Create verification audit entry
    await AadhaarVerification.create({
      userId,
      aadhaarHash,
      transactionId,
      status: 'verified',
      verifiedAt: new Date()
    });

    // Update User model verified flag
    await User.updateOne(
      { _id: userId },
      { isAadhaarVerified: true }
    );
    
    // Clear in-memory verification session
    activeAadhaarSessions.delete(transactionId);

    return {
      success: true,
      message: 'Aadhaar identity verified successfully',
      details: {
        lastFourDigits: session.aadhaarNumber.slice(-4)
      }
    };
  } catch (err) {
    logger.error('Error during Aadhaar verification:', err);
    throw err;
  }
};

module.exports = {
  sendAadhaarOTP,
  verifyAadhaarOTP
};
