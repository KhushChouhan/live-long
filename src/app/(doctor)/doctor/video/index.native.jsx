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

function getRoomName(id) {
  return `${ROOM_PREFIX}-${String(id).replace(/\s/g, '-')}`;
}

function getJitsiUrl(apptId) {
  const room = getRoomName(apptId);
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
    const jitsiUrl = getJitsiUrl(patient?.id || 'room');

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
            Powered by Jitsi Meet • Free • No account needed
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip icon={<ShieldCheck size={12} color="#10B981" />} label="Encrypted"  color="#10B981" bg="#F0FDF4" />
            <Chip icon={<Users       size={12} color="#10B981" />} label="Jitsi Meet" color="#10B981" bg="#ECFDF5" />
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
            {'🟢 Jitsi Meet — Free, Open Source, WebRTC'}
          </Text>
          <Text style={{ fontSize: 10, color: '#059669' }}>
            {'Server: meet.jit.si  •  No API key needed  •  Works globally'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
