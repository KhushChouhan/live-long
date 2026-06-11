import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  sendOTP: async () => {},
  verifyOTP: async () => {},
  resendOTP: async () => {},
  widgetLogin: async () => {},
  sendAadhaarOTP: async () => {},
  verifyAadhaarOTP: async () => {},
  loadUserFromStorage: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session data on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('current_user');
      const accessToken = await AsyncStorage.getItem('access_token');
      
      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.warn('Failed to load user session from secure storage:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, tokens } = res.data.data;

      // Save credentials in storage
      await AsyncStorage.setItem('access_token', tokens.accessToken);
      await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
      await AsyncStorage.setItem('current_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { user: userData, tokens } = res.data.data;

      // Save credentials in storage
      await AsyncStorage.setItem('access_token', tokens.accessToken);
      await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
      await AsyncStorage.setItem('current_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (_) {}
    
    // Clear storage and reset state
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('current_user');
    setUser(null);
  };

  const sendOTP = async (phone, purpose) => {
    try {
      const res = await api.post('/auth/send-otp', { phone, purpose });
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (err) {
      // Detailed error log for debugging
      console.error('[sendOTP] Error:', err.message);
      console.error('[sendOTP] Code:', err.code);
      console.error('[sendOTP] Response:', err.response?.data);
      console.error('[sendOTP] URL:', err.config ? (err.config.baseURL || '') + (err.config.url || '') : 'No config available');

      // Network error = server not reached (server stopped or incorrect IP)
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || !err.response) {
        return {
          success: false,
          error: 'Cannot connect to the server. Is the backend server running? (Check terminal)'
        };
      }
      // Server responded with an error
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      return { success: false, error: msg };
    }
  };

  const verifyOTP = async (phone, otp, purpose, requestId = null) => {
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp, purpose, requestId });
      
      // If logging in via OTP
      if (purpose === 'login' && res.data.data) {
        const { user: userData, tokens } = res.data.data;
        await AsyncStorage.setItem('access_token', tokens.accessToken);
        await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
        await AsyncStorage.setItem('current_user', JSON.stringify(userData));
        setUser(userData);
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Verification failed.' };
    }
  };

  const resendOTP = async (phone, purpose, requestId = null) => {
    try {
      const res = await api.post('/auth/resend-otp', { phone, purpose, requestId });
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to resend OTP.' };
    }
  };

  /**
   * Called after the MSG91 OTP Widget successfully verifies the OTP.
   * The widget returns a short-lived JWT access token; we send it to our backend
   * which validates it with MSG91 and returns our own app session tokens.
   *
   * @param {string} accessToken - JWT from OTPWidget.verifyOTP()
   */
  const widgetLogin = async (accessToken) => {
    try {
      const res = await api.post('/auth/widget-login', { accessToken });

      if (res.data?.success && res.data?.data) {
        const { user: userData, tokens } = res.data.data;

        await AsyncStorage.setItem('access_token', tokens.accessToken);
        await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
        await AsyncStorage.setItem('current_user', JSON.stringify(userData));

        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, error: 'Unexpected response from server.' };
    } catch (err) {
      console.error('[widgetLogin] Error:', err.response?.data || err.message);
      const msg = err.response?.data?.message || 'OTP login failed. Please try again.';
      return { success: false, error: msg };
    }
  };

  const sendAadhaarOTP = async (aadhaarNumber) => {
    try {
      const res = await api.post('/aadhaar/send-otp', { aadhaarNumber });
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Aadhaar OTP send failed.' };
    }
  };

  const verifyAadhaarOTP = async (transactionId, otp) => {
    try {
      const res = await api.post('/aadhaar/verify-otp', { transactionId, otp });
      
      // Reload user profile to fetch verified status
      const profileRes = await api.get('/users/profile');
      const updatedUser = profileRes.data.data;
      
      const parsedUserData = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isAadhaarVerified: updatedUser.isAadhaarVerified,
        profile: updatedUser.role === 'doctor' ? updatedUser.doctorProfile : updatedUser.patientProfile
      };
      
      await AsyncStorage.setItem('current_user', JSON.stringify(parsedUserData));
      setUser(parsedUserData);
      
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Aadhaar verification failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        sendOTP,
        verifyOTP,
        resendOTP,
        widgetLogin,
        sendAadhaarOTP,
        verifyAadhaarOTP,
        loadUserFromStorage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
