/**
 * Room and phone normalization utilities for LiveLong Telehealth.
 * Shared between Doctor and Patient layouts/contexts.
 */

export const normalizePhone = (phone) => {
  if (!phone) return '';
  // Remove all non-numeric characters
  let cleaned = String(phone).replace(/\D/g, '');
  // If it starts with 91 and has 12 digits, strip the 91 country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

export const getJitsiRoomName = (appointmentId) => {
  if (!appointmentId) return 'livelong-consult-default';
  // Standard Jitsi room name format from appointment ID
  return `livelong-consult-${appointmentId}`;
};
