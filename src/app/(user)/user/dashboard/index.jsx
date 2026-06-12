import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Platform, TouchableOpacity,
  TextInput, StatusBar, Modal, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useDoctor } from '../../../../store/DoctorContext';
import { router } from 'expo-router';
import { normalizePhone } from '../../../../utils/roomUtils';

// ── LiveLong Brand Tokens ─────────────────────────────────────────────────────
const C = {
  blue:        '#0066FF',
  blueDark:    '#004DD9',
  blueMid:     '#0052CC',
  blueSoft:    '#E8F0FF',
  teal:        '#00B3A4',
  tealDark:    '#008C80',
  tealSoft:    '#E0FAF7',
  purple:      '#7C3AED',
  purpleSoft:  '#F0EBFF',
  amber:       '#F59E0B',
  amberSoft:   '#FFF8E7',
  red:         '#EF4444',
  redSoft:     '#FFF0F0',
  green:       '#16A34A',
  greenSoft:   '#F0FDF4',
  text:        '#0D1829',
  textMid:     '#4A5568',
  textLight:   '#94A3B8',
  border:      '#E4E9F2',
  borderLight: '#F0F4FB',
  bg:          '#F3F6FD',
  card:        '#FFFFFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const isVideo    = (a) => a.type === 'video';
const isPhysical = (a) => a.type === 'physical' || a.type === 'in-person';

// ── Greeting ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ s, isMob }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 420, delay: s.delay }}
    style={{ flex: 1, minWidth: 0 }}
  >
    <TouchableOpacity
      activeOpacity={s.href ? 0.82 : 1}
      onPress={s.href ? () => router.push(s.href) : undefined}
      style={{
        backgroundColor: C.card,
        borderRadius: 18,
        padding: isMob ? 12 : 16,
        minHeight: isMob ? 100 : 120, // proper touch target height
        shadowColor: s.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
      }}
    >
      {/* Colored left strip */}
      <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: s.color, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} />
      <View style={{ paddingLeft: isMob ? 6 : 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMob ? 6 : 8 }}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={{ fontSize: isMob ? 9 : 10, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.7 }} numberOfLines={1}>{s.title}</Text>
            {s.badge && (
              <View style={{ alignSelf: 'flex-start', marginTop: 3, backgroundColor: '#FFF3CD', borderColor: '#FFC107', borderWidth: 1, borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 7, fontWeight: '800', color: '#856404' }}>{s.badge}</Text>
              </View>
            )}
          </View>
          <View style={{ width: isMob ? 30 : 38, height: isMob ? 30 : 38, borderRadius: isMob ? 9 : 12, backgroundColor: s.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={s.icon} size={isMob ? 13 : 17} color={s.color} />
          </View>
        </View>
        <Text style={{ fontSize: isMob ? 22 : 28, fontWeight: '900', color: C.text, letterSpacing: -1 }}>{s.count}</Text>
        <Text style={{ fontSize: isMob ? 9 : 10, color: C.textLight, marginTop: 1, fontWeight: '500' }}>{s.sub}</Text>
        {s.href && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: isMob ? 8 : 10, paddingTop: isMob ? 7 : 9, borderTopWidth: 1, borderTopColor: C.borderLight }}>
            <Text style={{ fontSize: isMob ? 10 : 11, fontWeight: '700', color: s.color }}>View all</Text>
            <Feather name="arrow-right" size={10} color={s.color} style={{ marginLeft: 2 }} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  </MotiView>
);

// ── QuickBtn ──────────────────────────────────────────────────────────────────
const QuickBtn = ({ label, icon, color, softColor, onPress, compact }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{ alignItems: 'center', gap: compact ? 6 : 8, minWidth: compact ? 60 : 72, minHeight: 44 }}
  >
    <View style={{
      width: compact ? 50 : 60, height: compact ? 50 : 60,
      borderRadius: compact ? 16 : 20,
      backgroundColor: softColor,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: color, shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.13, shadowRadius: 7, elevation: 3,
    }}>
      <Feather name={icon} size={compact ? 20 : 24} color={color} />
    </View>
    <Text style={{ fontSize: compact ? 9 : 10, fontWeight: '700', color: C.textMid, textAlign: 'center', lineHeight: 13 }}>{label}</Text>
  </TouchableOpacity>
);

