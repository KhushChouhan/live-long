import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Modal,
  StyleSheet,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import {
  Search,
  User,
  Phone,
  FileText,
  CalendarPlus,
  MessageSquare,
  Plus,
  X,
  CreditCard,
  Droplet,
  ChevronRight,
  UserPlus
} from 'lucide-react-native';
import { MotiView } from 'moti';

// ─── Color Palette ────────────────────────────────────────────
const C = {
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  primaryDark: '#3730A3',
  accent: '#0EA5E9',
  accentSoft: '#E0F2FE',
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

export default function PatientListScreen() {
  const router = useRouter();
  const { patients, addPatient, setPatientModalOpen, setApptModalOpen } = useDoctor();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for registering new patient
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIdentity, setNewIdentity] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newAge, setNewAge] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');

  // Local state for view details modal
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Filter logic
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patients.filter(patient => (
      patient.name.toLowerCase().includes(q) ||
      patient.phone.includes(q) ||
      (patient.identity && patient.identity.toLowerCase().includes(q))
    ));
  }, [patients, searchQuery]);

  const handleRegisterPatient = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    
    const newPatient = {
      name: newName,
      phone: newPhone,
      identity: newIdentity || `AADH-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: newGender,
      age: parseInt(newAge) || 30,
      bloodGroup: newBloodGroup
    };

    addPatient(newPatient);
    setShowAddModal(false);
    
    // Reset form
    setNewName('');
    setNewPhone('');
    setNewIdentity('');
    setNewGender('Male');
    setNewAge('');
    setNewBloodGroup('O+');
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Patient Registry</Text>
            <Text style={s.headerSub}>Manage profiles, medical history, and records</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAddModal(true)}
            style={s.registerBtn}
            activeOpacity={0.8}
          >
            <UserPlus size={16} color="#FFF" />
            <Text style={s.registerBtnText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Search size={16} color={C.textLight} />
            <TextInput
              placeholder="Search by name, phone, or ID..."
              placeholderTextColor={C.textLight}
              style={s.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearch}>
                <X size={14} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Main List ── */}
        <ScrollView style={s.listContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {filteredPatients.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyStateIcon}>
                <User size={32} color={C.textLight} />
              </View>
              <Text style={s.emptyStateText}>No patients found matching &quot;{searchQuery}&quot;</Text>
              <Text style={s.emptyStateSubText}>Try a different search term or register a new patient.</Text>
            </View>
          ) : (
            filteredPatients.map((patient, idx) => (
              <MotiView
                key={patient.id || idx}
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: Math.min(idx * 50, 500) }}
                style={s.patientCard}
              >
                <View style={s.patientCardLeft}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.patientName}>{patient.name}</Text>
                    <View style={s.patientMetaRow}>
                      <Text style={s.patientMetaText}>{patient.gender} • {patient.age} yrs</Text>
                      {patient.bloodGroup && (
                        <View style={s.bloodGroupBadge}>
                          <Droplet size={8} color={C.danger} fill={C.danger} />
                          <Text style={s.bloodGroupText}>{patient.bloodGroup}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.phoneRow}>
                      <Phone size={12} color={C.textLight} />
                      <Text style={s.phoneText}>{patient.phone}</Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setSelectedPatient(patient)}
                  style={s.viewBtn}
                >
                  <ChevronRight size={18} color={C.textLight} />
                </TouchableOpacity>
              </MotiView>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Patient Details Modal ── */}
      <Modal
        visible={selectedPatient !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPatient(null)}
      >
        <View style={s.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPatient(null)} />
          <MotiView
            from={{ opacity: 0, translateY: 200 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={s.modalContent}
          >
            {/* Header */}
            <View style={s.modalHeader}>
              <View style={s.modalHeaderLeft}>
                <View style={[s.avatar, { width: 50, height: 50, borderRadius: 25 }]}>
                  <Text style={[s.avatarText, { fontSize: 20 }]}>
                    {selectedPatient?.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={s.modalTitle}>{selectedPatient?.name}</Text>
                  <Text style={s.modalSubTitle}>Patient Profile Details</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedPatient(null)} style={s.closeBtn}>
                <X size={18} color={C.textMid} />
              </TouchableOpacity>
            </View>

            {/* Quick Metrics */}
            <View style={s.metricsRow}>
              <View style={s.metricCard}>
                <Text style={s.metricLabel}>AGE</Text>
                <Text style={s.metricValue}>{selectedPatient?.age} <Text style={{ fontSize: 10, color: C.textLight }}>yrs</Text></Text>
              </View>
              <View style={s.metricCard}>
                <Text style={s.metricLabel}>GENDER</Text>
                <Text style={s.metricValue}>{selectedPatient?.gender}</Text>
              </View>
              <View style={s.metricCard}>
                <Text style={s.metricLabel}>BLOOD</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Droplet size={14} color={C.danger} fill={C.danger} />
                  <Text style={s.metricValue}>{selectedPatient?.bloodGroup || 'O+'}</Text>
                </View>
              </View>
            </View>

            {/* Detail Rows */}
            <View style={s.detailsBox}>
              <View style={s.detailRow}>
                <View style={s.detailRowLeft}>
                  <Phone size={14} color={C.textLight} />
                  <Text style={s.detailRowLabel}>Phone Number</Text>
                </View>
                <Text style={s.detailRowValue}>{selectedPatient?.phone}</Text>
              </View>
              
              <View style={s.detailRow}>
                <View style={s.detailRowLeft}>
                  <CreditCard size={14} color={C.textLight} />
                  <Text style={s.detailRowLabel}>Identity Document</Text>
                </View>
                <Text style={s.detailRowValue}>{selectedPatient?.identity || 'N/A'}</Text>
              </View>

              <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
                <View style={s.detailRowLeft}>
                  <FileText size={14} color={C.textLight} />
                  <Text style={s.detailRowLabel}>Default Consultation</Text>
                </View>
                <Text style={s.detailRowValue}>Standard Appointment</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedPatient(null);
                  setApptModalOpen(true);
                  router.push('/doctor/dashboard');
                }}
                style={s.actionBtnPrimary}
                activeOpacity={0.8}
              >
                <CalendarPlus size={16} color="#FFF" />
                <Text style={s.actionBtnPrimaryText}>Book Appointment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setSelectedPatient(null);
                  router.push('/doctor/chat');
                }}
                style={s.actionBtnSecondary}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color={C.textMid} />
                <Text style={s.actionBtnSecondaryText}>Message</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* ── Register Patient Modal ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={s.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} />
          <View style={[s.modalContent, { maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}>
            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Register Patient</Text>
                <Text style={s.modalSubTitle}>Create a new patient profile</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={s.closeBtn}>
                <X size={18} color={C.textMid} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {/* Form Fields */}
              <View style={s.formGroup}>
                <Text style={s.fieldLabel}>FULL NAME *</Text>
                <View style={s.inputWrapper}>
                  <User size={16} color={C.textLight} />
                  <TextInput
                    placeholder="e.g. Sara Ali"
                    placeholderTextColor="#CBD5E1"
                    style={s.input}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>
              </View>

              <View style={s.formGroup}>
                <Text style={s.fieldLabel}>PHONE NUMBER *</Text>
                <View style={s.inputWrapper}>
                  <Phone size={16} color={C.textLight} />
                  <TextInput
                    placeholder="e.g. 919876001006"
                    placeholderTextColor="#CBD5E1"
                    style={s.input}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>AGE</Text>
                  <View style={s.inputWrapper}>
                    <TextInput
                      placeholder="e.g. 41"
                      placeholderTextColor="#CBD5E1"
                      style={s.input}
                      value={newAge}
                      onChangeText={setNewAge}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={s.fieldLabel}>IDENTITY CARD NO.</Text>
                  <View style={s.inputWrapper}>
                    <CreditCard size={16} color={C.textLight} />
                    <TextInput
                      placeholder="e.g. AADH-1006"
                      placeholderTextColor="#CBD5E1"
                      style={s.input}
                      value={newIdentity}
                      onChangeText={setNewIdentity}
                    />
                  </View>
                </View>
              </View>

              <View style={s.formGroup}>
                <Text style={s.fieldLabel}>GENDER</Text>
                <View style={s.chipRow}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setNewGender(g)}
                      style={[s.chip, newGender === g && s.chipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, newGender === g && s.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.formGroup}>
                <Text style={s.fieldLabel}>BLOOD GROUP</Text>
                <View style={[s.chipRow, { flexWrap: 'wrap' }]}>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <TouchableOpacity
                      key={bg}
                      onPress={() => setNewBloodGroup(bg)}
                      style={[s.chip, s.chipSmall, newBloodGroup === bg && s.chipDangerActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, newBloodGroup === bg && s.chipDangerTextActive]}>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleRegisterPatient}
              style={[s.submitBtn, (!newName || !newPhone) && { opacity: 0.5 }]}
              disabled={!newName || !newPhone}
              activeOpacity={0.9}
            >
              <Text style={s.submitBtnText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    ...Platform.select({ android: { paddingTop: 40 } }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 2,
  },
  registerBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  registerBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  clearSearch: {
    padding: 4,
    backgroundColor: C.bg,
    borderRadius: 10,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textMid,
    marginBottom: 6,
  },
  emptyStateSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textLight,
  },
  patientCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  patientCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: C.primary,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  patientMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMid,
  },
  bloodGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: C.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodGroupText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.danger,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textLight,
  },
  viewBtn: {
    padding: 8,
    backgroundColor: C.bg,
    borderRadius: 12,
  },
  
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  modalSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 14,
  },
  
  // Detail Modal Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
    marginTop: 4,
  },
  detailsBox: {
    backgroundColor: C.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
  },
  detailRowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnPrimaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: C.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnSecondaryText: {
    color: C.textMid,
    fontSize: 14,
    fontWeight: '800',
  },
  
  // Register Form
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: C.primarySoft,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMid,
  },
  chipTextActive: {
    color: C.primary,
    fontWeight: '800',
  },
  chipSmall: {
    flex: 0,
    minWidth: '22%',
    paddingVertical: 10,
  },
  chipDangerActive: {
    backgroundColor: C.dangerSoft,
    borderColor: C.danger,
  },
  chipDangerTextActive: {
    color: C.danger,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
