import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { useAuth } from '../../../store/AuthContext';
import { normalizePhone } from '../../../utils/roomUtils';
import {
  FileText,
  Activity,
  Archive,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  List,
  CheckCircle,
  XCircle,
  ArrowRight,
  Heart,
  PlusCircle,
  X
} from 'lucide-react-native';

const C = {
  blue: '#0066FF',
  blueSoft: '#E8F0FF',
  blueDark: '#004FCC',
  teal: '#00B3A4',
  tealSoft: '#E0FAF7',
  tealDark: '#008C80',
  purple: '#7C3AED',
  purpleSoft: '#F3E8FF',
  green: '#16A34A',
  greenSoft: '#F0FDF4',
  red: '#EF4444',
  redSoft: '#FFF0F0',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

// ── Patient Prescriptions Data ──
const PATIENT_PRESCRIPTIONS = [
  {
    id: 'P101',
    date: '2026-05-28',
    doctorName: 'Dr. Catherine L.',
    specialty: 'Senior Cardiologist',
    diagnosis: 'Essential Hypertension',
    medicationsSummary: 'Amlodipine 5mg, Telmisartan 40mg',
    status: 'active',
    refills: 2,
    details: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet once daily in the morning', duration: '30 days' },
      { name: 'Telmisartan 40mg', dosage: '1 tablet once daily in the evening', duration: '30 days' }
    ]
  },
  {
    id: 'P102',
    date: '2026-05-15',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Dermatologist',
    diagnosis: 'Atopic Dermatitis',
    medicationsSummary: 'Hydrocortisone 1% Cream, Cetirizine 10mg',
    status: 'active',
    refills: 0,
    details: [
      { name: 'Hydrocortisone 1% Cream', dosage: 'Apply thin layer to affected arm areas twice daily', duration: '14 days' },
      { name: 'Cetirizine 10mg', dosage: '1 tablet at bedtime for itching prn', duration: '15 days' }
    ]
  },
  {
    id: 'P103',
    date: '2026-04-10',
    doctorName: 'Dr. Amit Patel',
    specialty: 'Dental Surgeon',
    diagnosis: 'Acute Gingivitis',
    medicationsSummary: 'Amoxicillin 500mg, Chlorhexidine 0.12% Oral Rinse',
    status: 'past',
    refills: 0,
    details: [
      { name: 'Amoxicillin 500mg', dosage: '1 capsule 3 times daily', duration: '7 days (Complete full course)' },
      { name: 'Chlorhexidine 0.12% Rinse', dosage: 'Swish 15ml twice daily and spit out', duration: '14 days' }
    ]
  }
];

// ── Doctor Issued Prescriptions Data ──
const DOCTOR_PRESCRIPTIONS = [
  {
    id: 'DP201',
    date: '2026-06-01',
    patientName: 'Karan Sharma',
    age: 29,
    diagnosis: 'Mild Angina Pectoris',
    medicationsSummary: 'Amlodipine 5mg, Sorbitrate 5mg',
    status: 'active',
    refills: 1,
    details: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet once daily in morning', duration: '30 days' },
      { name: 'Sorbitrate 5mg', dosage: '1 tablet sublingually prn during severe tightness', duration: '10 days' }
    ]
  },
  {
    id: 'DP202',
    date: '2026-06-01',
    patientName: 'Chinu Choudhary',
    age: 26,
    diagnosis: 'Stage 1 Hypertension',
    medicationsSummary: 'Telmisartan 40mg',
    status: 'active',
    refills: 3,
    details: [
      { name: 'Telmisartan 40mg', dosage: '1 tablet once daily in evening', duration: '30 days' }
    ]
  },
  {
    id: 'DP203',
    date: '2026-05-24',
    patientName: 'Amit Patel',
    age: 42,
    diagnosis: 'Post-Myocardial Infarction',
    medicationsSummary: 'Aspirin 75mg, Atorvastatin 40mg',
    status: 'active',
    refills: 5,
    details: [
      { name: 'Aspirin 75mg', dosage: '1 tablet once daily after lunch', duration: '90 days' },
      { name: 'Atorvastatin 40mg', dosage: '1 tablet once daily at bedtime', duration: '90 days' }
    ]
  }
];

