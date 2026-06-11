import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../../store/DoctorContext';
import {
  Users,
  ClipboardList,
  Activity,
  MessageSquare,
  Bell,
  Settings,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Video,
  X,
  UserPlus,
  Plus,
  ChevronRight,
  Camera,
  Check,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:     '#2563EB',   // royal blue
  primaryDark: '#1D4ED8',
  primarySoft: '#EFF6FF',
  success:     '#16A34A',
  successSoft: '#F0FDF4',
  danger:      '#DC2626',
  dangerSoft:  '#FFF1F2',
  warning:     '#D97706',
  warningSoft: '#FFFBEB',
  text:        '#0F172A',
  textMid:     '#475569',
  textLight:   '#94A3B8',
  border:      '#E2E8F0',
  bg:          '#F8FAFC',
  card:        '#FFFFFF',
  sidebar:     '#FFFFFF',
  lavender:    '#EEF2FF',
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <MotiView
      from={{ opacity: 0, translateY: -16 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -16 }}
      style={{
        position: 'absolute', top: Platform.OS === 'android' ? 48 : 56,
        left: 16, right: 16, zIndex: 999,
        backgroundColor: '#1E293B',
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
      }}
    >
      <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: '600', flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={{ marginLeft: 12, padding: 4 }}>
        <X size={14} color="#94A3B8" />
      </TouchableOpacity>
    </MotiView>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function Badge({ label, color = 'green' }) {
  const map = {
    green:  { bg: C.successSoft, text: C.success },
    red:    { bg: C.dangerSoft,  text: C.danger  },
    blue:   { bg: C.primarySoft, text: C.primary },
    orange: { bg: C.warningSoft, text: C.warning },
  };
  const s = map[color] || map.green;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: s.text, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ─── SOLID BUTTON ─────────────────────────────────────────────────────────────
function Btn({ label, onPress, color = 'blue', icon, small = false, outline = false, style }) {
  const bgMap    = { blue: C.primary, green: C.success, red: C.danger, grey: '#64748B' };
  const bg       = outline ? 'transparent' : (bgMap[color] || C.primary);
  const textClr  = outline ? (bgMap[color] || C.primary) : '#FFFFFF';
  const borderClr= bgMap[color] || C.primary;
  const py       = small ? 7 : 10;
  const px       = small ? 14 : 18;
  const fs       = small ? 11 : 13;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[{
        backgroundColor: bg,
        borderRadius: 10,
        paddingVertical: py,
        paddingHorizontal: px,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: outline ? 1.5 : 0,
        borderColor: outline ? borderClr : 'transparent',
        minWidth: small ? 72 : 96,
      }, style]}
    >
      {icon}
      <Text style={{ color: textClr, fontSize: fs, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: '#94A3B8',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      overflow: 'hidden',
    }, style]}>
      {children}
    </View>
  );
}

// ─── CARD HEADER ──────────────────────────────────────────────────────────────
function CardHeader({ title, actionLabel, onAction }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary }}>{actionLabel}</Text>
          <ChevronRight size={14} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── TABLE HEADER ROW ─────────────────────────────────────────────────────────
