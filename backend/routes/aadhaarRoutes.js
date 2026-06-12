const express = require('express');
const router = express.Router();
const aadhaarController = require('../controllers/aadhaarController');
const authenticate = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  sendAadhaarOTPValidator,
  verifyAadhaarOTPValidator
} = require('../validators/aadhaarValidator');

// Apply JWT authentication middleware to all Aadhaar routes
router.use(authenticate);

// Send Aadhaar OTP Route (limits request attempts per IP)
router.post('/send-otp', authLimiter, sendAadhaarOTPValidator, aadhaarController.sendOTP);

// Verify Aadhaar OTP Route (updates user verified badge)
router.post('/verify-otp', authLimiter, verifyAadhaarOTPValidator, aadhaarController.verifyOTP);

// Get Current Verification Status
router.get('/status', aadhaarController.getVerificationStatus);

module.exports = router;
