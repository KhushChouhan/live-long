import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Platform, SafeAreaView, StatusBar, Text, TouchableOpacity,
  PermissionsAndroid, Vibration, useWindowDimensions
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { USER_MENU } from '../../config/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { useDoctor } from '../../store/DoctorContext';
import { useAuth } from '../../store/AuthContext';
import { PhoneOff, Mic, MicOff, Video, Home, Calendar, MessageSquare, LogOut } from 'lucide-react-native';
import { MotiView } from 'moti';
import Logo from '../../components/Logo';

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

// Runs AFTER page loads — hides Jitsi logo/watermark, hides login options, and auto-clicks "Join meeting"
const POST_JS = `
(function() {
  // 1. Inject CSS to hide Jitsi branding and display names (to remove "Fellow Jitster")
  var style = document.createElement('style');
  style.textContent = [
    '.leftwatermark, .rightwatermark, .watermark, #jitsi-meet-watermark, [class*="watermark"], a[class*="watermark"], div[class*="watermark"], svg[class*="watermark"], img[src*="watermark"] { display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; }',
    '#header-container { display: none !important; }',
    '.premeeting-screen header { display: none !important; }',
    '[class*="headerContainer"] { display: none !important; }',
    'a[href*="jitsi"], img[src*="jitsi"] { display: none !important; }',
    '.powered-by { display: none !important; }',
    '.displayname { display: none !important; }',
    '.display-name-container { display: none !important; }',
    '[class*="displayName"] { display: none !important; }',
    '[class*="participantName"] { display: none !important; }',
    '.participant-name-label { display: none !important; }',
    '.videocontainer [class*="displayName"] { display: none !important; }',
    '.videocontainer [class*="nick"] { display: none !important; }'
  ].join('\\n');
  document.head.appendChild(style);

  // 2. Hide Join Options to clean pre-meeting lobby
  function hideLoginAndBrand() {
    var preJoin = document.querySelector('.premeeting-screen');
    if (preJoin) {
      var header = preJoin.querySelector('header');
      if (header) header.style.display = 'none';
      var brand = preJoin.querySelector('.powered-by');
      if (brand) brand.style.display = 'none';
    }
  }
  hideLoginAndBrand();
  // Run periodically to catch dynamic UI state changes
  setInterval(hideLoginAndBrand, 500);

  true;
})();
`;

