const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  sendOTPValidator,
  verifyOTPValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../validators/authValidator');

// Registration Route
router.post('/register', registerValidator, authController.register);

// Password Login Route
router.post('/login', loginValidator, authController.login);

// Send OTP Route (with rate limiter to prevent spam)
router.post('/send-otp', authLimiter, sendOTPValidator, authController.sendOTP);

// Resend OTP Route
router.post('/resend-otp', authLimiter, sendOTPValidator, authController.resendOTP);

// Verify OTP Route (handles both standalone verify and login-via-OTP)
router.post('/verify-otp', authLimiter, verifyOTPValidator, authController.verifyOTP);

// MSG91 Widget Login Route — client verifies OTP via Widget SDK, sends JWT here
router.post('/widget-login', authLimiter, authController.verifyWidgetLogin);

// Token Refresh Route (used to rotate access/refresh tokens)
router.post('/refresh-token', authController.refreshToken);

// Logout Route (requires active access token authentication)
router.post('/logout', authenticate, authController.logout);

// Forgot Password Route
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);

// Reset Password Route
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);

module.exports = router;
