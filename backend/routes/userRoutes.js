const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const upload = require('../services/uploadService');

// Apply authentication to all user routes
router.use(authenticate);

// Profile detail retrieval
router.get('/profile', userController.getProfile);

// Profile details updates (handles patients and doctors dynamically)
router.put('/profile', userController.updateProfile);

// Secure medical record file upload (multer single 'document' upload)
router.post('/medical-records', upload.single('document'), userController.uploadMedicalRecord);

module.exports = router;
