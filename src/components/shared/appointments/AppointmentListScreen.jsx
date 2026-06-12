import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDoctor } from '../../../store/DoctorContext';
import { router } from 'expo-router';
import { normalizePhone } from '../../../utils/roomUtils';

// ── LiveLong Tokens ────────────────────────────────────────────────────────────
const C = {
  blue:       '#0066FF',
  blueDark:   '#004FCC',
  blueSoft:   '#E8F0FF',
  teal:       '#00B3A4',
  tealDark:   '#008C80',
  tealSoft:   '#E0FAF7',
  amber:      '#F59E0B',
  amberSoft:  '#FFF8E7',
  green:      '#16A34A',
  greenSoft:  '#F0FDF4',
  red:        '#EF4444',
  redSoft:    '#FFF0F0',
  purple:     '#7C3AED',
  text:       '#0D1829',
  textMid:    '#4A5568',
  textLight:  '#94A3B8',
  border:     '#E4E9F2',
  bg:         '#F3F6FD',
  card:       '#FFFFFF',
};

// ── helpers ────────────────────────────────────────────────────────────────────
const isVideo    = (a) => a.type === 'video';
const isPhysical = (a) => a.type === 'physical' || a.type === 'in-person';

const STATUS_COLORS = {
  Pending:   { bg: C.amberSoft,  text: '#92400E', border: '#FDE68A' },
  Scheduled: { bg: C.blueSoft,   text: C.blue,    border: C.blue + '40' },
  Completed: { bg: C.greenSoft,  text: C.green,   border: C.green + '40' },
  Cancelled: { bg: C.redSoft,    text: C.red,     border: C.red + '40' },
};

// ── Filter Tab ─────────────────────────────────────────────────────────────────
const FilterTab = ({ label, icon, color, active, count, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 22,
      backgroundColor: active ? color : C.card,
      borderWidth: 1.5,
      borderColor: active ? color : C.border,
      shadowColor: active ? color : 'transparent',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: active ? 0.22 : 0,
      shadowRadius: 8,
      elevation: active ? 4 : 0,
    }}
  >
    <Feather name={icon} size={14} color={active ? '#fff' : color} />
    <Text style={{
      fontSize: 12, fontWeight: '800',
      color: active ? '#fff' : C.textMid,
    }}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={{
        backgroundColor: active ? 'rgba(255,255,255,0.25)' : color + '18',
        borderRadius: 10, minWidth: 20, height: 20,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 5,
      }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#fff' : color }}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ── Status Badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Scheduled;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: s.border }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: s.text }}>{status}</Text>
    </View>
  );
};

