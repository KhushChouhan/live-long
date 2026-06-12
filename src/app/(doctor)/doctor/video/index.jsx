/**
 * Video Consultation Screen — WEB (Normalized UI)
 * Clean, standard medical telemedicine interface
 * Powered by Jitsi Meet
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useDoctor } from '../../../../store/DoctorContext';
import { getJitsiRoomName } from '../../../../utils/roomUtils';
import {
  Video, Phone, PhoneOff, ShieldCheck, Users, CheckCircle, Wifi, Activity, Clock,
} from 'lucide-react-native';
import { MotiView } from 'moti';

// ─── LOBBY CARD ───────────────────────────────────────────────────────────────
function AppointmentCard({ appt, onJoin, index }) {
  const riskColor = appt.risk === 'High Risk' ? '#EF4444' : appt.risk === 'Medium Risk' ? '#F59E0B' : '#10B981';
  return (
    <MotiView
      from={{ opacity:0, translateY:16 }}
      animate={{ opacity:1, translateY:0 }}
      transition={{ delay: index * 80 }}
      style={{ backgroundColor:'#fff', borderRadius:16, marginBottom:12, overflow:'hidden',
               shadowColor:'#64748B', shadowOpacity:0.06, shadowRadius:12, elevation:3,
               borderWidth:1, borderColor:'#E2E8F0' }}
    >
      {/* Top risk stripe */}
      <View style={{ height:3, backgroundColor: riskColor, opacity:0.7 }} />
      <View style={{ padding:16 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
          {/* Avatar */}
          <View style={{ width:52, height:52, borderRadius:26, alignItems:'center', justifyContent:'center',
                         backgroundColor:'#ECFDF5', borderWidth:2, borderColor:'#A7F3D0' }}>
            <Text style={{ fontSize:16, fontWeight:'800', color:'#047857' }}>{appt.avatar}</Text>
          </View>

          {/* Info */}
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:15, fontWeight:'800', color:'#0F172A', marginBottom:2 }}>{appt.name}</Text>
            <Text style={{ fontSize:11, color:'#64748B' }}>{appt.time}  ·  {appt.service}</Text>
            {appt.complaint && (
              <Text style={{ fontSize:10, color:'#94A3B8', marginTop:3, fontStyle:'italic' }} numberOfLines={1}>
                &ldquo;{appt.complaint}&rdquo;
              </Text>
            )}
          </View>

          {/* Join */}
          <TouchableOpacity onPress={() => onJoin(appt)} activeOpacity={0.85}
            style={{ backgroundColor:'#10B981', borderRadius:14, paddingHorizontal:16, paddingVertical:10,
                     flexDirection:'row', alignItems:'center', gap:6,
                     shadowColor:'#10B981', shadowOpacity:0.25, shadowRadius:8, elevation:4 }}>
            <Phone size={14} color="#fff" />
            <Text style={{ color:'#fff', fontSize:12, fontWeight:'800' }}>Start Call</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ flexDirection:'row', alignItems:'center', marginTop:12, paddingTop:10, borderTopWidth:1, borderTopColor:'#F1F5F9', gap:8 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor: appt.status==='Active' ? '#E6F4EA' : '#F8FAFC',
                         paddingHorizontal:8, paddingVertical:4, borderRadius:20 }}>
            <View style={{ width:6,height:6,borderRadius:3, backgroundColor: appt.status==='Active' ? '#10B981' : '#94A3B8' }} />
            <Text style={{ fontSize:10, fontWeight:'700', color: appt.status==='Active' ? '#10B981' : '#94A3B8' }}>{appt.status}</Text>
          </View>
          {appt.risk && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:`${riskColor}12`,
                           paddingHorizontal:8, paddingVertical:4, borderRadius:20 }}>
              <Activity size={10} color={riskColor} />
              <Text style={{ fontSize:10, fontWeight:'700', color:riskColor }}>{appt.risk}</Text>
            </View>
          )}
          <View style={{ flex:1 }} />
          <Clock size={10} color="#94A3B8" />
          <Text style={{ fontSize:10, color:'#94A3B8' }}>{appt.date || 'Today'}</Text>
        </View>
      </View>
    </MotiView>
  );
}

