import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import {
  Microscope,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  List,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
  FileText,
  CheckSquare,
  MessageSquare
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
  amber: '#F59E0B',
  amberSoft: '#FFF8E7',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

// ── Patient Diagnostics Data ──
const PATIENT_REPORTS = [
  {
    id: 'R-902',
    date: '2026-06-01',
    name: 'Complete Blood Count (CBC)',
    status: 'Normal',
    lab: 'LiveLong Central Diagnostics',
    referredBy: 'Dr. Catherine L.',
    biomarkers: [
      { name: 'Hemoglobin', value: 14.5, unit: 'g/dL', range: '13.0 - 17.0', status: 'Normal' },
      { name: 'White Blood Cells (WBC)', value: 6.8, unit: 'K/uL', range: '4.0 - 11.0', status: 'Normal' },
      { name: 'Red Blood Cells (RBC)', value: 4.9, unit: 'M/uL', range: '4.5 - 5.9', status: 'Normal' },
      { name: 'Platelets', value: 240, unit: 'K/uL', range: '150 - 450', status: 'Normal' }
    ]
  },
  {
    id: 'R-741',
    date: '2026-05-18',
    name: 'Lipid Profile Panel',
    status: 'Abnormal',
    lab: 'LiveLong Central Diagnostics',
    referredBy: 'Dr. Catherine L.',
    biomarkers: [
      { name: 'Total Cholesterol', value: 245, unit: 'mg/dL', range: '< 200', status: 'High' },
      { name: 'HDL Cholesterol', value: 45, unit: 'mg/dL', range: '> 40', status: 'Normal' },
      { name: 'LDL Cholesterol', value: 165, unit: 'mg/dL', range: '< 100', status: 'High' },
      { name: 'Triglycerides', value: 175, unit: 'mg/dL', range: '< 150', status: 'High' }
    ]
  }
];

// ── Doctor Laboratory Reviews Data ──
const DOCTOR_REPORTS = [
  {
    id: 'DR-810',
    date: '2026-06-01',
    name: 'Lipid Panel - Karan',
    patient: 'Karan',
    age: 28,
    status: 'Abnormal',
    lab: 'LiveLong Central Diagnostics',
    signedOff: false,
    notes: 'Patient shows elevated LDL cholesterol. Advise diet controls and low fat intake.',
    biomarkers: [
      { name: 'Total Cholesterol', value: 245, unit: 'mg/dL', range: '< 200', status: 'High' },
      { name: 'HDL Cholesterol', value: 45, unit: 'mg/dL', range: '> 40', status: 'Normal' },
      { name: 'LDL Cholesterol', value: 165, unit: 'mg/dL', range: '< 100', status: 'High' },
      { name: 'Triglycerides', value: 175, unit: 'mg/dL', range: '< 150', status: 'High' }
    ]
  },
  {
    id: 'DR-531',
    date: '2026-05-29',
    name: 'Thyroid Panel - Sonia',
    patient: 'Sonia',
    age: 27,
    status: 'Abnormal',
    lab: 'LiveLong Central Diagnostics',
    signedOff: false,
    notes: '',
    biomarkers: [
      { name: 'TSH (Thyroid Stimulating Hormone)', value: 5.8, unit: 'uIU/mL', range: '0.4 - 4.0', status: 'High' },
      { name: 'Free T4 (Thyroxine)', value: 1.1, unit: 'ng/dL', range: '0.8 - 1.8', status: 'Normal' }
    ]
  }
];

export default function LabReports() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const [reports, setReports] = useState(
    isDoctor ? DOCTOR_REPORTS : PATIENT_REPORTS
  );
  
  const [selectedReportId, setSelectedReportId] = useState(
    isDoctor ? 'DR-810' : 'R-902'
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | Normal | Abnormal
  
  // Trend Chart modal
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedBiomarker, setSelectedBiomarker] = useState('LDL Cholesterol');
  const [chartData, setChartData] = useState([140, 148, 155, 150, 160, 165]);

  // Doctor Clinical Notes state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSigningOff, setIsSigningOff] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const selectedReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  // Load clinical notes when selected report changes
  React.useEffect(() => {
    if (selectedReport && isDoctor) {
      setClinicalNotes(selectedReport.notes || '');
    }
  }, [selectedReportId, isDoctor]);

  // Calculations
  const filteredData = useMemo(() => {
    return reports.filter(item => {
      const matchesType = filterType === 'all' || item.status === filterType;
      
      const q = searchQuery.toLowerCase();
      const textToMatch = isDoctor
        ? `${item.name} ${item.patient}`
        : `${item.name}`;
        
      const matchesSearch = textToMatch.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [reports, filterType, searchQuery, isDoctor]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      normal: reports.filter(r => r.status === 'Normal').length,
      abnormal: reports.filter(r => r.status === 'Abnormal').length,
      pending: isDoctor ? reports.filter(r => !r.signedOff).length : 0,
    };
  }, [reports, isDoctor]);

  const triggerTrendChart = (biomarker) => {
    setSelectedBiomarker(biomarker);
    if (biomarker === 'LDL Cholesterol') {
      setChartData([140, 148, 152, 150, 160, 165]);
    } else if (biomarker.includes('TSH')) {
      setChartData([4.2, 4.8, 5.1, 5.0, 5.4, 5.8]);
    } else {
      setChartData([13.8, 14.1, 14.0, 14.3, 14.2, 14.5]);
    }
    setChartOpen(true);
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
      setIsSavingNotes(false);
      setReports(reports.map(r => r.id === selectedReportId ? { ...r, notes: clinicalNotes } : r));
      setToastMsg('Clinical recommendations saved.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }, 1000);
  };

  const handleSignOff = () => {
    setIsSigningOff(true);
    setTimeout(() => {
      setIsSigningOff(false);
      setReports(reports.map(r => r.id === selectedReportId ? { ...r, signedOff: true } : r));
      setToastMsg('Report signed off and clinical recommendations dispatched to patient.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  const getStatusColor = (status) => {
    return status === 'Normal' ? C.green : C.red;
  };

  const getStatusBg = (status) => {
    return status === 'Normal' ? C.greenSoft : C.redSoft;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isDoctor ? 'Diagnostic Reviews' : 'My Lab Reports'}
          </Text>
          <Text style={styles.headerSub}>
            {stats.total} total reports • {stats.normal} normal • {isDoctor ? `${stats.pending} pending review` : `${stats.abnormal} abnormal`}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>{isDoctor ? 'Upload Report' : 'Request Report'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat Cards Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            <Microscope size={18} color={C.purple} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL REPORTS</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.greenSoft }]}>
            <CheckCircle size={18} color={C.green} />
          </View>
          <Text style={styles.statValue}>{stats.normal}</Text>
          <Text style={styles.statLabel}>NORMAL</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.redSoft }]}>
            <AlertTriangle size={18} color={C.red} />
          </View>
          <Text style={styles.statValue}>{stats.abnormal}</Text>
          <Text style={styles.statLabel}>ABNORMAL</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Clock size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>{isDoctor ? 'PENDING SIGN-OFF' : 'PENDING'}</Text>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchBar}>
        <Search size={18} color={C.textLight} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isDoctor ? "Search reports by patient name..." : "Search by report name..."}
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
      </View>

      {/* ── Filter By Type Container ── */}
      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>FILTER BY FINDINGS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
            onPress={() => setFilterType('Normal')}
            style={[styles.pill, filterType === 'Normal' && styles.pillActiveNormal]}
          >
            <CheckCircle size={12} color={filterType === 'Normal' ? '#FFF' : C.green} />
            <Text style={[styles.pillText, filterType === 'Normal' && styles.pillTextActiveNormal]}>Normal</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'Normal' ? C.greenSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'Normal' ? C.green : C.textMid }}>{stats.normal}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('Abnormal')}
            style={[styles.pill, filterType === 'Abnormal' && styles.pillActiveAbnormal]}
          >
            <AlertTriangle size={12} color={filterType === 'Abnormal' ? '#FFF' : C.red} />
            <Text style={[styles.pillText, filterType === 'Abnormal' && styles.pillTextActiveAbnormal]}>Abnormal</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'Abnormal' ? C.redSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'Abnormal' ? C.red : C.textMid }}>{stats.abnormal}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Master Detail Split Screen ── */}
      <View style={styles.splitLayout}>
        {/* Left Side: Master List */}
        <View style={styles.leftColumn}>
          <Text style={styles.sectionHeaderTitle}>Select Laboratory Report</Text>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {filteredData.map(item => {
              const isSelected = item.id === selectedReportId;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedReportId(item.id)}
                  style={[
                    styles.reportRow,
                    isSelected && styles.reportRowSelected
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusIndicatorBar, { backgroundColor: getStatusColor(item.status) }]} />
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={[styles.rowReportName, isSelected && { color: C.blue, fontWeight: '900' }]}>{item.name}</Text>
                    <View style={styles.rowMetadata}>
                      <Calendar size={11} color={C.textLight} />
                      <Text style={styles.rowDateText}>{item.date}</Text>
                    </View>
                  </View>
                  <ChevronRight size={14} color={C.textLight} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Side: Detail Panel */}
        <View style={styles.rightColumn}>
          {selectedReport && (
            <MotiView
              from={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 250 }}
              style={styles.detailCard}
            >
              <View style={styles.detailHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.detailTitle}>{selectedReport.name}</Text>
                  <Text style={styles.detailLab}>{selectedReport.lab}</Text>
                  <Text style={styles.detailMeta}>
                    {isDoctor
                      ? `Patient: ${selectedReport.patient} (Age: ${selectedReport.age})`
                      : `Date: ${selectedReport.date} · Ref: ${selectedReport.referredBy}`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedReport.status), alignSelf: 'flex-start' }]}>
                  <Text style={[styles.statusBadgeTxt, { color: getStatusColor(selectedReport.status) }]}>{selectedReport.status}</Text>
                </View>
              </View>

              <View style={styles.biomarkerGrid}>
                <View style={styles.biomarkerHeaderRow}>
                  <Text style={[styles.biomarkerLabelHeader, { flex: 2.2 }]}>BIOMARKER</Text>
                  <Text style={[styles.biomarkerLabelHeader, { flex: 1.2, textAlign: 'right' }]}>VALUE</Text>
                  <Text style={[styles.biomarkerLabelHeader, { flex: 1.5, textAlign: 'right' }]}>REF RANGE</Text>
                  <Text style={[styles.biomarkerLabelHeader, { flex: 1.8, textAlign: 'center' }]}>STATUS</Text>
                  <Text style={[styles.biomarkerLabelHeader, { flex: 0.8 }]} />
                </View>

                {selectedReport.biomarkers.map((bio, index) => {
                  const isNormal = bio.status === 'Normal';
                  return (
                    <View key={index} style={styles.biomarkerRow}>
                      <Text style={styles.bioNameText}>{bio.name}</Text>
                      
                      <Text style={styles.bioValueText}>{bio.value} <Text style={{ fontSize: 9, color: C.textLight }}>{bio.unit}</Text></Text>
                      
                      <Text style={styles.bioRangeText}>{bio.range}</Text>

                      <View style={{ flex: 1.8, alignItems: 'center' }}>
                        <View style={[styles.bioStatusBadge, { backgroundColor: isNormal ? C.greenSoft : C.redSoft }]}>
                          <Text style={[styles.bioStatusBadgeTxt, { color: isNormal ? C.green : C.red }]}>{bio.status}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => triggerTrendChart(bio.name)}
                        style={styles.trendTriggerBtn}
                      >
                        <TrendingUp size={12} color={C.blue} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Differentiated Bottom Panel (Doctor recommendations vs Patient chart disclaimer) */}
              {isDoctor ? (
                /* Doctor Recommendations + Sign Off Layout */
                <View style={styles.doctorNotesCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MessageSquare size={14} color={C.blue} />
                    <Text style={styles.doctorNotesCardHeader}>Clinical Recommendations for Patient</Text>
                  </View>
                  <TextInput
                    value={clinicalNotes}
                    onChangeText={setClinicalNotes}
                    placeholder="Input dietary restrictions, drug adjustments, or review commands..."
                    placeholderTextColor={C.textLight}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={handleSaveNotes}
                      disabled={isSavingNotes}
                      style={styles.notesSaveBtn}
                    >
                      {isSavingNotes ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.notesSaveBtnTxt}>Save Notes</Text>}
                    </TouchableOpacity>

                    {!selectedReport.signedOff ? (
                      <TouchableOpacity
                        onPress={handleSignOff}
                        disabled={isSigningOff}
                        style={[styles.notesSaveBtn, { backgroundColor: C.green }]}
                      >
                        {isSigningOff ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.notesSaveBtnTxt}>Verify & Sign Off</Text>}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.signedOffBadge}>
                        <CheckSquare size={12} color={C.green} />
                        <Text style={styles.signedOffBadgeTxt}>Reviewed & Signed Off</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* Patient Chart Disclaimer */
                <Text style={styles.chartCTA}>💡 Click the graph icon next to any biomarker to view historical trends.</Text>
              )}

            </MotiView>
          )}
        </View>
      </View>

      {/* ── Trend Graph Modal ── */}
      <Modal
        visible={chartOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setChartOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setChartOpen(false)} />
          
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 250 }}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color={C.blue} />
                <Text style={styles.modalTitle}>Biomarker Historical Trend</Text>
              </View>
              <TouchableOpacity onPress={() => setChartOpen(false)} style={styles.modalCloseBtn}>
                <X size={16} color={C.textMid} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={styles.chartSubject}>{selectedBiomarker}</Text>
              <Text style={styles.chartSubtext}>Past 6 months evaluation report (Dec 2025 - Jun 2026)</Text>

              <View style={styles.chartMockContainer}>
                <View style={styles.gridLine} />
                <View style={[styles.gridLine, { top: '33%' }]} />
                <View style={[styles.gridLine, { top: '66%' }]} />
                
                <View style={styles.nodesContainer}>
                  {chartData.map((val, idx) => {
                    const heightLimit = selectedBiomarker.includes('TSH') ? 8 : 250;
                    const pct = (val / heightLimit) * 100;
                    return (
                      <View key={idx} style={styles.chartBarNode}>
                        <Text style={styles.nodeValueLabel}>{val}</Text>
                        <View style={[styles.nodeIndicatorCircle, { bottom: `${pct}%`, backgroundColor: val > (heightLimit * 0.6) ? C.red : C.green }]} />
                        <Text style={styles.nodeMonthLabel}>{['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'][idx] || 'Jun'}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.chartSummaryBox}>
                <TrendingUp size={16} color={C.blue} style={{ marginRight: 6 }} />
                <Text style={styles.chartSummaryTxt}>
                  A fluctuation of <Text style={{ fontWeight: '900' }}>+12%</Text> observed. Clinical diagnostics follow-ups are advised.
                </Text>
              </View>

            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseBtnPrimary} onPress={() => setChartOpen(false)}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>Close</Text>
              </TouchableOpacity>
            </View>

          </MotiView>
        </View>
      </Modal>

      {/* Simulated Toast */}
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
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMid,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  pillActiveNormal: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  pillTextActiveNormal: {
    color: '#FFF',
  },
  pillActiveAbnormal: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  pillTextActiveAbnormal: {
    color: '#FFF',
  },
  splitLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  leftColumn: {
    flex: 1.2,
  },
  rightColumn: {
    flex: 1.8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
    marginBottom: 12,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  reportRowSelected: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },
  statusIndicatorBar: {
    width: 4,
    height: '140%',
    position: 'absolute',
    left: 0,
  },
  rowReportName: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },
  rowMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rowDateText: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    shadowColor: '#0D1829',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingBottom: 14,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '950',
    color: C.text,
  },
  detailLab: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '700',
    marginTop: 2,
  },
  detailMeta: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeTxt: {
    fontSize: 11,
    fontWeight: '850',
  },
  biomarkerGrid: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  biomarkerHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  biomarkerLabelHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.5,
  },
  biomarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  bioNameText: {
    flex: 2.2,
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
  },
  bioValueText: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
    textAlign: 'right',
  },
  bioRangeText: {
    flex: 1.5,
    fontSize: 10,
    color: C.textMid,
    textAlign: 'right',
    fontWeight: '650',
  },
  bioStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bioStatusBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
  },
  trendTriggerBtn: {
    flex: 0.8,
    alignItems: 'flex-end',
    padding: 4,
  },
  chartCTA: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
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
  chartSubject: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
  },
  chartSubtext: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  chartMockContainer: {
    height: 140,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: C.textLight,
    marginTop: 20,
    position: 'relative',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  nodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: '100%',
    alignItems: 'flex-end',
  },
  chartBarNode: {
    alignItems: 'center',
    width: 40,
  },
  nodeValueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textMid,
    marginBottom: 6,
  },
  nodeIndicatorCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  nodeMonthLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    marginTop: 15,
    position: 'absolute',
    bottom: -22,
  },
  chartSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueSoft,
    borderRadius: 12,
    padding: 10,
    marginTop: 36,
  },
  chartSummaryTxt: {
    fontSize: 11,
    color: C.blueDark,
    fontWeight: '700',
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  modalCloseBtnPrimary: {
    backgroundColor: C.textMid,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  doctorNotesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginTop: 12,
  },
  doctorNotesCardHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: C.text,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: C.text,
    backgroundColor: C.card,
    fontWeight: '600',
    marginTop: 8,
    minHeight: 60,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  notesSaveBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: 'center',
  },
  notesSaveBtnTxt: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  signedOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.greenSoft,
    borderColor: C.green,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signedOffBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.green,
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
});
