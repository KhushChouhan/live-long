import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Update these URLs with your deployed backend server URL (e.g. Render, Railway, VPS)
export const PRODUCTION_API_URL = 'https://livelong-api.onrender.com';
export const PRODUCTION_WS_URL = 'wss://livelong-api.onrender.com';

export const getApiBaseUrl = () => {
  if (!__DEV__) {
    return `${PRODUCTION_API_URL}/api`;
  }

  if (Platform.OS === 'web') {
    const host = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
    return `http://${host}:5000/api`;
  }

  // Automatically get IP from Expo Metro
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const getWsBaseUrl = () => {
  if (!__DEV__) {
    return PRODUCTION_WS_URL;
  }

  if (Platform.OS === 'web') {
    const host = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
    return `ws://${host}:5000`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `ws://${ip}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:5000';
  }

  return 'ws://localhost:5000';
};
