const mongoose = require('mongoose');
const config = require('./config');
const winston = require('../utils/logger');

const connectDB = async () => {
  try {
    winston.info('Connecting to MongoDB database...');
    await mongoose.connect(config.db.uri);
    winston.info('MongoDB database connection established successfully.');
  } catch (err) {
    winston.error('Failed to connect to MongoDB database:', err);
    throw err;
  }
};

module.exports = {
  connectDB,
  mongoose
};
