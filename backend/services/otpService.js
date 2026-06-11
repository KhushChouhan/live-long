const { OTPVerification } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Normalize phone: 10 digits → +91XXXXXXXXXX
const normalizePhone = (phone) => {
  if (!phone) return phone;
  const p = phone.trim().replace(/\s+/g, '');
  if (/^\d{10}$/.test(p)) return `+91${p}`;
  return p;
};

// Generate 6-digit OTP using Math.random (development mode fallback only)
const generateOTP = () => {
  const otp = Math.floor(Math.random() * 900000) + 100000;
  return otp.toString();
};

// Numbers that skip MSG91 and use a local pinned OTP (for CI/automated tests only).
// Empty in production/staging — all real phones get SMS via MSG91.
const DEV_TEST_NUMBERS = new Set([]);

const sendOTP = async (phone, purpose) => {
  phone = normalizePhone(phone);
  const expiresAt = new Date(Date.now() + config.otp.expirationMinutes * 60 * 1000);

  // Invalidate all old active OTPs for this phone+purpose
  await OTPVerification.updateMany(
    { phone, purpose, isVerified: false },
    { isVerified: true }
  );

  const authToken = process.env.MSG91_AUTH_TOKEN;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const widgetId = process.env.MSG91_WIDGET_ID;

  // 1. Try MSG91 Widget OTP Send API (preferred when widgetId is set)
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && widgetId) {
    try {
      const cleanPhone = phone.replace('+', '');
      const url = 'https://api.msg91.com/api/v5/widget/sendOtp';

      const payload = {
        widgetId: widgetId,
        identifier: cleanPhone
      };

      logger.info(`[MSG91 Widget API] Dispatching OTP for: ${cleanPhone}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      logger.info(`[MSG91 Widget API] Response: ${JSON.stringify(data)}`);

      if (data.status === 'success' || data.type === 'success') {
        let requestId = data.reqId || data.request_id || data.requestId;
        if (!requestId && data.message && /^[a-fA-F0-9]{15,40}$/.test(data.message.trim())) {
          requestId = data.message.trim();
        }
        if (!requestId) {
          requestId = crypto.randomUUID();
        }
        await OTPVerification.create({ phone, purpose, requestId, expiresAt });

        logger.info(`[MSG91 Widget API] OTP successfully sent to ${phone}. Request ID: ${requestId}`);
        return { phone, purpose, expiresAt, requestId };
      } else {
        logger.error(`[MSG91 Widget API] Failed: ${data.message || JSON.stringify(data)}`);
        // If templateId is also available, we let it fall through to the standard API
        if (!templateId) {
          throw new Error(data.message || 'MSG91 Widget OTP API error');
        }
      }
    } catch (err) {
      logger.error(`[MSG91 Widget API] Exception: ${err.message}`);
      if (!templateId) {
        throw new Error(`Failed to dispatch MSG91 Widget OTP: ${err.message}`);
      }
    }
  }

  // 2. Try MSG91 Standard OTP Send API (as fallback or if templateId is set)
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && templateId) {
    try {
      const cleanPhone = phone.replace('+', '');
      const url = 'https://control.msg91.com/api/v5/otp';

      const payload = {
        template_id: templateId,
        mobile: cleanPhone
      };

      logger.info(`[MSG91 Standard API] Dispatching OTP for: ${cleanPhone}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      logger.info(`[MSG91 Standard API] Response: ${JSON.stringify(data)}`);

      if (data.type === 'success' || data.status === 'success') {
        const requestId = data.request_id || data.reqId || crypto.randomUUID();
        await OTPVerification.create({ phone, purpose, requestId, expiresAt });

        logger.info(`[MSG91 Standard API] OTP successfully sent to ${phone}. Request ID: ${requestId}`);
        return { phone, purpose, expiresAt, requestId };
      } else {
        throw new Error(data.message || 'MSG91 standard OTP API error');
      }
    } catch (err) {
      logger.error(`[MSG91 Standard API] Failed to send OTP: ${err.message}`);
      throw new Error(`Failed to dispatch MSG91 OTP: ${err.message}`);
    }
  }

  // Developer / UAT Fallback — pinned OTP for test numbers, random for others
  const otp = DEV_TEST_NUMBERS.has(phone) ? '301255' : generateOTP();
  const requestId = `mock_req_${crypto.randomUUID()}`;

  // Save new OTP record locally
  await OTPVerification.create({ phone, otp, purpose, requestId, expiresAt });

  // Always print to terminal in dev mode
  console.log(`\n${'═'.repeat(54)}`);
  console.log(`  [OTP LOG]  Phone   : ${phone}`);
  console.log(`  [OTP LOG]  OTP     : ${otp}`);
  console.log(`  [OTP LOG]  Purpose : ${purpose}`);
  console.log(`  [OTP LOG]  Req ID  : ${requestId}`);
  console.log(`  [OTP LOG]  Expires : ${config.otp.expirationMinutes} minutes`);
  console.log(`${'═'.repeat(54)}\n`);

  logger.info(`[SMS Simulator] OTP ${otp} sent to ${phone} for ${purpose}.`);

  const responseData = { phone, purpose, expiresAt, requestId };
  return responseData;
};

