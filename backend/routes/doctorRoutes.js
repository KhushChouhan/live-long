const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// Dashboard Route (requires doctor authentication role)
router.get(
  '/dashboard',
  authenticate,
  authorize('doctor'),
  doctorController.getDashboard
);

// Toggle Doctor Verification Badge (requires admin authentication role)
router.post(
  '/verify/:doctorId',
  authenticate,
  authorize('admin'),
  doctorController.toggleVerificationBadge
);

module.exports = router;
