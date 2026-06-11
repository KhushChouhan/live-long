/**
 * Video Consultation Screen — NATIVE version (iOS / Android)
 * Opens Jitsi Meet room in a full-screen WebView.
 * Free, no account, no API key needed.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDoctor } from '../../../../store/DoctorContext';
import {
  Video,
  Phone,
  PhoneOff,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
  Wifi,
} from 'lucide-react-native';
import { MotiView } from 'moti';

// ─── JITSI CONFIG ─────────────────────────────────────────────────────────────
const JITSI_DOMAIN = 'meet.jit.si';
const ROOM_PREFIX  = 'livelong-consult';

// Desktop user agent — forces Jitsi to load full WebRTC desktop UI
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Injected before Jitsi loads — overrides Permissions API so camera is pre-granted
const CAMERA_JS = `
(function() {
  try {
    const origQuery = navigator.permissions && navigator.permissions.query.bind(navigator.permissions);
    if (origQuery) {
      navigator.permissions.query = function(desc) {
        if (desc && (desc.name === 'camera' || desc.name === 'microphone')) {
          return Promise.resolve({ state: 'granted', onchange: null });
        }
        return origQuery(desc);
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
    '#premeeting-screen { padding-top: 40px !important; }',
    '.chrome-extension-banner { display: none !important; }'
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

  // 3. Scan and hide login / sign-in / host authentication buttons
  function hideLoginAndBrand() {
    // Hide any buttons, links, or text containing "login" / "sign in" / "host"
    var elements = document.querySelectorAll('button, a, div, span, p, img');
    elements.forEach(function(el) {
      // Check images/svgs containing Jitsi logo
      if (el.tagName === 'IMG' && el.src) {
        var src = el.src.toLowerCase();
        if (src.indexOf('jitsi') > -1 || src.indexOf('logo') > -1 || src.indexOf('watermark') > -1) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
      
      var text = (el.innerText || el.textContent || '').toLowerCase().trim();
      var isJoinBtn = text.indexOf('join') > -1 || text.indexOf('enter') > -1;
      
      if (!isJoinBtn && text.length > 0) {
        if (
          text === 'log in' || text === 'login' || text === 'sign in' || text === 'signin' ||
          text.indexOf('i am the host') > -1 || text.indexOf('wait for the host') > -1 ||
          text.indexOf('login to start') > -1 || text.indexOf('sign in to start') > -1 ||
          (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').indexOf('login') > -1)
        ) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });

    // 4. Inject LiveLong brand logo in place of Jitsi logo in top-left
    var logoId = 'livelong-injected-logo';
    if (!document.getElementById(logoId)) {
      var container = document.createElement('div');
      container.id = logoId;
      container.style.cssText = 'position: absolute; top: 18px; left: 18px; z-index: 999999; pointer-events: none; background: rgba(10, 15, 30, 0.45); padding: 5px 8px; borderRadius: 6px;';
      container.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 100" style="width: 100px; height: 27px;" fill="#00B3A4"><g transform="translate(0,100) scale(0.1,-0.1)" fill="#FFFFFF" stroke="none"><path d="M423 841 c-122 -45 -197 -139 -209 -262 -15 -160 39 -255 227 -400 91 -71 127 -94 137 -86 9 7 -9 31 -76 96 -118 114 -147 168 -147 276 0 74 3 84 33 132 39 61 74 84 156 108 58 17 154 17 198 0 16 -6 16 -4 7 24 -34 98 -205 157 -326 112z" fill="#0066FF"/><path d="M1496 684 c-9 -8 -16 -22 -16 -29 0 -7 7 -21 16 -29 30 -30 74 -13 74 29 0 42 -44 59 -74 29z"/><path d="M1200 465 l0 -215 125 0 125 0 0 30 0 29 -87 3 -88 3 -3 183 -2 182 -35 0 -35 0 0 -215z"/><path d="M2260 465 l0 -215 130 0 130 0 0 30 0 30 -90 0 -90 0 0 185 0 185 -40 0 -40 0 0 -215z"/><path d="M787 659 c-92 -22 -175 -88 -217 -174 -18 -38 -24 -67 -24 -120 -1 -38 4 -78 10 -88 9 -15 16 -8 54 49 46 69 192 224 211 224 6 0 -16 -29 -49 -65 -105 -115 -182 -248 -182 -313 0 -49 13 -55 46 -21 16 17 72 57 124 89 172 107 213 167 214 310 1 119 1 120 -81 119 -37 -1 -85 -5 -106 -10z" fill="#0066FF"/><path d="M1497 554 c-4 -4 -7 -74 -7 -156 l0 -148 40 0 41 0 -3 153 -3 152 -30 3 c-17 2 -34 0 -38 -4z"/><path d="M1610 553 c0 -4 23 -75 52 -156 l52 -148 45 3 45 3 48 135 c26 74 51 143 54 153 5 16 1 18 -33 15 l-38 -3 -35 -102 c-19 -56 -38 -104 -41 -107 -3 -3 -21 42 -40 101 l-35 108 -37 3 c-20 2 -37 0 -37 -5z"/><path d="M1992 540 c-89 -54 -81 -240 12 -284 61 -29 134 -18 175 25 32 35 28 52 -11 44 -18 -3 -45 -11 -60 -17 -39 -15 -75 -2 -93 32 -8 16 -15 31 -15 35 0 3 48 5 106 5 l106 0 -7 47 c-9 64 -29 99 -65 118 -41 21 -108 19 -148 -5z m122 -62 c29 -41 21 -48 -49 -48 -36 0 -65 2 -65 5 0 4 7 19 15 35 13 24 22 30 50 30 24 0 39 -7 49 -22z"/><path d="M2619 537 c-45 -30 -64 -71 -64 -137 1 -98 59 -160 150 -160 84 0 145 67 145 158 0 104 -53 162 -147 162 -36 0 -60 -7 -84 -23z m135 -59 c33 -54 26 -147 -14 -168 -58 -31 -110 11 -110 90 0 63 28 100 75 100 25 0 38 -6 49 -22z"/><path d="M2910 405 l0 -155 35 0 35 0 0 99 c0 84 3 102 21 125 23 29 60 34 83 10 13 -12 16 -39 16 -125 l0 -109 41 0 41 0 -4 118 c-6 156 -25 191 -104 192 -27 0 -50 -7 -67 -20 -14 -11 -28 -20 -31 -20 -3 0 -6 9 -6 20 0 16 -7 20 -30 20 l-30 0 0 -155z"/><path d="M3298 544 c-76 -40 -88 -182 -23 -253 30 -32 38 -36 84 -35 39 0 57 6 75 23 l24 23 -5 -44 c-3 -23 -12 -51 -21 -60 -21 -25 -77 -23 -102 2 -12 12 -33 20 -55 20 -40 0 -40 -1 -20 -39 40 -78 199 -81 250 -5 18 26 20 47 20 204 l0 175 -32 3 c-25 2 -33 -1 -33 -12 0 -20 -11 -20 -36 -1 -25 19 -91 18 -126 -1z m136 -66 c48 -78 5 -181 -68 -162 -61 15 -76 140 -22 176 24 17 75 8 90 -14z"/></g></svg>';
      (document.body || document.documentElement).appendChild(container);
    }
  }
  
  hideLoginAndBrand();
  // Run periodically to catch dynamic UI state changes
  setInterval(hideLoginAndBrand, 500);

  true;
})();
`;

function getCleanRoomName(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('khushwant')) return 'khushwant';
  if (n.includes('amit')) return 'amit';
  if (n.includes('kiran')) return 'kiran';
  if (n.includes('sneha')) return 'sneha';
  if (n.includes('vikram')) return 'vikram';
  return n.replace(/[^a-z0-9]/g, '');
}

function getRoomName(patient) {
  if (patient?.id) {
    return `${ROOM_PREFIX}-${patient.id}`;
  }
  const clean = getCleanRoomName(patient?.name);
  return `${ROOM_PREFIX}-${clean}`;
}

function getJitsiUrl(patient) {
  const room = getRoomName(patient);
  const name = encodeURIComponent('Dr. Lawrence');
  const params = [
    'config.prejoinPageEnabled=false',
    'config.prejoinConfig.enabled=false',
    'config.startWithAudioMuted=false',
    'config.startWithVideoMuted=false',
    'config.disableDeepLinking=true',
    'config.requireDisplayName=false',
    'config.enableUserRolesBasedOnToken=false',
    'config.disableInviteFunctions=true',
    'config.defaultRemoteDisplayName=%22Patient%22',
    'config.watermark.enabled=false',
    'config.logoClickUrl=%22%22',
    'config.logoImageUrl=%22%22',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    'interfaceConfig.SHOW_BRAND_WATERMARK=false',
    `userInfo.displayName=${name}`,
    'userInfo.moderator=true',
  ].join('&');
  return `https://${JITSI_DOMAIN}/${room}#${params}`;
}

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#111827',
  surface: '#1F2937',
  border:  '#374151',
  primary: '#10B981',
  success: '#10B981',
  danger:  '#EF4444',
  text:    '#F1F5F9',
  textMid: '#94A3B8',
};

function Chip({ icon, label, color, bg }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
      {icon}
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}

export default function VideoScreen() {
  const { videoCall, endVideoConsult, startVideoConsult, appointments } = useDoctor();

  const webViewRef = useRef(null);
  const [callEnded, setCallEnded] = useState(false);

  // Request camera & audio permissions on Android on mount (early, before WebView loads)
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      ]).catch(err => console.warn('Doctor native permission request failed:', err));
    }
  }, []);

  const videoAppts = appointments.filter(
    a => a.type === 'video' && a.status !== 'Completed' && a.status !== 'Cancelled',
  );

  // Handle Android back button during call
  useEffect(() => {
    if (!videoCall.isActive) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });
    return () => handler.remove();
  }, [videoCall.isActive]); // eslint-disable-line

  const handleEndCall = () => {
    setCallEnded(true);
    endVideoConsult();
    setTimeout(() => setCallEnded(false), 3000);
  };

  // ── Call ended ──
  if (callEnded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <MotiView from={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ alignItems: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#10B98115', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle size={36} color={C.success} />
          </View>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Consultation Ended</Text>
          <Text style={{ color: C.textMid, fontSize: 13, textAlign: 'center' }}>
            {'Session completed.\nMedical log has been saved.'}
          </Text>
        </MotiView>
      </SafeAreaView>
    );
  }

  // ── Active call — WebView with Jitsi ──
  if (videoCall.isActive) {
    const patient = videoCall.patient;
    const jitsiUrl = getJitsiUrl(patient);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(17,24,39,0.97)', borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger }} />
            <Text style={{ color: C.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>LIVE • {patient?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleEndCall}
            style={{ backgroundColor: C.danger, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}
          >
            <PhoneOff size={13} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>End Session</Text>
          </TouchableOpacity>
        </View>

        {/* Jitsi in WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: jitsiUrl }}
          style={{ flex: 1 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          originWhitelist={['*']}
          userAgent={DESKTOP_UA}
          scalesPageToFit={true}
          useWideViewPort={true}
          mixedContentMode="always"
          injectedJavaScriptBeforeContentLoaded={CAMERA_JS}
          injectedJavaScript={POST_JS}
          onPermissionRequest={(event) => {
            event.request.grant(event.request.resources);
          }}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            if (data === 'hangup') handleEndCall();
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Lobby ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -16 }} animate={{ opacity: 1, translateY: 0 }} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: 20, padding: 16, marginBottom: 14 }}>
            <Video size={36} color="#10B981" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Video Consultation Room</Text>
          <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
            Secure Video Consultations • LiveLong Platform
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip icon={<ShieldCheck size={12} color="#10B981" />} label="Encrypted"  color="#10B981" bg="#F0FDF4" />
            <Chip icon={<Users       size={12} color="#10B981" />} label="Secure RTC" color="#10B981" bg="#ECFDF5" />
            <Chip icon={<Wifi        size={12} color="#10B981" />} label="100% Free"  color="#10B981" bg="#F0FDF4" />
            <Chip icon={<Clock       size={12} color="#8B5CF6" />} label="No API Key" color="#8B5CF6" bg="#EDE9FE" />
          </View>
        </MotiView>

        {/* Appointment cards */}
        <View style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>Scheduled Video Consultations</Text>
            <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>{videoAppts.length} pending</Text>
            </View>
          </View>

          {videoAppts.length > 0 ? (
            videoAppts.map((appt, i) => (
              <MotiView key={appt.id} from={{ opacity: 0, translateX: -16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 100 + i * 60 }} style={{ backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#047857' }}>{appt.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{appt.name}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{appt.time}  •  {appt.service}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B', marginTop: 3 }}>Room: {getRoomName(appt.id)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => startVideoConsult(appt.id)}
                    activeOpacity={0.8}
                    style={{ backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Phone size={13} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Join Call</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8' }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{appt.status}</Text>
                  <ExternalLink size={10} color="#10B981" style={{ marginLeft: 'auto' }} />
                </View>
              </MotiView>
            ))
          ) : (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1' }}>
              <Video size={28} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 10 }}>No video consultations scheduled</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{ marginTop: 12, padding: 14, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', width: '100%' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46', marginBottom: 3 }}>
            {'🟢 Secure LiveLong Telehealth Connection'}
          </Text>
          <Text style={{ fontSize: 10, color: '#059669' }}>
            {'Fully encrypted WebRTC  •  No account required  •  Works globally'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