// ── Appointment Card ──────────────────────────────────────────────────────────
const ApptCard = ({ appt }) => {
  const video      = isVideo(appt);
  const accent     = video ? C.blue : C.teal;
  const accentSoft = video ? C.blueSoft : C.tealSoft;
  const typeLabel  = video ? 'Video Call' : 'Physical Visit';
  const typeIcon   = video ? 'video' : 'map-pin';

  return (
    <View style={{
      backgroundColor: C.bg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: accent + '18',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>{appt.service || typeLabel}</Text>
          <Text style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{appt.complaint || '—'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: accentSoft, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: accent + '30' }}>
          <Feather name={typeIcon} size={10} color={accent} />
          <Text style={{ fontSize: 10, fontWeight: '800', color: accent }}>{typeLabel}</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: C.border, marginBottom: 10 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="calendar" size={12} color={accent} />
          </View>
          <View>
            <Text style={{ fontSize: 9, color: C.textLight, fontWeight: '700', textTransform: 'uppercase' }}>Schedule</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.textMid }}>{appt.date || 'Today'} · {appt.time}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="user" size={12} color={C.teal} />
          </View>
          <View>
            <Text style={{ fontSize: 9, color: C.textLight, fontWeight: '700', textTransform: 'uppercase' }}>Doctor</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.textMid }}>Dr. Catherine</Text>
          </View>
        </View>
      </View>
      {appt.status !== 'Completed' && (() => {
        const isPending = appt.status === 'Pending';
        const isRejected = appt.status === 'Rejected' || appt.status === 'Cancelled';
        const bgCol = isPending ? C.amberSoft : (isRejected ? C.redSoft : (video ? C.blueSoft : C.greenSoft));
        const borderCol = isPending ? C.amber : (isRejected ? C.red : (video ? C.blue : C.green));
        const textCol = isPending ? C.amber : (isRejected ? C.red : (video ? C.blueMid : C.green));
        const statusText = isPending 
          ? 'Pending Approval · Awaiting doctor confirmation' 
          : (isRejected ? 'Rejected/Cancelled · Please schedule another slot' : (video ? 'Confirmed · Doctor will initiate call at scheduled time' : `Confirmed · LiveLong Clinic · ${appt.date}`));
        return (
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: bgCol, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 7, borderWidth: 1, borderColor: borderCol + '25' }}>
            <MotiView from={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 800, loop: true }} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: borderCol }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: textCol, flex: 1 }}>
              {statusText}
            </Text>
          </View>
        );
      })()}
    </View>
  );
};

// ── Timeline Item ─────────────────────────────────────────────────────────────
const TimelineItem = ({ icon, color, title, desc, time, last }) => (
  <View style={{ flexDirection: 'row', gap: 12, marginBottom: last ? 0 : 18 }}>
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color + '25' }}>
        <Feather name={icon} size={14} color={color} />
      </View>
      {!last && <View style={{ width: 1.5, flex: 1, backgroundColor: C.border, marginTop: 4 }} />}
    </View>
    <View style={{ flex: 1, paddingBottom: last ? 0 : 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 }}>{title}</Text>
        <Text style={{ fontSize: 10, color: C.textLight, fontWeight: '600' }}>{time}</Text>
      </View>
      <Text style={{ fontSize: 11, color: C.textMid, marginTop: 2, lineHeight: 16 }}>{desc}</Text>
    </View>
  </View>
);

// ── Card shell ────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <View style={{
    backgroundColor: C.card, borderRadius: 22, padding: 20,
    shadowColor: '#004DD9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 18, elevation: 4,
    ...style,
  }}>
    {children}
  </View>
);