function TH({ cols }) {
  return (
    <View style={{
      flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10,
      backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      {cols.map((c, i) => (
        <Text key={i} style={[{
          fontSize: 11, fontWeight: '700', color: C.textLight,
          letterSpacing: 0.6, textTransform: 'uppercase',
        }, c.style]}>
          {c.label}
        </Text>
      ))}
    </View>
  );
}

// ─── AVATAR CIRCLE ────────────────────────────────────────────────────────────
function Avatar({ initials, size = 36 }) {
  const colors = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];
  const idx = (initials || 'A').charCodeAt(0) % colors.length;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors[idx],
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>
        {(initials || '?').substring(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

// (SideNavItem removed — sidebar is provided by the app layout)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MedicalClinicPortal() {
  const router = useRouter();
  const { startVideoConsult } = useDoctor();

  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isDesk = isWeb && dims.width > 1080;

  // ── state ──
  const [upcomingQueue, setUpcomingQueue] = useState([
    { id: '48', name: 'Nick Young',      identity: 'S9810125G', gender: 'Male',   status: 'Confirmed'   },
    { id: '49', name: 'Muhammad Imran',  identity: 'T0013384G', gender: 'Male',   status: 'Unconfirmed' },
    { id: '50', name: 'Yi Ting Tan',     identity: 'I123156Z',  gender: 'Female', status: 'Unconfirmed' },
    { id: '51', name: 'Lady Arabella',   identity: 'ZEP00293R', gender: 'Female', status: 'Unconfirmed' },
    { id: '52', name: 'Narberal Gamma',  identity: 'V7N6M1W3X', gender: 'Female', status: 'Unconfirmed' },
  ]);
  const [missedQueue, setMissedQueue] = useState([
    { id: 'm1', name: 'Charlie Wu',   identity: 'S9712387J', gender: 'Male'   },
    { id: 'm2', name: 'Rachel Wong',  identity: 'T0411139Z', gender: 'Female' },
  ]);
  const [checkout, setCheckout] = useState([
    { id: '43', name: 'Huisan Li', identity: 'S8115753R', gender: 'Female',
      meds: [{ n: 'Loperamide 2mg', q: '10 tabs' }, { n: 'Telfast 180mg', q: '20 tabs' }],
      amount: '$37.50', status: 'Paid' },
    { id: '44', name: 'Joe White', identity: 'S9116253R', gender: 'Female',
      meds: [{ n: 'Lacteol Fort', q: '10 tabs' }, { n: 'Leftose 30mg', q: '20 tabs' }],
      amount: '$34.85', status: 'Unpaid' },
  ]);

  const [ericaServing, setEricaServing]     = useState(false);
  const [ericaPatient, setEricaPatient]     = useState('');
  const [searchQ, setSearchQ]               = useState('');
  const [toast, setToast]                   = useState('');
  const [apptModal, setApptModal]           = useState(false);
  const [msgModal, setMsgModal]             = useState(false);
  const [newName, setNewName]               = useState('');
  const [newId, setNewId]                   = useState('');
  const [newGender, setNewGender]           = useState('Male');

  // ── Appointment system state ──
  const TODAY    = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const TOMORROW = new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  const [appointments, setAppointments] = useState([
    { id:'a1', name:'Ramesh Kumar',   date: TODAY,    time:'09:00 AM', type:'Physical',    status:'Active',    identity:'S9001234A', gender:'Male',   note:'' },
    { id:'a2', name:'Priya Sharma',   date: TODAY,    time:'10:30 AM', type:'Video',       status:'Upcoming',  identity:'T0211345B', gender:'Female', note:'' },
    { id:'a3', name:'John Tan',       date: TODAY,    time:'11:00 AM', type:'Physical',    status:'Upcoming',  identity:'S8812340C', gender:'Male',   note:'' },
    { id:'a4', name:'Lisa Wong',      date: TODAY,    time:'12:00 PM', type:'Video',       status:'Upcoming',  identity:'T0312567D', gender:'Female', note:'' },
    { id:'a5', name:'David Lim',      date: TODAY,    time:'02:00 PM', type:'Physical',    status:'Upcoming',  identity:'S9512890E', gender:'Male',   note:'' },
    { id:'a6', name:'Sara Ali',       date: TOMORROW, time:'09:30 AM', type:'Physical',    status:'Upcoming',  identity:'T0013123F', gender:'Female', note:'' },
    { id:'a7', name:'Omar Hassan',    date: TOMORROW, time:'11:00 AM', type:'Video',       status:'Upcoming',  identity:'S9211456G', gender:'Male',   note:'' },
    { id:'a8', name:'Emily Chen',     date: TOMORROW, time:'03:00 PM', type:'Physical',    status:'Upcoming',  identity:'T0114789H', gender:'Female', note:'' },
    { id:'a9', name:'Mark Raj',       date:'30 Jun 2026', time:'10:00 AM', type:'Video',   status:'Upcoming',  identity:'S8915012I', gender:'Male',   note:'' },
    { id:'a10',name:'Nadia Yusof',    date:'02 Jul 2026', time:'02:30 PM', type:'Physical',status:'Upcoming',  identity:'T0016345J', gender:'Female', note:'' },
  ]);

  const [rescheduleModal,   setRescheduleModal]   = useState(false);
  const [rescheduleTarget,  setRescheduleTarget]  = useState(null);
  const [rescheduleDate,    setRescheduleDate]    = useState('');
  const [rescheduleTime,    setRescheduleTime]    = useState('');
  const [rescheduleNote,    setRescheduleNote]    = useState('');

  const [notifModal,        setNotifModal]        = useState(false);
  const [notifTarget,       setNotifTarget]       = useState(null);
  const [notifMsg,          setNotifMsg]          = useState('');
  const [notifLog,          setNotifLog]          = useState([
    { id:'n1', patient:'Ramesh Kumar', msg:'Please come 15 mins early for your 09:00 AM slot.', time:'08:45 AM', read: false },
    { id:'n2', patient:'Priya Sharma', msg:'Your video call link has been sent to your email.',  time:'10:00 AM', read: true  },
  ]);

  const [videoChatModal,    setVideoChatModal]    = useState(false);
  const [videoChatTarget,   setVideoChatTarget]   = useState(null);
  const [chatMessages,      setChatMessages]      = useState([]);
  const [chatInput,         setChatInput]         = useState('');
  const [apptDayTab,      setApptDayTab]      = useState('Today');   // Today | Tomorrow | Upcoming
  const [apptFilterType,    setApptFilterType]    = useState('All'); // All | Physical | Video
  const [notifBell,         setNotifBell]         = useState(true);  // unread badge

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  // ── handlers ──
  const confirmPatient = (id) => {
    const p = upcomingQueue.find(x => x.id === id);
    setUpcomingQueue(prev => prev.map(x => x.id === id ? { ...x, status: 'Confirmed' } : x));
    showToast(`✅ Confirmed: ${p?.name} (Queue #${id})`);
  };
  const cancelPatient = (id) => {
    const p = upcomingQueue.find(x => x.id === id);
    setUpcomingQueue(prev => prev.filter(x => x.id !== id));
    showToast(`❌ Cancelled slot for ${p?.name}`);
  };
  const rejoinQueue = (pat) => {
    setMissedQueue(prev => prev.filter(x => x.id !== pat.id));
    const nextNo = String(upcomingQueue.reduce((m, x) => Math.max(m, parseInt(x.id) || 0), 47) + 1);
    setUpcomingQueue(prev => [...prev, { id: nextNo, name: pat.name, identity: pat.identity, gender: pat.gender, status: 'Unconfirmed' }]);
    showToast(`⚡ ${pat.name} rejoined as Queue #${nextNo}`);
  };
  const bookAppointment = () => {
    if (!newName.trim() || !newId.trim()) { showToast('⚠️ Fill in all fields'); return; }
    const nextNo = String(upcomingQueue.reduce((m, x) => Math.max(m, parseInt(x.id) || 0), 47) + 1);
    setUpcomingQueue(prev => [...prev, { id: nextNo, name: newName.trim(), identity: newId.trim(), gender: newGender, status: 'Confirmed' }]);
    setApptModal(false); setNewName(''); setNewId('');
    showToast(`📅 Booked ${newName.trim()} — Queue #${nextNo}`);
  };
  const startErica = () => {
    const next = upcomingQueue.find(x => x.status === 'Confirmed') || upcomingQueue[0];
    if (!next) { showToast('ℹ️ No patients in queue'); return; }
    setEricaServing(true); setEricaPatient(next.name);
    setUpcomingQueue(prev => prev.filter(x => x.id !== next.id));
    showToast(`👩‍⚕️ Dr. Erica Lim → ${next.name}`);
  };
  const completeErica = () => {
    const nextId = String(checkout.reduce((m, x) => Math.max(m, parseInt(x.id) || 0), 42) + 1);
    setCheckout(prev => [...prev, {
      id: nextId, name: ericaPatient, identity: 'S9900001A', gender: 'Male',
      meds: [{ n: 'Panadol 500mg', q: '10 tabs' }, { n: 'Amoxicillin 500mg', q: '10 tabs' }],
      amount: '$28.00', status: 'Unpaid',
    }]);
    setEricaServing(false); setEricaPatient('');
    showToast('✓ Consultation completed & bill generated');
  };
  const toggleCheckout = (id) => {
    setCheckout(prev => prev.map(x => x.id === id ? { ...x, status: x.status === 'Paid' ? 'Unpaid' : 'Paid' } : x));
  };
  const quickChat = (name) => { showToast(`💬 Opening chat with ${name}`); setTimeout(() => router.push('/doctor/chat'), 1200); };
  const quickVideo = (id, name) => {
    showToast(`📹 Starting video call with ${name}`);
    startVideoConsult(id);
    setTimeout(() => router.push('/doctor/video'), 1200);
  };

  const filteredQueue = upcomingQueue.filter(q =>
    q.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    q.identity.toLowerCase().includes(searchQ.toLowerCase())
  );

  // ── Appointment helpers ──
  const todayAppts    = appointments.filter(a => a.date === TODAY);
  const tomorrowAppts = appointments.filter(a => a.date === TOMORROW);
  const activeAppt    = appointments.find(a => a.status === 'Active');
  const upcomingAppts = appointments.filter(a => a.date !== TODAY && a.date !== TOMORROW && a.status !== 'Cancelled');
  const unreadNotifs  = notifLog.filter(n => !n.read).length;

  const filteredAppts = (() => {
    let base = apptDayTab === 'Today' ? todayAppts
             : apptDayTab === 'Tomorrow' ? tomorrowAppts
             : upcomingAppts;
    return apptFilterType === 'All' ? base : base.filter(a => a.type === apptFilterType);
  })();

  const showDateCol = apptDayTab === 'Upcoming';

  const cancelAppt = (id) => {
    const a = appointments.find(x => x.id === id);
    setAppointments(prev => prev.map(x => x.id === id ? { ...x, status: 'Cancelled' } : x));
    // auto-notify patient
    setNotifLog(prev => [{ id: `n${Date.now()}`, patient: a.name, msg: `Your appointment on ${a.date} at ${a.time} has been cancelled by the doctor. Please reschedule.`, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), read: false }, ...prev]);
    setNotifBell(true);
    showToast(`❌ Appointment cancelled for ${a.name}. Patient notified.`);
  };

  const openReschedule = (appt) => { setRescheduleTarget(appt); setRescheduleDate(appt.date); setRescheduleTime(appt.time); setRescheduleNote(''); setRescheduleModal(true); };

  const submitReschedule = () => {
    if (!rescheduleDate.trim() || !rescheduleTime.trim()) { showToast('⚠️ Enter new date and time'); return; }
    setAppointments(prev => prev.map(x => x.id === rescheduleTarget.id ? { ...x, date: rescheduleDate.trim(), time: rescheduleTime.trim(), note: rescheduleNote.trim() } : x));
    // notify patient
    setNotifLog(prev => [{ id: `n${Date.now()}`, patient: rescheduleTarget.name, msg: `Your appointment has been rescheduled to ${rescheduleDate.trim()} at ${rescheduleTime.trim()}. ${rescheduleNote ? 'Note: ' + rescheduleNote : ''}`, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), read: false }, ...prev]);
    setNotifBell(true);
    setRescheduleModal(false);
    showToast(`📅 Rescheduled ${rescheduleTarget.name}. Patient notified.`);
  };

  const openNotify = (appt) => { setNotifTarget(appt); setNotifMsg(''); setNotifModal(true); };

  const sendNotification = () => {
    if (!notifMsg.trim()) { showToast('⚠️ Enter a message'); return; }
    setNotifLog(prev => [{ id: `n${Date.now()}`, patient: notifTarget.name, msg: notifMsg.trim(), time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), read: false }, ...prev]);
    setNotifBell(true);
    setNotifModal(false);
    showToast(`🔔 Notification sent to ${notifTarget.name}`);
  };

  const openVideoChat = (appt) => { setVideoChatTarget(appt); setChatMessages([{ from:'doctor', text:`Hello ${appt.name.split(' ')[0]}, I am ready for your ${appt.type === 'Video' ? 'video call' : 'consultation'}.`, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) }]); setVideoChatModal(true); };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { from:'doctor', text: chatInput.trim(), time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) }]);
    setChatInput('');
    setTimeout(() => setChatMessages(prev => [...prev, { from:'patient', text: `Got it, thank you doctor!`, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) }]), 1200);
  };

  const markAllRead = () => { setNotifLog(prev => prev.map(n => ({ ...n, read: true }))); setNotifBell(false); };

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT  (sidebar already provided by _layout.jsx — no duplicate here)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isDesk) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Toast message={toast} onClose={() => setToast('')} />

        {/* ── Top Bar ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
          paddingHorizontal: 24, paddingVertical: 14,
        }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4 }}>Dashboard</Text>
            <Text style={{ fontSize: 12, color: C.textLight, marginTop: 1 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, width: 220,
            }}>
              <Search size={15} color={C.textLight} />
              <TextInput
                placeholder="Search here"
                placeholderTextColor={C.textLight}
                value={searchQ}
                onChangeText={setSearchQ}
                style={{ flex: 1, fontSize: 13, color: C.text, outline: 'none' }}
              />
              {searchQ.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQ('')}>
                  <X size={13} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Bell */}
            <TouchableOpacity
              onPress={() => { setNotifLog(prev => prev.map(n => ({ ...n, read: true }))); setNotifBell(false); showToast('Notifications cleared'); }}
              style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={17} color={notifBell ? C.primary : C.textMid} />
              {notifBell && <View style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: C.danger, borderWidth: 1.5, borderColor: C.card }} />}
            </TouchableOpacity>

            {/* Gear */}
            <TouchableOpacity
              onPress={() => showToast('Opening settings')}
              style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Settings size={17} color={C.textMid} />
            </TouchableOpacity>

            {/* Make Appointment CTA */}
            <Btn
              label="Make an Appointment"
              onPress={() => setApptModal(true)}
              icon={<UserPlus size={15} color="#fff" />}
              style={{ paddingHorizontal: 18, paddingVertical: 10 }}
            />
          </View>
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 18 }}>

              {/* ── Metrics Row ── */}
              <Card>
                <View style={{ flexDirection: 'row' }}>
                  {[
                    { label: 'Patients',     val: 52, pct: '+25%', up: true,  icon: <Users size={20} color={C.primary} />       },
                    { label: 'Appointments', val: 48, pct: '+22%', up: true,  icon: <ClipboardList size={20} color={C.primary} /> },
                    { label: 'Treatments',   val: 44, pct: '-10%', up: false, icon: <Activity size={20} color={C.primary} />     },
                  ].map((m, i, arr) => (
                    <View
                      key={m.label}
                      style={{
                        flex: 1, paddingHorizontal: 24, paddingVertical: 20,
                        borderRightWidth: i < arr.length - 1 ? 1 : 0,
                        borderRightColor: C.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <View style={{ backgroundColor: C.primarySoft, borderRadius: 8, padding: 7 }}>{m.icon}</View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.textMid }}>{m.label}</Text>
                      </View>
                      <Text style={{ fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -1 }}>{m.val}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {m.up
                          ? <ArrowUpRight size={14} color={C.success} />
                          : <ArrowDownRight size={14} color={C.danger} />}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: m.up ? C.success : C.danger }}>{m.pct}</Text>
                        <Text style={{ fontSize: 11, color: C.textLight }}> from last month</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              {/* ── 2-col body ── */}
              <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>

                {/* LEFT COLUMN */}
                <View style={{ flex: 6, gap: 18 }}>

                  {/* Doctors */}
                  <Card>
                    <CardHeader title="Doctors" actionLabel="View All" onAction={() => showToast('All doctors')} />
                    <View style={{ flexDirection: 'row', gap: 0 }}>

                      {/* Dr Erica Lim */}
                      <View style={{ flex: 1, padding: 20, borderRightWidth: 1, borderRightColor: C.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <Avatar initials="EL" size={48} />
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>Dr. Erica Lim</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ericaServing ? C.success : C.textLight }} />
                              <Text style={{ fontSize: 12, color: ericaServing ? C.success : C.textMid, fontWeight: '600' }}>
                                {ericaServing ? `Serving ${ericaPatient}` : 'Not Serving Patient'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 56 }}>
                          <Text style={{ fontSize: 12, color: C.textMid, lineHeight: 18 }}>
                            {ericaServing
                              ? `Currently attending to ${ericaPatient} in Consultation Room 03.`
                              : 'Doctor is available for consultation. Begin the next appointment?'}
                          </Text>
                        </View>

                        {ericaServing ? (
                          <Btn label="Complete Consultation" onPress={completeErica} color="green" style={{ width: '100%' }} />
                        ) : (
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Btn label="Start Consultation" onPress={startErica} style={{ flex: 1 }} />
                            <TouchableOpacity
                              onPress={() => quickVideo('erica', 'Dr. Erica Lim')}
                              style={{
                                width: 42, height: 42, borderRadius: 10, borderWidth: 1.5,
                                borderColor: C.primary, backgroundColor: C.primarySoft,
                                alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Camera size={16} color={C.primary} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Dr Kevin Zane */}
                      <View style={{ flex: 1, padding: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <Avatar initials="KZ" size={48} />
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>Dr. Kevin Zane</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.success }} />
                              <Text style={{ fontSize: 12, color: C.success, fontWeight: '600' }}>Serving Patient</Text>
                            </View>
                          </View>
                        </View>

                        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Patient Information</Text>

                        {/* Patient sub-card */}
                        <View style={{
                          flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
                          backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16,
                        }}>
                          <Avatar initials="AC" size={40} />
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>46. Alina Choo</Text>
                            <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>ID: S8810250J  •  Female</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <Btn label="Cancel"   onPress={() => showToast('Cancelled Kevin Zane slot')} outline color="blue" small style={{ flex: 1 }} />
                          <Btn label="Absent"   onPress={() => showToast('Patient marked absent')}     outline color="blue" small style={{ flex: 1 }} />
                          <Btn label="Complete" onPress={() => showToast('Kevin Zane consult done')}           color="blue" small style={{ flex: 1 }} />
                        </View>
                      </View>
                    </View>
                  </Card>

                  {/* Checkout */}
                  <Card>
                    <CardHeader title="Checkout" actionLabel="View All" onAction={() => showToast('All checkouts')} />
                    <TH cols={[
                      { label: 'Patient',    style: { flex: 2.5 } },
                      { label: 'Medication', style: { flex: 3   } },
                      { label: 'Status',     style: { flex: 1.2 } },
                      { label: 'Actions',    style: { flex: 2.3, textAlign: 'right' } },
                    ]} />

                    {checkout.map((c, i) => (
                      <View
                        key={c.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 20, paddingVertical: 16,
                          borderBottomWidth: i < checkout.length - 1 ? 1 : 0,
                          borderBottomColor: C.border,
                          backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
                        }}
                      >
                        {/* Patient */}
                        <View style={{ flex: 2.5 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{c.id}. {c.name}</Text>
                          <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>ID: {c.identity} • {c.gender}</Text>
                        </View>

                        {/* Medications */}
                        <View style={{ flex: 3 }}>
                          {c.meds.map((m, j) => (
                            <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: j < c.meds.length - 1 ? 4 : 0 }}>
                              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.textLight }} />
                              <Text style={{ fontSize: 12, color: C.textMid }}>{m.n}</Text>
                              <Text style={{ fontSize: 11, color: C.textLight }}>({m.q})</Text>
                            </View>
                          ))}
                        </View>

                        {/* Status */}
                        <View style={{ flex: 1.2 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 5 }}>{c.amount}</Text>
                          <TouchableOpacity onPress={() => toggleCheckout(c.id)}>
                            <Badge label={c.status} color={c.status === 'Paid' ? 'green' : 'red'} />
                          </TouchableOpacity>
                        </View>

                        {/* Actions */}
                        <View style={{ flex: 2.3, alignItems: 'flex-end', gap: 8 }}>
                          <Btn label="Edit" onPress={() => showToast(`Editing ${c.name}`)} small style={{ width: 70 }} />
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Btn label="Print Bill" onPress={() => showToast(`Printing bill for ${c.name}`)} small outline color="grey" style={{ flex: 1 }} />
                            <Btn label="Print MC"   onPress={() => showToast(`Printing MC for ${c.name}`)}   small outline color="grey" style={{ flex: 1 }} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </Card>

                </View>

                {/* RIGHT COLUMN */}
                <View style={{ flex: 4, gap: 18 }}>

                  {/* Upcoming Queues */}
                  <Card>
                    <CardHeader title="Upcoming Queues" actionLabel="View All" onAction={() => showToast('All queues')} />
                    <TH cols={[
                      { label: 'No.',     style: { width: 36 } },
                      { label: 'Patient', style: { flex: 1 } },
                      { label: 'Status',  style: { width: 90 } },
                      { label: 'Actions', style: { width: 130, textAlign: 'right' } },
                    ]} />

                    {filteredQueue.map((q, i) => {
                      const confirmed = q.status === 'Confirmed';
                      return (
                        <View
                          key={q.id}
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 20, paddingVertical: 13,
                            borderBottomWidth: i < filteredQueue.length - 1 ? 1 : 0,
                            borderBottomColor: C.border,
                            backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
                          }}
                        >
                          <Text style={{ width: 36, fontSize: 13, fontWeight: '700', color: C.text }}>{q.id}</Text>

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }} numberOfLines={1}>{q.name}</Text>
                            <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{q.identity} • {q.gender}</Text>
                          </View>

                          <View style={{ width: 90 }}>
                            <Badge label={q.status} color={confirmed ? 'green' : 'red'} />
                          </View>

                          {/* Action cluster */}
                          <View style={{ width: 130, alignItems: 'flex-end', gap: 6 }}>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <Btn
                                label="Cancel"
                                onPress={() => cancelPatient(q.id)}
                                outline color="red" small
                                style={{ paddingHorizontal: 10, minWidth: 58 }}
                              />
                              {!confirmed && (
                                <Btn
                                  label="Confirm"
                                  onPress={() => confirmPatient(q.id)}
                                  color="blue" small
                                  style={{ paddingHorizontal: 10, minWidth: 60 }}
                                />
                              )}
                            </View>
                            {/* Chat + Video icons (active only when confirmed) */}
                            <View style={{ flexDirection: 'row', gap: 8, opacity: confirmed ? 1 : 0.3 }}>
                              <TouchableOpacity
                                onPress={() => confirmed ? quickChat(q.name) : showToast('Confirm patient first')}
                                style={{ backgroundColor: C.primarySoft, borderRadius: 6, padding: 5 }}
                              >
                                <MessageSquare size={13} color={C.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => confirmed ? quickVideo(q.id, q.name) : showToast('Confirm patient first')}
                                style={{ backgroundColor: C.primarySoft, borderRadius: 6, padding: 5 }}
                              >
                                <Video size={13} color={C.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </Card>

                  {/* Missed Queues */}
                  <Card>
                    <CardHeader title="Missed Queues" actionLabel="View All" onAction={() => showToast('All missed')} />
                    <TH cols={[
                      { label: 'Patient',     style: { flex: 1.2 } },
                      { label: 'Identity No.', style: { flex: 1.2 } },
                      { label: 'Action',       style: { flex: 0.8, textAlign: 'right' } },
                    ]} />

                    {missedQueue.map((m, i) => (
                      <View
                        key={m.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 20, paddingVertical: 14,
                          borderBottomWidth: i < missedQueue.length - 1 ? 1 : 0,
                          borderBottomColor: C.border,
                          backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
                        }}
                      >
                        <View style={{ flex: 1.2 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{m.name}</Text>
                          <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{m.gender}</Text>
                        </View>
                        <Text style={{ flex: 1.2, fontSize: 12, color: C.textMid, fontWeight: '600' }}>{m.identity}</Text>
                        <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                          <Btn label="Rejoin Queue" onPress={() => rejoinQueue(m)} small style={{ minWidth: 100 }} />
                        </View>
                      </View>
                    ))}

                    {missedQueue.length === 0 && (
                      <View style={{ padding: 24, alignItems: 'center' }}>
                        <Check size={28} color={C.success} />
                        <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No missed queues</Text>
                      </View>
                    )}
                  </Card>

                </View>
              </View>

              {/* ══════════════════════════════════════════════════════════════════════ */}
              {/* APPOINTMENT MANAGEMENT SECTION                                        */}
              {/* ══════════════════════════════════════════════════════════════════════ */}

              {/* Active Patient Appointment */}
              {activeAppt && (
                <Card style={{ borderLeftWidth: 4, borderLeftColor: C.success }}>
                  <CardHeader title="🟢 Active Consultation" />
                  <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Avatar initials={activeAppt.name.split(' ').map(w=>w[0]).join('').substring(0,2)} size={48} />
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{activeAppt.name}</Text>
                          <Text style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{activeAppt.identity} • {activeAppt.gender}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <Badge label={activeAppt.type} color={activeAppt.type === 'Video' ? 'blue' : 'green'} />
                            <Text style={{ fontSize: 12, color: C.textMid }}>📅 {activeAppt.date}  🕐 {activeAppt.time}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Btn label="💬 Chat" onPress={() => openVideoChat(activeAppt)} small outline color="blue" />
                        {activeAppt.type === 'Video' && (
                          <Btn label="📹 Video Call" onPress={() => { quickVideo(activeAppt.id, activeAppt.name); }} small color="blue" />
                        )}
                        <Btn label="Complete" onPress={() => { setAppointments(prev => prev.map(x => x.id === activeAppt.id ? { ...x, status: 'Done' } : x)); showToast('✓ Consultation marked complete'); }} small color="green" />
                      </View>
                    </View>
                  </View>
                </Card>
              )}

              {/* ── Unified Appointments Card ── */}
              <Card>
                {/* Card header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>Appointments</Text>
                  <Text style={{ fontSize: 12, color: C.textLight }}>
                    {filteredAppts.length} slot{filteredAppts.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Day tabs */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border }}>
                  {[
                    { key: 'Today',    label: `Today (${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'})})`,    count: todayAppts.length },
                    { key: 'Tomorrow', label: `Tomorrow (${new Date(Date.now()+86400000).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})})`, count: tomorrowAppts.length },
                    { key: 'Upcoming', label: 'Upcoming', count: upcomingAppts.length },
                  ].map(t => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => { setApptDayTab(t.key); setApptFilterType('All'); }}
                      style={{
                        flex: 1, paddingVertical: 11, alignItems: 'center',
                        borderBottomWidth: apptDayTab === t.key ? 2 : 0,
                        borderBottomColor: C.primary,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: apptDayTab === t.key ? '800' : '500', color: apptDayTab === t.key ? C.primary : C.textMid }}>
                        {t.label}
                      </Text>
                      {t.count > 0 && (
                        <View style={{ backgroundColor: apptDayTab === t.key ? C.primary : C.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginTop: 3 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: apptDayTab === t.key ? '#fff' : C.textMid }}>{t.count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Type filter chips */}
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  {['All', 'Physical', 'Video'].map(f => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setApptFilterType(f)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
                        backgroundColor: apptFilterType === f ? C.primary : C.card,
                        borderWidth: 1, borderColor: apptFilterType === f ? C.primary : C.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: apptFilterType === f ? '#fff' : C.textMid }}>
                        {f === 'Video' ? '📹 Video' : f === 'Physical' ? '🏥 Physical' : '📋 All'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Table header */}
                <TH cols={[
                  { label: 'Patient',  style: { flex: 2 } },
                  { label: 'Time',     style: { width: 90 } },
                  ...(showDateCol ? [{ label: 'Date', style: { width: 110 } }] : []),
                  { label: 'Type',     style: { width: 80 } },
                  { label: 'Status',   style: { width: 90 } },
                  { label: 'Actions',  style: { width: 180, textAlign: 'right' } },
                ]} />

                {filteredAppts.length === 0 && (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: C.textLight, fontSize: 13 }}>No appointments in this view</Text>
                  </View>
                )}

                {filteredAppts.map((a, i) => (
                  <View
                    key={a.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 20, paddingVertical: 12,
                      borderBottomWidth: i < filteredAppts.length - 1 ? 1 : 0,
                      borderBottomColor: C.border,
                      backgroundColor: a.status === 'Active' ? '#F0FDF4' : i % 2 === 0 ? C.card : '#FAFBFD',
                    }}
                  >
                    {/* Patient */}
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={a.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={34} />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{a.name}</Text>
                        <Text style={{ fontSize: 11, color: C.textLight }}>{a.identity} • {a.gender}</Text>
                      </View>
                    </View>

                    {/* Time */}
                    <Text style={{ width: 90, fontSize: 12, fontWeight: '600', color: C.textMid }}>{a.time}</Text>

                    {/* Date (Upcoming tab only) */}
                    {showDateCol && (
                      <Text style={{ width: 110, fontSize: 12, color: C.textMid }}>{a.date}</Text>
                    )}

                    {/* Type badge */}
                    <View style={{ width: 80 }}>
                      <Badge label={a.type} color={a.type === 'Video' ? 'blue' : 'green'} />
                    </View>

                    {/* Status badge */}
                    <View style={{ width: 90 }}>
                      <Badge
                        label={a.status}
                        color={a.status === 'Active' ? 'green' : a.status === 'Cancelled' ? 'red' : a.status === 'Done' ? 'grey' : 'orange'}
                      />
                    </View>

                    {/* Action icons — compact single row */}
                    <View style={{ width: 180, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {a.status !== 'Cancelled' && a.status !== 'Done' ? (
                        <>
                          {/* Set Active */}
                          {a.status !== 'Active' && apptDayTab === 'Today' && (
                            <TouchableOpacity
                              onPress={() => { setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'Active' } : (x.status === 'Active' ? { ...x, status: 'Upcoming' } : x))); showToast(`✅ ${a.name} set as active`); }}
                              style={{ backgroundColor: C.successSoft, borderRadius: 7, padding: 6, borderWidth: 1, borderColor: C.success }}
                              title="Set Active"
                            >
                              <Check size={13} color={C.success} />
                            </TouchableOpacity>
                          )}
                          {/* Chat */}
                          <TouchableOpacity
                            onPress={() => openVideoChat(a)}
                            style={{ backgroundColor: C.primarySoft, borderRadius: 7, padding: 6, borderWidth: 1, borderColor: C.primary }}
                          >
                            <MessageSquare size={13} color={C.primary} />
                          </TouchableOpacity>
                          {/* Video (Video type only) */}
                          {a.type === 'Video' && (
                            <TouchableOpacity
                              onPress={() => quickVideo(a.id, a.name)}
                              style={{ backgroundColor: C.primarySoft, borderRadius: 7, padding: 6, borderWidth: 1, borderColor: C.primary }}
                            >
                              <Video size={13} color={C.primary} />
                            </TouchableOpacity>
                          )}
                          {/* Notify */}
                          <TouchableOpacity
                            onPress={() => openNotify(a)}
                            style={{ backgroundColor: C.warningSoft, borderRadius: 7, padding: 6, borderWidth: 1, borderColor: C.warning }}
                          >
                            <Bell size={13} color={C.warning} />
                          </TouchableOpacity>
                          {/* Reschedule */}
                          <Btn label="Reschedule" onPress={() => openReschedule(a)} small outline color="grey" style={{ paddingHorizontal: 8, minWidth: 76 }} />
                          {/* Cancel */}
                          <Btn label="Cancel" onPress={() => cancelAppt(a.id)} small outline color="red" style={{ paddingHorizontal: 8, minWidth: 54 }} />
                        </>
                      ) : (
                        <Text style={{ fontSize: 11, color: C.textLight, fontStyle: 'italic' }}>{a.status}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </Card>

              {/* Notification Log */}
              <Card>
                <CardHeader title={`🔔 Notifications Sent${unreadNotifs > 0 ? ` (${unreadNotifs} new)` : ''}`} actionLabel="Mark All Read" onAction={markAllRead} />
                {notifLog.length === 0 && (
                  <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: C.textLight, fontSize: 13 }}>No notifications sent yet</Text></View>
                )}
                {notifLog.slice(0, 6).map((n, i) => (
                  <View key={n.id} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: i < Math.min(notifLog.length, 6) - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: n.read ? C.card : '#EFF6FF' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n.read ? C.textLight : C.primary, marginTop: 5, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{n.patient}</Text>
                      <Text style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 18 }}>{n.msg}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: C.textLight, marginLeft: 12 }}>{n.time}</Text>
                  </View>
                ))}
              </Card>
        </ScrollView>

        {/* ── MODALS ── */}
        <ApptModal
          visible={apptModal}
          onClose={() => setApptModal(false)}
          name={newName} setName={setNewName}
          patId={newId} setPatId={setNewId}
          gender={newGender} setGender={setNewGender}
          onSubmit={bookAppointment}
        />
        <MsgModal visible={msgModal} onClose={() => setMsgModal(false)} onOpen={() => { setMsgModal(false); router.push('/doctor/chat'); }} />

        {/* Reschedule Modal */}
        <RescheduleModal
          visible={rescheduleModal}
          target={rescheduleTarget}
          date={rescheduleDate} setDate={setRescheduleDate}
          time={rescheduleTime} setTime={setRescheduleTime}
          note={rescheduleNote} setNote={setRescheduleNote}
          onClose={() => setRescheduleModal(false)}
          onSubmit={submitReschedule}
        />

        {/* Notify Patient Modal */}
        <NotifyModal
          visible={notifModal}
          target={notifTarget}
          msg={notifMsg} setMsg={setNotifMsg}
          onClose={() => setNotifModal(false)}
          onSubmit={sendNotification}
        />

        {/* Chat / Video Call Modal */}
        <VideoChatModal
          visible={videoChatModal}
          target={videoChatTarget}
          messages={chatMessages}
          input={chatInput} setInput={setChatInput}
          onSend={sendChat}
          onVideo={() => { setVideoChatModal(false); quickVideo(videoChatTarget?.id, videoChatTarget?.name); }}
          onClose={() => setVideoChatModal(false)}
        />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <Toast message={toast} onClose={() => setToast('')} />

      {/* Mobile header */}
      <LinearGradient colors={[C.primary, '#4F46E5']} style={{ paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: '#BFDBFE', fontSize: 12, fontWeight: '600' }}>Good morning,</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 }}>Dr. C. Lawrence</Text>
            <Text style={{ color: '#93C5FD', fontSize: 12, marginTop: 2 }}>Cardiology Division</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 9 }} onPress={() => showToast('Notifications')}>
              <Bell size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setApptModal(true)}
              style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} color={C.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
          paddingHorizontal: 14, paddingVertical: 10, marginTop: 16,
        }}>
          <Search size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            placeholder="Search patients or queues…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQ} onChangeText={setSearchQ}
            style={{ flex: 1, fontSize: 13, color: '#fff' }}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>

        {/* Metrics */}
        <Card>
          <View style={{ flexDirection: 'row' }}>
            {[
              { label: 'Patients', val: 52, pct: '+25%', up: true },
              { label: 'Appts',    val: 48, pct: '+22%', up: true },
              { label: 'Treats',   val: 44, pct: '-10%', up: false },
            ].map((m, i, arr) => (
              <View key={m.label} style={{
                flex: 1, alignItems: 'center', paddingVertical: 18,
                borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: C.border,
              }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: C.text }}>{m.val}</Text>
                <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{m.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                  {m.up ? <ArrowUpRight size={11} color={C.success} /> : <ArrowDownRight size={11} color={C.danger} />}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: m.up ? C.success : C.danger }}>{m.pct}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Doctors */}
        <Card>
          <CardHeader title="Doctors" actionLabel="View All" onAction={() => showToast('All doctors')} />
          <View style={{ padding: 16, gap: 12 }}>
            {/* Dr Erica */}
            <View style={{ backgroundColor: C.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar initials="EL" size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>Dr. Erica Lim</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ericaServing ? C.success : '#94A3B8' }} />
                    <Text style={{ fontSize: 11, color: ericaServing ? C.success : C.textMid, fontWeight: '600' }}>
                      {ericaServing ? `Serving ${ericaPatient}` : 'Not Serving Patient'}
                    </Text>
                  </View>
                </View>
              </View>
              {ericaServing ? (
                <Btn label="Complete Consultation" onPress={completeErica} color="green" style={{ width: '100%' }} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn label="Start Consultation" onPress={startErica} style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => quickVideo('erica', 'Dr. Erica Lim')}
                    style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Camera size={16} color={C.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Dr Kevin */}
            <View style={{ backgroundColor: C.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar initials="KZ" size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>Dr. Kevin Zane</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.success }} />
                    <Text style={{ fontSize: 11, color: C.success, fontWeight: '600' }}>Serving Patient</Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}>
                <Avatar initials="AC" size={34} />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>46. Alina Choo</Text>
                  <Text style={{ fontSize: 11, color: C.textLight }}>S8810250J • Female</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn label="Cancel"   onPress={() => showToast('Cancelled')}   outline color="blue" small style={{ flex: 1 }} />
                <Btn label="Absent"   onPress={() => showToast('Absent')}     outline color="blue" small style={{ flex: 1 }} />
                <Btn label="Complete" onPress={() => showToast('Complete!')}           color="blue" small style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Card>

        {/* Upcoming Queues */}
        <Card>
          <CardHeader title="Upcoming Queues" actionLabel="View All" onAction={() => showToast('All queues')} />
          {filteredQueue.map((q, i) => {
            const confirmed = q.status === 'Confirmed';
            return (
              <View key={q.id} style={{
                padding: 14, paddingHorizontal: 16,
                borderBottomWidth: i < filteredQueue.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: C.primary }}>{q.id}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{q.name}</Text>
                      <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{q.identity} • {q.gender}</Text>
                    </View>
                  </View>
                  <Badge label={q.status} color={confirmed ? 'green' : 'red'} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Btn label="Cancel" onPress={() => cancelPatient(q.id)} outline color="red" small />
                    {!confirmed && <Btn label="Confirm" onPress={() => confirmPatient(q.id)} color="blue" small />}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, opacity: confirmed ? 1 : 0.3 }}>
                    <TouchableOpacity
                      onPress={() => confirmed ? quickChat(q.name) : undefined}
                      style={{ backgroundColor: C.primarySoft, borderRadius: 8, padding: 7 }}
                    >
                      <MessageSquare size={15} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmed ? quickVideo(q.id, q.name) : undefined}
                      style={{ backgroundColor: C.primarySoft, borderRadius: 8, padding: 7 }}
                    >
                      <Video size={15} color={C.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Checkout */}
        <Card>
          <CardHeader title="Checkout" actionLabel="View All" onAction={() => showToast('All checkouts')} />
          {checkout.map((c, i) => (
            <View key={c.id} style={{
              padding: 16,
              borderBottomWidth: i < checkout.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{c.id}. {c.name}</Text>
                  <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{c.identity} • {c.gender}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>{c.amount}</Text>
                  <TouchableOpacity onPress={() => toggleCheckout(c.id)}>
                    <Badge label={c.status} color={c.status === 'Paid' ? 'green' : 'red'} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 12 }}>
                {c.meds.map((m, j) => (
                  <Text key={j} style={{ fontSize: 12, color: C.textMid, lineHeight: 20 }}>• {m.n} ({m.q})</Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn label="Edit"       onPress={() => showToast(`Edit: ${c.name}`)}        style={{ flex: 1 }} small />
                <Btn label="Print Bill" onPress={() => showToast(`Bill: ${c.name}`)} outline color="grey" small style={{ flex: 1 }} />
                <Btn label="Print MC"   onPress={() => showToast(`MC: ${c.name}`)}   outline color="grey" small style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </Card>

        {/* Missed Queues */}
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title="Missed Queues" actionLabel="View All" onAction={() => showToast('All missed')} />
          {missedQueue.map((m, i) => (
            <View key={m.id} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: i < missedQueue.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{m.name}</Text>
                <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{m.identity} • {m.gender}</Text>
              </View>
              <Btn label="Rejoin Queue" onPress={() => rejoinQueue(m)} small style={{ minWidth: 100 }} />
            </View>
          ))}
          {missedQueue.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Check size={24} color={C.success} />
              <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No missed queues</Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Booking modal */}
      <ApptModal
        visible={apptModal}
        onClose={() => setApptModal(false)}
        name={newName} setName={setNewName}
        patId={newId} setPatId={setNewId}
        gender={newGender} setGender={setNewGender}
        onSubmit={bookAppointment}
      />
    </View>
  );
}

// ─── APPOINTMENT MODAL ────────────────────────────────────────────────────────
function ApptModal({ visible, onClose, name, setName, patId, setPatId, gender, setGender, onSubmit }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <MotiView
          from={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            backgroundColor: C.card, borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 400,
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>New Appointment</Text>
              <Text style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Register a consultation slot</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.bg, borderRadius: 8, padding: 7 }}>
              <X size={16} color={C.textMid} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Patient Name</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={C.textLight}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Identity Card No.</Text>
          <TextInput
            value={patId} onChangeText={setPatId}
            placeholder="e.g. S9876543A"
            placeholderTextColor={C.textLight}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Gender</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {['Male', 'Female'].map(g => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: gender === g ? C.primary : C.bg, borderWidth: 1.5, borderColor: gender === g ? C.primary : C.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: gender === g ? '#fff' : C.textMid }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Btn label="Book Appointment" onPress={onSubmit} style={{ width: '100%', paddingVertical: 14 }} />
        </MotiView>
      </View>
    </Modal>
  );
}

// ─── RESCHEDULE MODAL ─────────────────────────────────────────────────────────
function RescheduleModal({ visible, target, date, setDate, time, setTime, note, setNote, onClose, onSubmit }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <MotiView
          from={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>Reschedule Appointment</Text>
              {target && <Text style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Patient: {target.name}  •  Current: {target.date} {target.time}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.bg, borderRadius: 8, padding: 7 }}>
              <X size={16} color={C.textMid} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>New Date</Text>
          <TextInput
            value={date} onChangeText={setDate}
            placeholder="e.g. 30 Jun 2026"
            placeholderTextColor={C.textLight}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 14 }}
          />

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>New Time</Text>
          <TextInput
            value={time} onChangeText={setTime}
            placeholder="e.g. 10:30 AM"
            placeholderTextColor={C.textLight}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 14 }}
          />

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Note for Patient (optional)</Text>
          <TextInput
            value={note} onChangeText={setNote}
            placeholder="Reason for rescheduling…"
            placeholderTextColor={C.textLight}
            multiline numberOfLines={3}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 20, minHeight: 72, textAlignVertical: 'top' }}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn label="Cancel" onPress={onClose} outline color="grey" style={{ flex: 1, paddingVertical: 12 }} />
            <Btn label="📅 Reschedule & Notify" onPress={onSubmit} style={{ flex: 2, paddingVertical: 12 }} />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ─── NOTIFY PATIENT MODAL ─────────────────────────────────────────────────────
