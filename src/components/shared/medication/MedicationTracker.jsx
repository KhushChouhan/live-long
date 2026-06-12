import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { useAuth } from '../../../store/AuthContext';
import { normalizePhone } from '../../../utils/roomUtils';
import {
  Pill,
  Sunrise,
  Sun,
  Moon,
  Search,
  Plus,
  List,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Settings,
  Users,
  Activity,
  ChevronDown,
  ChevronUp
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
  indigo: '#4F46E5',
  indigoSoft: '#EEF2FF',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

// ── Patient Daily Medication Timeline Data ──
const PATIENT_MEDS = [
  {
    id: 't1',
    name: 'Metformin 500mg',
    type: 'Tablet',
    category: 'Diabetes',
    routine: 'morning',
    time: '08:00 AM',
    instructions: 'Take with food',
    status: 'taken', // taken | missed | pending
    totalPills: 60,
    remainingPills: 12,
  },
  {
    id: 't2',
    name: 'Zinc + Vitamin C',
    type: 'Capsule',
    category: 'Wellness',
    routine: 'morning',
    time: '08:30 AM',
    instructions: 'Take after breakfast',
    status: 'taken',
    totalPills: 30,
    remainingPills: 28,
  },
  {
    id: 't3',
    name: 'Amlodipine 5mg',
    type: 'Tablet',
    category: 'Cardiac',
    routine: 'afternoon',
    time: '01:00 PM',
    instructions: 'Take before lunch',
    status: 'pending',
    totalPills: 30,
    remainingPills: 18,
  },
  {
    id: 't4',
    name: 'Telmisartan 40mg',
    type: 'Tablet',
    category: 'Cardiac',
    routine: 'evening',
    time: '08:00 PM',
    instructions: 'Take after dinner',
    status: 'pending',
    totalPills: 30,
    remainingPills: 15,
  },
  {
    id: 't5',
    name: 'Atorvastatin 20mg',
    type: 'Tablet',
    category: 'Cardiac',
    routine: 'evening',
    time: '10:00 PM',
    instructions: 'Take at bedtime',
    status: 'pending',
    totalPills: 90,
    remainingPills: 5,
  }
];

// ── Doctor View: Patient compliance database ──
const DOCTOR_COMPLIANCE = [
  {
    id: 'pc1',
    name: 'Karan Sharma',
    age: 29,
    compliance: 92,
    status: 'Compliant',
    lastLogged: 'Today, 08:30 AM',
    adherenceList: [
      { med: 'Metformin 500mg', routine: 'Morning', status: 'Taken' },
      { med: 'Atorvastatin 20mg', routine: 'Bedtime', status: 'Taken' }
    ]
  },
  {
    id: 'pc2',
    name: 'Chinu Choudhary',
    age: 26,
    compliance: 45,
    status: 'Critical Alert',
    lastLogged: 'Yesterday, 08:00 PM',
    adherenceList: [
      { med: 'Telmisartan 40mg', routine: 'Evening', status: 'Missed' },
      { med: 'Amlodipine 5mg', routine: 'Morning', status: 'Missed' }
    ]
  },
  {
    id: 'pc3',
    name: 'Amit Patel',
    age: 42,
    compliance: 88,
    status: 'Compliant',
    lastLogged: 'Today, 01:00 PM',
    adherenceList: [
      { med: 'Aspirin 75mg', routine: 'Afternoon', status: 'Taken' },
      { med: 'Atorvastatin 40mg', routine: 'Bedtime', status: 'Taken' }
    ]
  },
  {
    id: 'pc4',
    name: 'Sneha Roy',
    age: 34,
    compliance: 75,
    status: 'Warning',
    lastLogged: 'Today, 09:00 AM',
    adherenceList: [
      { med: 'Iron Supplement', routine: 'Morning', status: 'Missed' },
      { med: 'Multivitamin', routine: 'Morning', status: 'Taken' }
    ]
  }
];

export default function MedicationTracker() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const { prescriptions, patients } = useDoctor();
  const { user } = useAuth();

  const getPatientId = () => {
    if (!user || !user.phone) return 'p1';
    const normUserPhone = normalizePhone(user.phone);
    const matched = patients.find(p => normalizePhone(p.phone) === normUserPhone);
    return matched ? matched.id : 'p1';
  };
  const loggedPatientId = getPatientId();

  // Dynamically compute meds array from prescriptions
  const computedMeds = useMemo(() => {
    const list = [];
    const userRxs = prescriptions.filter(p => p.patientId === loggedPatientId);
    
    userRxs.forEach(rx => {
      rx.details.forEach((med, idx) => {
        const durationDays = parseInt(med.duration) || 5;
        const prescriptionDate = new Date(rx.date);
        const expiryDate = new Date(prescriptionDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const isActive = expiryDate >= new Date();
        
        let routine = 'morning';
        const dosageLower = String(med.dosage || '').toLowerCase();
        if (dosageLower.includes('evening') || dosageLower.includes('night') || dosageLower.includes('bedtime') || dosageLower.includes('dinner')) {
          routine = 'evening';
        } else if (dosageLower.includes('afternoon') || dosageLower.includes('lunch')) {
          routine = 'afternoon';
        }

        list.push({
          id: `${rx.id}-${idx}`,
          name: med.name,
          type: med.name.toLowerCase().includes('cream') ? 'Cream' : 'Tablet',
          category: rx.diagnosis || 'General',
          routine: routine,
          time: routine === 'morning' ? '08:00 AM' : (routine === 'afternoon' ? '01:00 PM' : '08:00 PM'),
          instructions: med.dosage,
          status: isActive ? 'pending' : 'expired',
          totalPills: durationDays * (dosageLower.includes('twice') ? 2 : 1),
          remainingPills: isActive ? durationDays : 0,
          date: rx.date,
          duration: durationDays,
          isActive: isActive
        });
      });
    });
    
    return list;
  }, [prescriptions, loggedPatientId, patients]);

  const [localMeds, setLocalMeds] = useState([]);
  
  useEffect(() => {
    setLocalMeds(computedMeds);
  }, [computedMeds]);

  const [complianceList, setComplianceList] = useState(DOCTOR_COMPLIANCE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | morning/compliant | afternoon/warning | evening/critical
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  const toggleStatus = (id, newStatus) => {
    setLocalMeds(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const triggerRefill = (id, name) => {
    Alert.alert(
      'Request Pharmacy Refill',
      `Submit order for ${name} 30-day refill?`,
      [
        { text: 'Cancel' },
        {
          text: 'Refill Now',
          onPress: () => {
            setLocalMeds(prev => prev.map(m => m.id === id ? { ...m, remainingPills: m.totalPills } : m));
            Alert.alert('Refill Ordered', 'Your pharmacy order has been submitted successfully.');
          }
        }
      ]
    );
  };

  const togglePatientRow = (id) => {
    setExpandedPatientId(expandedPatientId === id ? null : id);
  };

  // Calculations for Patient View (only active ones for today's timeline)
  const filteredMeds = useMemo(() => {
    return localMeds.filter(item => {
      if (!item.isActive) return false; // hide expired ones from today's timeline
      const matchesType = filterType === 'all' || item.routine === filterType;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [localMeds, filterType, searchQuery]);

  // Calculations for Doctor View
  const filteredCompliance = useMemo(() => {
    return complianceList.filter(item => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'compliant' && item.status === 'Compliant') ||
        (filterType === 'warning' && item.status === 'Warning') ||
        (filterType === 'critical' && item.status === 'Critical Alert');
        
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [complianceList, filterType, searchQuery]);

  const stats = useMemo(() => {
    if (isDoctor) {
      return {
        total: complianceList.length,
        compliant: complianceList.filter(c => c.status === 'Compliant').length,
        warning: complianceList.filter(c => c.status === 'Warning').length,
        critical: complianceList.filter(c => c.status === 'Critical Alert').length,
      };
    }
    const activeOnly = localMeds.filter(m => m.isActive);
    return {
      total: activeOnly.length,
      morning: activeOnly.filter(a => a.routine === 'morning').length,
      afternoon: activeOnly.filter(a => a.routine === 'afternoon').length,
      evening: activeOnly.filter(a => a.routine === 'evening').length,
    };
  }, [localMeds, complianceList, isDoctor]);

  const getAdherenceColor = (compliance) => {
    if (compliance >= 85) return C.green;
    if (compliance >= 70) return C.amber;
    return C.red;
  };

  const getAdherenceBg = (compliance) => {
    if (compliance >= 85) return C.greenSoft;
    if (compliance >= 70) return C.amberSoft;
    return C.redSoft;
  };

  // Render Doctor Layout
  if (isDoctor) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* ── Page Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Adherence Monitoring</Text>
            <Text style={styles.headerSub}>
              {stats.total} patients monitored • {stats.compliant} compliant • {stats.critical} critical alerts
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Compliance Alert', 'Sending alerts reminder to non-compliant patient cohorts.')}
            style={[styles.addBtn, { backgroundColor: C.red }]}
            activeOpacity={0.85}
          >
            <AlertTriangle size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Remind Criticals</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4 Stat Cards Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
              <Users size={18} color={C.purple} />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>PATIENTS</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.greenSoft }]}>
              <CheckCircle size={18} color={C.green} />
            </View>
            <Text style={styles.statValue}>{stats.compliant}</Text>
            <Text style={styles.statLabel}>COMPLIANT (&gt;85%)</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.amberSoft }]}>
              <AlertTriangle size={18} color={C.amber} />
            </View>
            <Text style={styles.statValue}>{stats.warning}</Text>
            <Text style={styles.statLabel}>WARNINGS (70-85%)</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.redSoft }]}>
              <XCircle size={18} color={C.red} />
            </View>
            <Text style={styles.statValue}>{stats.critical}</Text>
            <Text style={styles.statLabel}>CRITICALS (&lt;70%)</Text>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Search size={18} color={C.textLight} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search patients compliance logs..."
            placeholderTextColor={C.textLight}
            style={styles.searchInput}
          />
        </View>

        {/* ── Filter By Type Container ── */}
        <View style={styles.filtersPanel}>
          <Text style={styles.filterTitle}>FILTER BY ADHERENCE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setFilterType('all')}
              style={[styles.pill, filterType === 'all' && styles.pillActive]}
            >
              <List size={12} color={filterType === 'all' ? '#FFF' : C.textMid} />
              <Text style={[styles.pillText, filterType === 'all' && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType('compliant')}
              style={[styles.pill, filterType === 'compliant' && styles.pillActiveGreen]}
            >
              <CheckCircle size={12} color={filterType === 'compliant' ? '#FFF' : C.green} />
              <Text style={[styles.pillText, filterType === 'compliant' && styles.pillTextActiveGreen]}>Compliant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType('warning')}
              style={[styles.pill, filterType === 'warning' && styles.pillActiveAmber]}
            >
              <AlertTriangle size={12} color={filterType === 'warning' ? '#FFF' : C.amber} />
              <Text style={[styles.pillText, filterType === 'warning' && styles.pillTextActiveAmber]}>Warning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType('critical')}
              style={[styles.pill, filterType === 'critical' && styles.pillActiveRed]}
            >
              <XCircle size={12} color={filterType === 'critical' ? '#FFF' : C.red} />
              <Text style={[styles.pillText, filterType === 'critical' && styles.pillTextActiveRed]}>Critical Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Patient Adherence List ── */}
        <View style={styles.compliancePanel}>
          <Text style={styles.sectionHeaderTitle}>Monitored Adherence Index</Text>
          
          <View style={styles.complianceList}>
            {filteredCompliance.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={32} color={C.textLight} />
                <Text style={styles.emptyTitle}>No matching patients</Text>
              </View>
            ) : (
              filteredCompliance.map(pat => {
                const isExpanded = expandedPatientId === pat.id;
                const adColor = getAdherenceColor(pat.compliance);
                const adBg = getAdherenceBg(pat.compliance);
                return (
                  <View key={pat.id} style={styles.complianceCardOuter}>
                    <TouchableOpacity
                      onPress={() => togglePatientRow(pat.id)}
                      style={styles.complianceRowHeader}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 2 }}>
                        <Text style={styles.patientNameTxt}>{pat.name}</Text>
                        <Text style={styles.patientMetaTxt}>Age: {pat.age} · Last Log: {pat.lastLogged}</Text>
                      </View>

                      {/* Compliance Score Indicator */}
                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <View style={[styles.scoreBadge, { backgroundColor: adBg }]}>
                          <Text style={[styles.scoreBadgeTxt, { color: adColor }]}>{pat.compliance}% Adherence</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        <View style={[styles.statusMiniBadge, { backgroundColor: adBg }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: adColor }}>{pat.status}</Text>
                        </View>
                        {isExpanded ? <ChevronUp size={14} color={C.textLight} /> : <ChevronDown size={14} color={C.textLight} />}
                      </View>
                    </TouchableOpacity>

                    {/* Adherence log breakdown */}
                    {isExpanded && (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ type: 'timing', duration: 250 }}
                        style={styles.adherenceExpandPanel}
                      >
                        <Text style={styles.expandLabel}>DAILY COMPLIANCE DOSES LOG</Text>
                        {pat.adherenceList.map((item, idx) => (
                          <View key={idx} style={styles.expandedLogItem}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Clock size={11} color={C.textLight} />
                              <Text style={styles.expLogMed}>{item.med} ({item.routine})</Text>
                            </View>
                            <View style={[styles.logStatusLabel, { backgroundColor: item.status === 'Taken' ? C.greenSoft : C.redSoft }]}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: item.status === 'Taken' ? C.green : C.red }}>{item.status}</Text>
                            </View>
                          </View>
                        ))}

                        {pat.compliance < 75 && (
                          <TouchableOpacity
                            onPress={() => Alert.alert('Compliance Alert Sent', `Sent direct reminder SMS alert to ${pat.name}.`)}
                            style={styles.sendReminderBtn}
                          >
                            <Text style={styles.sendReminderBtnTxt}>Send SMS Remind Alert</Text>
                          </TouchableOpacity>
                        )}
                      </MotiView>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    );
  }

  // Render Patient Layout
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Medication Tracker</Text>
          <Text style={styles.headerSub}>
            {stats.total} total meds • {stats.morning} morning • {stats.afternoon} afternoon
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>Add Med</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Stat Cards Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            <Pill size={18} color={C.purple} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL MEDS</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.amberSoft }]}>
            <Sunrise size={18} color={C.amber} />
          </View>
          <Text style={styles.statValue}>{stats.morning}</Text>
          <Text style={styles.statLabel}>MORNING</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Sun size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.afternoon}</Text>
          <Text style={styles.statLabel}>AFTERNOON</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.indigoSoft }]}>
            <Moon size={18} color={C.indigo} />
          </View>
          <Text style={styles.statValue}>{stats.evening}</Text>
          <Text style={styles.statLabel}>EVENING</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={C.textLight} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by medicine name or category..."
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>FILTER BY ROUTINE SLOT</Text>
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
            onPress={() => setFilterType('morning')}
            style={[styles.pill, filterType === 'morning' && styles.pillActiveAmber]}
          >
            <Sunrise size={12} color={filterType === 'morning' ? '#FFF' : C.amber} />
            <Text style={[styles.pillText, filterType === 'morning' && styles.pillTextActiveAmber]}>Morning</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'morning' ? C.amberSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'morning' ? C.amber : C.textMid }}>{stats.morning}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('afternoon')}
            style={[styles.pill, filterType === 'afternoon' && styles.pillActiveBlue]}
          >
            <Sun size={12} color={filterType === 'afternoon' ? '#FFF' : C.blue} />
            <Text style={[styles.pillText, filterType === 'afternoon' && styles.pillTextActiveBlue]}>Afternoon</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'afternoon' ? C.blueSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'afternoon' ? C.blue : C.textMid }}>{stats.afternoon}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('evening')}
            style={[styles.pill, filterType === 'evening' && styles.pillActiveIndigo]}
          >
            <Moon size={12} color={filterType === 'evening' ? '#FFF' : C.indigo} />
            <Text style={[styles.pillText, filterType === 'evening' && styles.pillTextActiveIndigo]}>Evening</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'evening' ? C.indigoSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'evening' ? C.indigo : C.textMid }}>{stats.evening}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.splitLayout}>
        <View style={styles.leftColumn}>
          <Text style={styles.sectionHeaderTitle}>{"Today's Dosages Timeline"}</Text>
          <View style={styles.timelineContainer}>
            {filteredMeds.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Pill size={32} color={C.textLight} />
                <Text style={styles.emptyTitle}>No dosages mapped</Text>
              </View>
            ) : (
              filteredMeds.map((item, idx) => {
                const isTaken = item.status === 'taken';
                const isMissed = item.status === 'missed';
                return (
                  <View key={item.id} style={styles.timelineNode}>
                    <View style={styles.timeSide}>
                      <Clock size={12} color={C.textLight} style={{ marginRight: 4 }} />
                      <Text style={styles.timeLabelText}>{item.time}</Text>
                    </View>
                    <View style={styles.lineConnector}>
                      <View style={[
                        styles.bulletDot,
                        isTaken && { backgroundColor: C.green, borderColor: C.green },
                        isMissed && { backgroundColor: C.red, borderColor: C.red }
                      ]} />
                      {idx < filteredMeds.length - 1 && <View style={styles.verticalLine} />}
                    </View>
                    <View style={styles.medCardContent}>
                      <View style={styles.medCardHeader}>
                        <View>
                          <Text style={styles.medName}>{item.name}</Text>
                          <View style={styles.medDetailsRow}>
                            <Text style={styles.medTag}>{item.type}</Text>
                            <Text style={styles.categoryLabel}>• {item.category}</Text>
                          </View>
                        </View>
                        <View style={styles.toggleRow}>
                          <TouchableOpacity
                            onPress={() => toggleStatus(item.id, isTaken ? 'pending' : 'taken')}
                            style={[styles.logBtn, isTaken && { backgroundColor: C.greenSoft, borderColor: C.green }]}
                          >
                            <CheckCircle size={14} color={isTaken ? C.green : C.textLight} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleStatus(item.id, isMissed ? 'pending' : 'missed')}
                            style={[styles.logBtn, isMissed && { backgroundColor: C.redSoft, borderColor: C.red }]}
                          >
                            <XCircle size={14} color={isMissed ? C.red : C.textLight} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.medInstructions}>Instructions: {item.instructions}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.sectionHeaderTitle}>Refill Alerts & Inventory</Text>
          <View style={styles.inventoryPanel}>
            {localMeds.filter(m => m.isActive).length === 0 ? (
              <View style={styles.emptyContainerSmall}>
                <Pill size={16} color={C.textLight} />
                <Text style={styles.emptyTitleSmall}>No active medications</Text>
              </View>
            ) : (
              localMeds.filter(m => m.isActive).map((item) => {
                const refillPct = (item.remainingPills / item.totalPills) * 100;
                const isLow = item.remainingPills <= 5 || refillPct <= 20;
                return (
                  <View key={item.id} style={styles.refillRow}>
                    <View style={styles.refillHeader}>
                      <View>
                        <Text style={styles.refillMedName}>{item.name}</Text>
                        <Text style={styles.refillCountTxt}>{item.remainingPills} of {item.totalPills} pills left</Text>
                      </View>
                      {isLow && (
                        <View style={styles.warningBadge}>
                          <AlertTriangle size={11} color={C.red} />
                          <Text style={styles.warningBadgeTxt}>LOW STOCK</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.barOuter}>
                      <View style={[
                        styles.barInner,
                        { width: `${refillPct}%` },
                        isLow ? { backgroundColor: C.red } : refillPct <= 50 ? { backgroundColor: C.amber } : { backgroundColor: C.green }
                      ]} />
                    </View>
                    {isLow && (
                      <TouchableOpacity
                        onPress={() => triggerRefill(item.id, item.name)}
                        style={styles.requestRefillBtn}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={12} color={C.blue} />
                        <Text style={styles.requestRefillBtnTxt}>Order Refill Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Old Medications & History</Text>
          <View style={styles.inventoryPanel}>
            {localMeds.filter(m => !m.isActive).length === 0 ? (
              <View style={styles.emptyContainerSmall}>
                <Clock size={16} color={C.textLight} />
                <Text style={styles.emptyTitleSmall}>No medication history</Text>
              </View>
            ) : (
              localMeds.filter(m => !m.isActive).map((item) => (
                <View key={item.id} style={styles.refillRow}>
                  <View style={styles.refillHeader}>
                    <View>
                      <Text style={[styles.refillMedName, { color: C.textLight, textDecorationLine: 'line-through' }]}>
                        {item.name}
                      </Text>
                      <Text style={styles.refillCountTxt}>
                        Prescribed: {item.date} • Duration: {item.duration} days
                      </Text>
                    </View>
                    <View style={[styles.warningBadge, { backgroundColor: C.border, borderColor: C.textLight }]}>
                      <Text style={[styles.warningBadgeTxt, { color: C.textLight }]}>ARCHIVED</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
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
  pillActiveAmber: {
    backgroundColor: C.amber,
    borderColor: C.amber,
  },
  pillTextActiveAmber: {
    color: '#FFF',
  },
  pillActiveBlue: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  pillTextActiveBlue: {
    color: '#FFF',
  },
  pillActiveIndigo: {
    backgroundColor: C.indigo,
    borderColor: C.indigo,
  },
  pillTextActiveIndigo: {
    color: '#FFF',
  },
  pillActiveGreen: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  pillTextActiveGreen: {
    color: '#FFF',
  },
  pillActiveRed: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  pillTextActiveRed: {
    color: '#FFF',
  },
  splitLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  leftColumn: {
    flex: 1.6,
  },
  rightColumn: {
    flex: 1.4,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
    marginBottom: 16,
  },
  timelineContainer: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },
  timelineNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 90,
  },
  timeSide: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    paddingTop: 8,
  },
  timeLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
  },
  lineConnector: {
    alignItems: 'center',
    width: 24,
    height: '100%',
  },
  bulletDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.card,
    borderWidth: 2.5,
    borderColor: C.textLight,
    marginTop: 10,
    zIndex: 10,
  },
  verticalLine: {
    width: 2,
    position: 'absolute',
    top: 20,
    bottom: -10,
    backgroundColor: C.border,
    zIndex: 1,
  },
  medCardContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 12,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medName: {
    fontSize: 13,
    fontWeight: '850',
    color: C.text,
  },
  medDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  medTag: {
    fontSize: 10,
    fontWeight: '700',
    color: C.blue,
    backgroundColor: C.blueSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  logBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInstructions: {
    fontSize: 11,
    color: C.textMid,
    fontWeight: '550',
    marginTop: 8,
  },
  inventoryPanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 16,
  },
  refillRow: {
    borderBottomWidth: 0.5,
    borderColor: C.border,
    paddingBottom: 14,
  },
  refillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refillMedName: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  refillCountTxt: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.redSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warningBadgeTxt: {
    fontSize: 9,
    fontWeight: '900',
    color: C.red,
  },
  barOuter: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    width: '100%',
    marginTop: 10,
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    borderRadius: 3,
  },
  requestRefillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: C.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  requestRefillBtnTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: C.blue,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: C.textMid,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 10,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyContainerSmall: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitleSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
    marginTop: 4,
  },
  compliancePanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  complianceList: {
    gap: 12,
    marginTop: 10,
  },
  complianceCardOuter: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  complianceRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  patientNameTxt: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  patientMetaTxt: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusMiniBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adherenceExpandPanel: {
    padding: 14,
    backgroundColor: '#FAFBFD',
    borderTopWidth: 0.5,
    borderColor: C.border,
  },
  expandLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  expandedLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  expLogMed: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  logStatusLabel: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sendReminderBtn: {
    backgroundColor: C.redSoft,
    borderColor: C.red,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  sendReminderBtnTxt: {
    color: C.red,
    fontSize: 11,
    fontWeight: '850',
  },
});