// ── Section Block (Video / Physical) ─────────────────────────────────────────
const SectionBlock = ({ color, colorDark, icon, title, count, tag, children, infoText }) => (
  <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: C.card, marginBottom: 20, elevation: 5, shadowColor: color, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}>
    <LinearGradient colors={[colorDark, color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon} size={16} color="#fff" />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>{title}</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>{count} upcoming · {tag}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{tag.toUpperCase()}</Text>
      </View>
    </LinearGradient>
    <View style={{ backgroundColor: C.card, padding: 16 }}>
      {children}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: color === C.blue ? C.blueSoft : C.tealSoft, borderRadius: 11, padding: 10, borderWidth: 1, borderColor: color + '22', marginTop: children ? 8 : 0 }}>
        <Feather name="info" size={13} color={color} style={{ marginTop: 1 }} />
        <Text style={{ fontSize: 10, color: color === C.blue ? C.blueMid : C.tealDark, flex: 1, lineHeight: 15, fontWeight: '500' }}>{infoText}</Text>
      </View>
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function UserDashboard() {
  const { appointments, chats, sendMessage, patients, prescriptions } = useDoctor();
  const { width: W } = useWindowDimensions(); // reactive on every resize
  const [currentUser, setCurrentUser] = useState(null);
  const [chatOpen, setChatOpen]     = useState(false);
  const [chatInput, setChatInput]   = useState('');
  const [dismissedNotif, setDismissedNotif] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('current_user')
      .then(s => { if (s) setCurrentUser(JSON.parse(s)); })
      .catch(() => {});
  }, []);

  const isWeb  = Platform.OS === 'web';
  // True responsive breakpoints — work on web AND native
  const isMob  = W < 600;
  const isTab  = W >= 600 && W < 1100;

  const getPatientId = () => {
    if (!currentUser || !currentUser.phone) return 'p1';
    const normUserPhone = normalizePhone(currentUser.phone);
    const matched = patients.find(p => normalizePhone(p.phone) === normUserPhone);
    return matched ? matched.id : 'p1';
  };

  const patientId      = getPatientId();
  const patientMsgs    = patientId && chats[patientId] ? chats[patientId] : [];
  const patientAppts   = patientId ? appointments.filter(a => a.patientId === patientId && a.status !== 'Rejected') : [];
  const videoAppts     = patientAppts.filter(a => isVideo(a)    && a.status !== 'Completed');
  const physicalAppts  = patientAppts.filter(a => isPhysical(a) && a.status !== 'Completed');
  const upcomingCount  = patientAppts.filter(a => a.status !== 'Completed' && a.status !== 'Rejected' && a.status !== 'Cancelled').length;
  const todayAppt      = patientAppts.find(a => a.status !== 'Completed' && a.status !== 'Rejected' && a.status !== 'Cancelled');

  const lastMsg   = patientMsgs.length > 0 ? patientMsgs[patientMsgs.length - 1] : null;
  const hasNewMsg = lastMsg && lastMsg.sender === 'doctor';

  useEffect(() => {
    if (lastMsg?.sender === 'doctor') setDismissedNotif(false);
  }, [lastMsg?.id, lastMsg?.sender]);

  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => chatScrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [patientMsgs.length, chatOpen]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !patientId) return;
    sendMessage(patientId, chatInput.trim(), 'patient');
    setChatInput('');
  };

  const greeting = getGreeting();

  // Compute active prescriptions dynamically
  const userPrescriptions = prescriptions.filter(p => p.patientId === patientId);
  const activePrescriptionsCount = userPrescriptions.filter(p => {
    return p.details.some(med => {
      const durationDays = parseInt(med.duration) || 5;
      const prescriptionDate = new Date(p.date);
      const expiryDate = new Date(prescriptionDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      return expiryDate >= new Date();
    });
  }).length;

  // ── Stat data ───────────────────────────────────────────────────────────────
  const stats = [
    { title: 'Appointments', count: upcomingCount || 0, sub: 'Upcoming', icon: 'calendar',    color: C.blue,   soft: C.blueSoft,   href: '/user/appointments/appointment-list', delay: 0 },
    { title: 'Prescriptions', count: activePrescriptionsCount, sub: 'Active',   icon: 'file-text',   color: C.teal,   soft: C.tealSoft,   href: '/user/prescriptions/prescription-list', delay: 60 },
    { title: 'Lab Reports',   count: 1,                 sub: 'Pending',  icon: 'activity',    color: C.amber,  soft: C.amberSoft,  href: '/user/lab-reports/lab-report-list', badge: 'New', delay: 120 },
    { title: 'Invoices',      count: '₹0',              sub: 'Cleared',  icon: 'credit-card', color: C.green,  soft: C.greenSoft,  href: '/user/invoices/invoice-list', delay: 180 },
  ];

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Book\nAppointment', icon: 'plus-circle',   color: C.blue,   soft: C.blueSoft,   onPress: () => router.push('/user/appointments/add-appointment') },
    { label: 'Prescriptions',    icon: 'file-text',      color: C.teal,   soft: C.tealSoft,   onPress: () => router.push('/user/prescriptions/prescription-list') },
    { label: 'Lab\nReports',     icon: 'activity',       color: C.amber,  soft: C.amberSoft,  onPress: () => router.push('/user/lab-reports/lab-report-list') },
    { label: 'Med\nTracker',     icon: 'tablet',         color: C.purple, soft: C.purpleSoft, onPress: () => router.push('/user/medication/medication-list') },
    { label: 'Order\nMeds',      icon: 'shopping-cart',  color: C.green,  soft: C.greenSoft,  onPress: () => router.push('/user/medication/add-medication') },
    { label: 'Chat\nDoctor',     icon: 'message-circle', color: C.blue,   soft: C.blueSoft,   onPress: () => setChatOpen(true) },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Stats Grid — 2-col on mobile (360–600px), 4-col on larger
  // ──────────────────────────────────────────────────────────────────────────
  const renderStats = () => {
    // Mobile: 2 equal columns with 12px gap inside 16px padding (total H padding 32px)
    // Tablet/Desktop: flexbox row fills space evenly
    const gap = isMob ? 12 : 14;
    return (
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        marginBottom: isMob ? 14 : 20,
      }}>
        {stats.map((s) => (
          <View
            key={s.title}
            style={{
              // On mobile: 2 per row. On larger screens: flex-grow to fill row
              flexBasis: isMob ? `${(100 - gap / (W - 32) * 100) / 2}%` : undefined,
              flex: isMob ? undefined : 1,
              minWidth: isMob ? 0 : 140,
            }}
          >
            <StatCard s={s} isMob={isMob} />
          </View>
        ))}
      </View>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Quick Actions
  // ──────────────────────────────────────────────────────────────────────────
  const renderQuickActions = () => (
    <Card style={{ marginBottom: isMob ? 14 : 20, padding: isMob ? 16 : 20 }}>
      <Text style={{ fontSize: isMob ? 13 : 15, fontWeight: '900', color: C.text, marginBottom: isMob ? 12 : 16, letterSpacing: -0.2 }}>Quick Actions</Text>
      {isMob ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingRight: 6 }}
        >
          {quickActions.map((q, i) => (
            <QuickBtn key={i} label={q.label} icon={q.icon} color={q.color} softColor={q.soft} onPress={q.onPress} compact={true} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {quickActions.map((q, i) => (
            <QuickBtn key={i} label={q.label} icon={q.icon} color={q.color} softColor={q.soft} onPress={q.onPress} compact={false} />
          ))}
        </View>
      )}
    </Card>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Video Section
  // ──────────────────────────────────────────────────────────────────────────
  const renderVideoSection = () => (
    <SectionBlock
      color={C.blue} colorDark={C.blueDark}
      icon="video" title="Video Consultations"
      count={videoAppts.length} tag="Live Ready"
      infoText="Your doctor initiates the video call. An incoming call screen will appear automatically at your appointment time."
    >
      {videoAppts.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Feather name="video-off" size={22} color={C.blue} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.textMid }}>No video sessions</Text>
          <TouchableOpacity onPress={() => router.push('/user/appointments/add-appointment')} style={{ marginTop: 12, backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="plus" size={13} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Book Video Consultation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        videoAppts.map((a, i) => <ApptCard key={i} appt={a} />)
      )}
    </SectionBlock>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Physical Section
  // ──────────────────────────────────────────────────────────────────────────
  const renderPhysicalSection = () => (
    <SectionBlock
      color={C.teal} colorDark={C.tealDark}
      icon="map-pin" title="Physical Appointments"
      count={physicalAppts.length} tag="In-Person"
      infoText="LiveLong Health Clinic · Ground Floor, Medical Tower. Please bring your Aadhaar card and prescription papers."
    >
      {physicalAppts.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Feather name="map-pin" size={22} color={C.teal} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.textMid }}>No clinic visits</Text>
          <Text style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>Book an in-person appointment at LiveLong clinic.</Text>
        </View>
      ) : (
        physicalAppts.map((a, i) => <ApptCard key={i} appt={a} />)
      )}
    </SectionBlock>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Doctor Card
  // ──────────────────────────────────────────────────────────────────────────
  const renderDoctorCard = () => (
    <Card style={{ marginBottom: isMob ? 16 : 0 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="user" size={15} color={C.blue} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.text, letterSpacing: -0.2 }}>Your Doctor</Text>
        </View>
        <TouchableOpacity onPress={() => setChatOpen(true)}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue }}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Doctor info row */}
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: C.bg, borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <LinearGradient colors={[C.blueDark, C.blue]} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>CL</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.text }}>Dr. Catherine Lawrence</Text>
          <Text style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>Senior Cardiologist · LiveLong</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <MotiView from={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 800, loop: true }} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.teal }}>Available for chat</Text>
          </View>
        </View>
        {/* Rating pill */}
        <View style={{ backgroundColor: '#FFF8E7', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' + '40' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: C.amber }}>★</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', color: C.amber }}>4.9</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { label: '12+ Yrs', sub: 'Experience' },
          { label: '2.4K+', sub: 'Patients' },
          { label: '98%', sub: 'Satisfaction' },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 12, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: C.borderLight }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: C.blue }}>{s.label}</Text>
            <Text style={{ fontSize: 9, color: C.textLight, fontWeight: '600', marginTop: 2 }}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => setChatOpen(true)} style={{ flex: 1, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Feather name="message-circle" size={14} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/user/appointments/add-appointment')} style={{ flex: 1, backgroundColor: C.tealSoft, borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.teal + '35' }}>
          <Feather name="calendar" size={14} color={C.teal} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.teal }}>Book Visit</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Recent Activity Timeline
  // ──────────────────────────────────────────────────────────────────────────
  const renderTimeline = () => (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="clock" size={15} color={C.purple} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '900', color: C.text, letterSpacing: -0.2 }}>Recent Activity</Text>
      </View>
      <TimelineItem icon="file-text"    color={C.teal}   title="Prescription updated"  desc="Dr. Catherine renewed your medication plan."                                  time="Today" />
      <TimelineItem icon="activity"     color={C.amber}  title="Lab report ready"       desc="Blood work results available in Lab Reports."                                time="Yesterday" />
      <TimelineItem icon="video"        color={C.blue}   title="Video consult booked"   desc={`Session confirmed for ${patientAppts[0]?.time || '12:00 PM'} today.`}      time="2 days ago" />
      <TimelineItem icon="check-circle" color={C.green}  title="Profile verified"        desc="Aadhaar-linked health profile is active."                                    time="Last week" last />
    </Card>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Message Notification Banner
  // ──────────────────────────────────────────────────────────────────────────
  const renderMsgNotif = () => hasNewMsg && !chatOpen && !dismissedNotif ? (
    <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }}
      style={{
        backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
        paddingVertical: 10, paddingHorizontal: 14,
        marginBottom: isMob ? 14 : 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: C.blue, shadowOpacity: 0.06, shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
        borderLeftWidth: 4, borderLeftColor: C.blue,
      }}
    >
      <TouchableOpacity onPress={() => setChatOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 8 }} activeOpacity={0.8}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="message-square" size={16} color={C.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.text }}>New message · Dr. Catherine</Text>
          <Text style={{ fontSize: 11, color: C.textMid, marginTop: 1 }} numberOfLines={1}>{lastMsg.text}</Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setChatOpen(true)} style={{ backgroundColor: C.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissedNotif(true)} style={{ padding: 5, borderRadius: 9, backgroundColor: C.bg }}>
          <Feather name="x" size={13} color={C.textLight} />
        </TouchableOpacity>
      </View>
    </MotiView>
  ) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT PANEL — UNTOUCHED (video call, chat, OTP preserved)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderChat = () => {
    if (!patientId) return null;

    const chatContent = (
      <View style={{ flex: 1, backgroundColor: C.card }}>
        {/* Header */}
        <View style={{
          backgroundColor: C.blue,
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>CL</Text>
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Dr. Catherine</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' }} />
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', fontWeight: '600' }}>Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setChatOpen(false)} style={{ padding: 5, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={chatScrollRef}
          style={{ flex: 1, paddingHorizontal: 14, paddingTop: 14 }}
          contentContainerStyle={{ paddingBottom: 14 }}
          showsVerticalScrollIndicator={true}
        >
          {patientMsgs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Feather name="message-square" size={26} color={C.border} />
              <Text style={{ fontSize: 12, color: C.textLight, marginTop: 8, fontWeight: '600' }}>No messages yet</Text>
            </View>
          ) : (
            patientMsgs.map((m, i) => {
              const isDoc = m.sender === 'doctor';
              return (
                <View key={i} style={{ flexDirection: 'row', justifyContent: isDoc ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
                  <View style={{
                    maxWidth: '78%',
                    backgroundColor: isDoc ? C.bg : C.blue,
                    borderRadius: 14,
                    borderBottomLeftRadius: isDoc ? 2 : 14,
                    borderBottomRightRadius: isDoc ? 14 : 2,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: isDoc ? 1 : 0,
                    borderColor: C.border,
                  }}>
                    <Text style={{ fontSize: 12, color: isDoc ? C.text : '#fff', lineHeight: 18 }}>{m.text}</Text>
                    <Text style={{ fontSize: 8, color: isDoc ? C.textLight : 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'right' }}>
                      {m.timestamp || m.time}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={{
          flexDirection: 'row',
          gap: 8,
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: C.border,
          backgroundColor: C.card,
          ...Platform.select({
            ios: { paddingBottom: 24 },
          }),
        }}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Message your doctor..."
            placeholderTextColor={C.textLight}
            onSubmitEditing={handleSendChat}
            style={{
              flex: 1,
              backgroundColor: C.bg,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 9,
              fontSize: 12,
              color: C.text,
              ...Platform.select({ web: { outline: 'none' } }),
            }}
          />
          <TouchableOpacity
            onPress={handleSendChat}
            disabled={!chatInput.trim()}
            style={{
              backgroundColor: chatInput.trim() ? C.blue : C.bg,
              padding: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: chatInput.trim() ? C.blue : C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="send" size={14} color={chatInput.trim() ? '#fff' : C.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <>
        {/* On Web, this is a floating chat box on the bottom right. On mobile, it's a bottom drawer inside a Modal. */}
        {chatOpen && (
          isWeb ? (
            <View style={{
              position: 'fixed',
              bottom: isMob ? 0 : 86,
              right: isMob ? 0 : 22,
              left: isMob ? 0 : undefined,
              width: isMob ? '100%' : 330,
              height: isMob ? '75%' : 460,
              backgroundColor: C.card,
              borderRadius: isMob ? 0 : 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              shadowColor: C.blue,
              shadowOpacity: 0.18,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 6 },
              elevation: 16,
              zIndex: 9999,
              overflow: 'hidden',
            }}>
              {chatContent}
            </View>
          ) : (
            <Modal
              visible={chatOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setChatOpen(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={1}
                  onPress={() => setChatOpen(false)}
                />
                <View style={{
                  height: '75%',
                  backgroundColor: C.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  overflow: 'hidden',
                  elevation: 20,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: -5 },
                }}>
                  {chatContent}
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )
        )}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => setChatOpen(v => !v)}
          activeOpacity={0.8}
          style={{
            position: isWeb ? 'fixed' : 'absolute',
            bottom: isMob ? 45 : 22,
            right: 22,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.blue,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.blue,
            shadowOpacity: 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 5 },
            elevation: 12,
            zIndex: 9999,
          }}
        >
          <Feather name={chatOpen ? 'x' : 'message-circle'} size={24} color="#fff" />
          {hasNewMsg && !chatOpen && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: C.red,
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: '#fff',
            }} />
          )}
        </TouchableOpacity>
      </>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Hero Banner (shared across layouts)
  // ──────────────────────────────────────────────────────────────────────────
  const renderHero = () => (
    <MotiView
      from={{ opacity: 0, translateY: -12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480 }}
      style={{ marginBottom: isMob ? 0 : 20 }}
    >
      <LinearGradient
        colors={['#003DB3', C.blue, '#0099DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: isMob ? 0 : 28,
          borderBottomLeftRadius: isMob ? 28 : 28,
          borderBottomRightRadius: isMob ? 28 : 28,
          overflow: 'hidden',
          paddingTop: isMob ? (Platform.OS === 'android' ? 18 : 18) : 28,
          paddingBottom: isMob ? 20 : 28,
          paddingHorizontal: isMob ? 18 : 28,
          shadowColor: C.blue,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* Decorative circles */}
        <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <View style={{ position: 'absolute', bottom: -30, left: 60, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,179,164,0.14)' }} />

        {/* ── MOBILE: fully vertical stack ─────────────────────────── */}
        {isMob ? (
          <View>
            {/* Row 1: badge + book button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,179,164,0.22)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,179,164,0.38)' }}>
                <MotiView from={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 900, loop: true }} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.teal }} />
                <Text style={{ color: '#66FFF5', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }}>LIVELONG PORTAL</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/user/appointments/add-appointment')}
                style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 34 }}
              >
                <Feather name="plus" size={12} color={C.blue} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.blue }}>Book</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: greeting + name */}
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginBottom: 2 }}>{greeting.text} {greeting.emoji}</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 28 }}>
              {currentUser?.name || 'Patient'} 👋
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: 4, marginBottom: 12 }}>
              {upcomingCount > 0 ? `${upcomingCount} upcoming session${upcomingCount > 1 ? 's' : ''}` : 'No upcoming sessions'}
            </Text>

            {/* Row 3: wellness tip — full width */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: todayAppt ? 12 : 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Feather name="heart" size={11} color="#B3D9FF" />
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '500', flex: 1 }}>Tip: Stay hydrated · 30 min walk · 7 hrs sleep</Text>
            </View>

            {/* Row 4: next appointment strip (if exists) */}
            {todayAppt && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: todayAppt.status === 'Pending' ? 'rgba(255,165,0,0.1)' : 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: todayAppt.status === 'Pending' ? 'rgba(255,165,0,0.3)' : 'rgba(255,255,255,0.2)' }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={isVideo(todayAppt) ? 'video' : 'map-pin'} size={15} color={todayAppt.status === 'Pending' ? '#FFD700' : "rgba(255,255,255,0.9)"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Session</Text>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{todayAppt.time}</Text>
                  {todayAppt.status === 'Pending' && (
                    <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700', marginTop: 2 }}>Pending Confirmation</Text>
                  )}
                </View>
                <View style={{ backgroundColor: isVideo(todayAppt) ? 'rgba(0,102,255,0.35)' : 'rgba(0,179,164,0.3)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ color: isVideo(todayAppt) ? '#B3D9FF' : '#66FFF5', fontSize: 10, fontWeight: '700' }}>{isVideo(todayAppt) ? 'Video' : 'In-Person'}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ── DESKTOP/TABLET: side-by-side row ─────────────────────── */
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 14 }}>
              {/* LIVELONG badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginBottom: 10, backgroundColor: 'rgba(0,179,164,0.22)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,179,164,0.38)' }}>
                <MotiView from={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 900, loop: true }} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal }} />
                <Text style={{ color: '#66FFF5', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>LIVELONG HEALTH PORTAL</Text>
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600', marginBottom: 2 }}>{greeting.text} {greeting.emoji}</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, lineHeight: 36 }}>
                {currentUser?.name || 'Patient'} 👋
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 5 }}>
                {upcomingCount > 0 ? `${upcomingCount} upcoming session${upcomingCount > 1 ? 's' : ''}` : 'No upcoming sessions'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Feather name="heart" size={12} color="#B3D9FF" />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' }}>Tip: Stay hydrated · 30 min walk · 7 hrs sleep</Text>
              </View>
            </View>

            {/* Right: next session card */}
            <View style={{ alignItems: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/user/appointments/add-appointment')}
                style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Feather name="plus" size={13} color={C.blue} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: C.blue }}>Book</Text>
              </TouchableOpacity>

              {todayAppt && (
                <View style={{ backgroundColor: todayAppt.status === 'Pending' ? 'rgba(255,165,0,0.15)' : 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: todayAppt.status === 'Pending' ? 'rgba(255,165,0,0.3)' : 'rgba(255,255,255,0.22)' }}>
                  <Feather name={isVideo(todayAppt) ? 'video' : 'map-pin'} size={13} color={todayAppt.status === 'Pending' ? '#FFD700' : "rgba(255,255,255,0.85)"} />
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 4 }}>{todayAppt.time}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 2 }}>{isVideo(todayAppt) ? 'Video' : 'Visit'}</Text>
                  {todayAppt.status === 'Pending' && (
                    <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '700', marginTop: 4 }}>Pending</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </LinearGradient>
    </MotiView>
  );


  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT  (< 600px)
  // ════════════════════════════════════════════════════════════════════════════
  if (isMob) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.blue} />

        {renderHero()}

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: -28, zIndex: 10, elevation: 10 }}>
            {renderMsgNotif()}
            {renderStats()}
          </View>
          {renderQuickActions()}
          {renderVideoSection()}
          {renderPhysicalSection()}
          {renderDoctorCard()}
          {renderTimeline()}
        </ScrollView>

        {renderChat()}
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TABLET LAYOUT  (600px – 1099px)
  // ════════════════════════════════════════════════════════════════════════════
  if (isTab) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {renderHero()}
          {renderMsgNotif()}
          {renderStats()}
          {renderQuickActions()}

          {/* Two-column: Video + Physical side by side */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 0 }}>
            <View style={{ flex: 1 }}>{renderVideoSection()}</View>
            <View style={{ flex: 1 }}>{renderPhysicalSection()}</View>
          </View>

          {/* Two-column: Doctor + Timeline */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>{renderDoctorCard()}</View>
            <View style={{ flex: 1 }}>{renderTimeline()}</View>
          </View>
        </ScrollView>
        {renderChat()}
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT  (≥ 1100px)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, position: 'relative' }}>
      <ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {renderHero()}
        {renderMsgNotif()}
        {renderStats()}
        {renderQuickActions()}

        {/* Three-column: Video | Physical | Doctor */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>{renderVideoSection()}</View>
          <View style={{ flex: 1 }}>{renderPhysicalSection()}</View>
          <View style={{ flex: 1 }}>{renderDoctorCard()}</View>
        </View>

        {/* Full-width timeline */}
        {renderTimeline()}
      </ScrollView>

      {renderChat()}
    </View>
  );
}