// ─── Jitsi URL ────────────────────────────────────────────────────────────────
function buildJitsiUrl(room, displayName) {
  const name = encodeURIComponent(displayName || 'Patient');
  return (
    'https://meet.jit.si/' + room +
    '#config.prejoinPageEnabled=false' +
    '&config.prejoinConfig.enabled=false' +
    '&config.startWithAudioMuted=false' +
    '&config.startWithVideoMuted=false' +
    '&config.disableDeepLinking=true' +
    '&config.requireDisplayName=false' +
    '&config.disableInviteFunctions=true' +
    '&config.watermark.enabled=false' +
    '&config.logoClickUrl=""' +
    '&config.logoImageUrl=""' +
    '&config.toolbarButtons=["microphone","camera","hangup","tileview"]' +
    '&config.defaultRemoteDisplayName="Doctor"' +
    '&interfaceConfig.SHOW_JITSI_WATERMARK=false' +
    '&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false' +
    '&interfaceConfig.SHOW_BRAND_WATERMARK=false' +
    '&userInfo.displayName=' + name
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = function(n) { return String(n).padStart(2, '0'); };
  return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
}



export default function UserLayout() {
  const { user, logout } = useAuth();
  const { videoCall, acceptVideoConsult, declineVideoConsult, endVideoConsult, chats } = useDoctor();
  const [currentUser, setCurrentUser] = useState(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const vibratingRef = useRef(false);
  const winRef = useRef(null);

  const { width: W } = useWindowDimensions();
  const isMob = W < 600;
  const router = useRouter();
  const pathname = usePathname();

  // Get unread chats count
  const patientId = useMemo(() => {
    if (!currentUser || !currentUser.phone) return 'p1';
    return 'p1'; // Assuming standard mock mapping for now, or calculate properly
  }, [currentUser]);
  const patientMsgs = chats[patientId] || [];
  const unreadChats = patientMsgs.filter(m => m.sender === 'doctor').length; // simple mock for unread count

  const callStatus = videoCall.isActive ? (videoCall.incoming ? 'incoming' : 'connected') : 'idle';

  // ── Sync user from AuthContext or storage ────────────────────────────────────
  useEffect(() => {
    if (user) {
      console.log('[PatientLayout] User loaded from AuthContext:', user);
      setCurrentUser(user);
    } else {
      AsyncStorage.getItem('current_user')
        .then(str => {
          if (str) {
            const parsed = JSON.parse(str);
            console.log('[PatientLayout] User loaded from AsyncStorage:', parsed);
            setCurrentUser(parsed);
          }
        })
        .catch(err => console.error('[PatientLayout] AsyncStorage error:', err));
    }
  }, [user]);

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

  // ── Open Jitsi on Web in new tab & monitor it ─────────────────────────────
  useEffect(() => {
    let interval;
    if (callStatus === 'connected' && Platform.OS === 'web') {
      const url = buildJitsiUrl(videoCall.roomName || 'livelong-consult-default', currentUser?.name || 'Patient');
      
      if (winRef.current && !winRef.current.closed) {
        try { winRef.current.close(); } catch(e) {}
      }
      
      winRef.current = window.open(url, '_blank');
      
      interval = setInterval(() => {
        if (winRef.current && winRef.current.closed) {
          clearInterval(interval);
          handleEndCall();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]); // eslint-disable-line

  // Close browser tab if the call was ended by the other peer
  useEffect(() => {
    if (callStatus !== 'connected' && winRef.current && !winRef.current.closed) {
      try {
        winRef.current.close();
      } catch (e) {
        console.warn('Failed to close video window:', e);
      }
    }
  }, [callStatus]);

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
    acceptVideoConsult();
  };

  const handleDecline = () => {
    declineVideoConsult();
  };

  const handleEndCall = () => {
    endVideoConsult();
    if (winRef.current && !winRef.current.closed) {
      try { winRef.current.close(); } catch (e) {}
    }
  };

  const jitsiUrl = buildJitsiUrl(videoCall.roomName || 'livelong-consult-default', currentUser?.name || 'Patient');

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 flex-row">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} menuData={USER_MENU} />

        <View className="flex-1 bg-slate-50">
          <Topbar onMenuPress={() => setSidebarOpen(!sidebarOpen)} />
          <Slot />
          
          {/* Bottom Navigation Bar for Mobile */}
          {isMob && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              backgroundColor: '#fff',
              paddingVertical: 10,
              paddingBottom: Platform.OS === 'ios' ? 24 : 10,
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
            }}>
              <TouchableOpacity onPress={() => router.push('/user/dashboard')} style={{ alignItems: 'center', gap: 4 }}>
                <Home size={22} color={pathname === '/user/dashboard' ? '#2563EB' : '#94A3B8'} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: pathname === '/user/dashboard' ? '#2563EB' : '#94A3B8' }}>Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/user/appointments/appointment-list')} style={{ alignItems: 'center', gap: 4 }}>
                <Calendar size={22} color={pathname.includes('appointments') ? '#2563EB' : '#94A3B8'} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: pathname.includes('appointments') ? '#2563EB' : '#94A3B8' }}>Appointments</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/user/dashboard')} style={{ alignItems: 'center', gap: 4 }}>
                <View>
                  <MessageSquare size={22} color={pathname.includes('chat') ? '#2563EB' : '#94A3B8'} />
                  {unreadChats > 0 && (
                    <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 4, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{unreadChats > 9 ? '9+' : unreadChats}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: pathname.includes('chat') ? '#2563EB' : '#94A3B8' }}>Chats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/user/dashboard')} style={{ alignItems: 'center', gap: 4 }}>
                <Video size={22} color={pathname.includes('video') ? '#2563EB' : '#94A3B8'} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: pathname.includes('video') ? '#2563EB' : '#94A3B8' }}>Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={logout} style={{ alignItems: 'center', gap: 4 }}>
                <LogOut size={22} color="#94A3B8" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

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
          backgroundColor: '#0A0F1E', zIndex: 1000
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
              onNavigationStateChange={(navState) => {
                const url = navState.url;
                console.log('[WebView] Patient Navigated to:', url);
                if (url.includes('static/close3.html') || url.includes('close3') || url.includes('thankyou') || url.includes('/static/close')) {
                  handleEndCall();
                }
              }}
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
    </SafeAreaView>
  );
}
