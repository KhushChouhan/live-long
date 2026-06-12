const { body, validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', errors.array(), 400);
  }
  next();
};

const sendAadhaarOTPValidator = [
  body('aadhaarNumber')
    .trim()
    .notEmpty()
    .withMessage('Aadhaar number is required')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar number must be exactly 12 digits'),
  validateResults
];

const verifyAadhaarOTPValidator = [
  body('transactionId')
    .trim()
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('Aadhaar OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Aadhaar OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('Aadhaar OTP must contain only numbers'),
  validateResults
];

module.exports = {
  sendAadhaarOTPValidator,
  verifyAadhaarOTPValidator
};
