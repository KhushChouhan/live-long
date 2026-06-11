import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../../../services/api';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Dimensions, Platform, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../../store/DoctorContext';
import {
  Users, ClipboardList, Activity, MessageSquare, Bell, Search,
  ArrowUpRight, ArrowDownRight, Video, X, ChevronRight, Camera, Check,
  UserPlus, CalendarPlus, IndianRupee, Clock, Stethoscope, Heart
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = {
  primary: '#2563EB', primaryDark: '#1E40AF', primarySoft: '#EFF6FF',
  success: '#059669', successSoft: '#ECFDF5',
  danger: '#DC2626', dangerSoft: '#FEF2F2',
  warning: '#D97706', warningSoft: '#FFFBEB',
  text: '#0F172A', textMid: '#475569', textLight: '#94A3B8',
  border: '#E2E8F0', bg: '#F1F5F9', card: '#FFFFFF',
  sidebar: '#1E293B', lavender: '#8B5CF6', lavenderSoft: '#F5F3FF',
  accent: '#0EA5E9', accentSoft: '#F0F9FF',
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Toast
const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <MotiView
      from={{ opacity: 0, translateY: -30 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -30 }}
      transition={{ type: 'spring', damping: 18 }}
      style={{
        position: 'absolute', top: 20, left: '50%', transform: [{ translateX: '-50%' }],
        zIndex: 9999, backgroundColor: C.sidebar, paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 14, maxWidth: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>{message}</Text>
    </MotiView>
  );
};

// Badge
const Badge = ({ label, color = 'blue' }) => {
  const colors = {
    green: { bg: C.successSoft, text: C.success },
    red: { bg: C.dangerSoft, text: C.danger },
    blue: { bg: C.primarySoft, text: C.primary },
    orange: { bg: C.warningSoft, text: C.warning },
    purple: { bg: C.lavenderSoft, text: C.lavender },
  };
  const c = colors[color] || colors.blue;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{label}</Text>
    </View>
  );
};

// Button
const Btn = ({ label, onPress, icon, outline, small, color, style, disabled }) => {
  const clr = color === 'red' ? C.danger : color === 'green' ? C.success : color === 'grey' ? C.textMid : color === 'purple' ? C.lavender : C.primary;
  const h = small ? 32 : 40;
  const fs = small ? 12 : 14;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled}
      activeOpacity={0.7}
      style={{
        height: h, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingHorizontal: small ? 12 : 18,
        backgroundColor: outline ? 'transparent' : clr,
        borderRadius: 10, borderWidth: outline ? 1.5 : 0, borderColor: clr,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon}
      <Text style={{ fontSize: fs, fontWeight: '700', color: outline ? clr : '#fff' }}>{label}</Text>
    </TouchableOpacity>
  );
};

// Card
const Card = ({ children, style }) => (
  <View style={{
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    ...style,
  }}>
    {children}
  </View>
);

// Card Header
const CardHeader = ({ title, icon, iconBg, iconColor, count, action, onAction }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ backgroundColor: iconBg || C.primarySoft, borderRadius: 10, padding: 8 }}>
        {icon}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>{title}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {count !== undefined && (
        <View style={{ backgroundColor: iconColor === C.danger ? C.danger : iconColor === C.warning ? C.warning : C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{count}</Text>
        </View>
      )}
      {action && (
        <TouchableOpacity onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary }}>{action}</Text>
          <ChevronRight size={14} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Table Header
const TH = ({ cols }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: C.border }}>
    {cols.map((c, i) => (
      <Text key={i} style={{ fontSize: 11, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, ...c.style }}>{c.label}</Text>
    ))}
  </View>
);

// Avatar
const Avatar = ({ initials, size = 40, color }) => {
  const bg = color || (() => { const h = (initials?.charCodeAt(0) || 65) * 137 % 360; return `hsl(${h}, 60%, 55%)`; })();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#fff' }}>{initials}</Text>
    </View>
  );
};