const getCleanRoomName = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('khushwant')) return 'khushwant';
  if (n.includes('amit')) return 'amit';
  if (n.includes('kiran')) return 'kiran';
  if (n.includes('sneha')) return 'sneha';
  if (n.includes('vikram')) return 'vikram';
  return n.replace(/[^a-z0-9]/g, '');
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function VideoScreen() {
  const { videoCall, endVideoConsult, startVideoConsult, appointments } = useDoctor();

  const [callEnded, setCallEnded] = useState(false);
  const winRef = useRef(null);

  // Auto-open Jitsi room in a new tab on Web & monitor it
  useEffect(() => {
    let interval;
    if (videoCall.isActive && typeof window !== 'undefined') {
      const patient = videoCall.patient;
      const room = videoCall.roomName || getJitsiRoomName(patient?.id);
      const jitsiUrl = `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.requireDisplayName=false&config.enableUserRolesBasedOnToken=false&config.disableInviteFunctions=true&config.defaultRemoteDisplayName="Patient"&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&userInfo.displayName=Dr.%20Lawrence&userInfo.moderator=true`;
      
      if (winRef.current && !winRef.current.closed) {
        try { winRef.current.close(); } catch(e) {}
      }

      winRef.current = window.open(jitsiUrl, '_blank');

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
  }, [videoCall.isActive, videoCall.patient, videoCall.roomName]);

  // Close browser tab if the call was ended by the other peer
  useEffect(() => {
    if (!videoCall.isActive && winRef.current && !winRef.current.closed) {
      try {
        winRef.current.close();
      } catch (e) {
        console.warn('Failed to close video window:', e);
      }
    }
  }, [videoCall.isActive]);

  const videoAppts = appointments.filter(
    a => a.type === 'video' && a.status !== 'Completed' && a.status !== 'Cancelled',
  );

  const handleEndCall = () => {
    setCallEnded(true);
    endVideoConsult();
    if (winRef.current && !winRef.current.closed) {
      try { winRef.current.close(); } catch (e) {}
    }
    setTimeout(() => setCallEnded(false), 3500);
  };

  // ── ENDED ────────────────────────────────────────────────────────────────────
  if (callEnded) return (
    <View style={{ flex:1, backgroundColor:'#111827', alignItems:'center', justifyContent:'center' }}>
      <MotiView from={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring' }}
        style={{ alignItems:'center', padding:40 }}>
        <MotiView from={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:200 }}
          style={{ width:90, height:90, borderRadius:45, backgroundColor:'#10B98120',
                   borderWidth:2, borderColor:'#10B981', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <CheckCircle size={42} color="#10B981" />
        </MotiView>
        <Text style={{ color:'#F1F5F9', fontSize:22, fontWeight:'900', marginBottom:8, letterSpacing:-0.5 }}>
          Session Complete
        </Text>
        <Text style={{ color:'#94A3B8', fontSize:13, textAlign:'center', lineHeight:20 }}>
          {'Consultation ended successfully.'}
        </Text>
      </MotiView>
    </View>
  );

  // ── ACTIVE CALL ──────────────────────────────────────────────────────────────
  if (videoCall.isActive) {
    const patient = videoCall.patient;
    const clean = getCleanRoomName(patient?.name);
    const room = `livelong-consult-${patient?.id || clean}`;
    const jitsiUrl = `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.requireDisplayName=false&config.enableUserRolesBasedOnToken=false&config.disableInviteFunctions=true&config.defaultRemoteDisplayName="Patient"&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&userInfo.displayName=Dr.%20Lawrence&userInfo.moderator=true`;

    return (
      <View style={{ flex:1, backgroundColor:'#111827', position:'relative' }}>
        {/* Top bar */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10, backgroundColor:'rgba(17,24,39,0.97)', borderBottomWidth:1, borderBottomColor:'#374151', zIndex: 10 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#EF4444' }} />
            <Text style={{ color:'#F1F5F9', fontSize:11, fontWeight:'800', letterSpacing:0.8 }}>LIVE • {patient?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleEndCall}
            style={{ backgroundColor:'#EF4444', flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:7, borderRadius:20 }}
          >
            <PhoneOff size={13} color="#fff" />
            <Text style={{ color:'#fff', fontSize:11, fontWeight:'800' }}>End Session</Text>
          </TouchableOpacity>
        </View>

        {/* Centered Launch Room Card */}
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:40 }}>
          <View style={{
            backgroundColor:'#1F2937', borderRadius:20, padding:32, width:'100%', maxWidth:440,
            borderWidth:1, borderColor:'#374151', alignItems:'center',
            shadowColor:'#000', shadowOpacity:0.4, shadowRadius:12, elevation:10
          }}>
            <MotiView
              from={{ scale:0.9, opacity:0.5 }}
              animate={{ scale:[1, 1.05, 1], opacity:[0.5, 1, 0.5] }}
              transition={{ type:'timing', duration:2000, loop:true }}
              style={{
                width:80, height:80, borderRadius:40, backgroundColor:'rgba(16,185,129,0.1)',
                alignItems:'center', justifyContent:'center', marginBottom:20,
                borderWidth:2, borderColor:'#10B981'
              }}
            >
              <Video size={36} color="#10B981" />
            </MotiView>

            <Text style={{ color:'#F1F5F9', fontSize:18, fontWeight:'800', textAlign:'center', marginBottom:8 }}>
              Telehealth Room Active
            </Text>
            <Text style={{ color:'#94A3B8', fontSize:13, textAlign:'center', marginBottom:24, lineHeight:20 }}>
              The video consultation has been opened in a new secure window. You can rejoin at any time using the button below.
            </Text>

            <TouchableOpacity
              onPress={() => window.open(jitsiUrl, '_blank')}
              style={{
                backgroundColor:'#10B981', paddingVertical:14, paddingHorizontal:28, borderRadius:12,
                flexDirection:'row', alignItems:'center', gap:8, width:'100%', justifyContent:'center',
                shadowColor:'#10B981', shadowOpacity:0.3, shadowRadius:8, elevation:5
              }}
            >
              <Video size={18} color="#FFFFFF" />
              <Text style={{ color:'#FFFFFF', fontWeight:'700', fontSize:14 }}>Open Consultation Room</Text>
            </TouchableOpacity>

            <Text style={{ color:'rgba(255,255,255,0.4)', fontSize:11, textAlign:'center', marginTop:16 }}>
              Please keep this dashboard open to take notes during the call.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ minHeight:'100%' }} showsVerticalScrollIndicator={false}>
      {/* Normalized Header with light background */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        position: 'relative'
      }}>
        <MotiView from={{ opacity:0, translateY:-12 }} animate={{ opacity:1, translateY:0 }}
          style={{ alignItems:'center' }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor:'rgba(16,185,129,0.1)',
            borderWidth:1.5, borderColor:'rgba(16,185,129,0.3)',
            alignItems:'center', justifyContent:'center', marginBottom:14 }}>
            <Video size={32} color="#10B981" />
          </View>
          <Text style={{ color:'#0F172A', fontSize:20, fontWeight:'800', letterSpacing:-0.5, marginBottom:6 }}>
            Video Consultation
          </Text>
          <Text style={{ color:'#64748B', fontSize:12, textAlign:'center', lineHeight:18 }}>
            Browser-native WebRTC  ·  Peer-to-peer encrypted  ·  No login required
          </Text>

          {/* Feature chips */}
          <View style={{ flexDirection:'row', gap:8, marginTop:16, flexWrap:'wrap', justifyContent:'center' }}>
            {[
              { icon:<ShieldCheck size={11} color="#10B981"/>, label:'E2E Encrypted', c:'#10B981', bg:'rgba(16,185,129,0.1)' },
              { icon:<Wifi size={11} color="#10B981"/>,        label:'P2P WebRTC',   c:'#10B981', bg:'rgba(16,185,129,0.1)' },
              { icon:<Users size={11} color="#64748B"/>,       label:'No Login',     c:'#64748B', bg:'rgba(100,116,139,0.1)' },
            ].map(ch => (
              <View key={ch.label} style={{ flexDirection:'row', alignItems:'center', gap:5,
                backgroundColor:ch.bg, paddingHorizontal:10, paddingVertical:5, borderRadius:20,
                borderWidth:1, borderColor:`${ch.c}20` }}>
                {ch.icon}
                <Text style={{ fontSize:10, fontWeight:'700', color:ch.c }}>{ch.label}</Text>
              </View>
            ))}
          </View>
        </MotiView>
      </View>

      {/* Appointments list */}
      <View style={{ padding:20, backgroundColor:'#F8FAFC', flex:1 }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <Text style={{ fontSize:14, fontWeight:'800', color:'#1E293B' }}>
            Video Appointments
          </Text>
          <View style={{ backgroundColor:'#ECFDF5', borderRadius:20, paddingHorizontal:10, paddingVertical:4,
            borderWidth:1, borderColor:'#A7F3D0' }}>
            <Text style={{ fontSize:11, fontWeight:'700', color:'#047857' }}>
              {videoAppts.length} scheduled
            </Text>
          </View>
        </View>

        {videoAppts.length > 0 ? (
          videoAppts.map((appt, i) => (
            <AppointmentCard key={appt.id} appt={appt} index={i}
              onJoin={(a) => startVideoConsult(a.id)} />
          ))
        ) : (
          <MotiView from={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ backgroundColor:'#fff', borderRadius:20, padding:40, alignItems:'center',
                     borderWidth:1.5, borderStyle:'dashed', borderColor:'#CBD5E1' }}>
            <Video size={32} color="#CBD5E1" />
            <Text style={{ color:'#94A3B8', fontSize:14, fontWeight:'600', marginTop:12 }}>
              No video appointments today
            </Text>
            <Text style={{ color:'#CBD5E1', fontSize:12, marginTop:4 }}>
              Schedule a video consultation from the dashboard
            </Text>
          </MotiView>
        )}
      </View>
    </ScrollView>
  );
}