// ── Appointment Card ───────────────────────────────────────────────────────────
const ApptCard = ({ appt, delay }) => {
  const video     = isVideo(appt);
  const accent    = video ? C.blue : C.teal;
  const accentSoft= video ? C.blueSoft : C.tealSoft;
  const typeLabel = video ? 'Video Call' : 'Physical Visit';
  const typeIcon  = video ? 'video'      : 'map-pin';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380, delay }}
      style={{
        backgroundColor: C.card,
        borderRadius: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        shadowColor: accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Left accent strip */}
      <View style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
        backgroundColor: accent,
        borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
      }} />

      <View style={{ padding: 16, paddingLeft: 20 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: C.text, letterSpacing: -0.2 }}>
              {appt.service || typeLabel}
            </Text>
            <Text style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>
              {appt.complaint || 'General consultation'}
            </Text>
          </View>
          <StatusBadge status={appt.status} />
        </View>

        {/* Info chips row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {/* Type chip */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: accentSoft, borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: accent + '30',
          }}>
            <Feather name={typeIcon} size={11} color={accent} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: accent }}>{typeLabel}</Text>
          </View>
          {/* Time chip */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: C.bg, borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: C.border,
          }}>
            <Feather name="clock" size={11} color={C.textMid} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.textMid }}>{appt.time}</Text>
          </View>
          {/* Date chip */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: C.bg, borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: C.border,
          }}>
            <Feather name="calendar" size={11} color={C.textMid} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.textMid }}>{appt.date}</Text>
          </View>
        </View>

        {/* Doctor + fee row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30, height: 30, borderRadius: 10,
              backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>CL</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>Dr. Catherine L.</Text>
              <Text style={{ fontSize: 10, color: C.textLight }}>Senior Cardiologist</Text>
            </View>
          </View>

          {appt.amount != null && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: C.textLight, fontWeight: '600' }}>Consultation Fee</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: C.text }}>₹{appt.amount}</Text>
            </View>
          )}
        </View>

        {/* Physical: clinic info */}
        {isPhysical(appt) && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            marginTop: 12, backgroundColor: C.tealSoft,
            borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7,
            borderWidth: 1, borderColor: C.teal + '25',
          }}>
            <Feather name="navigation" size={12} color={C.teal} />
            <Text style={{ fontSize: 11, color: C.tealDark, fontWeight: '600' }}>
              LiveLong Clinic · Bring Aadhaar + prescription
            </Text>
          </View>
        )}

        {/* Video: call info */}
        {video && appt.status !== 'Completed' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            marginTop: 12, backgroundColor: C.blueSoft,
            borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7,
            borderWidth: 1, borderColor: C.blue + '25',
          }}>
            <MotiView
              from={{ opacity: 0.3 }} animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 800, loop: true }}
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }}
            />
            <Text style={{ fontSize: 11, color: C.blueDark, fontWeight: '600' }}>
              Doctor will initiate the call at the scheduled time
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────────
const EmptyState = ({ icon, color, label, sub }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
    <View style={{
      width: 68, height: 68, borderRadius: 20,
      backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center',
      marginBottom: 14, borderWidth: 1.5, borderColor: color + '25',
    }}>
      <Feather name={icon} size={28} color={color} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '800', color: C.textMid }}>{label}</Text>
    <Text style={{ fontSize: 12, color: C.textLight, marginTop: 5, textAlign: 'center', maxWidth: 240, lineHeight: 18 }}>
      {sub}
    </Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const FILTERS = [
  { key: 'all',      label: 'All',      icon: 'list',    color: C.purple },
  { key: 'video',    label: 'Video',    icon: 'video',   color: C.blue   },
  { key: 'physical', label: 'Physical', icon: 'map-pin', color: C.teal   },
];