const verifyOTP = async (phone, otp, purpose, requestId = null) => {
  phone = normalizePhone(phone);

  let record = null;
  if (requestId) {
    record = await OTPVerification.findOne({
      phone,
      requestId,
      purpose,
      isVerified: false
    });
  } else {
    record = await OTPVerification.findOne({
      phone,
      purpose,
      isVerified: false
    }).sort({ createdAt: -1 });
  }

  if (!record) {
    return { success: false, message: 'No active OTP found. Please request a new one' };
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    return { success: false, message: 'OTP has expired. Please request a new one' };
  }

  // Check max attempts
  if (record.attempts >= config.otp.maxAttempts) {
    return { success: false, message: 'Maximum attempts reached. Please request a new one' };
  }

  const authToken = process.env.MSG91_AUTH_TOKEN;
  const widgetId = process.env.MSG91_WIDGET_ID;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // 1. Try Widget Verify API
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && widgetId && record.requestId && !record.requestId.startsWith('mock_')) {
    try {
      const url = 'https://api.msg91.com/api/v5/widget/verifyOtp';
      const payload = {
        widgetId: widgetId,
        reqId: record.requestId,
        otp: otp.trim()
      };

      logger.info(`[MSG91 Widget API] Verifying OTP ${otp} for reqId: ${record.requestId}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      logger.info(`[MSG91 Widget API] Response: ${JSON.stringify(data)}`);

      if (data.status === 'success' || data.type === 'success' || (data.message && data.message.includes('verified'))) {
        record.isVerified = true;
        await record.save();
        return { success: true, message: 'OTP verified successfully' };
      } else {
        record.attempts += 1;
        await record.save();

        let errorMsg = data.message || 'Invalid OTP';
        if (data.message && data.message.toLowerCase().includes('expire')) {
          errorMsg = 'OTP has expired. Please request a new one';
        }
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      logger.error(`[MSG91 Widget API] Verification failed: ${err.message}`);
      if (!templateId) {
        return { success: false, message: `OTP verification request failed: ${err.message}` };
      }
    }
  }

  // 2. Try Standard Verify API
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && templateId && (!record.requestId || !record.requestId.startsWith('mock_'))) {
    try {
      const cleanPhone = phone.replace('+', '');
      const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${cleanPhone}&otp=${otp.trim()}`;

      logger.info(`[MSG91 Standard API] Verifying OTP ${otp} for mobile: ${cleanPhone}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'authkey': authToken
        }
      });
      const data = await response.json();
      logger.info(`[MSG91 Standard API] Response: ${JSON.stringify(data)}`);

      if (data.type === 'success' || data.status === 'success') {
        record.isVerified = true;
        await record.save();
        return { success: true, message: 'OTP verified successfully' };
      } else {
        record.attempts += 1;
        await record.save();

        let errorMsg = data.message || 'Invalid OTP';
        if (data.message && data.message.toLowerCase().includes('expire')) {
          errorMsg = 'OTP has expired. Please request a new one';
        }
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      logger.error(`[MSG91] Failed to verify OTP: ${err.message}`);
      return { success: false, message: `OTP verification request failed: ${err.message}` };
    }
  }

  // Fallback Local Validation
  if (record.otp !== otp.trim()) {
    record.attempts += 1;
    await record.save();
    return { success: false, message: `Invalid OTP. ${config.otp.maxAttempts - record.attempts} attempts left` };
  }

  // Mark verified
  record.isVerified = true;
  await record.save();

  return { success: true, message: 'OTP verified successfully' };
};

const resendOTP = async (phone, purpose, requestId = null) => {
  phone = normalizePhone(phone);
  const authToken = process.env.MSG91_AUTH_TOKEN;
  const widgetId = process.env.MSG91_WIDGET_ID;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  let record = null;
  if (requestId) {
    record = await OTPVerification.findOne({ phone, requestId, purpose, isVerified: false });
  } else {
    record = await OTPVerification.findOne({ phone, purpose, isVerified: false }).sort({ createdAt: -1 });
  }

  if (!record) {
    throw new Error('No active OTP session found to resend');
  }

  // Extend expiration time
  record.expiresAt = new Date(Date.now() + config.otp.expirationMinutes * 60 * 1000);
  await record.save();

  // 1. Try Widget Retry API
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && widgetId && record.requestId && !record.requestId.startsWith('mock_')) {
    try {
      const url = 'https://api.msg91.com/api/v5/widget/retryOtp';
      const payload = {
        widgetId: widgetId,
        reqId: record.requestId
      };

      logger.info(`[MSG91 Widget API] Retrying OTP for reqId: ${record.requestId}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      logger.info(`[MSG91 Widget API] Response: ${JSON.stringify(data)}`);

      if (data.status === 'success' || data.type === 'success' || (data.message && data.message.includes('sent'))) {
        logger.info(`[MSG91 Widget API] OTP resent successfully for mobile ${phone}.`);
        return { success: true, message: 'OTP resent successfully', requestId: record.requestId };
      } else {
        logger.error(`[MSG91 Widget API] Retry failed: ${data.message || JSON.stringify(data)}`);
        if (!templateId) {
          throw new Error(data.message || 'MSG91 Widget Retry API error');
        }
      }
    } catch (err) {
      logger.error(`[MSG91 Widget API] Retry Exception: ${err.message}`);
      if (!templateId) {
        throw new Error(`Failed to resend MSG91 Widget OTP: ${err.message}`);
      }
    }
  }

  // 2. Try Standard Retry API
  if (!DEV_TEST_NUMBERS.has(phone) && authToken && templateId && (!record.requestId || !record.requestId.startsWith('mock_'))) {
    try {
      const cleanPhone = phone.replace('+', '');
      const url = `https://control.msg91.com/api/v5/otp/retry?authkey=${authToken}&mobile=${cleanPhone}&retrytype=text`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();

      if (data.type === 'success') {
        logger.info(`[MSG91] OTP resent successfully for mobile ${phone}.`);
        return { success: true, message: 'OTP resent successfully', requestId: record.requestId };
      } else {
        throw new Error(data.message || 'MSG91 API error');
      }
    } catch (err) {
      logger.error(`[MSG91] Failed to resend OTP: ${err.message}`);
      throw new Error(`Failed to resend MSG91 OTP: ${err.message}`);
    }
  }

  // Simulated Fallback
  logger.info(`[SMS Simulator] Dev mode: Resending OTP for mobile ${phone}`);
  console.log(`\n${'═'.repeat(54)}`);
  console.log(`  [OTP RESEND LOG] Phone : ${phone}`);
  console.log(`  [OTP RESEND LOG] OTP   : ${record.otp || '301255'}`);
  console.log(`  [OTP RESEND LOG] Req ID: ${record.requestId}`);
  console.log(`${'═'.repeat(54)}\n`);
  return { success: true, message: 'OTP resent successfully (Simulated)', requestId: record.requestId };
};

/**
 * Verify an access token issued by the MSG91 OTP Widget.
 * The widget (running on the client / React Native) sends OTP directly via MSG91
 * and upon successful verification returns a short-lived JWT access token.
 * We verify that token server-side to confirm the user's phone number.
 *
 * @param {string} accessToken - JWT returned by OTPWidget.verifyOTP() on the client
 * @returns {{ success: boolean, mobile?: string, message?: string }}
 */
const verifyWidgetToken = async (accessToken) => {
  const authKey = process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTH_TOKEN;

  if (!authKey) {
    throw new Error('MSG91 auth key not configured in environment variables');
  }

  try {
    const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        authkey: authKey,
        'access-token': accessToken,
      }),
    });

    const data = await response.json();
    logger.info(`[MSG91 Widget] verifyAccessToken response: ${JSON.stringify(data)}`);

    if (data.type === 'success') {
      // MSG91 returns the mobile number in data.message or data.mobile
      const mobile = data.mobile || data.message || null;
      return { success: true, mobile };
    } else {
      return { success: false, message: data.message || 'Widget token verification failed' };
    }
  } catch (err) {
    logger.error(`[MSG91 Widget] Failed to verify access token: ${err.message}`);
    throw new Error(`Widget token verification failed: ${err.message}`);
  }
};

module.exports = { sendOTP, verifyOTP, resendOTP, verifyWidgetToken };
