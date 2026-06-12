const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Session, User } = require('../models');
const logger = require('../utils/logger');

const generateTokens = (user) => {
  const payload = {
    userId: user.id || user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration
  });

  const refreshToken = jwt.sign({ userId: user.id || user._id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration
  });

  return { accessToken, refreshToken };
};

const saveSession = async (userId, refreshToken, ipAddress, userAgent) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days matching refresh expiration
  
  return Session.create({
    userId,
    refreshToken,
    ipAddress,
    userAgent,
    expiresAt
  });
};

const refreshTokens = async (oldRefreshToken, ipAddress, userAgent) => {
  try {
    // 1. Verify old refresh token structure
    const decoded = jwt.verify(oldRefreshToken, config.jwt.refreshSecret);

    // 2. Locate active session in DB
    const session = await Session.findOne({
      userId: decoded.userId,
      refreshToken: oldRefreshToken,
      isRevoked: false
    });

    if (!session || new Date() > session.expiresAt) {
      logger.warn(`Failed token refresh attempt for user ${decoded.userId}. Session revoked or expired.`);
      return null;
    }

    // 3. Load user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return null;

    // 4. Generate new token pair
    const tokens = generateTokens(user);

    // 5. Revoke old session and save the new session (token rotation)
    session.isRevoked = true;
    await session.save();

    await saveSession(user.id || user._id, tokens.refreshToken, ipAddress, userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAadhaarVerified: user.isAadhaarVerified
      }
    };
  } catch (err) {
    logger.error('Error executing refresh tokens transaction:', err);
    return null;
  }
};

const revokeSession = async (refreshToken) => {
  return Session.updateOne(
    { refreshToken },
    { isRevoked: true }
  );
};

module.exports = {
  generateTokens,
  saveSession,
  refreshTokens,
  revokeSession
};
