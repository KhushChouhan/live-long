import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Search,
  User,
  UserPlus,
  Plus,
  Trash2,
  CheckCircle,
  Microscope,
  FlaskConical,
  Beaker,
  Activity,
  FileText,
  CalendarDays,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  StickyNote,
  Send,
  Stethoscope,
  Building2,
  Phone,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardCheck,
} from 'lucide-react-native';

import { useDoctor } from '../../../store/DoctorContext';

// ─── Color Palette ────────────────────────────────────────────
const C = {
  primary: '#7C3AED',
  primarySoft: '#F3E8FF',
  primaryDark: '#5B21B6',
  accent: '#0EA5E9',
  accentSoft: '#E0F2FE',
  teal: '#14B8A6',
  tealSoft: '#CCFBF1',
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  text: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  dark: '#1E293B',
};

// ─── Test Panel Presets ────────────────────────────────────────
const TEST_PANELS = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    icon: 'blood',
    color: C.danger,
    colorSoft: C.dangerSoft,
    biomarkers: [
      { name: 'Hemoglobin', unit: 'g/dL', refRange: '13.0 - 17.0' },
      { name: 'White Blood Cells (WBC)', unit: 'K/uL', refRange: '4.0 - 11.0' },
      { name: 'Red Blood Cells (RBC)', unit: 'M/uL', refRange: '4.5 - 5.9' },
      { name: 'Platelets', unit: 'K/uL', refRange: '150 - 450' },
      { name: 'Hematocrit (HCT)', unit: '%', refRange: '38.0 - 50.0' },
    ],
  },
  {
    id: 'lipid',
    name: 'Lipid Profile Panel',
    icon: 'heart',
    color: C.warning,
    colorSoft: C.warningSoft,
    biomarkers: [
      { name: 'Total Cholesterol', unit: 'mg/dL', refRange: '< 200' },
      { name: 'HDL Cholesterol', unit: 'mg/dL', refRange: '> 40' },
      { name: 'LDL Cholesterol', unit: 'mg/dL', refRange: '< 100' },
      { name: 'Triglycerides', unit: 'mg/dL', refRange: '< 150' },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', refRange: '< 30' },
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid Function Panel',
    icon: 'thyroid',
    color: C.accent,
    colorSoft: C.accentSoft,
    biomarkers: [
      { name: 'TSH', unit: 'uIU/mL', refRange: '0.4 - 4.0' },
      { name: 'Free T4 (Thyroxine)', unit: 'ng/dL', refRange: '0.8 - 1.8' },
      { name: 'Free T3', unit: 'pg/mL', refRange: '2.3 - 4.2' },
    ],
  },
  {
    id: 'liver',
    name: 'Liver Function Test (LFT)',
    icon: 'liver',
    color: C.teal,
    colorSoft: C.tealSoft,
    biomarkers: [
      { name: 'ALT (SGPT)', unit: 'U/L', refRange: '7 - 56' },
      { name: 'AST (SGOT)', unit: 'U/L', refRange: '10 - 40' },
      { name: 'Alkaline Phosphatase', unit: 'U/L', refRange: '44 - 147' },
      { name: 'Total Bilirubin', unit: 'mg/dL', refRange: '0.1 - 1.2' },
      { name: 'Albumin', unit: 'g/dL', refRange: '3.5 - 5.5' },
    ],
  },
  {
    id: 'kidney',
    name: 'Kidney Function Test (KFT)',
    icon: 'kidney',
    color: '#8B5CF6',
    colorSoft: '#EDE9FE',
    biomarkers: [
      { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', refRange: '7 - 20' },
      { name: 'Creatinine', unit: 'mg/dL', refRange: '0.7 - 1.3' },
      { name: 'Uric Acid', unit: 'mg/dL', refRange: '3.5 - 7.2' },
      { name: 'eGFR', unit: 'mL/min', refRange: '> 90' },
    ],
  },
  {
    id: 'diabetes',
    name: 'Diabetes Panel (HbA1c)',
    icon: 'sugar',
    color: '#EC4899',
    colorSoft: '#FCE7F3',
    biomarkers: [
      { name: 'Fasting Blood Glucose', unit: 'mg/dL', refRange: '70 - 100' },
      { name: 'HbA1c', unit: '%', refRange: '< 5.7' },
      { name: 'Post Prandial Glucose', unit: 'mg/dL', refRange: '< 140' },
    ],
  },
];

// ─── Auto-evaluate status from value vs ref range ──────────────
const evaluateStatus = (value, refRange) => {
  if (!value || !refRange) return 'Pending';
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return 'Pending';

  const clean = refRange.trim();
  // Handle "< X"
  if (clean.startsWith('<')) {
    const limit = parseFloat(clean.replace(/[<\s]/g, ''));
    if (!isNaN(limit)) return numVal < limit ? 'Normal' : 'High';
  }
  // Handle "> X"
  if (clean.startsWith('>')) {
    const limit = parseFloat(clean.replace(/[>\s]/g, ''));
    if (!isNaN(limit)) return numVal > limit ? 'Normal' : 'Low';
  }
  // Handle "X - Y"
  const parts = clean.split('-').map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    if (numVal < parts[0]) return 'Low';
    if (numVal > parts[1]) return 'High';
    return 'Normal';
  }
  return 'Pending';
};

