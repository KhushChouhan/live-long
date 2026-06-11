import Icon from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   COLOR PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const COLORS = {
  bg: '#F5F8FF',
  white: '#FFFFFF',
  accent: '#1A56DB',
  accentLight: '#EBF2FF',
  textDark: '#111928',
  textMid: '#4B5563',
  textSoft: '#9CA3AF',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  success: '#057A55',
  successBg: '#DEF7EC',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FormInput = React.memo(({ label, iconName, isPassword, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(e);
  }, [focusAnim, props]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(e);
  }, [focusAnim, props]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accent],
  });

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.labelRow}>
        <Icon name={iconName} size={14} color={COLORS.textMid} />
        <Text style={styles.labelText}>{label}</Text>
      </View>

      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        <Icon
          name={iconName}
          size={18}
          color={isFocused ? COLORS.accent : COLORS.textSoft}
          style={styles.inputIconLeft}
        />
        <TextInput
          style={styles.textInput}
          placeholderTextColor={COLORS.textSoft}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
    </View>
  );
});
FormInput.displayName = 'FormInput';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ForgotPasswordScreen() {
  // ── State ──────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = verify OTP & reset password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  // ── Animation Refs ─────────────────────────────────
  const fadeAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([24, 18, 14].map(val => new Animated.Value(val))).current;
  const btnScaleAnim = useRef(new Animated.Value(0.95)).current;
  const btnPressScale = useRef(new Animated.Value(1)).current;

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    const createEntranceAnim = (fadeAnim, slideAnim, isScale = false) => {
      const parallelAnims = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: isScale ? 400 : 450,
          easing: slideAnim ? Easing.out(Easing.exp) : Easing.linear,
          useNativeDriver: false,
        }),
      ];

      if (slideAnim) {
        parallelAnims.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          })
        );
      }
      if (isScale) {
        parallelAnims.push(
          Animated.timing(btnScaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          })
        );
      }
      return Animated.parallel(parallelAnims);
    };

    Animated.stagger(100, [
      createEntranceAnim(fadeAnims[0], slideAnims[0]),
      createEntranceAnim(fadeAnims[1], slideAnims[1]),
      createEntranceAnim(fadeAnims[2], slideAnims[2]),
      createEntranceAnim(fadeAnims[3], undefined, true),
      Animated.timing(fadeAnims[4], { toValue: 1, duration: 350, useNativeDriver: false }),
    ]).start();
  }, [fadeAnims, slideAnims, btnScaleAnim]);

  // ── Handlers ───────────────────────────────────────
  const handleRequestOTP = useCallback(async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });

      if (response.data && response.data.success) {
        setSuccessMessage(response.data.message || 'OTP sent successfully!');
        setStep(2);
      } else {
        setErrorMessage(response.data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('[RequestOTP] Error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'No account registered with this email or username.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp.trim()) {
      setErrorMessage('Please enter the OTP sent to your phone.');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });

      if (response.data && response.data.success) {
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        setErrorMessage(response.data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('[ResetPassword] Error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Failed to reset password. Please verify the OTP.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword]);

  const handlePressIn = useCallback(() => {
    Animated.spring(btnPressScale, {
      toValue: 0.96,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [btnPressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(btnPressScale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [btnPressScale]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWide && styles.scrollContentWide,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── BLOCK 1: TOP HEADER ───────────────────────── */}
          <Animated.View
            style={[styles.headerBlock, { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }]}
          >
            <View style={styles.logoContainer}>
              <Icon name="pulse-outline" size={34} color={COLORS.accent} />
            </View>
          </Animated.View>

          <Animated.View
            style={[styles.titleBlock, { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }]}
          >
            <Text style={styles.appName} accessibilityRole="header">LiveLong</Text>
            <View style={styles.secureBadge}>
              <Icon name="shield-checkmark-outline" size={14} color={COLORS.success} />
              <Text style={styles.badgeText}>HIPAA Secured</Text>
            </View>
          </Animated.View>

          {/* ── BLOCK 2: FORM CARD ────────────────────────── */}
          <Animated.View
            style={[styles.formCard, { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{step === 1 ? 'Reset Password' : 'Enter OTP Code'}</Text>
              <Text style={styles.cardSubtitle}>
                {step === 1
                  ? 'Enter your username/email to receive a reset OTP code'
                  : 'Check your registered mobile number for the OTP'}
              </Text>
            </View>

            {errorMessage ? (
              <View style={{ backgroundColor: '#FDE8E8', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#C81E1E', fontSize: 13, fontWeight: '500' }}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={{ backgroundColor: '#DEF7EC', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#057A55', fontSize: 13, fontWeight: '500' }}>
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <FormInput
                  label="Username / Email"
                  iconName="mail-outline"
                  placeholder="Enter your email or username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                {/* Send OTP Button */}
                <Animated.View
                  style={{
                    marginTop: 12,
                    opacity: fadeAnims[3],
                    transform: [{ scale: Animated.multiply(btnScaleAnim, btnPressScale) }],
                  }}
                >
                  <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleRequestOTP}
                    disabled={isLoading}
                    activeOpacity={1}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isLoading, busy: isLoading }}
                  >
                    <View style={styles.primaryBtn}>
                      {isLoading ? (
                        <>
                          <ActivityIndicator size="small" color={COLORS.white} />
                          <Text style={[styles.primaryBtnText, { fontSize: 15 }]}>Sending OTP...</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="send-outline" size={20} color={COLORS.white} />
                          <Text style={styles.primaryBtnText}>Send Reset OTP</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <FormInput
                  label="OTP Code"
                  iconName="key-outline"
                  placeholder="Enter the 6-digit OTP"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <FormInput
                  label="New Password"
                  iconName="lock-closed-outline"
                  placeholder="Enter new password"
                  isPassword={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <FormInput
                  label="Confirm Password"
                  iconName="lock-closed-outline"
                  placeholder="Confirm new password"
                  isPassword={true}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                {/* Reset Password Button */}
                <Animated.View
                  style={{
                    marginTop: 12,
                    opacity: fadeAnims[3],
                    transform: [{ scale: Animated.multiply(btnScaleAnim, btnPressScale) }],
                  }}
                >
                  <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={1}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isLoading, busy: isLoading }}
                  >
                    <View style={styles.primaryBtn}>
                      {isLoading ? (
                        <>
                          <ActivityIndicator size="small" color={COLORS.white} />
                          <Text style={[styles.primaryBtnText, { fontSize: 15 }]}>Resetting password...</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="checkmark-circle-outline" size={20} color={COLORS.white} />
                          <Text style={styles.primaryBtnText}>Reset Password</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.backBtn}
                  onPress={() => { setStep(1); setErrorMessage(''); setSuccessMessage(''); }}
                >
                  <Text style={styles.backBtnText}>← Change Username / Email</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.backBtn, { marginTop: step === 1 ? 24 : 12 }]}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.backBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── BOTTOM LINKS ──────────────────────────────── */}
          <Animated.View style={[styles.bottomBlock, { opacity: fadeAnims[4] }]}>
           
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 64, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  scrollContentWide: { paddingHorizontal: 40 },

  headerBlock: { alignItems: 'center', marginBottom: 16 },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1.5,
    borderColor: `${COLORS.accent}33`,
    alignItems: 'center',
    justifyContent: 'center'
  },

  titleBlock: { alignItems: 'center', marginBottom: 28 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.textDark, letterSpacing: -0.5, marginBottom: 8 },
  secureBadge: { backgroundColor: COLORS.successBg, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 13, fontWeight: '600', color: COLORS.success },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { boxShadow: '0px 12px 24px rgba(17, 25, 40, 0.06)' },
      default: {
        shadowColor: '#111928',
        shadowOpacity: 0.06,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8
      }
    })
  },

  cardHeader: { marginBottom: 24 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: COLORS.textSoft },

  inputWrapper: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelText: { fontSize: 13, fontWeight: '600', color: COLORS.textMid, marginLeft: 6 },

  inputContainer: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden'
  },
  inputIconLeft: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: COLORS.textDark, paddingVertical: 0 },

  primaryBtn: {
    height: 54,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },

  backBtn: { alignSelf: 'center', marginTop: 24, paddingVertical: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMid },

  bottomBlock: { marginTop: 36, alignItems: 'center' },
  bottomText: { fontSize: 14, color: COLORS.textMid },
  bottomLink: { color: COLORS.accent, fontWeight: '700' },
});
