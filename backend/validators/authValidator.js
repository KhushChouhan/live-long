const { body, validationResult } = require('express-validator');
const { error } = require('../utils/response');

// Middleware to handle validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', errors.array(), 400);
  }
  next();
};

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format (e.g. +919999999999)'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor'])
    .withMessage('Role must be either patient or doctor'),
  validateResults
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email/Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateResults
];

const sendOTPValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+91)?[6-9]\d{9}$|^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number. Use 10-digit Indian number or +91XXXXXXXXXX format'),
  body('purpose')
    .notEmpty()
    .withMessage('OTP purpose is required')
    .isIn(['registration', 'login', 'forgot_password'])
    .withMessage('Invalid OTP purpose'),
  validateResults
];

const verifyOTPValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+91)?[6-9]\d{9}$|^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number. Use 10-digit Indian number or +91XXXXXXXXXX format'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('requestId')
    .optional()
    .trim(),
  body('purpose')
    .notEmpty()
    .withMessage('OTP purpose is required')
    .isIn(['registration', 'login', 'forgot_password'])
    .withMessage('Invalid OTP purpose'),
  validateResults
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  validateResults
];

const resetPasswordValidator = [
  body('phone')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error('Phone number or email is required');
      }
      if (value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
        throw new Error('Invalid phone number format');
      }
      return true;
    }),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase, lowercase, digit, and special character'),
  validateResults
];

module.exports = {
  registerValidator,
  loginValidator,
  sendOTPValidator,
  verifyOTPValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
