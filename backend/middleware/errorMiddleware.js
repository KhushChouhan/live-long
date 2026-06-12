const logger = require('../utils/logger');
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`, {
    stack: err.stack
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return error(res, 'Validation error occurred', errorDetails, 400);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const errorDetails = [{
      field,
      message: `This ${field} is already registered`
    }];
    return error(res, 'Validation error occurred', errorDetails, 400);
  }



  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid authentication token', null, 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Authentication token has expired', null, 401);
  }

  // Default to 500 server error in production, expose message in development
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  return error(res, message, null, err.statusCode || 500);
};

module.exports = errorHandler;
