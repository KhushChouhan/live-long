import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Platform, TouchableOpacity,
  PermissionsAndroid, Vibration, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { useDoctor } from '../../../../store/DoctorContext';
import { PhoneOff, Mic, MicOff, Video } from 'lucide-react-native';
import { MotiView } from 'moti';
import Logo from '../../../../components/Logo';

// Components
import StatCard from '../../../../components/widgets/StatCard';
import Tabs from '../../../../components/widgets/Tabs';
import ScheduleWidget from '../../../../components/widgets/ScheduleWidget';
import UpcomingAppointments from '../../../../components/widgets/UpcomingAppointments';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIBRATE_PATTERN = [0, 800, 1000];

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Runs BEFORE page content loads — pre-grants camera/mic so Jitsi never blocks them
const PRE_JS = `
(function() {
  try {
    var orig = navigator.permissions && navigator.permissions.query.bind(navigator.permissions);
    if (orig) {
      navigator.permissions.query = function(desc) {
        if (desc && (desc.name === 'camera' || desc.name === 'microphone')) {
          return Promise.resolve({ state: 'granted', onchange: null });
        }
        return orig(desc);
      };
    }
  } catch(e) {}
  true;
})();
`;

// Runs AFTER page loads — hides Jitsi logo/watermark and auto-clicks "Join meeting"
const POST_JS = `
(function() {
  // 1. Inject CSS to hide Jitsi branding
  var style = document.createElement('style');
  style.textContent = [
    '.leftwatermark { display: none !important; }',
    '.rightwatermark { display: none !important; }',
    '.watermark { display: none !important; }',
    '#header-container { display: none !important; }',
    '.premeeting-screen header { display: none !important; }',
    '[class*="headerContainer"] { display: none !important; }',
    'a[href*="jitsi"] { display: none !important; }',
    '.powered-by { display: none !important; }'
  ].join('');
  (document.head || document.documentElement).appendChild(style);

  // 2. Auto-click "Join meeting" so the user skips the pre-join screen
  function tryJoin() {
    var btns = Array.from(document.querySelectorAll('button'));
    var joinBtn = btns.find(function(b) {
      var t = (b.innerText || b.textContent || '').toLowerCase().trim();
      return t === 'join meeting' || t === 'join' || t === 'enter';
    });
    if (joinBtn) {
      joinBtn.click();
    } else {
      setTimeout(tryJoin, 600);
    }
  }
  setTimeout(tryJoin, 1200);

  true;
})();
`;

