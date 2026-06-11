/**
 * Patient Video Join Page — /join?room=livelong-doctor-{id}
 * Opens the Jitsi Meet room in the device's real browser for full camera access.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { PhoneOff, CheckCircle, AlertCircle, Video, ExternalLink } from 'lucide-react-native';

function buildJitsiUrl(room, displayName = 'Patient') {
  return (
    `https://meet.jit.si/${room}` +
    `#config.prejoinPageEnabled=false` +
    `&config.prejoinConfig.enabled=false` +
    `&config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false` +
    `&config.disableDeepLinking=true` +
    `&config.requireDisplayName=false` +
    `&config.enableUserRolesBasedOnToken=false` +
    `&config.disableInviteFunctions=true` +
    `&config.watermark.enabled=false` +
    `&config.logoClickUrl=""` +
    `&config.logoImageUrl=""` +
    `&config.defaultRemoteDisplayName="Doctor"` +
    `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
    `&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false` +
    `&interfaceConfig.SHOW_BRAND_WATERMARK=false` +
    `&userInfo.displayName=${encodeURIComponent(displayName)}`
  );
}

export default function PatientJoinPage() {
  const [jitsiUrl, setJitsiUrl] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | connected | ended | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      const apptId = room.includes('livelong-doctor-') ? room.replace('livelong-doctor-', '') : room;

      let targetRoom = apptId;
      if (apptId === '3' || apptId === 'chinu') {
        targetRoom = '77';
      } else if (apptId === 'karan' || apptId === '6') {
        targetRoom = '66';
      } else if (apptId === '5') {
        targetRoom = '55';
      }

      const jitsiRoom = `livelong-consult-${targetRoom}`;
      const url = buildJitsiUrl(jitsiRoom, 'Patient');
      setJitsiUrl(url);
      setStatus('connected');

      if (Platform.OS === 'web') {
        // Web: open in new tab
        window.open(url, '_blank');
      } else {
        // Native: open in real browser (Chrome) for full camera support
        Linking.openURL(url).catch(err => {
          console.warn('Could not open browser:', err);
          setError('Could not open browser. Please copy the link manually.');
          setStatus('error');
        });
      }
    } else {
      setError('Invalid room link. Please ask your doctor for a new link.');
      setStatus('error');
    }
  }, []);

  const handleOpenBrowser = () => {
    if (jitsiUrl) {
      if (Platform.OS === 'web') {
        window.open(jitsiUrl, '_blank');
      } else {
        Linking.openURL(jitsiUrl).catch(() => {});
      }
    }
  };

  const handleLeave = () => setStatus('ended');

  // ── ENDED ──
  if (status === 'ended') {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={48} color="#10B981" />
        <Text style={{ color: '#F1F5F9', fontSize: 20, fontWeight: '800', marginTop: 16 }}>Consultation Ended</Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>Thank you. You may close this tab.</Text>
      </View>
    );
  }

  // ── ERROR ──
  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>Connection Failed</Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>{error}</Text>
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#F1F5F9' }}>Loading consultation room...</Text>
      </View>
    );
  }

  // ── CONNECTED — show in-app card, actual video is in browser ──
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* Top Bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
      }}>
        <View>
          <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '800' }}>Dr. Catherine Lawrence</Text>
          <Text style={{ color: '#94a3b8', fontSize: 10 }}>Cardiology division consultation</Text>
        </View>
        <TouchableOpacity onPress={handleLeave} style={{
          backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20
        }}>
          <PhoneOff size={13} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>Leave Call</Text>
        </TouchableOpacity>
      </View>

      {/* In-call card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          width: 90, height: 90, borderRadius: 45,
          backgroundColor: 'rgba(16,185,129,0.15)',
          borderWidth: 2, borderColor: '#10B981',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24
        }}>
          <Video size={40} color="#10B981" />
        </View>

        <Text style={{ color: '#F1F5F9', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 }}>
          Call in Progress
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Your video call is running in the browser.{'\n'}Tap the button below to switch to it.
        </Text>

        <TouchableOpacity
          onPress={handleOpenBrowser}
          style={{
            backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center',
            gap: 8, paddingVertical: 15, paddingHorizontal: 28, borderRadius: 16,
            width: '100%', justifyContent: 'center',
            shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
            marginBottom: 14
          }}
        >
          <ExternalLink size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
            {Platform.OS === 'web' ? 'Open Video Call' : 'Open in Browser'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLeave}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingVertical: 13, paddingHorizontal: 28, borderRadius: 16,
            width: '100%', justifyContent: 'center',
            borderWidth: 1.5, borderColor: '#EF4444'
          }}
        >
          <PhoneOff size={16} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '800' }}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
