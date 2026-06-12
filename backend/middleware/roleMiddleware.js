const { error } = require('../utils/response');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', null, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Access denied. Insufficient permissions', null, 403);
    }

    next();
  };
};

module.exports = authorize;
