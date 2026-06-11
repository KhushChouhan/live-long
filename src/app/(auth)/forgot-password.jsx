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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ForgotPasswordScreen() {
  // ── State ──────────────────────────────────────────
  const [email, setEmail] = useState('');
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
  const handleResetPassword = useCallback(async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = Platform.OS === 'web'
        ? '/api/user/lostpassword'
        : 'https://uat.live-long.app/user/lostpassword?_format=json';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: email,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Drupal might return an empty 200 OK for lost password or non-JSON
        console.log('Response text:', responseText);
      }

      if (response.ok) {
        setSuccessMessage('If an account exists, a reset link has been sent.');
      } else {
        setErrorMessage(data?.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Network catch error:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

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
              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSubtitle}>Enter your email to receive a reset link</Text>
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

            {/* Reset Button */}
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
                      <Text style={[styles.primaryBtnText, { fontSize: 15 }]}>Sending link...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="send-outline" size={20} color={COLORS.white} />
                      <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backBtn}
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