function NotifyModal({ visible, target, msg, setMsg, onClose, onSubmit }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <MotiView
          from={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>🔔 Notify Patient</Text>
              {target && <Text style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>To: {target.name}  •  {target.date} {target.time}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.bg, borderRadius: 8, padding: 7 }}>
              <X size={16} color={C.textMid} />
            </TouchableOpacity>
          </View>

          {/* Quick templates */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Quick Templates</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[
              'Please arrive 15 mins early.',
              'Bring your previous reports.',
              'Your appointment is confirmed.',
              'Please reschedule your appointment.',
            ].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setMsg(t)}
                style={{ backgroundColor: C.primarySoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Custom Message</Text>
          <TextInput
            value={msg} onChangeText={setMsg}
            placeholder="Type your message to the patient…"
            placeholderTextColor={C.textLight}
            multiline numberOfLines={4}
            style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, marginBottom: 20, minHeight: 90, textAlignVertical: 'top' }}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn label="Cancel" onPress={onClose} outline color="grey" style={{ flex: 1, paddingVertical: 12 }} />
            <Btn label="Send Notification" onPress={onSubmit} style={{ flex: 2, paddingVertical: 12 }} />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ─── VIDEO / CHAT MODAL ───────────────────────────────────────────────────────
function VideoChatModal({ visible, target, messages, input, setInput, onSend, onVideo, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <MotiView
          from={{ translateY: 300, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ backgroundColor: C.primarySoft, borderRadius: 10, padding: 8 }}>
                <MessageSquare size={18} color={C.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>
                  {target?.type === 'Video' ? '📹 Video Consult' : '💬 Chat'} — {target?.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{target?.date}  •  {target?.time}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {target?.type === 'Video' && (
                <Btn label="Start Video" onPress={onVideo} small color="blue" icon={<Video size={14} color="#fff" />} />
              )}
              <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.bg, borderRadius: 8, padding: 7 }}>
                <X size={16} color={C.textMid} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat messages */}
          <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
            {messages.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: m.from === 'doctor' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <View style={{
                  maxWidth: '72%',
                  backgroundColor: m.from === 'doctor' ? C.primary : C.bg,
                  borderRadius: 14,
                  borderBottomRightRadius: m.from === 'doctor' ? 4 : 14,
                  borderBottomLeftRadius: m.from === 'doctor' ? 14 : 4,
                  paddingHorizontal: 14, paddingVertical: 10,
                  borderWidth: m.from === 'doctor' ? 0 : 1, borderColor: C.border,
                }}>
                  <Text style={{ fontSize: 13, color: m.from === 'doctor' ? '#fff' : C.text, lineHeight: 18 }}>{m.text}</Text>
                  <Text style={{ fontSize: 10, color: m.from === 'doctor' ? 'rgba(255,255,255,0.6)' : C.textLight, marginTop: 4 }}>{m.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message…"
              placeholderTextColor={C.textLight}
              style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, color: C.text }}
              onSubmitEditing={onSend}
            />
            <Btn label="Send" onPress={onSend} small style={{ paddingHorizontal: 18 }} />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ─── MESSAGES MODAL ───────────────────────────────────────────────────────────
function MsgModal({ visible, onClose, onOpen }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <MotiView
          from={{ translateY: 200, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 280 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ backgroundColor: C.primarySoft, borderRadius: 10, padding: 8 }}>
                <MessageSquare size={18} color={C.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>Messages Center</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: C.bg, borderRadius: 8, padding: 7 }}>
              <X size={16} color={C.textMid} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 20 }}>
              Chat threads available for confirmed patients.{'\n'}Open the Messaging View to begin.
            </Text>
          </View>
          <Btn label="Open Messaging View" onPress={onOpen} style={{ width: '100%', paddingVertical: 14, marginTop: 16 }} />
        </MotiView>
      </View>
    </Modal>
  );
}