export default function AppointmentListScreen() {
  const { appointments, patients } = useDoctor();
  const [currentUser, setCurrentUser]     = useState(null);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [searchQ, setSearchQ]             = useState('');

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

  const patientId   = getPatientId();
  const allAppts    = patientId ? appointments.filter(a => a.patientId === patientId && a.status !== 'Rejected') : [];

  const videoCount    = allAppts.filter(isVideo).length;
  const physicalCount = allAppts.filter(isPhysical).length;

  // Apply type filter
  const typeFiltered =
    activeFilter === 'video'    ? allAppts.filter(isVideo) :
    activeFilter === 'physical' ? allAppts.filter(isPhysical) :
    allAppts;

  // Apply search
  const filtered = typeFiltered.filter(a => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      (a.service    || '').toLowerCase().includes(q) ||
      (a.complaint  || '').toLowerCase().includes(q) ||
      (a.status     || '').toLowerCase().includes(q) ||
      (a.date       || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={{ marginBottom: 22 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: -0.5 }}>
                My Appointments
              </Text>
              <Text style={{ fontSize: 13, color: C.textLight, marginTop: 3 }}>
                {allAppts.length} total · {videoCount} video · {physicalCount} in-person
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/user/appointments/add-appointment')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: C.blue, borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 10,
                shadowColor: C.blue, shadowOpacity: 0.3,
                shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
                elevation: 5,
              }}
            >
              <Feather name="plus" size={15} color="#fff" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Book</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* ── Summary Chips ────────────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 50 }}
          style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}
        >
          {[
            { label: 'Total',     count: allAppts.length,                                  color: C.purple, icon: 'layers'  },
            { label: 'Video',     count: videoCount,                                        color: C.blue,   icon: 'video'   },
            { label: 'Physical',  count: physicalCount,                                     color: C.teal,   icon: 'map-pin' },
            { label: 'Completed', count: allAppts.filter(a => a.status==='Completed').length, color: C.green, icon: 'check-circle' },
          ].map(chip => (
            <View key={chip.label} style={{
              flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12,
              alignItems: 'center', borderWidth: 1, borderColor: C.border,
              shadowColor: chip.color, shadowOpacity: 0.06, shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 }, elevation: 2,
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: chip.color + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Feather name={chip.icon} size={14} color={chip.color} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: C.text }}>{chip.count}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>{chip.label}</Text>
            </View>
          ))}
        </MotiView>

        {/* ── Search Bar ───────────────────────────────────────────────── */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 80 }}
          style={{ marginBottom: 16 }}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
            borderRadius: 14, paddingHorizontal: 14, height: 44,
            shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 }, elevation: 1,
          }}>
            <Feather name="search" size={16} color={C.textLight} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="Search service, date, status…"
              placeholderTextColor={C.textLight}
              style={{ flex: 1, fontSize: 13, color: C.text, outline: 'none' }}
            />
            {searchQ.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQ('')}>
                <Feather name="x-circle" size={16} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </MotiView>

        {/* ── Filter Tabs ──────────────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={{ marginBottom: 20 }}
        >
          <View style={{
            backgroundColor: C.card, borderRadius: 18, padding: 12,
            borderWidth: 1, borderColor: C.border,
            shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }, elevation: 1,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Filter by Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FILTERS.map(f => (
                <FilterTab
                  key={f.key}
                  label={f.label}
                  icon={f.icon}
                  color={f.color}
                  active={activeFilter === f.key}
                  count={
                    f.key === 'all'      ? allAppts.length :
                    f.key === 'video'    ? videoCount :
                    f.key === 'physical' ? physicalCount :
                    undefined
                  }
                  onPress={() => setActiveFilter(f.key)}
                />
              ))}
            </View>
          </View>
        </MotiView>

        {/* ── Active filter label ──────────────────────────────────────── */}
        {(activeFilter !== 'all' || searchQ) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather
                name={activeFilter === 'video' ? 'video' : activeFilter === 'physical' ? 'map-pin' : 'search'}
                size={13}
                color={activeFilter === 'video' ? C.blue : activeFilter === 'physical' ? C.teal : C.purple}
              />
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.textMid }}>
                {searchQ
                  ? `Results for "${searchQ}"`
                  : activeFilter === 'video'
                    ? 'Video Consultations'
                    : 'Physical Appointments'}
              </Text>
              <View style={{
                backgroundColor: activeFilter === 'video' ? C.blueSoft : activeFilter === 'physical' ? C.tealSoft : '#F0EBFF',
                borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '800',
                  color: activeFilter === 'video' ? C.blue : activeFilter === 'physical' ? C.teal : C.purple
                }}>
                  {filtered.length} found
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setActiveFilter('all'); setSearchQ(''); }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue }}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Appointment List ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={activeFilter === 'video' ? 'video-off' : activeFilter === 'physical' ? 'map-pin' : 'calendar'}
            color={activeFilter === 'video' ? C.blue : activeFilter === 'physical' ? C.teal : C.purple}
            label={
              searchQ
                ? 'No results found'
                : activeFilter === 'video'
                  ? 'No video consultations'
                  : activeFilter === 'physical'
                    ? 'No physical appointments'
                    : 'No appointments yet'
            }
            sub={
              searchQ
                ? `Try a different search term.`
                : `You don't have any ${activeFilter === 'all' ? '' : activeFilter + ' '}appointments. Tap Book to create one.`
            }
          />
        ) : (
          filtered.map((appt, idx) => (
            <ApptCard key={idx} appt={appt} delay={idx * 60} />
          ))
        )}

        {/* ── Book CTA (bottom) ─────────────────────────────────────────── */}
        {allAppts.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/user/appointments/add-appointment')}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: C.blue, borderRadius: 16, paddingVertical: 14, marginTop: 8,
              shadowColor: C.blue, shadowOpacity: 0.28, shadowRadius: 12,
              shadowOffset: { width: 0, height: 5 }, elevation: 7,
            }}
          >
            <Feather name="plus-circle" size={18} color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Book New Appointment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
