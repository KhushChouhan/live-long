import Icon from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Logo from '../../components/Logo'
import api from '../../services/api'
import { useAuth } from '../../store/AuthContext'

// MSG91 OTP Widget SDK
let OTPWidget = null
/*
try {
  // Dynamically imported so the app doesn't crash if the package isn't installed
  OTPWidget = require('@msg91comm/sendotp-react-native').OTPWidget
} catch (_) {
  console.warn(
    '[MSG91] @msg91comm/sendotp-react-native not installed — widget disabled',
  )
}
*/

// Widget credentials (non-secret — safe to embed in client)
const MSG91_WIDGET_ID = '3665416c557a323334313638'
const MSG91_WIDGET_TOKEN = '520374TIemqzXW6a1700c7P1'

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
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FormInput = React.memo(({ label, iconName, isPassword, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const focusAnim = useRef(new Animated.Value(0)).current

  const handleFocus = useCallback(
    (e) => {
      setIsFocused(true)
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start()
      props.onFocus?.(e)
    },
    [focusAnim, props],
  )

  const handleBlur = useCallback(
    (e) => {
      setIsFocused(false)
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start()
      props.onBlur?.(e)
    },
    [focusAnim, props],
  )

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accent],
  })

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
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSoft}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  )
})
FormInput.displayName = 'FormInput'

