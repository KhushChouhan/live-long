const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Doctor, Patient } = require('../models');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication token required', null, 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    // Retrieve user and their role-specific profiles
    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Doctor, as: 'doctorProfile' },
        { model: Patient, as: 'patientProfile' }
      ]
    });

    if (!user) {
      return error(res, 'User not found or session invalid', null, 401);
    }

    if (!user.isActive) {
      return error(res, 'User account is deactivated', null, 403);
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token expired', { expired: true }, 401);
    }
    return error(res, 'Invalid access token', null, 401);
  }
};

module.exports = authenticate;