// ─── Generate Report ID ────────────────────────────────────────
const generateReportId = () => {
  const num = Math.floor(100 + Math.random() * 900);
  return `DR-${num}`;
};

// ─── Format Date ───────────────────────────────────────────────
const formatDate = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AddLabReportScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const ctx = useDoctor();
  const patients = ctx?.patients || [];

  // ─── Report Metadata ─────────────────────────────────────────
  const [reportId] = useState(generateReportId());
  const [reportDate] = useState(formatDate(new Date()));

  // ─── Patient Selection ────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [customPatient, setCustomPatient] = useState({
    name: '',
    age: '',
    phone: '',
    gender: 'Male',
  });

  // ─── Test Panel ──────────────────────────────────────────────
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [labName, setLabName] = useState('LiveLong Central Diagnostics');

  // ─── Biomarkers ──────────────────────────────────────────────
  const [biomarkers, setBiomarkers] = useState([]);

  // ─── Extra Info ──────────────────────────────────────────────
  const [priority, setPriority] = useState('routine'); // routine | urgent | critical
  const [clinicalNotes, setClinicalNotes] = useState('');

  // ─── UI States ───────────────────────────────────────────────
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── Patient Filtering ────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const selectedPanel = useMemo(
    () => TEST_PANELS.find((p) => p.id === selectedPanelId) || null,
    [selectedPanelId]
  );

  // ─── Overall Status ──────────────────────────────────────────
  const overallStatus = useMemo(() => {
    if (biomarkers.length === 0) return 'Pending';
    const hasAbnormal = biomarkers.some((b) => {
      const s = evaluateStatus(b.value, b.refRange);
      return s === 'High' || s === 'Low';
    });
    const allFilled = biomarkers.every((b) => b.value);
    if (!allFilled) return 'Incomplete';
    return hasAbnormal ? 'Abnormal' : 'Normal';
  }, [biomarkers]);

  const statusCounts = useMemo(() => {
    let normal = 0, high = 0, low = 0, pending = 0;
    biomarkers.forEach((b) => {
      const s = evaluateStatus(b.value, b.refRange);
      if (s === 'Normal') normal++;
      else if (s === 'High') high++;
      else if (s === 'Low') low++;
      else pending++;
    });
    return { normal, high, low, pending };
  }, [biomarkers]);

  // ─── Select Panel → Load Biomarkers ──────────────────────────
  const handleSelectPanel = useCallback((panelId) => {
    setSelectedPanelId(panelId);
    const panel = TEST_PANELS.find((p) => p.id === panelId);
    if (panel) {
      setBiomarkers(
        panel.biomarkers.map((b, i) => ({
          id: String(Date.now()) + i,
          name: b.name,
          value: '',
          unit: b.unit,
          refRange: b.refRange,
        }))
      );
    }
  }, []);

  // ─── Add custom biomarker ─────────────────────────────────────
  const addCustomBiomarker = useCallback(() => {
    setBiomarkers((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', value: '', unit: '', refRange: '' },
    ]);
  }, []);

  const removeBiomarker = useCallback((id) => {
    setBiomarkers((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBiomarker = useCallback((id, field, val) => {
    setBiomarkers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: val } : b))
    );
  }, []);

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = () => {
    const patientInfo = selectedPatient || {
      name: customPatient.name || 'Unknown Patient',
    };
    if (!patientInfo.name.trim()) return;
    if (biomarkers.length === 0) return;
    setIsSuccess(true);
  };

  // ─── Status Badge Helper ──────────────────────────────────────
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Normal':
        return { bg: C.successSoft, color: C.success };
      case 'High':
        return { bg: C.dangerSoft, color: C.danger };
      case 'Low':
        return { bg: '#DBEAFE', color: '#2563EB' };
      default:
        return { bg: C.borderLight, color: C.textLight };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Normal':
        return <CheckCircle size={10} color={C.success} />;
      case 'High':
        return <TrendingUp size={10} color={C.danger} />;
      case 'Low':
        return <TrendingDown size={10} color="#2563EB" />;
      default:
        return <Minus size={10} color={C.textLight} />;
    }
  };

  // ─── Success Screen ──────────────────────────────────────────
  if (isSuccess) {
    const patientName = selectedPatient?.name || customPatient.name || 'Patient';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
        <View style={s.successContainer}>
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 100 }}
          >
            <View style={s.successIconRing}>
              <View style={s.successIconInner}>
                <ClipboardCheck size={52} color={C.primary} />
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 400 }}
          >
            <Text style={s.successTitle}>Lab Report Filed</Text>
            <Text style={s.successSub}>
              {reportId} • {selectedPanel?.name || 'Custom Panel'}
            </Text>
            <Text style={s.successPatient}>Patient: {patientName}</Text>

            <View style={s.successStatusRow}>
              <View style={[s.successStatusChip, { backgroundColor: overallStatus === 'Normal' ? C.successSoft : C.dangerSoft }]}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: overallStatus === 'Normal' ? C.success : C.danger }}>
                  {overallStatus === 'Normal' ? '✓ All Normal' : '⚠ Abnormal Findings'}
                </Text>
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 700 }}
            style={s.successActions}
          >
            <TouchableOpacity
              onPress={() => {
                setIsSuccess(false);
                const basePath = isDoctor ? '/doctor' : '/user';
                router.push(`${basePath}/lab-reports/lab-report-list`);
              }}
              style={s.successPrimaryBtn}
            >
              <Microscope size={16} color="#FFF" />
              <Text style={s.successPrimaryBtnText}>View All Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsSuccess(false);
                setSelectedPatientId('');
                setCustomPatient({ name: '', age: '', phone: '', gender: 'Male' });
                setSelectedPanelId('');
                setBiomarkers([]);
                setClinicalNotes('');
                setPriority('routine');
              }}
              style={s.successSecondaryBtn}
            >
              <Plus size={16} color={C.primary} />
              <Text style={s.successSecondaryBtnText}>Add Another Report</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Form ───────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={18} color={C.textMid} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.topBarTitle}>Add Lab Report</Text>
            <Text style={s.topBarSub}>Record diagnostic results and biomarker values</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ SECTION 1: Report Header ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={s.section}
          >
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconBg, { backgroundColor: C.primarySoft }]}>
                <Microscope size={16} color={C.primary} />
              </View>
              <Text style={s.sectionTitle}>Report Details</Text>
            </View>

            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <View style={s.metaIconRow}>
                  <Hash size={12} color={C.textLight} />
                  <Text style={s.metaLabel}>REPORT ID</Text>
                </View>
                <Text style={s.metaValue}>{reportId}</Text>
              </View>
              <View style={s.metaItem}>
                <View style={s.metaIconRow}>
                  <CalendarDays size={12} color={C.textLight} />
                  <Text style={s.metaLabel}>DATE</Text>
                </View>
                <Text style={s.metaValue}>{reportDate}</Text>
              </View>
              <View style={s.metaItem}>
                <View style={s.metaIconRow}>
                  <Building2 size={12} color={C.textLight} />
                  <Text style={s.metaLabel}>LAB</Text>
                </View>
                <TextInput
                  style={[s.metaValue, { padding: 0, fontSize: 11 }]}
                  value={labName}
                  onChangeText={setLabName}
                  placeholder="Lab name..."
                  placeholderTextColor={C.textLight}
                />
              </View>
            </View>
          </MotiView>

          {/* ═══ SECTION 2: Patient Selection ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 80 }}
            style={s.section}
          >
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconBg, { backgroundColor: C.accentSoft }]}>
                <User size={16} color={C.accent} />
              </View>
              <Text style={s.sectionTitle}>Patient Information</Text>
            </View>

            {patients.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>SELECT PATIENT</Text>
                <TouchableOpacity
                  onPress={() => setShowPatientDropdown(!showPatientDropdown)}
                  style={s.selectButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <User size={14} color={selectedPatient ? C.primary : C.textLight} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: selectedPatient ? '700' : '500',
                        color: selectedPatient ? C.text : C.textLight,
                      }}
                      numberOfLines={1}
                    >
                      {selectedPatient
                        ? `${selectedPatient.name}  •  ${selectedPatient.phone}`
                        : 'Search or pick a registered patient...'}
                    </Text>
                  </View>
                  {showPatientDropdown ? (
                    <ChevronUp size={16} color={C.textLight} />
                  ) : (
                    <ChevronDown size={16} color={C.textLight} />
                  )}
                </TouchableOpacity>

                {showPatientDropdown && (
                  <View style={s.dropdown}>
                    <View style={s.dropdownSearch}>
                      <Search size={14} color={C.textLight} />
                      <TextInput
                        placeholder="Type to search..."
                        placeholderTextColor={C.textLight}
                        style={s.dropdownSearchInput}
                        value={patientSearch}
                        onChangeText={setPatientSearch}
                        autoFocus
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPatientId('');
                          setShowPatientDropdown(false);
                        }}
                        style={[s.dropdownItem, selectedPatientId === '' && s.dropdownItemActive]}
                      >
                        <UserPlus size={14} color={selectedPatientId === '' ? C.primary : C.textLight} />
                        <Text style={[s.dropdownItemText, selectedPatientId === '' && { color: C.primary, fontWeight: '700' }]}>
                          Walk-in / Manual Entry
                        </Text>
                      </TouchableOpacity>
                      {filteredPatients.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedPatientId(p.id);
                            setShowPatientDropdown(false);
                            setPatientSearch('');
                          }}
                          style={[s.dropdownItem, selectedPatientId === p.id && s.dropdownItemActive]}
                        >
                          <View style={s.dropdownAvatar}>
                            <Text style={s.dropdownAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.dropdownItemText, selectedPatientId === p.id && { color: C.primary, fontWeight: '700' }]}>
                              {p.name}
                            </Text>
                            <Text style={s.dropdownItemSub}>{p.phone} • {p.gender} • {p.age}y</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {!selectedPatient && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={s.fieldLabel}>FULL NAME *</Text>
                    <View style={s.inputWithIcon}>
                      <User size={14} color={C.textLight} />
                      <TextInput
                        placeholder="Patient name..."
                        placeholderTextColor="#CBD5E1"
                        style={s.inputField}
                        value={customPatient.name}
                        onChangeText={(v) => setCustomPatient({ ...customPatient, name: v })}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>AGE</Text>
                    <View style={s.inputWithIcon}>
                      <TextInput
                        placeholder="Age"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="numeric"
                        style={s.inputField}
                        value={customPatient.age}
                        onChangeText={(v) => setCustomPatient({ ...customPatient, age: v })}
                      />
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>PHONE</Text>
                    <View style={s.inputWithIcon}>
                      <Phone size={14} color={C.textLight} />
                      <TextInput
                        placeholder="91XXXXXXXXXX"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="phone-pad"
                        style={s.inputField}
                        value={customPatient.phone}
                        onChangeText={(v) => setCustomPatient({ ...customPatient, phone: v })}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>GENDER</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setCustomPatient({ ...customPatient, gender: g })}
                          style={[
                            s.genderChip,
                            customPatient.gender === g && s.genderChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              s.genderChipText,
                              customPatient.gender === g && s.genderChipTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {selectedPatient && (
              <View style={s.selectedPatientCard}>
                <View style={s.selectedPatientAvatar}>
                  <Text style={s.selectedPatientAvatarText}>
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectedPatientName}>{selectedPatient.name}</Text>
                  <Text style={s.selectedPatientMeta}>
                    {selectedPatient.phone} • {selectedPatient.gender} • {selectedPatient.age} yrs
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPatientId('')}
                  style={s.clearPatientBtn}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.danger }}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </MotiView>

          {/* ═══ SECTION 3: Test Panel Selection ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 160 }}
            style={s.section}
          >
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconBg, { backgroundColor: C.tealSoft }]}>
                <FlaskConical size={16} color={C.teal} />
              </View>
              <Text style={s.sectionTitle}>Select Test Panel</Text>
            </View>

            <View style={s.panelGrid}>
              {TEST_PANELS.map((panel) => {
                const isActive = selectedPanelId === panel.id;
                return (
                  <TouchableOpacity
                    key={panel.id}
                    onPress={() => handleSelectPanel(panel.id)}
                    style={[
                      s.panelCard,
                      isActive && { borderColor: panel.color, backgroundColor: panel.colorSoft },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        s.panelIconBg,
                        { backgroundColor: isActive ? panel.color + '22' : C.borderLight },
                      ]}
                    >
                      <FlaskConical size={16} color={isActive ? panel.color : C.textLight} />
                    </View>
                    <Text
                      style={[
                        s.panelCardText,
                        isActive && { color: panel.color, fontWeight: '800' },
                      ]}
                      numberOfLines={2}
                    >
                      {panel.name}
                    </Text>
                    {isActive && (
                      <View style={[s.panelCheckmark, { backgroundColor: panel.color }]}>
                        <CheckCircle size={10} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotiView>

          {/* ═══ SECTION 4: Biomarker Values ═══ */}
          {biomarkers.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 240 }}
              style={s.section}
            >
              <View style={[s.sectionHeader, { marginBottom: 6 }]}>
                <View style={[s.sectionIconBg, { backgroundColor: C.warningSoft }]}>
                  <Activity size={16} color={C.warning} />
                </View>
                <Text style={[s.sectionTitle, { flex: 1 }]}>
                  Biomarker Results
                </Text>
                <TouchableOpacity onPress={addCustomBiomarker} style={s.addItemBtn}>
                  <Plus size={14} color={C.primary} />
                  <Text style={s.addItemBtnText}>Add Custom</Text>
                </TouchableOpacity>
              </View>

              {/* Mini Stats Bar */}
              <View style={s.bioStatsBar}>
                <View style={[s.bioStatChip, { backgroundColor: C.successSoft }]}>
                  <CheckCircle size={10} color={C.success} />
                  <Text style={[s.bioStatText, { color: C.success }]}>{statusCounts.normal} Normal</Text>
                </View>
                {statusCounts.high > 0 && (
                  <View style={[s.bioStatChip, { backgroundColor: C.dangerSoft }]}>
                    <TrendingUp size={10} color={C.danger} />
                    <Text style={[s.bioStatText, { color: C.danger }]}>{statusCounts.high} High</Text>
                  </View>
                )}
                {statusCounts.low > 0 && (
                  <View style={[s.bioStatChip, { backgroundColor: '#DBEAFE' }]}>
                    <TrendingDown size={10} color="#2563EB" />
                    <Text style={[s.bioStatText, { color: '#2563EB' }]}>{statusCounts.low} Low</Text>
                  </View>
                )}
                {statusCounts.pending > 0 && (
                  <View style={[s.bioStatChip, { backgroundColor: C.borderLight }]}>
                    <Minus size={10} color={C.textLight} />
                    <Text style={[s.bioStatText, { color: C.textLight }]}>{statusCounts.pending} Pending</Text>
                  </View>
                )}
              </View>

              {/* Biomarker Rows */}
              {biomarkers.map((bio, index) => {
                const status = evaluateStatus(bio.value, bio.refRange);
                const statusStyle = getStatusStyle(status);
                return (
                  <MotiView
                    key={bio.id}
                    from={{ opacity: 0, translateX: -8 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: index * 40 }}
                    style={s.bioRow}
                  >
                    {/* Status bar on left */}
                    <View style={[s.bioStatusBar, { backgroundColor: statusStyle.color }]} />

                    <View style={s.bioContent}>
                      {/* Row 1: Name + Status */}
                      <View style={s.bioTopRow}>
                        <TextInput
                          placeholder="Biomarker name"
                          placeholderTextColor="#CBD5E1"
                          style={s.bioNameInput}
                          value={bio.name}
                          onChangeText={(v) => updateBiomarker(bio.id, 'name', v)}
                        />
                        <View style={[s.bioStatusBadge, { backgroundColor: statusStyle.bg }]}>
                          {getStatusIcon(status)}
                          <Text style={[s.bioStatusText, { color: statusStyle.color }]}>{status}</Text>
                        </View>
                        {biomarkers.length > 1 && (
                          <TouchableOpacity onPress={() => removeBiomarker(bio.id)} style={s.bioRemoveBtn}>
                            <Trash2 size={12} color={C.danger} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Row 2: Value, Unit, Ref Range */}
                      <View style={s.bioBottomRow}>
                        <View style={{ flex: 1.5 }}>
                          <Text style={s.bioFieldLabel}>VALUE</Text>
                          <TextInput
                            placeholder="0.0"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="numeric"
                            style={s.bioFieldInput}
                            value={bio.value}
                            onChangeText={(v) => updateBiomarker(bio.id, 'value', v)}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.bioFieldLabel}>UNIT</Text>
                          <TextInput
                            placeholder="g/dL"
                            placeholderTextColor="#CBD5E1"
                            style={s.bioFieldInput}
                            value={bio.unit}
                            onChangeText={(v) => updateBiomarker(bio.id, 'unit', v)}
                          />
                        </View>
                        <View style={{ flex: 1.5 }}>
                          <Text style={s.bioFieldLabel}>REF. RANGE</Text>
                          <TextInput
                            placeholder="0 - 100"
                            placeholderTextColor="#CBD5E1"
                            style={s.bioFieldInput}
                            value={bio.refRange}
                            onChangeText={(v) => updateBiomarker(bio.id, 'refRange', v)}
                          />
                        </View>
                      </View>
                    </View>
                  </MotiView>
                );
              })}
            </MotiView>
          )}

          {/* ═══ SECTION 5: Priority & Notes ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 320 }}
            style={s.section}
          >
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconBg, { backgroundColor: C.dangerSoft }]}>
                <Zap size={16} color={C.danger} />
              </View>
              <Text style={s.sectionTitle}>Priority & Clinical Notes</Text>
            </View>

            <Text style={s.fieldLabel}>REPORT PRIORITY</Text>
            <View style={s.priorityRow}>
              {[
                { id: 'routine', label: 'Routine', color: C.success, colorSoft: C.successSoft },
                { id: 'urgent', label: 'Urgent', color: C.warning, colorSoft: C.warningSoft },
                { id: 'critical', label: 'Critical', color: C.danger, colorSoft: C.dangerSoft },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPriority(p.id)}
                  style={[
                    s.priorityChip,
                    priority === p.id && { backgroundColor: p.colorSoft, borderColor: p.color },
                  ]}
                >
                  <View style={[s.priorityDot, { backgroundColor: priority === p.id ? p.color : C.textLight }]} />
                  <Text
                    style={[
                      s.priorityChipText,
                      priority === p.id && { color: p.color, fontWeight: '800' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={s.fieldLabel}>CLINICAL NOTES / OBSERVATIONS</Text>
              <View style={[s.inputWithIcon, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                <StickyNote size={14} color={C.textLight} style={{ marginTop: 2 }} />
                <TextInput
                  placeholder="Enter clinical observations, recommendations, dietary restrictions..."
                  placeholderTextColor="#CBD5E1"
                  style={[s.inputField, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={clinicalNotes}
                  onChangeText={setClinicalNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </MotiView>

          {/* ═══ SECTION 6: Summary Card ═══ */}
          {biomarkers.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 }}
              style={[s.section, { backgroundColor: C.dark }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={s.summaryLabel}>REPORT SUMMARY</Text>
                <View style={[
                  s.overallBadge,
                  {
                    backgroundColor:
                      overallStatus === 'Normal' ? C.success + '22' :
                      overallStatus === 'Abnormal' ? C.danger + '22' : '#334155',
                  }
                ]}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color:
                      overallStatus === 'Normal' ? C.success :
                      overallStatus === 'Abnormal' ? '#FCA5A5' : '#94A3B8',
                  }}>
                    {overallStatus === 'Normal' ? '✓ All Normal' :
                     overallStatus === 'Abnormal' ? '⚠ Abnormal' : '○ ' + overallStatus}
                  </Text>
                </View>
              </View>

              <View style={s.summaryGrid}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryItemValue}>{selectedPanel?.name || 'Custom Panel'}</Text>
                  <Text style={s.summaryItemLabel}>TEST PANEL</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryItemValue}>{biomarkers.length}</Text>
                  <Text style={s.summaryItemLabel}>BIOMARKERS</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryItemValue}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                  <Text style={s.summaryItemLabel}>PRIORITY</Text>
                </View>
              </View>
            </MotiView>
          )}

          {/* ═══ SUBMIT ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 480 }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                s.submitBtn,
                (biomarkers.length === 0) && { opacity: 0.5 },
              ]}
              activeOpacity={0.85}
              disabled={biomarkers.length === 0}
            >
              <Send size={18} color="#FFFFFF" />
              <Text style={s.submitBtnText}>Submit Lab Report</Text>
            </TouchableOpacity>
            <Text style={s.footerNote}>
              Report will be saved to diagnostic records and made available to the patient.
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
    ...Platform.select({ android: { paddingTop: 40 } }),
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 2,
  },

  // Sections
  section: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },

  // Meta row
  metaRow: { flexDirection: 'row', gap: 10 },
  metaItem: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },

  // Fields
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    paddingVertical: 10,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },

  // Select
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Dropdown
  dropdown: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 10,
  },
  dropdownItemActive: { backgroundColor: C.primarySoft },
  dropdownItemText: { fontSize: 13, fontWeight: '600', color: C.textMid },
  dropdownItemSub: { fontSize: 10, fontWeight: '500', color: C.textLight, marginTop: 2 },
  dropdownAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: { fontSize: 12, fontWeight: '800', color: C.primary },

  // Gender chips
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: C.primarySoft,
    borderColor: C.primary,
  },
  genderChipText: { fontSize: 11, fontWeight: '700', color: C.textMid },
  genderChipTextActive: { color: C.primary, fontWeight: '800' },

  // Selected patient
  selectedPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primarySoft,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectedPatientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPatientAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  selectedPatientName: { fontSize: 14, fontWeight: '800', color: C.text },
  selectedPatientMeta: { fontSize: 11, fontWeight: '500', color: C.textMid, marginTop: 2 },
  clearPatientBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: C.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Panel Grid
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  panelCard: {
    width: '31%',
    minWidth: 100,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  panelIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  panelCardText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 14,
  },
  panelCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bio stats bar
  bioStatsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  bioStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bioStatText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Add item
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.primarySoft,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addItemBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Bio Row
  bioRow: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bioStatusBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  bioContent: {
    flex: 1,
    padding: 12,
  },
  bioTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bioNameInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    padding: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  bioStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bioStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bioRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.dangerSoft,
  },
  bioBottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bioFieldLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bioFieldInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },

  // Priority
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
  },

  // Summary
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  overallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryItemLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 12,
    marginBottom: 20,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  successPatient: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  successStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  successStatusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  successActions: {
    width: '100%',
    marginTop: 36,
    gap: 12,
  },
  successPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  successPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primarySoft,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  successSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
});