import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView,
  TextInput, Platform, StatusBar, useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { useDoctor } from '../../../../store/DoctorContext';
import {
  Users, ClipboardList, Activity, MessageSquare, Bell, Search, Send,
  ArrowUpRight, ArrowDownRight, Video, X, ChevronRight, Check,
  UserPlus, CalendarPlus, IndianRupee, Clock, FileText, Pill, ShieldCheck
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePhone } from '../../../../utils/roomUtils';

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
  teal: '#00B3A4', tealDark: '#008C80', tealSoft: '#E0FAF7',
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const Badge = ({ label, color = 'blue' }) => {
  const colors = {
    green: { bg: C.successSoft, text: C.success },
    red: { bg: C.dangerSoft, text: C.danger },
    blue: { bg: C.primarySoft, text: C.primary },
    yellow: { bg: C.warningSoft, text: C.warning },
    purple: { bg: C.lavenderSoft, text: C.lavender },
  };
  const c = colors[color] || colors.blue;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{label}</Text>
    </View>
  );
};

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

const isVideo = (a) => a.type === 'video' || a.type === 'Video';

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function UserDashboard() {
  const { appointments, patients, prescriptions, chats, sendMessage } = useDoctor();
  const [currentUser, setCurrentUser] = useState(null);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [dismissedNotif, setDismissedNotif] = useState(false);
  const chatScrollRef = useRef(null);

  const { width: W } = useWindowDimensions();
  const isWeb  = Platform.OS === 'web';
  const isMob  = W < 600;

  useEffect(() => {
    AsyncStorage.getItem('current_user')
      .then(s => { if (s) setCurrentUser(JSON.parse(s)); })
      .catch(() => {});
  }, []);

  const getPatientId = () => {
    if (!currentUser || !currentUser.phone) return 'p1';
    const normUserPhone = normalizePhone(currentUser.phone);
    const matched = patients.find(p => normalizePhone(p.phone) === normUserPhone);
    return matched ? matched.id : 'p1';
  };

  const patientId = getPatientId();
  const patientProfile = patients.find(p => p.id === patientId) || { name: currentUser?.name || 'Patient', identity: 'AADH-8890', age: 28, gender: 'Male', bloodGroup: 'B+' };

  const [apptDayTab, setApptDayTab] = useState('Upcoming');
  const [apptFilterType, setApptFilterType] = useState('All');
  
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Filter Appointments
  const userAppts = appointments.filter(a => a.patientId === patientId);
  const upcomingAppts = userAppts.filter(a => !['Completed', 'Cancelled', 'Rejected'].includes(a.status));
  const todayAppts = userAppts.filter(a => a.date === todayStr);
  const tomorrowAppts = userAppts.filter(a => a.date === tomorrowStr);

  const filteredAppts = useMemo(() => {
    let list = userAppts;
    if (apptDayTab === 'Today') list = todayAppts;
    if (apptDayTab === 'Tomorrow') list = tomorrowAppts;
    if (apptDayTab === 'Upcoming') list = upcomingAppts;
    
    if (apptFilterType !== 'All') {
      list = list.filter(a => (a.type === apptFilterType) || (a.type?.toLowerCase() === apptFilterType.toLowerCase()));
    }
    return list;
  }, [userAppts, todayAppts, tomorrowAppts, upcomingAppts, apptDayTab, apptFilterType]);

  const activePrescriptions = prescriptions.filter(p => p.patientId === patientId && p.status !== 'past');

  // Chat Data
  const patientMsgs    = patientId && chats[patientId] ? chats[patientId] : [];
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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const stats = {
    totalAppts: upcomingAppts.length,
    activeMeds: activePrescriptions.length,
    labReports: 1, // mock
    invoices: 0 // mock
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT PANEL RENDER (Preserved from original but styled with lucide)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderChat = () => {
    if (!patientId) return null;

    const chatContent = (
      <View style={{ flex: 1, backgroundColor: C.card }}>
        {/* Header */}
        <View style={{
          backgroundColor: C.primary,
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
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Dr. Catherine L.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' }} />
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', fontWeight: '600' }}>Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setChatOpen(false)} style={{ padding: 5, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <X size={16} color="rgba(255,255,255,0.85)" />
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
              <MessageSquare size={26} color={C.border} />
              <Text style={{ fontSize: 12, color: C.textLight, marginTop: 8, fontWeight: '600' }}>No messages yet</Text>
            </View>
          ) : (
            patientMsgs.map((m, i) => {
              const isDoc = m.sender === 'doctor';
              return (
                <View key={i} style={{ flexDirection: 'row', justifyContent: isDoc ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
                  <View style={{
                    maxWidth: '78%',
                    backgroundColor: isDoc ? C.bg : C.primary,
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
              backgroundColor: chatInput.trim() ? C.primary : C.bg,
              padding: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: chatInput.trim() ? C.primary : C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={14} color={chatInput.trim() ? '#fff' : C.textLight} />
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
              shadowColor: C.primary,
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
      </>
    );
  };

  const renderMsgNotif = () => hasNewMsg && !chatOpen && !dismissedNotif ? (
    <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }}
      style={{
        backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
        paddingVertical: 10, paddingHorizontal: 14,
        marginBottom: isMob ? 14 : 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: C.primary, shadowOpacity: 0.06, shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
        borderLeftWidth: 4, borderLeftColor: C.primary,
      }}
    >
      <TouchableOpacity onPress={() => setChatOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 8 }} activeOpacity={0.8}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={16} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.text }}>New message · Dr. Catherine</Text>
          <Text style={{ fontSize: 11, color: C.textMid, marginTop: 1 }} numberOfLines={1}>{lastMsg.text}</Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setChatOpen(true)} style={{ backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissedNotif(true)} style={{ padding: 5, borderRadius: 9, backgroundColor: C.bg }}>
          <X size={13} color={C.textLight} />
        </TouchableOpacity>
      </View>
    </MotiView>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Gradient */}
        <LinearGradient colors={['#0F172A', '#1E3A5F', '#2563EB']} style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{greeting},</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{patientProfile.name}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Patient Portal</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => router.push('/user/appointments/add-appointment')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10 }}>
                <CalendarPlus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 16 }}>
          {renderMsgNotif()}

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Upcoming', value: stats.totalAppts, color: C.primary, icon: <ClipboardList size={16} color={C.primary} /> },
              { label: 'Active Meds', value: stats.activeMeds, color: C.teal, icon: <Pill size={16} color={C.teal} /> },
              { label: 'Lab Reports', value: stats.labReports, color: C.warning, icon: <Activity size={16} color={C.warning} /> },
              { label: 'Invoices', value: `₹${stats.invoices}`, color: C.success, icon: <IndianRupee size={16} color={C.success} /> },
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

          {/* Profile Overview Card */}
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <LinearGradient colors={[C.teal, C.tealDark]} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>
                  {patientProfile.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>{patientProfile.name}</Text>
                <Text style={{ fontSize: 12, color: C.textMid }}>{patientProfile.identity} • Age {patientProfile.age} • Blood {patientProfile.bloodGroup}</Text>
              </View>
              <Badge label="Healthy" color="green" />
            </View>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader title="My Appointments" icon={<ClipboardList size={16} color={C.primary} />} iconBg={C.primarySoft} count={filteredAppts.length} />
            <View style={{ flexDirection: 'row', padding: 12, gap: 6 }}>
              {['All', 'Today', 'Tomorrow', 'Upcoming'].map(tab => (
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

            {filteredAppts.map((a, i) => {
              const isVid = isVideo(a);
              return (
                <View key={a.id} style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isVid ? C.lavenderSoft : C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      {isVid ? <Video size={18} color={C.lavender} /> : <Users size={18} color={C.primary} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{a.service || (isVid ? 'Video Consult' : 'Physical Visit')}</Text>
                      <Text style={{ fontSize: 11, color: C.textLight }}>{a.time} • {a.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Badge label={isVid ? 'Video' : 'Physical'} color={isVid ? 'purple' : 'blue'} />
                      <Badge label={a.status} color={a.status === 'Active' ? 'green' : a.status === 'Cancelled' || a.status === 'Rejected' ? 'red' : a.status === 'Pending' ? 'yellow' : 'blue'} />
                    </View>
                  </View>
                  
                  {a.status === 'Pending' && (
                    <View style={{ backgroundColor: C.warningSoft, padding: 8, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: C.warning + '20' }}>
                      <Text style={{ fontSize: 11, color: C.warning, fontWeight: '600' }}>{"Waiting for doctor's approval"}</Text>
                    </View>
                  )}

                  {!['Cancelled', 'Completed', 'Rescheduled', 'Rejected'].includes(a.status) && (
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {isVid && a.status !== 'Pending' && <Btn label="Join" onPress={() => router.push('/user/appointments/appointment-list')} small color="purple" icon={<Video size={12} color="#fff" />} />}
                      <Btn label="Details" onPress={() => router.push('/user/appointments/appointment-list')} small outline color="grey" />
                    </View>
                  )}
                </View>
              );
            })}

            {filteredAppts.length === 0 && (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: C.textLight }}>No appointments found</Text>
              </View>
            )}
          </Card>

          {/* Active Prescriptions */}
          <Card>
            <CardHeader title="Recent Prescriptions" icon={<FileText size={16} color={C.teal} />} iconBg={C.tealSoft} iconColor={C.teal} count={activePrescriptions.length} />
            {activePrescriptions.map((p, i) => (
              <View key={p.id} style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={14} color={C.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{p.diagnosis}</Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>Dr. Catherine L. • {p.date}</Text>
                  </View>
                  <Badge label="Active" color="green" />
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Btn label="View PDF" onPress={() => router.push('/user/prescriptions/prescription-list')} small outline color="grey" style={{ flex: 1 }} />
                </View>
              </View>
            ))}
            {activePrescriptions.length === 0 && <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ fontSize: 12, color: C.textLight }}>No active prescriptions</Text></View>}
          </Card>
          
          {/* Lab Reports */}
          <Card>
            <CardHeader title="Lab Reports" icon={<Activity size={16} color={C.warning} />} iconBg={C.warningSoft} iconColor={C.warning} />
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ShieldCheck size={24} color={C.success} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.textMid }}>All clear</Text>
              <Text style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>No pending lab tests or reports.</Text>
            </View>
          </Card>

        </View>
      </ScrollView>

      {/* FAB for Chat */}
      <TouchableOpacity
        onPress={() => setChatOpen(v => !v)}
        activeOpacity={0.8}
        style={{
          position: Platform.OS === 'web' ? 'fixed' : 'absolute',
          bottom: 22,
          right: 22,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: C.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.primary,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 12,
          zIndex: 9999,
        }}
      >
        {chatOpen ? <X size={24} color="#fff" /> : <MessageSquare size={24} color="#fff" />}
        {hasNewMsg && !chatOpen && (
          <View style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: C.danger,
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: '#fff',
          }} />
        )}
      </TouchableOpacity>

      {renderChat()}
    </View>
  );
}