const isDevTestPhone = false

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function LoginScreen() {
  // ── State ──────────────────────────────────────────
  const { sendOTP, verifyOTP, resendOTP, widgetLogin } = useAuth()
  const [loginMode, setLoginMode] = useState('password') // 'password' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isPhoneFocused, setIsPhoneFocused] = useState(false)
  const [requestId, setRequestId] = useState('')
  /**
   * We route all OTP requests through our backend REST API (server-to-server)
   * on both Web and Mobile. This completely bypasses client-side restrictions
   * like 'IPBlocked' on web and 'Mobile requests are not allowed for this widget' on mobile.
   */
  const [useWidgetFlow] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = width >= 600

  // ── Animation Refs ─────────────────────────────────
  const fadeAnims = useRef(
    [...Array(5)].map(() => new Animated.Value(0)),
  ).current
  const slideAnims = useRef(
    [24, 18, 14].map((val) => new Animated.Value(val)),
  ).current
  const btnScaleAnim = useRef(new Animated.Value(0.95)).current
  const btnPressScale = useRef(new Animated.Value(1)).current
  const otpInputRef = useRef(null)

  // ── Widget Initialisation ──────────────────────────
  useEffect(() => {
    if (OTPWidget) {
      OTPWidget.initializeWidget(MSG91_WIDGET_ID, MSG91_WIDGET_TOKEN)
      console.log('[MSG91 Widget] Initialized with widgetId:', MSG91_WIDGET_ID)
    }
  }, [])

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
      ]

      if (slideAnim) {
        parallelAnims.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          }),
        )
      }
      if (isScale) {
        parallelAnims.push(
          Animated.timing(btnScaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        )
      }
      return Animated.parallel(parallelAnims)
    }

    Animated.stagger(100, [
      createEntranceAnim(fadeAnims[0], slideAnims[0]),
      createEntranceAnim(fadeAnims[1], slideAnims[1]),
      createEntranceAnim(fadeAnims[2], slideAnims[2]),
      createEntranceAnim(fadeAnims[3], undefined, true),
      Animated.timing(fadeAnims[4], {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start()
  }, [fadeAnims, slideAnims, btnScaleAnim])

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  // ── Handlers ───────────────────────────────────────
  const handleSendOTP = useCallback(async () => {
    Keyboard.dismiss()
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      setErrorMessage('Phone number is required')
      return
    }

    setIsLoading(true)

    // ── Path A: MSG91 Widget SDK (native only, real numbers only) ────
    if (useWidgetFlow && !isDevTestPhone) {
      try {
        console.log('[MSG91 Widget] Sending OTP to:', `91${trimmedPhone}`)
        const widgetRes = await OTPWidget.sendOTP({
          identifier: `91${trimmedPhone}`,
        })
        console.log('[MSG91 Widget] sendOTP response:', widgetRes)

        if (widgetRes?.type === 'success' || widgetRes?.message === 'success') {
          setOtpSent(true)
          setResendTimer(30)
          setSuccessMessage('OTP sent to your mobile number via MSG91!')
        } else {
          setErrorMessage(
            widgetRes?.message || 'Failed to send OTP. Please try again.',
          )
        }
      } catch (err) {
        console.error('[MSG91 Widget] sendOTP error:', err)
        setErrorMessage(
          'Failed to send OTP. Please check your number and try again.',
        )
      } finally {
        setIsLoading(false)
      }
      return
    }

    // ── Path B: Backend REST OTP (web / test numbers / fallback) ─────
    console.log('[OTP] Dispatching OTP via backend REST API for:', trimmedPhone)
    const res = await sendOTP(trimmedPhone, 'login')
    setIsLoading(false)

    if (res.success) {
      if (res.data?.requestId) setRequestId(res.data.requestId)
      const otpCode =
        res.data?.otp ||
        (res.message && res.message.match(/code is:\s*(\d+)/)?.[1])
      setSuccessMessage(
        otpCode ? `✅ OTP code: ${otpCode}` : res.message || 'OTP sent!',
      )
      setOtpSent(true)
      setResendTimer(30)
    } else {
      setErrorMessage(res.error || 'Failed to send OTP. Please try again.')
    }
  }, [phone, sendOTP, useWidgetFlow, setResendTimer])

  const handleLoginSuccess = useCallback(async () => {
    const userStr = await AsyncStorage.getItem('current_user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        const roles = u.roles || [u.role] || []
        const userName = u.name || ''

        const nameToCheck = userName.toLowerCase()
        if (nameToCheck.includes('doctor')) {
          if (!roles.includes('doctor')) roles.push('doctor')
        }
        if (nameToCheck.includes('admin')) {
          if (!roles.includes('administrator') && !roles.includes('admin')) {
            roles.push('administrator')
          }
        }

        const isDocRole = roles.some((r) =>
          String(r).toLowerCase().includes('doctor'),
        )
        const isAdminRole = roles.some(
          (r) =>
            String(r).toLowerCase().includes('admin') ||
            String(r).toLowerCase().includes('administrator'),
        )

        if (isAdminRole || roles.includes('administrator')) {
          router.replace('/admin/dashboard')
        } else if (isDocRole || roles.includes('doctor')) {
          router.replace('/doctor/dashboard')
        } else {
          router.replace('/user/dashboard')
        }
      } catch (_) {
        router.replace('/user/dashboard')
      }
    } else {
      router.replace('/user/dashboard')
    }
  }, [])

  const handleResendOTP = useCallback(async () => {
    Keyboard.dismiss()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    // ── Path A: MSG91 Widget SDK (native only, real numbers only) ────
    if (useWidgetFlow && !isDevTestPhone) {
      try {
        console.log('[MSG91 Widget] Retrying OTP for:', `91${phone.trim()}`)
        const widgetRes = await OTPWidget.retryOtp({ retrytype: 'text' })
        console.log('[MSG91 Widget] retryOtp response:', widgetRes)
        setSuccessMessage('OTP resent to your mobile number!')
        setResendTimer(30)
      } catch (err) {
        console.error('[MSG91 Widget] retryOtp error:', err)
        setErrorMessage('Failed to resend OTP. Please try again.')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // ── Path B: Backend REST OTP (fallback) ──────────
    console.log('[OTP] Resending OTP via backend API for:', phone.trim())
    const res = await resendOTP(phone.trim(), 'login', requestId)
    setIsLoading(false)

    if (res.success) {
      if (res.data?.requestId) setRequestId(res.data.requestId)
      const otpCode =
        res.data?.otp ||
        (res.message && res.message.match(/code is:\s*(\d+)/)?.[1])
      setSuccessMessage(
        otpCode ? `OTP code: ${otpCode}` : res.message || 'OTP resent!',
      )
      setResendTimer(30)
    } else {
      setErrorMessage(res.error || 'Failed to resend OTP. Please try again.')
    }
  }, [phone, resendOTP, requestId, useWidgetFlow, setResendTimer])

  const handleVerifyOTP = useCallback(async () => {
    Keyboard.dismiss()
    setErrorMessage('')
    setSuccessMessage('')

    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP')
      return
    }

    setIsLoading(true)

    // ── Path A: MSG91 Widget SDK (native only, real numbers only) ────
    if (useWidgetFlow && !isDevTestPhone) {
      try {
        console.log('[MSG91 Widget] Verifying OTP:', otp.trim())
        const widgetRes = await OTPWidget.verifyOtp({ otp: otp.trim() })
        console.log('[MSG91 Widget] verifyOtp response:', widgetRes)

        if (widgetRes?.type === 'success' || widgetRes?.message === 'success') {
          // Widget verified — exchange JWT access token with our backend
          const accessToken =
            widgetRes?.['access-token'] ||
            widgetRes?.access_token ||
            widgetRes?.token
          if (!accessToken) {
            setIsLoading(false)
            setErrorMessage(
              'OTP verified by MSG91 but no access token received. Please try again.',
            )
            return
          }
          const loginRes = await widgetLogin(accessToken)
          setIsLoading(false)
          if (loginRes.success) {
            setSuccessMessage('OTP verified! Logging in...')
            setTimeout(handleLoginSuccess, 800)
          } else {
            setErrorMessage(
              loginRes.error || 'Login failed after OTP. Please try again.',
            )
          }
        } else {
          setIsLoading(false)
          setErrorMessage(
            widgetRes?.message || 'Invalid OTP. Please try again.',
          )
        }
      } catch (err) {
        setIsLoading(false)
        console.error('[MSG91 Widget] verifyOtp error:', err)
        setErrorMessage('OTP verification failed. Please try again.')
      }
      return
    }

    // ── Path B: Backend REST OTP (fallback) ──────────
    console.log('[OTP] Verifying OTP via backend API for:', phone.trim())
    const res = await verifyOTP(phone.trim(), otp.trim(), 'login', requestId)
    setIsLoading(false)

    if (res.success) {
      setSuccessMessage('OTP verified! Logging in...')
      setTimeout(handleLoginSuccess, 800)
    } else {
      setErrorMessage(res.error || 'Invalid OTP code. Please try again.')
    }
  }, [
    phone,
    otp,
    requestId,
    verifyOTP,
    widgetLogin,
    useWidgetFlow,
    handleLoginSuccess,
  ])

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      console.log('[Login] Requesting credentials for:', username)
      const res = await api.post('/auth/login', {
        email: username,
        password: password,
      })

      if (res.data && res.data.success) {
        const loginData = res.data.data

        if (loginData.tokens) {
          await AsyncStorage.setItem(
            'access_token',
            loginData.tokens.accessToken,
          )
          await AsyncStorage.setItem(
            'refresh_token',
            loginData.tokens.refreshToken,
          )
        }
        if (loginData.user) {
          await AsyncStorage.setItem(
            'current_user',
            JSON.stringify(loginData.user),
          )
        }

        setSuccessMessage('Login successful! Redirecting...')
        const handleRouting = async () => {
          let roles = []
          let userName = ''
          if (loginData.user) {
            roles = loginData.user.roles || [loginData.user.role] || []
            userName = loginData.user.name
          }

          const nameToCheck = (userName || username || '').toLowerCase()
          if (nameToCheck.includes('doctor')) {
            if (!roles.includes('doctor')) roles.push('doctor')
          }
          if (nameToCheck.includes('admin')) {
            if (!roles.includes('administrator') && !roles.includes('admin')) {
              roles.push('administrator')
            }
          }

          const isDocRole = roles.some((r) =>
            String(r).toLowerCase().includes('doctor'),
          )
          const isAdminRole = roles.some(
            (r) =>
              String(r).toLowerCase().includes('admin') ||
              String(r).toLowerCase().includes('administrator'),
          )

          if (isAdminRole || roles.includes('administrator')) {
            router.replace('/admin/dashboard')
          } else if (isDocRole || roles.includes('doctor')) {
            router.replace('/doctor/dashboard')
          } else {
            router.replace('/user/dashboard')
          }
        }
        setTimeout(handleRouting, 800)
      } else {
        setErrorMessage(res.data?.message || 'Login failed. Please verify credentials.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[Login] Error:', err.response?.data || err.message)
      const msg = err.response?.data?.message || 'Login failed. Cannot connect to the server.'
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }, [username, password])

  const handlePressIn = useCallback(() => {
    Animated.spring(btnPressScale, {
      toValue: 0.96,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start()
  }, [btnPressScale])

  const handlePressOut = useCallback(() => {
    Animated.spring(btnPressScale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 4,
    }).start()
  }, [btnPressScale])

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
            style={[
              styles.headerBlock,
              {
                opacity: fadeAnims[0],
                transform: [{ translateY: slideAnims[0] }],
              },
            ]}
          >
            <Logo width={200} height={60} style={{ marginBottom: 12 }} />
          </Animated.View>

          <Animated.View
            style={[
              styles.titleBlock,
              {
                opacity: fadeAnims[1],
                transform: [{ translateY: slideAnims[1] }],
              },
            ]}
          >
            <View style={styles.secureBadge}>
              <Icon
                name="shield-checkmark-outline"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.badgeText}>HIPAA Secured</Text>
            </View>
          </Animated.View>

          {/* ── BLOCK 2: FORM CARD ────────────────────────── */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnims[2],
                transform: [{ translateY: slideAnims[2] }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardSubtitle}>
                Choose your preferred login method
              </Text>
            </View>

            {/* Segmented Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => {
                  setLoginMode('password')
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                style={[
                  styles.tabButton,
                  loginMode === 'password' && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    loginMode === 'password' && styles.tabButtonTextActive,
                  ]}
                >
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setLoginMode('otp')
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                style={[
                  styles.tabButton,
                  loginMode === 'otp' && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    loginMode === 'otp' && styles.tabButtonTextActive,
                  ]}
                >
                  Phone OTP
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View
                style={{
                  backgroundColor: '#FDE8E8',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: '#C81E1E', fontSize: 13, fontWeight: '500' }}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <View
                style={{
                  backgroundColor: '#DEF7EC',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: '#057A55', fontSize: 13, fontWeight: '500' }}
                >
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {loginMode === 'password' ? (
              <>
                <FormInput
                  label="Username"
                  iconName="person-outline"
                  placeholder="Enter your username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />

                <View style={styles.passwordWrapper}>
                  <FormInput
                    label="Password"
                    iconName="lock-closed-outline"
                    placeholder="Enter your password"
                    isPassword
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.forgotPwdBtn}
                  accessibilityRole="button"
                  onPress={() => router.push('/forgot-password')}
                >
                  <Text style={styles.forgotPwdText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Password Sign In Button */}
                <Animated.View
                  style={{
                    opacity: fadeAnims[3],
                    transform: [
                      { scale: Animated.multiply(btnScaleAnim, btnPressScale) },
                    ],
                  }}
                >
                  <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={1}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isLoading,
                      busy: isLoading,
                    }}
                  >
                    <View style={styles.primaryBtn}>
                      {isLoading ? (
                        <>
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                          <Text
                            style={[styles.primaryBtnText, { fontSize: 15 }]}
                          >
                            Signing in...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Icon
                            name="log-in-outline"
                            size={20}
                            color={COLORS.white}
                          />
                          <Text style={styles.primaryBtnText}>Sign in</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <View style={styles.inputWrapper}>
                  <View style={styles.labelRow}>
                    <Icon
                      name="call-outline"
                      size={14}
                      color={COLORS.textMid}
                    />
                    <Text style={styles.labelText}>Phone Number</Text>
                  </View>

                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryBadge}>
                      <Text style={styles.countryBadgeText}>🇮🇳 +91</Text>
                    </View>
                    <View
                      style={[
                        styles.phoneInputContainer,
                        {
                          borderColor: isPhoneFocused
                            ? COLORS.accent
                            : COLORS.border,
                        },
                      ]}
                    >
                      <Icon
                        name="call-outline"
                        size={18}
                        color={isPhoneFocused ? COLORS.accent : COLORS.textSoft}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        style={styles.phoneTextInput}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor={COLORS.textSoft}
                        keyboardType="numeric"
                        maxLength={10}
                        editable={!otpSent}
                        value={phone}
                        onChangeText={(val) => {
                          const cleanVal = val.replace(/\D/g, '')
                          setPhone(cleanVal)
                        }}
                        onFocus={() => setIsPhoneFocused(true)}
                        onBlur={() => setIsPhoneFocused(false)}
                      />
                    </View>
                  </View>
                </View>

                {otpSent ? (
                  <>
                    <View style={styles.passwordWrapper}>
                      <View style={styles.labelRow}>
                        <Icon
                          name="key-outline"
                          size={14}
                          color={COLORS.textMid}
                        />
                        <Text style={styles.labelText}>6-Digit OTP Code</Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => otpInputRef.current?.focus()}
                        style={styles.otpBoxesContainer}
                      >
                        {[...Array(6)].map((_, index) => {
                          const char = otp[index] || ''
                          const isFocused = otp.length === index
                          return (
                            <View
                              key={index}
                              style={[
                                styles.otpBox,
                                char ? styles.otpBoxFilled : null,
                                isFocused ? styles.otpBoxFocused : null,
                              ]}
                            >
                              <Text style={styles.otpBoxText}>{char}</Text>
                            </View>
                          )
                        })}
                      </TouchableOpacity>

                      <TextInput
                        ref={otpInputRef}
                        style={styles.hiddenOtpInput}
                        value={otp}
                        onChangeText={(val) => {
                          const cleanVal = val.replace(/\D/g, '')
                          if (cleanVal.length <= 6) {
                            setOtp(cleanVal)
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus={true}
                      />
                    </View>

                    <View style={styles.otpActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setOtpSent(false)
                          setOtp('')
                          setSuccessMessage('')
                          setErrorMessage('')
                          setResendTimer(0)
                        }}
                      >
                        <Text style={styles.otpActionLinkText}>
                          Change Number
                        </Text>
                      </TouchableOpacity>

                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimerText}>
                          Resend in {resendTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={handleResendOTP}
                          disabled={isLoading}
                        >
                          <Text
                            style={[
                              styles.otpActionLinkText,
                              isLoading && { opacity: 0.5 },
                            ]}
                          >
                            Resend OTP
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Verify & Sign In Button */}
                    <Animated.View
                      style={{
                        opacity: fadeAnims[3],
                        transform: [
                          {
                            scale: Animated.multiply(
                              btnScaleAnim,
                              btnPressScale,
                            ),
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={handleVerifyOTP}
                        disabled={isLoading}
                        activeOpacity={1}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: isLoading,
                          busy: isLoading,
                        }}
                      >
                        <View style={styles.primaryBtn}>
                          {isLoading ? (
                            <>
                              <ActivityIndicator
                                size="small"
                                color={COLORS.white}
                              />
                              <Text
                                style={[
                                  styles.primaryBtnText,
                                  { fontSize: 15 },
                                ]}
                              >
                                Verifying...
                              </Text>
                            </>
                          ) : (
                            <>
                              <Icon
                                name="checkmark-circle-outline"
                                size={20}
                                color={COLORS.white}
                              />
                              <Text style={styles.primaryBtnText}>
                                Verify & Sign In
                              </Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                ) : (
                  /* Send OTP Button */
                  <Animated.View
                    style={{
                      opacity: fadeAnims[3],
                      transform: [
                        {
                          scale: Animated.multiply(btnScaleAnim, btnPressScale),
                        },
                      ],
                      marginTop: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={handleSendOTP}
                      disabled={isLoading}
                      activeOpacity={1}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: isLoading,
                        busy: isLoading,
                      }}
                    >
                      <View style={styles.primaryBtn}>
                        {isLoading ? (
                          <>
                            <ActivityIndicator
                              size="small"
                              color={COLORS.white}
                            />
                            <Text
                              style={[styles.primaryBtnText, { fontSize: 15 }]}
                            >
                              Sending OTP...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Icon
                              name="paper-plane-outline"
                              size={20}
                              color={COLORS.white}
                            />
                            <Text style={styles.primaryBtnText}>Send OTP</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </>
            )}
          </Animated.View>

          {/* ── BOTTOM LINKS ──────────────────────────────── */}
          <Animated.View
            style={[styles.bottomBlock, { opacity: fadeAnims[4] }]}
          ></Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
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
    justifyContent: 'center',
  },

  titleBlock: { alignItems: 'center', marginBottom: 28 },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  secureBadge: {
    backgroundColor: COLORS.successBg,
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
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
        elevation: 8,
      },
    }),
  },

  cardHeader: { marginBottom: 24 },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  cardSubtitle: { fontSize: 14, color: COLORS.textSoft },

  inputWrapper: { marginBottom: 18 },
  passwordWrapper: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMid,
    marginLeft: 6,
  },

  inputContainer: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  inputIconLeft: { marginRight: 12 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },

  forgotPwdBtn: { alignSelf: 'flex-end', marginBottom: 28, paddingVertical: 4 },
  forgotPwdText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabButtonTextActive: {
    color: '#1A56DB',
  },

  primaryBtn: {
    height: 54,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },

  bottomBlock: { marginTop: 36, alignItems: 'center' },
  bottomText: { fontSize: 14, color: COLORS.textMid },
  bottomLink: { color: COLORS.accent, fontWeight: '700' },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryBadge: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  countryBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  phoneInputContainer: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    flex: 1,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
    paddingVertical: 0,
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  otpActionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  resendTimerText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSoft,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
  },
  otpBoxFilled: {
    borderColor: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  otpBoxFocused: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
})
