import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  StyleSheet
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { usePathname } from 'expo-router';
import {
  User,
  ShieldAlert,
  BellRing,
  Sliders,
  Camera,
  CheckCircle,
  AlertCircle,
  Lock,
  Smartphone,
  Mail,
  MapPin,
  Phone,
  FileText,
  IndianRupee,
  FileSignature
} from 'lucide-react-native';

const C = {
  blue: '#0066FF',
  blueDark: '#004FCC',
  blueSoft: '#E8F0FF',
  teal: '#00B3A4',
  tealDark: '#008C80',
  tealSoft: '#E0FAF7',
  amber: '#F59E0B',
  amberSoft: '#FFF8E7',
  green: '#16A34A',
  greenSoft: '#F0FDF4',
  red: '#EF4444',
  redSoft: '#FFF0F0',
  purple: '#7C3AED',
  purpleSoft: '#F3E8FF',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

// Custom iOS-style Switch Component
const IosSwitch = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? C.green : '#E2E8F0',
        padding: 2,
        justifyContent: 'center',
      }}
    >
      <MotiView
        animate={{
          translateX: value ? 20 : 0
        }}
        transition={{ type: 'timing', duration: 150 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2
        }}
      />
    </TouchableOpacity>
  );
};

export default function Settings() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Demographics Profile State
  const [profile, setProfile] = useState({
    name: isDoctor ? 'Dr. Catherine L.' : 'Karan Sharma',
    email: isDoctor ? 'catherine.l@livelong.app' : 'karan.sharma@livelong.app',
    phone: isDoctor ? '9876543210' : '7014956589',
    address: isDoctor ? 'LiveLong Cardio Wing, New Delhi' : 'A-42, Sector 11, Malviya Nagar, Jaipur'
  });
  
  // 2. Credentials State (Doctor Only)
  const [credentials, setCredentials] = useState({
    licenseNumber: 'MCI-82901A',
    affiliation: 'LiveLong Central Hospital Cardiology Wing',
    signatureFileName: 'digital_sig_path_catherine.png'
  });
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // 3. Consultation Fees State (Doctor Only)
  const [fees, setFees] = useState({
    videoFee: '1500',
    clinicFee: '1200'
  });

  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // 4. Security State
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [twoFactor, setTwoFactor] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 5. Notifications State
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // 6. Preferences State (Patient Only)
  const [lang, setLang] = useState('English (India)');
  const [darkMode, setDarkMode] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2500);
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (!profile.name || !profile.email) {
      showToast('Name and Email are required.', 'error');
      return;
    }
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      showToast('Profile demographics updated successfully.');
    }, 1200);
  };

  // Picture Upload simulation
  const handleUploadPic = () => {
    setUploadingPic(true);
    setTimeout(() => {
      setUploadingPic(false);
      showToast('Avatar profile picture updated.');
    }, 1500);
  };

  // Credentials Save
  const handleSaveCredentials = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      showToast('Professional medical credentials saved.');
    }, 1200);
  };

  // Signature Upload simulator
  const handleUploadSignature = () => {
    setUploadingSignature(true);
    setTimeout(() => {
      setUploadingSignature(false);
      showToast('Digital signature verified & uploaded.');
    }, 1500);
  };

  // Save Pricing Fees
  const handleSaveFees = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      showToast('Consultation fee structures updated.');
    }, 1000);
  };

  // Security Save
  const handleSaveSecurity = () => {
    setPasswordError('');
    if (!passwords.oldPassword && !passwords.newPassword && !passwords.confirmPassword) {
      setSavingSecurity(true);
      setTimeout(() => {
        setSavingSecurity(false);
        showToast('Two-factor parameters configured.');
      }, 1000);
      return;
    }

    if (!passwords.oldPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Confirmation password does not match.');
      return;
    }

    setSavingSecurity(true);
    setTimeout(() => {
      setSavingSecurity(false);
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Credentials updated successfully.');
    }, 1500);
  };

  // Notifications Save
  const handleSaveNotifs = () => {
    setSavingNotifs(true);
    setTimeout(() => {
      setSavingNotifs(false);
      showToast('Communication channels configured.');
    }, 1000);
  };

  // Preferences Save
  const handleSavePref = () => {
    setSavingPref(true);
    setTimeout(() => {
      setSavingPref(false);
      showToast('Preferences updated.');
    }, 1000);
  };

  // Dynamic Tabs array
  const TABS = isDoctor
    ? [
        { id: 'profile', label: 'Clinical Profile', icon: User },
        { id: 'credentials', label: 'Credentials & Licensure', icon: FileSignature },
        { id: 'fees', label: 'Consultation Pricing', icon: IndianRupee },
        { id: 'security', label: 'Security & Sign In', icon: ShieldAlert },
        { id: 'notifications', label: 'Communication Feeds', icon: BellRing }
      ]
    : [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'security', label: 'Security & Sign In', icon: ShieldAlert },
        { id: 'notifications', label: 'Notifications Feeds', icon: BellRing },
        { id: 'preferences', label: 'System Preferences', icon: Sliders }
      ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* Toast Alert Box */}
      <AnimatePresence>
        {toast.show && (
          <MotiView
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -50 }}
            transition={{ type: 'timing', duration: 250 }}
            style={[styles.toast, { backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2', borderColor: toast.type === 'success' ? '#10B981' : '#EF4444' }]}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={16} color={C.green} />
            ) : (
              <AlertCircle size={16} color={C.red} />
            )}
            <Text style={[styles.toastText, { color: toast.type === 'success' ? '#065F46' : '#991B1B' }]}>
              {toast.message}
            </Text>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.headerTitle}>{isDoctor ? 'Clinical Workspace Settings' : 'Account Settings'}</Text>
        <Text style={styles.headerSub}>Manage your profile metadata, secure access keys, and communication alerts.</Text>
      </View>

      <View style={styles.splitLayout}>
        {/* Left Navigation Tabs */}
        <View style={styles.leftColumn}>
          <View style={{ gap: 6 }}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              >
                <tab.icon size={15} color={activeTab === tab.id ? C.blue : C.textLight} />
                <Text style={[styles.tabBtnTxt, activeTab === tab.id && styles.tabBtnTxtActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Right Configuration Form */}
        <View style={styles.rightColumn}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <View>
              <Text style={styles.tabHeadingTitle}>Profile Demographics</Text>
              
              <View style={styles.avatarContainer}>
                <View style={styles.avatarFrame}>
                  <Text style={styles.avatarInitials}>{isDoctor ? 'DL' : 'PT'}</Text>
                  {uploadingPic && (
                    <View style={styles.uploadSpinnerFrame}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleUploadPic}
                  disabled={uploadingPic}
                  style={styles.photoChangeBtn}
                >
                  <Camera size={12} color={C.blue} />
                  <Text style={styles.photoChangeBtnTxt}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Full Legal Name</Text>
                  <TextInput
                    value={profile.name}
                    onChangeText={(t) => setProfile(p => ({ ...p, name: t }))}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Primary Email Address</Text>
                  <TextInput
                    value={profile.email}
                    onChangeText={(t) => setProfile(p => ({ ...p, email: t }))}
                    keyboardType="email-address"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    value={profile.phone}
                    onChangeText={(t) => setProfile(p => ({ ...p, phone: t }))}
                    keyboardType="phone-pad"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Registered Address Location</Text>
                  <TextInput
                    value={profile.address}
                    onChangeText={(t) => setProfile(p => ({ ...p, address: t }))}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={styles.submitBtn}
              >
                {savingProfile ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnTxt}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* CREDENTIALS TAB (Doctor Only) */}
          {activeTab === 'credentials' && isDoctor && (
            <View>
              <Text style={styles.tabHeadingTitle}>Professional Credentials</Text>
              
              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>MEDICAL COUNCIL REGISTRATION LICENSE ID</Text>
                  <TextInput
                    value={credentials.licenseNumber}
                    onChangeText={(t) => setCredentials(c => ({ ...c, licenseNumber: t }))}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>HOSPITAL / CLINIC AFFILIATION</Text>
                  <TextInput
                    value={credentials.affiliation}
                    onChangeText={(t) => setCredentials(c => ({ ...c, affiliation: t }))}
                    style={styles.textInput}
                  />
                </View>

                {/* Digital Signature Upload Area */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>VERIFIED DIGITAL SIGNATURE SCAN</Text>
                  <View style={styles.signatureCard}>
                    <FileText size={16} color={C.textLight} />
                    <Text style={styles.signatureFileTxt}>{credentials.signatureFileName}</Text>
                    
                    <TouchableOpacity
                      onPress={handleUploadSignature}
                      disabled={uploadingSignature}
                      style={styles.sigUploadBtn}
                    >
                      {uploadingSignature ? <ActivityIndicator size="small" color={C.blue} /> : <Text style={styles.sigUploadBtnTxt}>Re-upload</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveCredentials}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnTxt}>Save Credentials</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CONSULTATION PRICING TAB (Doctor Only) */}
          {activeTab === 'fees' && isDoctor && (
            <View>
              <Text style={styles.tabHeadingTitle}>Consultation Service Fees</Text>
              
              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>VIDEO CONSULTATION CONSULTING FEE (₹)</Text>
                  <TextInput
                    value={fees.videoFee}
                    onChangeText={(t) => setFees(f => ({ ...f, videoFee: t }))}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>IN-CLINIC PHYSICAL VISIT FEE (₹)</Text>
                  <TextInput
                    value={fees.clinicFee}
                    onChangeText={(t) => setFees(f => ({ ...f, clinicFee: t }))}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveFees}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnTxt}>Update Fees</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <View>
              <Text style={styles.tabHeadingTitle}>Security & Access Keys</Text>

              {passwordError ? (
                <View style={styles.errAlert}>
                  <AlertCircle size={14} color={C.red} />
                  <Text style={styles.errAlertTxt}>{passwordError}</Text>
                </View>
              ) : null}

              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <TextInput
                    value={passwords.oldPassword}
                    onChangeText={(t) => setPasswords(p => ({ ...p, oldPassword: t }))}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={C.textLight}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    value={passwords.newPassword}
                    onChangeText={(t) => setPasswords(p => ({ ...p, newPassword: t }))}
                    secureTextEntry
                    placeholder="Min 6 characters"
                    placeholderTextColor={C.textLight}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    value={passwords.confirmPassword}
                    onChangeText={(t) => setPasswords(p => ({ ...p, confirmPassword: t }))}
                    secureTextEntry
                    placeholder="Re-type password"
                    placeholderTextColor={C.textLight}
                    style={styles.textInput}
                  />
                </View>

                {/* 2FA Toggle */}
                <View style={styles.toggleCard}>
                  <View style={{ flex: 1, pr: 10 }}>
                    <Text style={styles.toggleCardTitle}>Two-Factor Authentication (2FA)</Text>
                    <Text style={styles.toggleCardSub}>Request one-time SMS verification keys when logging in.</Text>
                  </View>
                  <IosSwitch value={twoFactor} onValueChange={setTwoFactor} />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveSecurity}
                disabled={savingSecurity}
                style={styles.submitBtn}
              >
                {savingSecurity ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnTxt}>Save Security</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <View>
              <Text style={styles.tabHeadingTitle}>Communication Channels</Text>
              
              <View style={{ gap: 12, marginBottom: 20 }}>
                {[
                  { key: 'email', label: 'Email Correspondence', desc: 'Clinical reports, receipt statements, and appointment schedule logs.' },
                  { key: 'sms', label: 'SMS Reminders', desc: 'Secure verification codes and emergency consulting reminders.' },
                  { key: 'push', label: 'Push App Alerts', desc: 'Realtime notifications when patient calls are initiated.' }
                ].map(item => (
                  <View key={item.key} style={styles.toggleCard}>
                    <View style={{ flex: 1, pr: 10 }}>
                      <Text style={styles.toggleCardTitle}>{item.label}</Text>
                      <Text style={styles.toggleCardSub}>{item.desc}</Text>
                    </View>
                    <IosSwitch
                      value={notifs[item.key]}
                      onValueChange={(v) => setNotifs(n => ({ ...n, [item.key]: v }))}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSaveNotifs}
                disabled={savingNotifs}
                style={styles.submitBtn}
              >
                {savingNotifs ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnTxt}>Save Channels</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* PREFERENCES TAB (Patient Only) */}
          {activeTab === 'preferences' && !isDoctor && (
            <View>
              <Text style={styles.tabHeadingTitle}>System Preferences</Text>
              
              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Language Selection</Text>
                  <TextInput
                    value={lang}
                    onChangeText={setLang}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.toggleCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleCardTitle}>UI Dark Theme Mode</Text>
                    <Text style={styles.toggleCardSub}>Optimize presentation colors for night environments.</Text>
                  </View>
                  <IosSwitch value={darkMode} onValueChange={setDarkMode} />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSavePref}
                disabled={savingPref}
                style={styles.submitBtn}
              >
                {savingPref ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnTxt}>Save Settings</Text>}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.text,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textLight,
    marginTop: 3,
  },
  splitLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    marginTop: 10,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 2.8,
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    shadowColor: '#0D1829',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabBtnActive: {
    backgroundColor: C.blueSoft,
    borderColor: C.blue,
  },
  tabBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMid,
  },
  tabBtnTxtActive: {
    color: C.blue,
    fontWeight: '900',
  },
  tabHeadingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingBottom: 10,
    marginBottom: 20,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarFrame: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '900',
    color: C.textMid,
  },
  uploadSpinnerFrame: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,102,255,0.15)',
  },
  photoChangeBtnTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: C.blue,
  },
  formGrid: {
    gap: 14,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textLight,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: '#FAFBFD',
    fontWeight: '600',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  submitBtn: {
    backgroundColor: C.blue,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  submitBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  errAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.redSoft,
    borderColor: C.red,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errAlertTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.red,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    borderRadius: 16,
  },
  toggleCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: C.text,
  },
  toggleCardSub: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 14,
  },
  signatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  signatureFileTxt: {
    flex: 1,
    fontSize: 11,
    fontWeight: '750',
    color: C.textMid,
  },
  sigUploadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.blueSoft,
  },
  sigUploadBtnTxt: {
    fontSize: 10,
    fontWeight: '850',
    color: C.blue,
  },
  toast: {
    position: 'absolute',
    top: 10,
    left: 24,
    right: 24,
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 99999,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
