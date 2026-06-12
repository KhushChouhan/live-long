import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import {
  Layers,
  Video,
  MapPin,
  CheckCircle,
  Search,
  Plus,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  ExternalLink,
  Filter,
  Trash2,
  User,
  Heart
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

// ── Patient Appointments Data ──
const PATIENT_APPOINTMENTS = [
  {
    id: '1',
    doctorName: 'Dr. Catherine L.',
    specialty: 'Senior Cardiologist',
    date: '2026-06-01',
    time: '10:00 AM - 10:30 AM',
    type: 'video',
    status: 'Scheduled',
    complaint: 'Routine chest tightness checkup',
    zoomLink: 'https://zoom.us/j/9876543210',
    fee: '₹1,500',
    location: 'Online (Zoom Video Meeting)'
  },
  {
    id: '2',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Dermatologist',
    date: '2026-06-03',
    time: '02:00 PM - 02:45 PM',
    type: 'physical',
    status: 'Completed',
    complaint: 'Skin allergy and redness on forearms',
    fee: '₹1,200',
    location: 'LiveLong Clinic, Suite 402, New Delhi'
  },
  {
    id: '3',
    doctorName: 'Dr. Amit Patel',
    specialty: 'Dental Surgeon',
    date: '2026-06-05',
    time: '11:30 AM - 12:15 PM',
    type: 'physical',
    status: 'Scheduled',
    complaint: 'Scaling and root canal assessment',
    fee: '₹800',
    location: 'LiveLong Dental Care Wing, Sector 12'
  },
  {
    id: '4',
    doctorName: 'Dr. Emma Watson',
    specialty: 'Clinical Psychologist',
    date: '2026-06-08',
    time: '03:00 PM - 04:00 PM',
    type: 'video',
    status: 'Pending',
    complaint: 'Anxiety management follow-up',
    zoomLink: 'https://zoom.us/j/1234567890',
    fee: '₹2,000',
    location: 'Online (Zoom Session)'
  },
  {
    id: '5',
    doctorName: 'Dr. James Cole',
    specialty: 'Ophthalmologist',
    date: '2026-06-12',
    time: '09:00 AM - 09:30 AM',
    type: 'physical',
    status: 'Cancelled',
    complaint: 'Blurry vision and headache during reading',
    fee: '₹1,000',
    location: 'LiveLong Clinic, Cabin A-2, Mumbai'
  }
];

// ── Doctor Schedules Data (Booked by Patients) ──
const DOCTOR_APPOINTMENTS = [
  {
    id: 'd1',
    patientName: 'Karan',
    age: 28,
    gender: 'Male',
    date: '2026-06-01',
    time: '10:00 AM - 10:30 AM',
    type: 'video',
    status: 'Scheduled',
    complaint: 'Chest pain and rapid heartbeat episodes',
    zoomLink: 'https://zoom.us/j/9876543210',
    fee: '₹1,500',
    location: 'Online (Jitsi Telehealth Room)'
  },
  {
    id: 'd2',
    patientName: 'Sonia',
    age: 27,
    gender: 'Female',
    date: '2026-06-01',
    time: '11:00 AM - 11:30 AM',
    type: 'video',
    status: 'Scheduled',
    complaint: 'Hypertension assessment follow-up',
    zoomLink: 'https://zoom.us/j/9876543210',
    fee: '₹1,500',
    location: 'Online (Jitsi Telehealth Room)'
  },
  {
    id: 'd3',
    patientName: 'Amit Patel',
    age: 42,
    gender: 'Male',
    date: '2026-06-03',
    time: '12:00 PM - 12:45 PM',
    type: 'physical',
    status: 'Completed',
    complaint: 'Ischemic post-op rehab verification',
    fee: '₹1,500',
    location: 'OPD Ward-4, LiveLong Cardiothoracic Wing'
  },
  {
    id: 'd4',
    patientName: 'Sneha Roy',
    age: 34,
    gender: 'Female',
    date: '2026-06-05',
    time: '04:00 PM - 04:30 PM',
    type: 'video',
    status: 'Pending',
    complaint: 'Echocardiogram results analysis review',
    zoomLink: 'https://zoom.us/j/1223334444',
    fee: '₹1,500',
    location: 'Online'
  },
  {
    id: 'd5',
    patientName: 'Vikram Singh',
    age: 51,
    gender: 'Male',
    date: '2026-06-08',
    time: '09:30 AM - 10:15 AM',
    type: 'physical',
    status: 'Scheduled',
    complaint: 'Pacemaker threshold test evaluation',
    fee: '₹1,500',
    location: 'OPD Ward-4, LiveLong Cardiothoracic Wing'
  }
];

export default function AppointmentsCalendar() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  // Load appropriate data list based on role
  const [appointments, setAppointments] = useState(
    isDoctor ? DOCTOR_APPOINTMENTS : PATIENT_APPOINTMENTS
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | video | physical
  const [viewMode, setViewMode] = useState('month'); // month | week | day
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // June 1st, 2026
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Month navigation helpers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    }
  };

  // Memoized filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesType = filterType === 'all' || apt.type === filterType;
      
      const q = searchQuery.toLowerCase();
      const textToMatch = isDoctor
        ? `${apt.patientName} ${apt.complaint}`
        : `${apt.doctorName} ${apt.specialty} ${apt.complaint}`;
        
      const matchesSearch = textToMatch.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [appointments, filterType, searchQuery, isDoctor]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      video: appointments.filter(a => a.type === 'video').length,
      physical: appointments.filter(a => a.type === 'physical').length,
      completed: appointments.filter(a => a.status === 'Completed').length,
    };
  }, [appointments]);

  // Calendar rendering helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayIndex = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const calendarGrid = useMemo(() => {
    const tempGrid = [];
    const prevMonthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() - 1);
    for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
      tempGrid.push({
        day: prevMonthDays - i,
        monthOffset: -1,
        dateString: `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const padDay = String(i).padStart(2, '0');
      const padMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      tempGrid.push({
        day: i,
        monthOffset: 0,
        dateString: `${currentDate.getFullYear()}-${padMonth}-${padDay}`
      });
    }
    const remainingSlots = 42 - tempGrid.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const padDay = String(i).padStart(2, '0');
      const padMonth = String(currentDate.getMonth() + 2).padStart(2, '0');
      tempGrid.push({
        day: i,
        monthOffset: 1,
        dateString: `${currentDate.getFullYear()}-${padMonth}-${padDay}`
      });
    }
    return tempGrid;
  }, [currentDate, daysInMonth, adjustedFirstDayIndex]);

  const openDetails = (appt) => {
    setSelectedAppointment(appt);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return C.green;
      case 'Pending': return C.amber;
      case 'Cancelled': return C.red;
      default: return C.blue;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Completed': return C.greenSoft;
      case 'Pending': return C.amberSoft;
      case 'Cancelled': return C.redSoft;
      default: return C.blueSoft;
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isDoctor ? 'Doctor Consultations' : 'My Appointments'}
          </Text>
          <Text style={styles.headerSub}>
            {stats.total} total • {stats.video} video • {stats.physical} in-person
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, isDoctor && { backgroundColor: C.teal }]}
          activeOpacity={0.85}
          onPress={() => {
            if (isDoctor) {
              Alert.alert('Configuration Settings', 'Directing to availability schedule settings...');
            } else {
              Alert.alert('Book Appointment', 'Directing to booking clinic panels...');
            }
          }}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.bookBtnText}>{isDoctor ? 'Set Availability' : 'Book'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat Cards Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            <Layers size={18} color={C.purple} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{isDoctor ? 'CONSULTS' : 'TOTAL'}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Video size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.video}</Text>
          <Text style={styles.statLabel}>TELE-VIDEO</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.tealSoft }]}>
            <MapPin size={18} color={C.teal} />
          </View>
          <Text style={styles.statValue}>{stats.physical}</Text>
          <Text style={styles.statLabel}>IN-CLINIC</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.greenSoft }]}>
            <CheckCircle size={18} color={C.green} />
          </View>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <Search size={18} color={C.textLight} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isDoctor ? "Search by patient name or complaint..." : "Search by doctor or complaint..."}
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <X size={16} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter By Type Container ── */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>FILTER BY TYPE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setFilterType('all')}
            style={[styles.pill, filterType === 'all' && { backgroundColor: C.purple, borderColor: C.purple }]}
          >
            <List size={13} color={filterType === 'all' ? '#FFF' : C.textMid} />
            <Text style={[styles.pillText, filterType === 'all' && { color: '#FFF' }]}>All</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'all' ? C.purpleSoft : '#F1F5F9' }]}>
              <Text style={[styles.badgeText, { color: filterType === 'all' ? C.purple : C.textMid }]}>{stats.total}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('video')}
            style={[styles.pill, filterType === 'video' && { backgroundColor: C.blue, borderColor: C.blue }]}
          >
            <Video size={13} color={filterType === 'video' ? '#FFF' : C.blue} />
            <Text style={[styles.pillText, filterType === 'video' && { color: '#FFF' }]}>Video</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'video' ? C.blueSoft : '#F1F5F9' }]}>
              <Text style={[styles.badgeText, { color: filterType === 'video' ? C.blue : C.textMid }]}>{stats.video}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('physical')}
            style={[styles.pill, filterType === 'physical' && { backgroundColor: C.teal, borderColor: C.teal }]}
          >
            <MapPin size={13} color={filterType === 'physical' ? '#FFF' : C.teal} />
            <Text style={[styles.pillText, filterType === 'physical' && { color: '#FFF' }]}>Physical</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'physical' ? C.tealSoft : '#F1F5F9' }]}>
              <Text style={[styles.badgeText, { color: filterType === 'physical' ? C.teal : C.textMid }]}>{stats.physical}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Interactive Calendar Header ── */}
      <View style={styles.calendarControlRow}>
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
            <ChevronLeft size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthName}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <ChevronRight size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggleContainer}>
          {['month', 'week', 'day'].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[styles.viewTab, viewMode === mode && styles.viewTabActive]}
            >
              <Text style={[styles.viewTabText, viewMode === mode && styles.viewTabActiveText]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Calendar Grid Panel ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.calendarPanel}
      >
        {viewMode === 'month' && (
          <View>
            <View style={styles.dayOfWeekHeader}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarGrid.map((slot, index) => {
                const isSelectedMonth = slot.monthOffset === 0;
                const dayEvents = filteredAppointments.filter(apt => apt.date === slot.dateString);
                
                return (
                  <View
                    key={index}
                    style={[styles.gridSlot, !isSelectedMonth && styles.gridSlotInactive]}
                  >
                    <Text style={[
                      styles.dayNumberText,
                      !isSelectedMonth && styles.dayNumberTextInactive,
                      dayEvents.length > 0 && styles.dayNumberHasEvents
                    ]}>
                      {slot.day}
                    </Text>

                    <ScrollView style={{ flex: 1, marginTop: 4 }} showsVerticalScrollIndicator={false}>
                      {dayEvents.map(evt => (
                        <TouchableOpacity
                          key={evt.id}
                          onPress={() => openDetails(evt)}
                          style={[
                            styles.eventPill,
                            { backgroundColor: getStatusBg(evt.status), borderLeftColor: evt.type === 'video' ? C.blue : C.teal }
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text numberOfLines={1} style={[styles.eventPillText, { color: getStatusColor(evt.status) }]}>
                            {isDoctor ? evt.patientName : evt.doctorName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {viewMode === 'week' && (
          <View style={{ padding: 10 }}>
            <Text style={styles.viewModeTitle}>Weekly Timeline View</Text>
            {filteredAppointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No appointments scheduled for this week.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredAppointments.slice(0, 3).map((appt) => (
                  <TouchableOpacity
                    key={appt.id}
                    onPress={() => openDetails(appt)}
                    style={styles.apptCardRow}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.apptAccentBar, { backgroundColor: appt.type === 'video' ? C.blue : C.teal }]} />
                    <View style={styles.apptDetailsMain}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.apptDoctorName}>
                          {isDoctor ? `Patient: ${appt.patientName}` : `Doctor: ${appt.doctorName}`}
                        </Text>
                        <View style={[styles.statusBadgeText, { backgroundColor: getStatusBg(appt.status) }]}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: getStatusColor(appt.status) }}>{appt.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.apptSpec}>{isDoctor ? `Age/Gender: ${appt.age}/${appt.gender}` : appt.specialty}</Text>
                      <View style={styles.apptTimeRow}>
                        <Clock size={12} color={C.textLight} />
                        <Text style={styles.apptTimeText}>{appt.date} · {appt.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {viewMode === 'day' && (
          <View style={{ padding: 10 }}>
            <Text style={styles.viewModeTitle}>Daily Consultations ({currentDate.toLocaleDateString()})</Text>
            {filteredAppointments.filter(a => a.date === '2026-06-01').length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredAppointments
                  .filter(a => a.date === '2026-06-01')
                  .map((appt) => (
                    <TouchableOpacity
                      key={appt.id}
                      onPress={() => openDetails(appt)}
                      style={styles.apptCardRow}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.apptAccentBar, { backgroundColor: appt.type === 'video' ? C.blue : C.teal }]} />
                      <View style={styles.apptDetailsMain}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.apptDoctorName}>
                            {isDoctor ? `Patient: ${appt.patientName}` : `Doctor: ${appt.doctorName}`}
                          </Text>
                          <View style={[styles.statusBadgeText, { backgroundColor: getStatusBg(appt.status) }]}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: getStatusColor(appt.status) }}>{appt.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.apptSpec}>{isDoctor ? `Reason: ${appt.complaint}` : appt.specialty}</Text>
                        <View style={styles.apptTimeRow}>
                          <Clock size={12} color={C.textLight} />
                          <Text style={styles.apptTimeText}>{appt.time}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        )}
      </MotiView>

      {/* ── Appointment Details Modal ── */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsModalOpen(false)} />
          {selectedAppointment && (
            <MotiView
              from={{ opacity: 0, translateY: 40, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.modalTypeIconCircle, { backgroundColor: selectedAppointment.type === 'video' ? C.blueSoft : C.tealSoft }]}>
                    {selectedAppointment.type === 'video' ? (
                      <Video size={18} color={C.blue} />
                    ) : (
                      <MapPin size={18} color={C.teal} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>{isDoctor ? 'Clinical Consultation Details' : 'Appointment Details'}</Text>
                    <Text style={styles.modalSubtitle}>{selectedAppointment.type === 'video' ? 'Telehealth Call' : 'In-Person Consultation'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color={C.textMid} />
                </TouchableOpacity>
              </View>

              {/* Body info */}
              <ScrollView style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <View>
                    <Text style={styles.detailDocName}>
                      {isDoctor ? selectedAppointment.patientName : selectedAppointment.doctorName}
                    </Text>
                    <Text style={styles.detailDocSpec}>
                      {isDoctor
                        ? `Age: ${selectedAppointment.age} · Gender: ${selectedAppointment.gender}`
                        : selectedAppointment.specialty}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedAppointment.status), alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10 }]}>
                    <Text style={{ fontSize: 11, fontWeight: '850', color: getStatusColor(selectedAppointment.status) }}>
                      {selectedAppointment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>DATE & TIME</Text>
                  <Text style={styles.infoValue}>{selectedAppointment.date} at {selectedAppointment.time}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>{isDoctor ? 'CLINICAL LOCATION' : 'CLINIC LOCATION'}</Text>
                  <Text style={styles.infoValue}>{selectedAppointment.location}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>{isDoctor ? "PATIENT'S CHIEF COMPLAINT" : 'CHIEF COMPLAINT'}</Text>
                  <Text style={styles.infoValue}>{selectedAppointment.complaint}</Text>
                </View>

                {/* Video Consult Start Call Action Button */}
                {selectedAppointment.type === 'video' && selectedAppointment.status !== 'Cancelled' && (
                  <View style={styles.zoomCallBlock}>
                    <Video size={18} color={C.blue} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.zoomTitle}>{isDoctor ? 'Start Telehealth Consult' : 'Zoom Telehealth Meeting'}</Text>
                      <Text style={styles.zoomSubtitle}>
                        {isDoctor ? 'Start consultation room call with patient.' : 'Click "Join" to enter video consulting.'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(isDoctor ? 'Calling Patient' : 'Redirecting', isDoctor ? 'Initializing video calling pipeline...' : 'Opening consultation room...');
                        setIsModalOpen(false);
                      }}
                      style={styles.joinVideoBtn}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{isDoctor ? 'Call' : 'Join'}</Text>
                      <ExternalLink size={12} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Actions Footer */}
              <View style={styles.modalFooter}>
                {isDoctor ? (
                  /* Doctor Actions */
                  <>
                    <TouchableOpacity
                      style={styles.prescriptionBtn}
                      onPress={() => {
                        Alert.alert('Clinical Portal', 'Navigating to prescription forms...');
                        setIsModalOpen(false);
                      }}
                    >
                      <Heart size={14} color={C.blue} />
                      <Text style={styles.prescriptionBtnText}>Write Rx</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalPrimaryCloseBtn} onPress={() => setIsModalOpen(false)}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Close</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Patient Actions */
                  <>
                    {selectedAppointment.status !== 'Cancelled' && selectedAppointment.status !== 'Completed' && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
                            { text: 'No' },
                            {
                              text: 'Yes, Cancel',
                              style: 'destructive',
                              onPress: () => {
                                setAppointments(appointments.map(a => a.id === selectedAppointment.id ? { ...a, status: 'Cancelled' } : a));
                                setIsModalOpen(false);
                              }
                            }
                          ]);
                        }}
                      >
                        <Trash2 size={14} color={C.red} />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.modalPrimaryCloseBtn} onPress={() => setIsModalOpen(false)}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </MotiView>
          )}
        </View>
      </Modal>
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
  bookBtn: {
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
  bookBtnText: {
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
  filtersContainer: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  calendarControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    minWidth: 120,
    textAlign: 'center',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4E9F2',
    padding: 3,
    borderRadius: 10,
  },
  viewTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewTabActive: {
    backgroundColor: C.card,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  viewTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  viewTabActiveText: {
    color: C.text,
    fontWeight: '800',
  },
  calendarPanel: {
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
  dayOfWeekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridSlot: {
    width: `${100 / 7}%`,
    height: 90,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    padding: 6,
  },
  gridSlotInactive: {
    backgroundColor: '#FAFBFD',
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  dayNumberTextInactive: {
    color: C.textLight,
  },
  dayNumberHasEvents: {
    backgroundColor: C.purpleSoft,
    color: C.purple,
    borderRadius: 10,
  },
  eventPill: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  eventPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  viewModeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
  },
  apptCardRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    height: 72,
  },
  apptAccentBar: {
    width: 4,
    height: '100%',
  },
  apptDetailsMain: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  apptDoctorName: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  apptSpec: {
    fontSize: 10,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  apptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  apptTimeText: {
    fontSize: 9,
    color: C.textMid,
    fontWeight: '600',
  },
  statusBadgeText: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
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
    maxWidth: 480,
    backgroundColor: C.card,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#0D1829',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  modalTypeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDocName: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
  },
  detailDocSpec: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 12,
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    lineHeight: 18,
  },
  zoomCallBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueSoft,
    borderColor: 'rgba(0, 102, 255, 0.15)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    gap: 12,
  },
  zoomTitle: {
    fontSize: 12,
    fontWeight: '850',
    color: C.blue,
  },
  zoomSubtitle: {
    fontSize: 10,
    color: C.textMid,
    marginTop: 2,
  },
  joinVideoBtn: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    color: C.red,
    fontWeight: '800',
  },
  modalPrimaryCloseBtn: {
    backgroundColor: C.textMid,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.blueSoft,
    borderRadius: 8,
  },
  prescriptionBtnText: {
    fontSize: 12,
    color: C.blue,
    fontWeight: '800',
  }
});