export default function AllPrescriptions() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const { prescriptions, addPrescription, patients } = useDoctor();
  const { user } = useAuth();

  const getPatientId = () => {
    if (!user || !user.phone) return 'p1';
    const normUserPhone = normalizePhone(user.phone);
    const matched = patients.find(p => normalizePhone(p.phone) === normUserPhone);
    return matched ? matched.id : 'p1';
  };
  const loggedPatientId = getPatientId();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | active | past
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // all | last30 | last90
  
  // Custom Rx Creator Modal State
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxPatientName, setRxPatientName] = useState('Karan');
  const [rxDiagnosis, setRxDiagnosis] = useState('Essential Hypertension');
  const [rxMeds, setRxMeds] = useState('Telmisartan 40mg (1 daily - 5 days)');
  const [rxRefills, setRxRefills] = useState('2');
  const [isSavingRx, setIsSavingRx] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const startDownload = (id) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setToastMsg('Prescription PDF report downloaded successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }, 1500);
  };

  const handleWriteRx = () => {
    if (!rxDiagnosis || !rxMeds) {
      Alert.alert('Incomplete Form', 'Please provide diagnosis and medication guidelines.');
      return;
    }
    setIsSavingRx(true);
    setTimeout(() => {
      setIsSavingRx(false);
      setRxModalOpen(false);
      
      const matched = patients.find(p => p.name.toLowerCase().includes(rxPatientName.toLowerCase()));
      const patientId = matched ? matched.id : 'p1';

      // Parse duration from text or default to 5 days
      let durationStr = '5 days';
      const durationMatch = rxMeds.match(/(\d+)\s*day/i);
      if (durationMatch) {
        durationStr = `${durationMatch[1]} days`;
      }

      const newRx = {
        patientId,
        patientName: matched ? matched.name : rxPatientName,
        doctorName: 'Dr. Catherine L.',
        specialty: 'Senior Cardiologist',
        diagnosis: rxDiagnosis,
        medicationsSummary: rxMeds,
        status: 'active',
        refills: parseInt(rxRefills) || 0,
        details: [
          { name: rxMeds.split('(')[0].trim(), dosage: rxMeds, duration: durationStr }
        ]
      };
      
      addPrescription(newRx);
      setToastMsg('Prescription issued and sent to patient!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  // Filter calculations
  const filteredData = useMemo(() => {
    return prescriptions.filter(item => {
      // 1. Patient ID Filter (only for patient views)
      if (!isDoctor && item.patientId !== loggedPatientId) return false;

      // 2. Type Filter
      const matchesType = filterType === 'all' || item.status === filterType;
      
      const q = searchQuery.toLowerCase();
      const textToMatch = isDoctor
        ? `${item.patientName} ${item.diagnosis} ${item.medicationsSummary}`
        : `${item.doctorName} ${item.diagnosis} ${item.medicationsSummary}`;
        
      const matchesSearch = textToMatch.toLowerCase().includes(q);

      let matchesDate = true;
      if (dateFilter === 'last30') {
        const d = new Date(item.date);
        const limit = new Date(2026, 4, 1); // 30 days before June 1, 2026
        matchesDate = d >= limit;
      } else if (dateFilter === 'last90') {
        const d = new Date(item.date);
        const limit = new Date(2026, 2, 1); // 90 days before June 1, 2026
        matchesDate = d >= limit;
      }

      return matchesType && matchesSearch && matchesDate;
    });
  }, [prescriptions, filterType, searchQuery, dateFilter, isDoctor, loggedPatientId]);

  const stats = useMemo(() => {
    const data = isDoctor ? prescriptions : prescriptions.filter(p => p.patientId === loggedPatientId);
    return {
      total: data.length,
      active: data.filter(p => p.status === 'active').length,
      past: data.filter(p => p.status === 'past').length,
      refills: data.filter(p => p.refills > 0).length,
    };
  }, [prescriptions, loggedPatientId, isDoctor]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isDoctor ? 'Prescriptions Portal' : 'My Prescriptions'}
          </Text>
          <Text style={styles.headerSub}>
            {stats.total} total • {stats.active} active • {stats.past} past
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (isDoctor) {
              setRxModalOpen(true);
            } else {
              Alert.alert('Info', 'Prescription requests are handled during appointments.');
            }
          }}
          style={[styles.addBtn, isDoctor && { backgroundColor: C.blue }]}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>{isDoctor ? 'Write Rx' : 'Add New'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat Cards Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            <FileText size={18} color={C.purple} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Activity size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>ACTIVE RX</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.tealSoft }]}>
            <Archive size={18} color={C.teal} />
          </View>
          <Text style={styles.statValue}>{stats.past}</Text>
          <Text style={styles.statLabel}>PAST RX</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.greenSoft }]}>
            <RefreshCw size={18} color={C.green} />
          </View>
          <Text style={styles.statValue}>{stats.refills}</Text>
          <Text style={styles.statLabel}>REFILLS AUTHORIZED</Text>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchBar}>
        <Search size={18} color={C.textLight} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isDoctor ? "Search by patient name, diagnosis, or medicine..." : "Search by doctor or diagnosis..."}
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
      </View>

      {/* ── Filter Status Panel ── */}
      <View style={styles.filtersPanel}>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterGroupLabel}>FILTER BY STATUS</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setFilterType('all')}
              style={[styles.pill, filterType === 'all' && styles.pillActive]}
            >
              <List size={12} color={filterType === 'all' ? '#FFF' : C.textMid} />
              <Text style={[styles.pillText, filterType === 'all' && styles.pillTextActive]}>All</Text>
              <View style={[styles.badge, { backgroundColor: filterType === 'all' ? C.purpleSoft : '#F1F5F9' }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'all' ? C.purple : C.textMid }}>{stats.total}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType('active')}
              style={[styles.pill, filterType === 'active' && styles.pillActiveVideo]}
            >
              <Activity size={12} color={filterType === 'active' ? '#FFF' : C.blue} />
              <Text style={[styles.pillText, filterType === 'active' && styles.pillTextActiveVideo]}>Active</Text>
              <View style={[styles.badge, { backgroundColor: filterType === 'active' ? C.blueSoft : '#F1F5F9' }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'active' ? C.blue : C.textMid }}>{stats.active}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType('past')}
              style={[styles.pill, filterType === 'past' && styles.pillActivePhysical]}
            >
              <Archive size={12} color={filterType === 'past' ? '#FFF' : C.teal} />
              <Text style={[styles.pillText, filterType === 'past' && styles.pillTextActivePhysical]}>Past</Text>
              <View style={[styles.badge, { backgroundColor: filterType === 'past' ? C.tealSoft : '#F1F5F9' }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'past' ? C.teal : C.textMid }}>{stats.past}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 12, height: '80%' }} />

        <View style={{ minWidth: 140 }}>
          <Text style={styles.filterGroupLabel}>DATE RANGE</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {['all', 'last30', 'last90'].map(dKey => (
              <TouchableOpacity
                key={dKey}
                onPress={() => setDateFilter(dKey)}
                style={[
                  styles.smallTab,
                  dateFilter === dKey && styles.smallTabActive
                ]}
              >
                <Text style={[styles.smallTabTxt, dateFilter === dKey && styles.smallTabTxtActive]}>
                  {dKey === 'all' ? 'All' : dKey === 'last30' ? '30d' : '90d'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Table Layout Container ── */}
      <View style={styles.tablePanel}>
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.tableColHeader, { flex: 2.2 }]}>{isDoctor ? 'Patient Name' : 'Doctor Name'}</Text>
          <Text style={[styles.tableColHeader, { flex: 2.2 }]}>Diagnosis</Text>
          <Text style={[styles.tableColHeader, { flex: 3.5, display: Platform.OS === 'web' ? 'flex' : 'none' }]}>Medications Summary</Text>
          <Text style={[styles.tableColHeader, { flex: 1.8, textAlign: 'right' }]}>Action</Text>
        </View>

        {/* Table Body rows */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={32} color={C.textLight} />
            <Text style={styles.emptyTitle}>No matching prescriptions</Text>
            <Text style={styles.emptySub}>Modify your search query or filter settings.</Text>
          </View>
        ) : (
          filteredData.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isDownloading = downloadingId === item.id;
            return (
              <View key={item.id} style={[styles.rowContainer, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                {/* Main Row */}
                <View style={styles.tableBodyRow}>
                  <Text style={[styles.cellText, { flex: 1.2, fontWeight: '750' }]}>{item.date}</Text>
                  
                  <View style={{ flex: 2.2 }}>
                    <Text style={[styles.cellText, { fontWeight: '800', color: C.text }]}>
                      {isDoctor ? item.patientName : item.doctorName}
                    </Text>
                    <Text style={{ fontSize: 9, color: C.textLight, fontWeight: '600' }}>
                      {isDoctor ? `Age: ${item.age}` : item.specialty}
                    </Text>
                  </View>

                  <Text style={[styles.cellText, { flex: 2.2, color: C.textMid }]}>{item.diagnosis}</Text>
                  
                  <Text style={[styles.cellText, { flex: 3.5, color: C.textMid, display: Platform.OS === 'web' ? 'flex' : 'none' }]} numberOfLines={1}>
                    {item.medicationsSummary}
                  </Text>

                  {/* Actions column */}
                  <View style={[styles.actionCell, { flex: 1.8 }]}>
                    <TouchableOpacity
                      onPress={() => toggleRow(item.id)}
                      style={styles.detailsBtn}
                    >
                      <Text style={styles.detailsBtnTxt}>Details</Text>
                      {isExpanded ? <ChevronUp size={11} color={C.blue} /> : <ChevronDown size={11} color={C.blue} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => startDownload(item.id)}
                      disabled={isDownloading}
                      style={[styles.downloadBtn, isDownloading && { backgroundColor: '#F1F5F9' }]}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={C.blue} />
                      ) : (
                        <Download size={13} color={C.textMid} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded Dosage Instructions */}
                {isExpanded && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={styles.expandedContent}
                  >
                    <View style={styles.dosageCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Heart size={14} color={C.red} />
                        <Text style={styles.dosageCardHeader}>Medication Dosage & Intake Guidelines</Text>
                      </View>

                      {item.details.map((med, index) => (
                        <View key={index} style={styles.dosageRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ArrowRight size={10} color={C.textLight} />
                            <Text style={styles.medNameText}>{med.name}</Text>
                          </View>
                          <Text style={styles.medDosageDetail}>{med.dosage} · <Text style={{ fontWeight: '800', color: C.textLight }}>{med.duration}</Text></Text>
                        </View>
                      ))}

                      {item.refills > 0 && (
                        <View style={styles.refillBadge}>
                          <RefreshCw size={11} color={C.green} />
                          <Text style={styles.refillBadgeTxt}>Authorized Refills: {item.refills}</Text>
                        </View>
                      )}
                    </View>
                  </MotiView>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* ── Write Rx Modal Dialog (Doctor Only) ── */}
      <Modal
        visible={rxModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRxModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setRxModalOpen(false)} />
          
          <MotiView
            from={{ opacity: 0, translateY: 60 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={18} color={C.blue} />
                <Text style={styles.modalTitle}>Issue Patient Prescription</Text>
              </View>
              <TouchableOpacity onPress={() => setRxModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={16} color={C.textMid} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>PATIENT NAME</Text>
                <TextInput
                  value={rxPatientName}
                  onChangeText={setRxPatientName}
                  style={styles.formTextInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>CLINICAL DIAGNOSIS</Text>
                <TextInput
                  value={rxDiagnosis}
                  onChangeText={setRxDiagnosis}
                  style={styles.formTextInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>MEDICATION DOSAGE SCHEME</Text>
                <TextInput
                  value={rxMeds}
                  onChangeText={setRxMeds}
                  placeholder="e.g. Amlodipine 5mg (1 daily - 30 days)"
                  style={styles.formTextInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>REFILLS AUTHORIZED</Text>
                <TextInput
                  value={rxRefills}
                  onChangeText={setRxRefills}
                  keyboardType="numeric"
                  style={styles.formTextInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setRxModalOpen(false)} style={styles.cancelCheckoutBtn}>
                <Text style={styles.cancelCheckoutBtnTxt}>Discard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleWriteRx}
                disabled={isSavingRx}
                style={styles.placeOrderBtn}
              >
                {isSavingRx ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.placeOrderBtnTxt}>Submit Rx</Text>
                )}
              </TouchableOpacity>
            </View>

          </MotiView>
        </View>
      </Modal>

      {/* ── Simulated Toast Notification ── */}
      {showToast && (
        <MotiView
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.toast}
        >
          <CheckCircle size={16} color="#FFF" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </MotiView>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textLight,
    marginTop: 3,
  },
  addBtn: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 3,
    shadowColor: C.blue,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    marginLeft: 6,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0D1829',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  searchBar: {
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  filtersPanel: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  filterGroupLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  pillTextActive: {
    color: '#FFF',
  },
  pillActiveVideo: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  pillTextActiveVideo: {
    color: '#FFF',
  },
  pillActivePhysical: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  pillTextActivePhysical: {
    color: '#FFF',
  },
  smallTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  smallTabActive: {
    backgroundColor: C.card,
    borderColor: C.blue,
  },
  smallTabTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMid,
  },
  smallTabTxtActive: {
    color: C.blue,
    fontWeight: '800',
  },
  tablePanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#0D1829',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
    textTransform: 'uppercase',
  },
  rowContainer: {
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cellText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  detailsBtnTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.blue,
  },
  downloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFBFD',
  },
  dosageCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  dosageCardHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: C.text,
  },
  dosageRow: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  medNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
  },
  medDosageDetail: {
    fontSize: 11,
    color: C.textMid,
    marginTop: 2,
    marginLeft: 16,
    fontWeight: '600',
  },
  refillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: C.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  refillBadgeTxt: {
    fontSize: 10,
    fontWeight: '850',
    color: C.green,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.textMid,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 24, 41, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.card,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: C.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  formTextInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: C.text,
    backgroundColor: '#FAFBFD',
    fontWeight: '600',
    marginTop: 6,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
  },
  cancelCheckoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelCheckoutBtnTxt: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '800',
  },
  placeOrderBtn: {
    backgroundColor: C.blue,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  placeOrderBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