// Stat Card
const StatCard = ({ icon, label, value, change, changeUp, color, delay = 0 }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 500, delay }}
    style={{ flex: 1 }}
  >
    <Card style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ backgroundColor: color + '18', borderRadius: 12, padding: 10 }}>
          {icon}
        </View>
        {change !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: changeUp ? C.successSoft : C.dangerSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            {changeUp ? <ArrowUpRight size={12} color={C.success} /> : <ArrowDownRight size={12} color={C.danger} />}
            <Text style={{ fontSize: 11, fontWeight: '700', color: changeUp ? C.success : C.danger }}>{change}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -1, marginBottom: 4 }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.textLight }}>{label}</Text>
    </Card>
  </MotiView>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function MedicalClinicPortal() {
  const router = useRouter();
  const {
    // Data
    patients, appointments, upcomingQueue, missedQueue, checkout,
    chats, stats, notifLog, searchQ, activeChatPatientId,
    TODAY_STR, TOMORROW_STR,
    // Setters
    setSearchQ, setNotifLog, setActiveChatPatientId,
    // Modal controls
    apptModalOpen, setApptModalOpen,
    patientModalOpen, setPatientModalOpen,
    // Patient actions
    addPatient,
    // Appointment actions
    addAppointment, setAppointmentActive, completeAppointment,
    rescheduleAppointment, cancelAppointment,
    // Queue actions
    confirmQueuePatient, cancelQueuePatient, rejoinQueue, addToQueue,
    // Checkout actions
    toggleCheckoutStatus, addToCheckout,
    // Chat/Video actions
    sendMessage, startVideoConsult,
  } = useDoctor();

  // ─── Responsive ───────────────────────────────────────────────
  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  const isWeb = Platform.OS === 'web';
  const isDesk = isWeb && dims.width > 1080;

  // ─── Local UI State ───────────────────────────────────────────
  const [toast, setToast] = useState('');
  const [msgModal, setMsgModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [notifModal, setNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState(null);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifPhone, setNotifPhone] = useState('');
  const [videoChatModal, setVideoChatModal] = useState(false);
  const [whatsappSender, setWhatsappSender] = useState('917014956589');
  const [videoChatTarget, setVideoChatTarget] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [apptDayTab, setApptDayTab] = useState('Today');
  const [apptFilterType, setApptFilterType] = useState('All');

  // ─── Dr. Erica Serving ────────────────────────────────────────
  const [ericaServing, setEricaServing] = useState(false);
  const [ericaPatient, setEricaPatient] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ─── Auto-open chat from context ──────────────────────────────
  useEffect(() => {
    if (activeChatPatientId) {
      const appt = appointments.find(a => a.id === activeChatPatientId || a.patientId === activeChatPatientId);
      if (appt) { setVideoChatTarget(appt); setVideoChatModal(true); }
    }
  }, [activeChatPatientId]);

  // ─── Greeting ─────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // ─── Filtered Appointments ────────────────────────────────────
  const todayAppts = useMemo(() => appointments.filter(a => a.date === TODAY_STR), [appointments, TODAY_STR]);
  const tomorrowAppts = useMemo(() => appointments.filter(a => a.date === TOMORROW_STR), [appointments, TOMORROW_STR]);
  const upcomingAppts = useMemo(() => appointments.filter(a => a.date !== TODAY_STR && a.date !== TOMORROW_STR && a.status !== 'Cancelled'), [appointments, TODAY_STR, TOMORROW_STR]);

  const filteredAppts = useMemo(() => {
    let list = apptDayTab === 'Today' ? todayAppts : apptDayTab === 'Tomorrow' ? tomorrowAppts : upcomingAppts;
    if (apptFilterType !== 'All') list = list.filter(a => a.type === apptFilterType);
    return list;
  }, [apptDayTab, apptFilterType, todayAppts, tomorrowAppts, upcomingAppts]);

  const showDateCol = apptDayTab === 'Upcoming';

  // ─── Filtered Queue ───────────────────────────────────────────
  const filteredQueue = useMemo(() => {
    if (!searchQ.trim()) return upcomingQueue;
    const q = searchQ.toLowerCase();
    return upcomingQueue.filter(p => p.name.toLowerCase().includes(q) || p.identity.toLowerCase().includes(q));
  }, [upcomingQueue, searchQ]);

  // ─── Handlers ─────────────────────────────────────────────────
  const startErica = () => {
    const next = upcomingQueue.find(q => q.status === 'Confirmed');
    if (!next) { showToast('⚠️ No confirmed patients in queue'); return; }
    setEricaServing(true); setEricaPatient(next.name);
    cancelQueuePatient(next.id);
    showToast(`🩺 Dr. Erica is now serving ${next.name}`);
  };

  const completeErica = () => {
    addToCheckout(
      { name: ericaPatient, identity: 'IC-AUTO', gender: '' },
      [{ n: 'Panadol 500mg', q: '2x daily' }, { n: 'Amoxicillin 250mg', q: '3x daily' }],
      800
    );
    setEricaServing(false); setEricaPatient('');
    showToast(`✅ ${ericaPatient} consultation complete — moved to billing`);
  };

  const cancelAppt = (id) => {
    const appt = appointments.find(a => a.id === id);
    cancelAppointment(id);
    if (appt) {
      setNotifLog(prev => [{ id: `n${Date.now()}`, patient: appt.name, msg: `Appointment cancelled for ${appt.date} at ${appt.time}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false }, ...prev]);
      showToast(`❌ ${appt.name}'s appointment cancelled`);
    }
  };

  const openReschedule = (appt) => { setRescheduleTarget(appt); setRescheduleDate(appt.date); setRescheduleTime(appt.time); setRescheduleNote(''); setRescheduleModal(true); };

  const submitReschedule = () => {
    if (!rescheduleTarget) return;
    rescheduleAppointment(rescheduleTarget.id, rescheduleDate, rescheduleTime);
    setNotifLog(prev => [{ id: `n${Date.now()}`, patient: rescheduleTarget.name, msg: `Rescheduled to ${rescheduleDate} at ${rescheduleTime}. ${rescheduleNote}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false }, ...prev]);
    setRescheduleModal(false);
    showToast(`📅 ${rescheduleTarget.name} rescheduled to ${rescheduleDate}`);
  };

  const openNotify = (appt) => {
    setNotifTarget(appt); setNotifMsg('');
    setNotifPhone(appt.phone || '');
    setNotifModal(true);
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) { showToast('⚠️ Enter a message'); return; }

    setNotifLog(prev => [{ id: `n${Date.now()}`, patient: notifTarget.name, msg: notifMsg.trim(), time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false }, ...prev]);
    setNotifModal(false);
    showToast(`⏳ Sending WhatsApp template to ${notifTarget.name}...`);

    try {
      const response = await api.post('/whatsapp/send', {
        integrated_number: whatsappSender.trim(),
        recipient_number: notifPhone.trim(),
        template: {
          body_1: notifTarget.name || 'Patient',
          body_2: `${notifTarget.date} at ${notifTarget.time}`,
          body_3: notifMsg.trim(),
          body_4: 'Dr. Catherine L.',
        }
      });
      console.log('[WhatsApp] Success:', response.data);
      showToast(`✅ WhatsApp template sent to ${notifTarget.name}!`);
    } catch (error) {
      console.error('[WhatsApp] Error:', error.response?.data || error.message);
      let errMsg = error.message;
      if (error.response?.data) {
        const data = error.response.data;
        errMsg = data.message || data.error || (typeof data === 'string' ? data : JSON.stringify(data));
      }
      showToast(`❌ MSG91: ${errMsg}`);
    }
  };

  const openVideoChat = (appt) => { setVideoChatTarget(appt); setVideoChatModal(true); };

  const sendChat = () => {
    if (!chatInput.trim() || !videoChatTarget) return;
    sendMessage(videoChatTarget.id, chatInput.trim(), 'doctor');
    setChatInput('');
  };

  const quickChat = (name) => { showToast(`💬 Opening chat with ${name}...`); setTimeout(() => router.push('/doctor/chat'), 1200); };
  const quickVideo = (id, name) => { showToast(`📹 Starting video call with ${name}...`); startVideoConsult(id); setTimeout(() => router.push('/doctor/video'), 1500); };

  // ═══════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ═══════════════════════════════════════════════════════════════
  if (isDesk) return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" />
      <Toast message={toast} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, gap: 24 }} showsVerticalScrollIndicator={false}>

        {/* ═══ HERO BAR ═══ */}
        <LinearGradient colors={['#0F172A', '#1E3A5F', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={{ borderRadius: 20, padding: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>CL</Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{greeting},</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>Dr. Catherine Lawrence</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Cardiology Specialist • MCI-12345 • LiveLong Heart Care</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Btn label="New Patient" icon={<UserPlus size={15} color="#fff" />} onPress={() => setPatientModalOpen(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
            <Btn label="New Appointment" icon={<CalendarPlus size={15} color="#fff" />} onPress={() => setApptModalOpen(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
          </View>
        </LinearGradient>

        {/* ═══ STATS ROW ═══ */}
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <StatCard icon={<Users size={20} color={C.primary} />} label="Total Patients" value={stats.totalPatients} change={`${patients.length} registered`} changeUp color={C.primary} delay={0} />
          <StatCard icon={<ClipboardList size={20} color={C.success} />} label="Today's Appointments" value={stats.todayAppointments} change={`${stats.completedToday} completed`} changeUp color={C.success} delay={100} />
          <StatCard icon={<Activity size={20} color={C.warning} />} label="Queue Pending" value={stats.pendingQueue} change={`${stats.missedQueueCount} missed`} changeUp={stats.missedQueueCount === 0} color={C.warning} delay={200} />
          <StatCard icon={<IndianRupee size={20} color={C.lavender} />} label="Revenue (Paid)" value={`₹${stats.totalRevenue.toLocaleString()}`} change={`${stats.checkoutCount} bills`} changeUp color={C.lavender} delay={300} />
        </View>

        {/* ═══ DOCTOR PROFILE ═══ */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, gap: 24 }}>
            <LinearGradient colors={['#2563EB', '#1E40AF']} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>CL</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: C.text }}>Dr. Catherine Lawrence</Text>
                <Badge label="Active Duty" color="green" />
              </View>
              <Text style={{ fontSize: 13, color: C.textMid }}>Cardiology Specialist • Reg: MCI-12345 • 12 Years Experience</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              {[
                { label: 'Fee', value: '₹800', icon: <IndianRupee size={14} color={C.primary} /> },
                { label: 'Clinic', value: 'LiveLong Heart Care', icon: <Heart size={14} color={C.danger} /> },
              ].map((item, i) => (
                <View key={i} style={{ alignItems: 'center', paddingHorizontal: 16, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>{item.icon}<Text style={{ fontSize: 11, color: C.textLight, fontWeight: '600' }}>{item.label}</Text></View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ═══ APPOINTMENTS TABLE ═══ */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ backgroundColor: C.primarySoft, borderRadius: 10, padding: 8 }}>
                <ClipboardList size={18} color={C.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>Appointments</Text>
              <View style={{ backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{filteredAppts.length}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {['Today', 'Tomorrow', 'Upcoming'].map(tab => (
                <TouchableOpacity key={tab} onPress={() => setApptDayTab(tab)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: apptDayTab === tab ? C.primary : '#F1F5F9' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: apptDayTab === tab ? '#fff' : C.textMid }}>
                    {tab} ({tab === 'Today' ? todayAppts.length : tab === 'Tomorrow' ? tomorrowAppts.length : upcomingAppts.length})
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={{ width: 1, height: 24, backgroundColor: C.border, marginHorizontal: 4 }} />
              {['All', 'Physical', 'Video'].map(f => (
                <TouchableOpacity key={f} onPress={() => setApptFilterType(f)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: apptFilterType === f ? (f === 'Physical' ? C.successSoft : f === 'Video' ? C.lavenderSoft : '#F1F5F9') : 'transparent' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: apptFilterType === f ? (f === 'Physical' ? C.success : f === 'Video' ? C.lavender : C.text) : C.textLight }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TH cols={[
            { label: 'Patient', style: { flex: 2 } },
            { label: 'Time', style: { flex: 1 } },
            ...(showDateCol ? [{ label: 'Date', style: { flex: 1 } }] : []),
            { label: 'Type', style: { flex: 0.8 } },
            { label: 'Status', style: { flex: 0.8 } },
            { label: 'Actions', style: { flex: 2.5, textAlign: 'right' } },
          ]} />

          {filteredAppts.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ClipboardList size={32} color={C.textLight} />
              <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No appointments found</Text>
            </View>
          )}

          {filteredAppts.map((a, i) => {
            const isActive = a.status === 'Active';
            const isDone = ['Cancelled', 'Completed', 'Rescheduled'].includes(a.status);
            return (
              <View key={a.id} style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14,
                borderBottomWidth: i < filteredAppts.length - 1 ? 1 : 0, borderBottomColor: C.border,
                backgroundColor: isActive ? '#F0FDF4' : i % 2 === 0 ? C.card : '#FAFBFD',
              }}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={a.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={36} />
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{a.name}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{a.identity} • {a.gender}</Text>
                  </View>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.text }}>{a.time}</Text>
                {showDateCol && <Text style={{ flex: 1, fontSize: 12, color: C.textMid }}>{a.date}</Text>}
                <View style={{ flex: 0.8 }}><Badge label={a.type} color={a.type === 'Video' ? 'purple' : 'blue'} /></View>
                <View style={{ flex: 0.8 }}><Badge label={a.status} color={a.status === 'Active' ? 'green' : a.status === 'Cancelled' ? 'red' : a.status === 'Completed' ? 'green' : a.status === 'Rescheduled' ? 'orange' : 'blue'} /></View>

                <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  {!isDone && (
                    <>
                      {!isActive && apptDayTab === 'Today' && (
                        <TouchableOpacity onPress={() => setAppointmentActive(a.id)} style={{ backgroundColor: C.successSoft, borderRadius: 7, padding: 5 }}>
                          <Check size={14} color={C.success} />
                        </TouchableOpacity>
                      )}
                      {a.type === 'Video' && (
                        <>
                          <TouchableOpacity onPress={() => openVideoChat(a)} style={{ backgroundColor: C.primarySoft, borderRadius: 7, padding: 5 }}>
                            <MessageSquare size={14} color={C.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => quickVideo(a.id, a.name)} style={{ backgroundColor: C.lavenderSoft, borderRadius: 7, padding: 5 }}>
                            <Video size={14} color={C.lavender} />
                          </TouchableOpacity>
                        </>
                      )}
                      {a.type === 'Physical' && (
                        <TouchableOpacity onPress={() => openNotify(a)} style={{ backgroundColor: C.warningSoft, borderRadius: 7, padding: 5 }}>
                          <Bell size={14} color={C.warning} />
                        </TouchableOpacity>
                      )}
                      <Btn label="Reschedule" onPress={() => openReschedule(a)} small outline color="grey" style={{ paddingHorizontal: 8, minWidth: 80 }} />
                      <Btn label="Cancel" onPress={() => cancelAppt(a.id)} small outline color="red" style={{ paddingHorizontal: 8, minWidth: 58 }} />
                    </>
                  )}
                  {isDone && <Text style={{ fontSize: 11, color: C.textLight, fontStyle: 'italic' }}>{a.status}</Text>}
                </View>
              </View>
            );
          })}
        </Card>

        {/* ═══ QUEUES (Side-by-Side) ═══ */}
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>

          {/* Upcoming Queues */}
          <View style={{ flex: 1 }}>
            <Card>
              <CardHeader title="Upcoming Queues" icon={<Users size={18} color={C.warning} />} iconBg={C.warningSoft} iconColor={C.warning} count={filteredQueue.length} />
              <TH cols={[
                { label: 'No.', style: { width: 40 } },
                { label: 'Patient', style: { flex: 1 } },
                { label: 'Status', style: { width: 95 } },
                { label: 'Actions', style: { width: 140, textAlign: 'right' } },
              ]} />

              {filteredQueue.map((q, i) => {
                const confirmed = q.status === 'Confirmed';
                return (
                  <View key={q.id} style={{
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14,
                    borderBottomWidth: i < filteredQueue.length - 1 ? 1 : 0, borderBottomColor: C.border,
                    backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
                  }}>
                    <View style={{ width: 40 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: C.primary }}>{q.id}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }} numberOfLines={1}>{q.name}</Text>
                      <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{q.identity} • {q.gender}</Text>
                    </View>
                    <View style={{ width: 95 }}><Badge label={q.status} color={confirmed ? 'green' : 'red'} /></View>
                    <View style={{ width: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <Btn label="Cancel" onPress={() => cancelQueuePatient(q.id)} outline color="red" small style={{ paddingHorizontal: 8, minWidth: 54 }} />
                      {!confirmed && <Btn label="Confirm" onPress={() => confirmQueuePatient(q.id)} color="blue" small style={{ paddingHorizontal: 8, minWidth: 58 }} />}
                      {confirmed && (
                        <>
                          <TouchableOpacity onPress={() => quickChat(q.name)} style={{ backgroundColor: C.primarySoft, borderRadius: 7, padding: 5 }}><MessageSquare size={13} color={C.primary} /></TouchableOpacity>
                          <TouchableOpacity onPress={() => quickVideo(q.id, q.name)} style={{ backgroundColor: C.primarySoft, borderRadius: 7, padding: 5 }}><Video size={13} color={C.primary} /></TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}

              {filteredQueue.length === 0 && (
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <Check size={28} color={C.success} />
                  <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No patients in queue</Text>
                </View>
              )}
            </Card>
          </View>

          {/* Missed Queues */}
          <View style={{ flex: 1 }}>
            <Card>
              <CardHeader title="Missed Queues" icon={<X size={18} color={C.danger} />} iconBg={C.dangerSoft} iconColor={C.danger} count={missedQueue.length} />
              <TH cols={[
                { label: 'Patient', style: { flex: 1.2 } },
                { label: 'Identity No.', style: { flex: 1.2 } },
                { label: 'Action', style: { flex: 1, textAlign: 'right' } },
              ]} />

              {missedQueue.map((m, i) => (
                <View key={m.id} style={{
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14,
                  borderBottomWidth: i < missedQueue.length - 1 ? 1 : 0, borderBottomColor: C.border,
                  backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
                }}>
                  <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={m.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={32} />
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{m.name}</Text>
                      <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{m.gender}</Text>
                    </View>
                  </View>
                  <Text style={{ flex: 1.2, fontSize: 12, color: C.textMid, fontWeight: '600' }}>{m.identity}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Btn label="Rejoin Queue" onPress={() => rejoinQueue(m)} small style={{ minWidth: 110 }} />
                  </View>
                </View>
              ))}

              {missedQueue.length === 0 && (
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <Check size={28} color={C.success} />
                  <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No missed queues</Text>
                </View>
              )}
            </Card>
          </View>
        </View>

        {/* ═══ CHECKOUT & BILLING ═══ */}
        <Card>
          <CardHeader title="Checkout & Billing" icon={<Check size={18} color={C.success} />} iconBg={C.successSoft} iconColor={C.success} count={checkout.length} />
          <TH cols={[
            { label: 'Patient', style: { flex: 2 } },
            { label: 'Medication', style: { flex: 3 } },
            { label: 'Amount', style: { flex: 1 } },
            { label: 'Status', style: { flex: 1 } },
            { label: 'Actions', style: { flex: 2.5, textAlign: 'right' } },
          ]} />

          {checkout.map((c, i) => (
            <View key={c.id} style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16,
              borderBottomWidth: i < checkout.length - 1 ? 1 : 0, borderBottomColor: C.border,
              backgroundColor: i % 2 === 0 ? C.card : '#FAFBFD',
            }}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar initials={c.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={34} />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{c.name}</Text>
                  <Text style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{c.identity} • {c.gender}</Text>
                </View>
              </View>
              <View style={{ flex: 3 }}>
                {c.meds.map((m, j) => (
                  <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: j < c.meds.length - 1 ? 4 : 0 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary }} />
                    <Text style={{ fontSize: 12, color: C.textMid }}>{m.n}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>({m.q})</Text>
                  </View>
                ))}
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: C.text }}>{c.amount}</Text>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => toggleCheckoutStatus(c.id)}>
                  <Badge label={c.status} color={c.status === 'Paid' ? 'green' : 'red'} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Btn label="Edit" onPress={() => showToast(`Editing ${c.name}`)} small style={{ minWidth: 60 }} />
                <Btn label="Print Bill" onPress={() => { if (typeof window !== 'undefined') window.print(); else showToast(`Printing bill for ${c.name}`); }} small outline color="grey" style={{ minWidth: 80 }} />
                <Btn label="Print MC" onPress={() => showToast(`Printing MC for ${c.name}`)} small outline color="grey" style={{ minWidth: 72 }} />
              </View>
            </View>
          ))}

          {checkout.length === 0 && (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <Check size={28} color={C.success} />
              <Text style={{ marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: '600' }}>No pending checkouts</Text>
            </View>
          )}
        </Card>

      </ScrollView>

      {/* ── MODALS ── */}
      <AddPatientModal visible={patientModalOpen} onClose={() => setPatientModalOpen(false)} onSubmit={(p) => { addPatient(p); setPatientModalOpen(false); showToast(`✅ ${p.name} added to patient registry`); }} />
      <AddAppointmentModal visible={apptModalOpen} onClose={() => setApptModalOpen(false)} patients={patients} onSubmit={(a) => { addAppointment(a); setApptModalOpen(false); showToast(`📅 Appointment booked for ${a.name}`); }} TODAY_STR={TODAY_STR} TOMORROW_STR={TOMORROW_STR} />
      <MsgModal visible={msgModal} onClose={() => setMsgModal(false)} onOpen={() => { setMsgModal(false); router.push('/doctor/chat'); }} />
      <RescheduleModal visible={rescheduleModal} onClose={() => setRescheduleModal(false)} target={rescheduleTarget} date={rescheduleDate} setDate={setRescheduleDate} time={rescheduleTime} setTime={setRescheduleTime} note={rescheduleNote} setNote={setRescheduleNote} onSubmit={submitReschedule} />
      <NotifyModal visible={notifModal} onClose={() => setNotifModal(false)} target={notifTarget} msg={notifMsg} setMsg={setNotifMsg} phone={notifPhone} setPhone={setNotifPhone} sender={whatsappSender} setSender={setWhatsappSender} onSend={sendNotification} />
      <VideoChatModal visible={videoChatModal} onClose={() => { setVideoChatModal(false); setActiveChatPatientId(null); }} target={videoChatTarget} chats={chats} input={chatInput} setInput={setChatInput} onSend={sendChat} onVideo={(id, name) => quickVideo(id, name)} isWeb={isWeb} />
    </View>
  );

  // ═══════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <Toast message={toast} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Mobile Header */}
        <LinearGradient colors={['#0F172A', '#1E3A5F', '#2563EB']} style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{greeting},</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>Dr. C. Lawrence</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Cardiology Division</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setPatientModalOpen(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 }}>
                <UserPlus size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setApptModalOpen(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 }}>
                <CalendarPlus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, height: 42 }}>
            <Search size={16} color="rgba(255,255,255,0.5)" />
            <TextInput value={searchQ} onChangeText={setSearchQ} placeholder="Search patients..." placeholderTextColor="rgba(255,255,255,0.4)" style={{ flex: 1, marginLeft: 10, color: '#fff', fontSize: 14 }} />
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 16 }}>
          {/* Mobile Stats */}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Patients', value: stats.totalPatients, color: C.primary, icon: <Users size={16} color={C.primary} /> },
              { label: 'Today', value: stats.todayAppointments, color: C.success, icon: <ClipboardList size={16} color={C.success} /> },
              { label: 'Queue', value: stats.pendingQueue, color: C.warning, icon: <Clock size={16} color={C.warning} /> },
              { label: 'Revenue', value: `₹${stats.totalRevenue}`, color: C.lavender, icon: <IndianRupee size={16} color={C.lavender} /> },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, minWidth: '45%', backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ backgroundColor: s.color + '18', borderRadius: 8, padding: 6 }}>{s.icon}</View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: C.textLight }}>{s.label}</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: C.text }}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Mobile Doctor Profile */}
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <LinearGradient colors={['#2563EB', '#1E40AF']} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>CL</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>Dr. Catherine Lawrence</Text>
                <Text style={{ fontSize: 12, color: C.textMid }}>Cardiology • MCI-12345 • ₹800</Text>
              </View>
              <Badge label="Active" color="green" />
            </View>
          </Card>

          {/* Mobile Appointments */}
          <Card>
            <CardHeader title="Appointments" icon={<ClipboardList size={16} color={C.primary} />} iconBg={C.primarySoft} count={filteredAppts.length} />
            <View style={{ flexDirection: 'row', padding: 12, gap: 6 }}>
              {['Today', 'Tomorrow', 'Upcoming'].map(tab => (
                <TouchableOpacity key={tab} onPress={() => setApptDayTab(tab)} style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: apptDayTab === tab ? C.primary : '#F1F5F9', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: apptDayTab === tab ? '#fff' : C.textMid }}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}>
              {['All', 'Physical', 'Video'].map(f => (
                <TouchableOpacity key={f} onPress={() => setApptFilterType(f)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: apptFilterType === f ? C.primarySoft : 'transparent' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: apptFilterType === f ? C.primary : C.textLight }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredAppts.map((a, i) => (
              <View key={a.id} style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <Avatar initials={a.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{a.name}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>{a.time} • {a.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={a.type} color={a.type === 'Video' ? 'purple' : 'blue'} />
                    <Badge label={a.status} color={a.status === 'Active' ? 'green' : a.status === 'Cancelled' ? 'red' : 'blue'} />
                  </View>
                </View>
                {!['Cancelled', 'Completed', 'Rescheduled'].includes(a.status) && (
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {a.type === 'Video' && <Btn label="Chat" onPress={() => openVideoChat(a)} small style={{ minWidth: 60 }} icon={<MessageSquare size={12} color="#fff" />} />}
                    {a.type === 'Video' && <Btn label="Video" onPress={() => quickVideo(a.id, a.name)} small color="purple" icon={<Video size={12} color="#fff" />} />}
                    {a.type === 'Physical' && <Btn label="Notify" onPress={() => openNotify(a)} small color="green" icon={<Bell size={12} color="#fff" />} />}
                    <Btn label="Reschedule" onPress={() => openReschedule(a)} small outline color="grey" />
                    <Btn label="Cancel" onPress={() => cancelAppt(a.id)} small outline color="red" />
                  </View>
                )}
              </View>
            ))}

            {filteredAppts.length === 0 && (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: C.textLight }}>No appointments</Text>
              </View>
            )}
          </Card>

          {/* Mobile Checkout */}
          <Card>
            <CardHeader title="Checkout & Billing" icon={<Check size={16} color={C.success} />} iconBg={C.successSoft} count={checkout.length} />
            {checkout.map((c, i) => (
              <View key={c.id} style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Avatar initials={c.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>{c.identity}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>{c.amount}</Text>
                  <TouchableOpacity onPress={() => toggleCheckoutStatus(c.id)}><Badge label={c.status} color={c.status === 'Paid' ? 'green' : 'red'} /></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Btn label="Edit" onPress={() => showToast(`Editing ${c.name}`)} small style={{ flex: 1 }} />
                  <Btn label="Print Bill" onPress={() => { if (typeof window !== 'undefined') window.print(); else showToast('Printing...'); }} small outline color="grey" style={{ flex: 1 }} />
                </View>
              </View>
            ))}
          </Card>

          {/* Mobile Upcoming Queues */}
          <Card>
            <CardHeader title="Upcoming Queues" icon={<Users size={16} color={C.warning} />} iconBg={C.warningSoft} iconColor={C.warning} count={filteredQueue.length} />
            {filteredQueue.map((q, i) => (
              <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.primary }}>{q.id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{q.name}</Text>
                  <Text style={{ fontSize: 11, color: C.textLight }}>{q.identity}</Text>
                </View>
                <Badge label={q.status} color={q.status === 'Confirmed' ? 'green' : 'red'} />
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
                  <Btn label="Cancel" onPress={() => cancelQueuePatient(q.id)} outline color="red" small style={{ paddingHorizontal: 6 }} />
                  {q.status !== 'Confirmed' && <Btn label="Confirm" onPress={() => confirmQueuePatient(q.id)} small style={{ paddingHorizontal: 6 }} />}
                </View>
              </View>
            ))}
            {filteredQueue.length === 0 && <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ fontSize: 12, color: C.textLight }}>No patients in queue</Text></View>}
          </Card>

          {/* Mobile Missed Queues */}
          <Card>
            <CardHeader title="Missed Queues" icon={<X size={16} color={C.danger} />} iconBg={C.dangerSoft} iconColor={C.danger} count={missedQueue.length} />
            {missedQueue.map((m, i) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border }}>
                <Avatar initials={m.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={30} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{m.name}</Text>
                  <Text style={{ fontSize: 11, color: C.textLight }}>{m.identity}</Text>
                </View>
                <Btn label="Rejoin" onPress={() => rejoinQueue(m)} small style={{ paddingHorizontal: 10 }} />
              </View>
            ))}
            {missedQueue.length === 0 && <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ fontSize: 12, color: C.textLight }}>No missed queues</Text></View>}
          </Card>
        </View>
      </ScrollView>

      {/* ── ALL MODALS (MOBILE) ── */}
      <AddPatientModal visible={patientModalOpen} onClose={() => setPatientModalOpen(false)} onSubmit={(p) => { addPatient(p); setPatientModalOpen(false); showToast(`✅ ${p.name} added`); }} />
      <AddAppointmentModal visible={apptModalOpen} onClose={() => setApptModalOpen(false)} patients={patients} onSubmit={(a) => { addAppointment(a); setApptModalOpen(false); showToast(`📅 ${a.name} booked`); }} TODAY_STR={TODAY_STR} TOMORROW_STR={TOMORROW_STR} />
      <MsgModal visible={msgModal} onClose={() => setMsgModal(false)} onOpen={() => { setMsgModal(false); router.push('/doctor/chat'); }} />
      <RescheduleModal visible={rescheduleModal} onClose={() => setRescheduleModal(false)} target={rescheduleTarget} date={rescheduleDate} setDate={setRescheduleDate} time={rescheduleTime} setTime={setRescheduleTime} note={rescheduleNote} setNote={setRescheduleNote} onSubmit={submitReschedule} />
      <NotifyModal visible={notifModal} onClose={() => setNotifModal(false)} target={notifTarget} msg={notifMsg} setMsg={setNotifMsg} phone={notifPhone} setPhone={setNotifPhone} sender={whatsappSender} setSender={setWhatsappSender} onSend={sendNotification} />
      <VideoChatModal visible={videoChatModal} onClose={() => { setVideoChatModal(false); setActiveChatPatientId(null); }} target={videoChatTarget} chats={chats} input={chatInput} setInput={setChatInput} onSend={sendChat} onVideo={(id, name) => quickVideo(id, name)} isWeb={isWeb} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: ADD PATIENT
// ═══════════════════════════════════════════════════════════════════
function AddPatientModal({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [identity, setIdentity] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const reset = () => { setName(''); setPhone(''); setIdentity(''); setGender('Male'); setAge(''); setBloodGroup(''); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!phone.trim()) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), identity: identity.trim(), gender, age: parseInt(age) || 0, bloodGroup: bloodGroup.trim() });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ backgroundColor: C.card, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <UserPlus size={20} color="#fff" />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>New Patient</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </LinearGradient>

          <View style={{ padding: 24, gap: 16 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Patient Name *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Full name" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Phone Number *</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="91XXXXXXXXXX" keyboardType="phone-pad" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Identity Card No.</Text>
              <TextInput value={identity} onChangeText={setIdentity} placeholder="AADH-XXXX" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Male', 'Female'].map(g => (
                    <TouchableOpacity key={g} onPress={() => setGender(g)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: gender === g ? C.primary : '#F1F5F9', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: gender === g ? '#fff' : C.textMid }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ width: 80 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Age</Text>
                <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, textAlign: 'center' }} />
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Blood Group</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <TouchableOpacity key={bg} onPress={() => setBloodGroup(bg)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: bloodGroup === bg ? C.danger : '#F1F5F9' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: bloodGroup === bg ? '#fff' : C.textMid }}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Btn label="Cancel" onPress={() => { reset(); onClose(); }} outline color="grey" style={{ flex: 1 }} />
              <Btn label="✅ Register Patient" onPress={handleSubmit} style={{ flex: 2 }} disabled={!name.trim() || !phone.trim()} />
            </View>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: ADD APPOINTMENT
// ═══════════════════════════════════════════════════════════════════
function AddAppointmentModal({ visible, onClose, patients, onSubmit, TODAY_STR, TOMORROW_STR }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Physical');
  const [complaint, setComplaint] = useState('');

  const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
  }, [patients, patientSearch]);

  const reset = () => { setSelectedPatient(null); setPatientSearch(''); setShowPatientList(false); setDate('Today'); setTime(''); setType('Physical'); setComplaint(''); };

  const actualDate = date === 'Today' ? TODAY_STR : date === 'Tomorrow' ? TOMORROW_STR : date;

  const handleSubmit = () => {
    if (!selectedPatient || !time) return;
    onSubmit({
      patientId: selectedPatient.id,
      name: selectedPatient.name,
      phone: selectedPatient.phone,
      identity: selectedPatient.identity,
      gender: selectedPatient.gender,
      date: actualDate,
      time,
      type,
      complaint: complaint.trim(),
    });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ backgroundColor: C.card, borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90%', overflow: 'hidden' }}>
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CalendarPlus size={20} color="#fff" />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>New Appointment</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}><X size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </LinearGradient>

          <ScrollView style={{ padding: 24 }} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
            {/* Patient Selection */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Select Patient *</Text>
              {selectedPatient ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.primarySoft, padding: 12, borderRadius: 10, gap: 10 }}>
                  <Avatar initials={selectedPatient.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{selectedPatient.name}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>{selectedPatient.phone} • {selectedPatient.gender}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedPatient(null); setShowPatientList(true); }}><X size={18} color={C.textLight} /></TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TextInput value={patientSearch} onChangeText={(t) => { setPatientSearch(t); setShowPatientList(true); }} onFocus={() => setShowPatientList(true)} placeholder="Search patient by name or phone..." style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
                  {showPatientList && (
                    <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, marginTop: 4, maxHeight: 160, overflow: 'hidden' }}>
                      <ScrollView nestedScrollEnabled>
                        {filteredPatients.map(p => (
                          <TouchableOpacity key={p.id} onPress={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(''); }}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 }}>
                            <Avatar initials={p.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={28} />
                            <View>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{p.name}</Text>
                              <Text style={{ fontSize: 10, color: C.textLight }}>{p.phone} • {p.gender} • {p.bloodGroup}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredPatients.length === 0 && <Text style={{ padding: 12, fontSize: 12, color: C.textLight, textAlign: 'center' }}>No patients found</Text>}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Date Selection */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Date *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Today', 'Tomorrow'].map(d => (
                  <TouchableOpacity key={d} onPress={() => setDate(d)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: date === d ? C.primary : '#F1F5F9', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: date === d ? '#fff' : C.textMid }}>{d}</Text>
                    <Text style={{ fontSize: 10, color: date === d ? 'rgba(255,255,255,0.7)' : C.textLight }}>{d === 'Today' ? TODAY_STR : TOMORROW_STR}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {date !== 'Today' && date !== 'Tomorrow' && (
                <TextInput value={date} onChangeText={setDate} placeholder="DD Mon YYYY" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, marginTop: 8 }} />
              )}
            </View>

            {/* Time Selection */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Time Slot *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {timeSlots.map(t => (
                  <TouchableOpacity key={t} onPress={() => setTime(t)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: time === t ? C.primary : '#F1F5F9', minWidth: 80, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: time === t ? '#fff' : C.textMid }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Appointment Type</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Physical', 'Video'].map(tp => (
                  <TouchableOpacity key={tp} onPress={() => setType(tp)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: type === tp ? (tp === 'Physical' ? C.success : C.lavender) : '#F1F5F9', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    {tp === 'Physical' ? <Stethoscope size={16} color={type === tp ? '#fff' : C.textMid} /> : <Video size={16} color={type === tp ? '#fff' : C.textMid} />}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: type === tp ? '#fff' : C.textMid }}>{tp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Complaint */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Complaint / Notes</Text>
              <TextInput value={complaint} onChangeText={setComplaint} placeholder="Brief description..." multiline numberOfLines={3} style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, textAlignVertical: 'top', minHeight: 70 }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Btn label="Cancel" onPress={() => { reset(); onClose(); }} outline color="grey" style={{ flex: 1 }} />
              <Btn label="📅 Book Appointment" onPress={handleSubmit} style={{ flex: 2 }} disabled={!selectedPatient || !time} />
            </View>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: RESCHEDULE
// ═══════════════════════════════════════════════════════════════════
function RescheduleModal({ visible, onClose, target, date, setDate, time, setTime, note, setNote, onSubmit }) {
  if (!target) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ backgroundColor: C.card, borderRadius: 20, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>📅 Reschedule</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </LinearGradient>
          <View style={{ padding: 24, gap: 16 }}>
            <View style={{ backgroundColor: C.primarySoft, padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{target.name}</Text>
              <Text style={{ fontSize: 11, color: C.textLight }}>Current: {target.date} at {target.time}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>New Date</Text>
              <TextInput value={date} onChangeText={setDate} style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>New Time</Text>
              <TextInput value={time} onChangeText={setTime} style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text }} />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Note (optional)</Text>
              <TextInput value={note} onChangeText={setNote} placeholder="Reason for rescheduling..." multiline style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, minHeight: 60, textAlignVertical: 'top' }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Btn label="Cancel" onPress={onClose} outline color="grey" style={{ flex: 1 }} />
              <Btn label="📅 Reschedule & Notify" onPress={onSubmit} style={{ flex: 2 }} />
            </View>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: NOTIFY (WHATSAPP)
// ═══════════════════════════════════════════════════════════════════
function NotifyModal({ visible, onClose, target, msg, setMsg, phone, setPhone, sender, setSender, onSend }) {
  if (!target) return null;
  const templates = [
    'Please arrive 15 minutes early for your appointment.',
    'Kindly bring your previous reports and prescriptions.',
    'Your appointment has been confirmed. See you soon!',
    'Your appointment has been rescheduled. Check the new timing.',
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ backgroundColor: C.card, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>🔔 Notify Patient</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </LinearGradient>
          <View style={{ padding: 24, gap: 16 }}>
            <View style={{ backgroundColor: C.primarySoft, padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>To: {target.name} • {target.date} {target.time}</Text>
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Quick Templates</Text>
              <View style={{ gap: 6 }}>
                {templates.map((t, i) => (
                  <TouchableOpacity key={i} onPress={() => setMsg(t)} style={{ backgroundColor: msg === t ? C.primarySoft : '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: msg === t ? C.primary : C.border }}>
                    <Text style={{ fontSize: 12, color: msg === t ? C.primary : C.textMid }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>



            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 6 }}>Custom Message</Text>
              <TextInput value={msg} onChangeText={setMsg} placeholder="Type your message..." multiline style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: 'top' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Btn label="Cancel" onPress={onClose} outline color="grey" style={{ flex: 1 }} />
              <Btn label="📩 Send WhatsApp" onPress={onSend} color="green" style={{ flex: 2 }} disabled={!msg.trim()} />
            </View>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: VIDEO CHAT
// ═══════════════════════════════════════════════════════════════════
function VideoChatModal({ visible, onClose, target, chats, input, setInput, onSend, onVideo, isWeb }) {
  const scrollRef = useRef(null);
  const messages = target ? (chats[target.id] || []) : [];

  useEffect(() => { if (scrollRef.current) setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100); }, [messages.length]);

  if (!visible || !target) return null;

  const containerStyle = isWeb
    ? { position: 'absolute', bottom: 20, right: 20, width: 380, height: 520, backgroundColor: C.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', zIndex: 9000 }
    : { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, zIndex: 9000 };

  return (
    <View style={containerStyle}>
      <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar initials={target.name.split(' ').map(w => w[0]).join('').substring(0, 2)} size={32} />
          <View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{target.name}</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{target.date} • {target.time}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {target.type === 'Video' && (
            <TouchableOpacity onPress={() => onVideo(target.id, target.name)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 7 }}>
              <Video size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 7 }}>
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={{ flex: 1, padding: 14 }} contentContainerStyle={{ gap: 8 }}>
        {messages.map((m) => {
          const isDoc = m.sender === 'doctor';
          return (
            <View key={m.id} style={{ alignSelf: isDoc ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <View style={{ backgroundColor: isDoc ? C.primary : '#F1F5F9', padding: 10, borderRadius: 14, borderBottomRightRadius: isDoc ? 4 : 14, borderBottomLeftRadius: isDoc ? 14 : 4 }}>
                <Text style={{ fontSize: 13, color: isDoc ? '#fff' : C.text, lineHeight: 18 }}>{m.text}</Text>
              </View>
              <Text style={{ fontSize: 10, color: C.textLight, marginTop: 3, alignSelf: isDoc ? 'flex-end' : 'flex-start' }}>{m.timestamp}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 8 }}>
        <TextInput value={input} onChangeText={setInput} placeholder="Type a message..."
          onSubmitEditing={onSend} returnKeyType="send"
          style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border }} />
        <TouchableOpacity onPress={onSend} style={{ backgroundColor: C.primary, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL: MESSAGES CENTER
// ═══════════════════════════════════════════════════════════════════
function MsgModal({ visible, onClose, onOpen }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ backgroundColor: C.card, borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>💬 Messages</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </LinearGradient>
          <View style={{ padding: 24, gap: 16, alignItems: 'center' }}>
            <MessageSquare size={40} color={C.primary} />
            <Text style={{ fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 22 }}>Chat threads available for confirmed patients. Open the Messaging View to begin.</Text>
            <Btn label="Open Messaging View" onPress={onOpen} style={{ width: '100%' }} />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}