// ─── Jitsi URL ────────────────────────────────────────────────────────────────
function buildJitsiUrl(room, displayName) {
  var name = encodeURIComponent(displayName || 'Patient');
  return (
    'https://meet.jit.si/' + room +
    '#config.prejoinPageEnabled=false' +
    '&config.prejoinConfig.enabled=false' +
    '&config.startWithAudioMuted=false' +
    '&config.startWithVideoMuted=false' +
    '&config.disableDeepLinking=true' +
    '&config.requireDisplayName=false' +
    '&config.disableInviteFunctions=true' +
    '&config.toolbarButtons=["microphone","camera","hangup","tileview"]' +
    '&userInfo.displayName=' + name
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function formatDuration(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { endVideoConsult } = useDoctor();

  const [currentUser, setCurrentUser] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle | incoming | connected
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const vibratingRef = useRef(false);

  // ── Load user ────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('current_user')
      .then(str => { if (str) setCurrentUser(JSON.parse(str)); })
      .catch(() => {});
  }, []);

  // ── Poll signaling ────────────────────────────────────────────────────────
  useEffect(() => {
    const patientId = currentUser?.uid || currentUser?.id || '3';
    const poll = setInterval(async () => {
      try {
        const url = `https://keyvalue.immanuel.co/api/KeyVal/GetValue/mm0xw0az/call_state_${patientId}?cb=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        if (data === 'active') {
          if (callStatus === 'idle') setCallStatus('incoming');
        } else {
          if (callStatus === 'incoming') setCallStatus('idle');
        }
      } catch (_) {}
    }, 2500);
    return () => clearInterval(poll);
  }, [currentUser, callStatus]);

  // ── Vibrate on incoming ───────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (callStatus === 'incoming') {
      vibratingRef.current = true;
      Vibration.vibrate(VIBRATE_PATTERN, true);
    } else if (vibratingRef.current) {
      Vibration.cancel();
      vibratingRef.current = false;
    }
    return () => {
      if (vibratingRef.current) { Vibration.cancel(); vibratingRef.current = false; }
    };
  }, [callStatus]);

  // ── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') { setCallDuration(0); return; }
    const t = setInterval(() => setCallDuration(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  // ── Open Jitsi on Web in new tab ──────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected' || Platform.OS !== 'web') return;
    const patientId = currentUser?.uid || currentUser?.id || '3';
    const url = buildJitsiUrl(`livelong-consult-${patientId}`, currentUser?.name || 'Patient');
    window.open(url, '_blank');
  }, [callStatus]); // eslint-disable-line

  // ── Handlers ─────────────────────────────────────────────────────────────
  const acceptIncomingCall = async () => {
    if (Platform.OS === 'android') {
      Vibration.cancel();
      vibratingRef.current = false;
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      } catch (_) {}
    }
    setCallStatus('connected');
  };

  const handleDecline = () => {
    const id = currentUser?.uid || currentUser?.id || '3';
    fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_${id}/inactive`, { method: 'POST' }).catch(() => {});
    setCallStatus('idle');
  };

  const handleEndCall = () => {
    const id = currentUser?.uid || currentUser?.id || '3';
    fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_${id}/inactive`, { method: 'POST' }).catch(() => {});
    endVideoConsult();
    setCallStatus('idle');
  };

  const patientId = currentUser?.uid || currentUser?.id || '3';
  const jitsiUrl = buildJitsiUrl(`livelong-consult-${patientId}`, currentUser?.name || 'Patient');

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
        <View className="mb-8">
          <Text className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">My Dashboard</Text>
          <Text className="text-sm text-slate-500">
            Welcome back, {currentUser?.name || 'User'}. Your personal health summary
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4 mb-8">
          <StatCard title="Upcoming Appointments" count="2" subtitle="Scheduled" icon="calendar" iconColor="#10b981" href="/user/appointments/appointment-list" />
          <StatCard title="Prescriptions" count="3" subtitle="Active medications" icon="file-text" iconColor="#10b981" href="/user/prescriptions/prescription-list" />
          <StatCard title="Lab Reports" count="1" subtitle="Pending review" icon="activity" iconColor="#64748b" badge="New" href="/user/lab-reports/lab-report-list" />
          <StatCard title="Unpaid Invoices" count="₹0.00" subtitle="All cleared" icon="pie-chart" iconColor="#ef4444" href="/user/invoices/invoice-list" />
        </View>

        <View className="mb-6">
          <Tabs tabs={['Overview', 'History', 'Stats']} activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        <View className={`flex-row flex-wrap gap-6 ${Platform.OS === 'web' ? 'lg:flex-nowrap' : 'flex-col'}`}>
          <View className={Platform.OS === 'web' ? 'flex-[6] min-w-[300px]' : 'w-full mb-6'}>
            <ScheduleWidget />
          </View>
          <View className={Platform.OS === 'web' ? 'flex-[4] min-w-[300px]' : 'w-full'}>
            <UpcomingAppointments />
          </View>
        </View>
      </ScrollView>

      {/* ═══ INCOMING CALL ═══════════════════════════════════════════════════ */}
      {callStatus === 'incoming' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0A0F1E', zIndex: 1000
        }}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

          {/* Logo + badge */}
          <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 12 }}>
            <Logo width={130} height={38} />
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
              borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)'
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
              <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>SECURE MEDICAL CALL</Text>
            </View>
          </View>

          {/* Doctor avatar */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <MotiView
                key={i}
                from={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 2.2 + i * 0.5, opacity: 0 }}
                transition={{ type: 'timing', duration: 2200, loop: true, delay: i * 700 }}
                style={{
                  position: 'absolute', width: 110, height: 110,
                  borderRadius: 55, borderWidth: 1.5, borderColor: '#10B981'
                }}
              />
            ))}
            <View style={{
              width: 110, height: 110, borderRadius: 55, backgroundColor: '#1A2740',
              borderWidth: 3, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center',
              shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 24, elevation: 12
            }}>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#10B981' }}>DL</Text>
            </View>

            <Text style={{ color: '#F1F5F9', fontSize: 26, fontWeight: '900', marginTop: 24, letterSpacing: -0.5 }}>
              Dr. Catherine Lawrence
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Cardiologist · LiveLong Health</Text>

            <MotiView
              from={{ opacity: 0.4 }} animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 900, loop: true }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 7,
                backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 24,
                paddingHorizontal: 18, paddingVertical: 9, marginTop: 18,
                borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)'
              }}
            >
              <Video size={14} color="#10B981" />
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>Incoming Video Call</Text>
            </MotiView>
          </View>

          {/* Decline / Accept */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-evenly',
            alignItems: 'center', paddingBottom: 72, paddingHorizontal: 32
          }}>
            <TouchableOpacity onPress={handleDecline} style={{ alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 70, height: 70, borderRadius: 35, backgroundColor: '#EF4444',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 16, elevation: 10
              }}>
                <PhoneOff size={28} color="#fff" />
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={acceptIncomingCall} style={{ alignItems: 'center', gap: 10 }}>
              <MotiView
                from={{ scale: 1 }} animate={{ scale: [1, 1.1, 1] }}
                transition={{ type: 'timing', duration: 1000, loop: true }}
                style={{
                  width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#10B981', shadowOpacity: 0.6, shadowRadius: 20, elevation: 12
                }}
              >
                <Video size={28} color="#fff" />
              </MotiView>
              <Text style={{ color: '#F1F5F9', fontSize: 12, fontWeight: '700' }}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══ ACTIVE CALL — Jitsi WebView inside the app ══════════════════════ */}
      {callStatus === 'connected' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0A0F1E', zIndex: 100
        }}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

          {/* Top bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingTop: 48, paddingBottom: 10,
            backgroundColor: '#0A0F1E'
          }}>
            {/* Left: Logo + live timer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Logo width={90} height={26} />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 12,
                paddingHorizontal: 9, paddingVertical: 4,
                borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)'
              }}>
                <MotiView
                  from={{ opacity: 0.3 }} animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 800, loop: true }}
                  style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' }}
                />
                <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
                  {formatDuration(callDuration)}
                </Text>
              </View>
            </View>

            {/* Right: End call */}
            <TouchableOpacity
              onPress={handleEndCall}
              style={{
                backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center',
                gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6
              }}
            >
              <PhoneOff size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>End Call</Text>
            </TouchableOpacity>
          </View>

          {/* Jitsi WebView — full screen video inside the app */}
          {Platform.OS === 'web' ? (
            // Web: show a card with rejoin button (camera works in browser)
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <View style={{
                backgroundColor: '#1F2937', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440,
                borderWidth: 1, borderColor: '#374151', alignItems: 'center'
              }}>
                <Video size={40} color="#10B981" style={{ marginBottom: 16 }} />
                <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Consultation Room Active</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                  Video call opened in a new window.
                </Text>
                <TouchableOpacity
                  onPress={() => window.open(jitsiUrl, '_blank')}
                  style={{ backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, width: '100%', alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Open Video Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <WebView
              source={{ uri: jitsiUrl }}
              style={{ flex: 1 }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              userAgent={DESKTOP_UA}
              scalesPageToFit={false}
              useWideViewPort={true}
              mixedContentMode="always"
              allowsFullscreenVideo
              injectedJavaScriptBeforeContentLoaded={PRE_JS}
              injectedJavaScript={POST_JS}
              onPermissionRequest={event => {
                event.request.grant(event.request.resources);
              }}
              onShouldStartLoadWithRequest={() => true}
            />
          )}

          {/* Bottom control strip */}
          {Platform.OS !== 'web' && (
            <View style={{
              flexDirection: 'row', justifyContent: 'center',
              backgroundColor: '#0A0F1E', paddingVertical: 12, gap: 16
            }}>
              <TouchableOpacity
                onPress={() => setMuted(m => !m)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
                  borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10,
                  borderWidth: 1, borderColor: muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'
                }}
              >
                {muted ? <MicOff size={15} color="#EF4444" /> : <Mic size={15} color="#94A3B8" />}
                <Text style={{ color: muted ? '#EF4444' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>
                  {muted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
