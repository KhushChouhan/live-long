import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Platform, Modal, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDoctor } from '../../store/DoctorContext';
import { useAuth } from '../../store/AuthContext';

export default function Topbar({ onMenuPress }) {
  const { searchQ, setSearchQ, notifLog, markAllNotifLogRead, setActiveChatPatientId } = useDoctor();
  const pathname = usePathname();
  const { user } = useAuth();
  const { width: W } = useWindowDimensions();
  const isMobile = W < 600;

  const [currentUser, setCurrentUser] = useState(user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const unreadNotifs = notifLog?.filter(n => !n.read).length || 0;
  const isUserPath = pathname.includes('/user');

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      AsyncStorage.getItem('current_user')
        .then(str => { if (str) setCurrentUser(JSON.parse(str)); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = () => {
    if (pathname.includes('/doctor')) return 'DL';
    if (!currentUser?.name) return 'PT';
    const parts = currentUser.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return currentUser.name.substring(0, 2).toUpperCase();
  };

  const getTitle = (path) => {
    if (!path) return 'Dashboard';
    const isUser = path.includes('/user');
    if (path === '/doctor/dashboard' || path === '/doctor' || path === '/user/dashboard' || path === '/') {
      return isUser ? 'Patient Portal' : 'Dashboard';
    }
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/chat')) return 'Chats';
    if (path.includes('/video')) return 'Video Call';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/billing')) return 'Billing';
    if (path.includes('/patients')) return 'Patients';
    if (path.includes('/prescriptions')) return 'Prescriptions';
    if (path.includes('/lab-reports')) return 'Lab Reports';
    if (path.includes('/invoices')) return 'Invoices';
    if (path.includes('/medication')) return 'Medications';
    if (path.includes('/diagnostics')) return 'Diagnostics';
    return isUser ? 'Patient Portal' : 'Doctor Portal';
  };

  // ── Mobile Search Overlay ─────────────────────────────────────────────────
  const SearchOverlay = () => (
    <Modal visible={searchVisible} transparent animationType="fade" onRequestClose={() => setSearchVisible(false)}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        activeOpacity={1}
        onPress={() => setSearchVisible(false)}
      />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 46 : 52,
        paddingHorizontal: 16, paddingBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#3B82F6',
            borderRadius: 12, paddingHorizontal: 12, height: 44,
          }}>
            <Feather name="search" size={16} color="#3B82F6" />
            <TextInput
              autoFocus
              placeholder="Search here..."
              placeholderTextColor="#94A3B8"
              value={searchQ}
              onChangeText={setSearchQ}
              style={{ flex: 1, fontSize: 14, color: '#0F172A', ...Platform.select({ web: { outline: 'none' } }) }}
            />
            {searchQ.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQ('')}>
                <Feather name="x" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setSearchVisible(false)}
            style={{ backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ── Notification Panel ────────────────────────────────────────────────────
  const NotifPanel = () => (
    showNotif && (
      <>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowNotif(false)}
          style={{
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            top: Platform.OS === 'web' ? 0 : -200,
            left: Platform.OS === 'web' ? 0 : -1000,
            right: Platform.OS === 'web' ? 0 : -1000,
            bottom: Platform.OS === 'web' ? 0 : -1000,
            zIndex: 90, backgroundColor: 'transparent',
          }}
        />
        <View style={{
          position: 'absolute',
          top: 48,
          right: isMobile ? -50 : 0,
          width: isMobile ? Math.min(W - 24, 340) : 360,
          backgroundColor: '#fff', borderRadius: 14,
          shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 100,
          maxHeight: 440,
        }}>
          {/* Arrow */}
          <View style={{ position: 'absolute', top: -6, right: isMobile ? 60 : 14, width: 0, height: 0, borderLeftWidth: 6, borderLeftColor: 'transparent', borderRightWidth: 6, borderRightColor: 'transparent', borderBottomWidth: 6, borderBottomColor: '#E2E8F0', zIndex: 101 }} />
          <View style={{ position: 'absolute', top: -5, right: isMobile ? 60 : 14, width: 0, height: 0, borderLeftWidth: 6, borderLeftColor: 'transparent', borderRightWidth: 6, borderRightColor: 'transparent', borderBottomWidth: 6, borderBottomColor: '#fff', zIndex: 102 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15 }}>🔔</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>Notifications</Text>
              {unreadNotifs > 0 && (
                <View style={{ backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#3B82F6' }}>{unreadNotifs}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={markAllNotifLogRead}>
              <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '600' }}>Mark all read</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {(!notifLog || notifLog.length === 0) ? (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Feather name="bell-off" size={26} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 10, fontWeight: '500' }}>No notifications yet</Text>
              </View>
            ) : (
              notifLog.map((n, i) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={n.isChat ? 0.7 : 1}
                  onPress={() => {
                    if (n.isChat && n.patientId) {
                      setActiveChatPatientId(n.patientId);
                      setShowNotif(false);
                    }
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'flex-start',
                    paddingHorizontal: 14, paddingVertical: 13,
                    borderBottomWidth: i < notifLog.length - 1 ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                    backgroundColor: n.read ? '#fff' : '#EFF6FF',
                    minHeight: 52, // good touch target
                  }}
                >
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: n.read ? '#CBD5E1' : '#3B82F6', marginTop: 5, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', flex: 1 }}>{n.patient}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8' }}>{n.time}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 16 }}>{n.msg}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </>
    )
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  MOBILE TOPBAR
  // ─────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <View style={{
        height: 60, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, gap: 10,
        position: 'relative', zIndex: 1000,
      }}>
        {/* Hamburger */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        >
          <Feather name="menu" size={22} color="#475569" />
        </TouchableOpacity>

        {/* Title (centered) */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: isUserPath ? '#0066FF' : '#0F172A', letterSpacing: -0.3 }}>
            {getTitle(pathname)}
          </Text>
        </View>

        {/* Search icon */}
        <TouchableOpacity
          onPress={() => setSearchVisible(true)}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <Feather name="search" size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Bell */}
        <View style={{ position: 'relative', zIndex: 50 }}>
          <TouchableOpacity
            onPress={() => setShowNotif(!showNotif)}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Feather name="bell" size={18} color="#64748B" />
            {unreadNotifs > 0 && (
              <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', borderWidth: 1.5, borderColor: '#fff' }} />
            )}
          </TouchableOpacity>
          <NotifPanel />
        </View>

        {/* Avatar */}
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', borderWidth: 1.5, borderColor: '#93C5FD', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#1D4ED8' }}>{getInitials()}</Text>
        </View>

        <SearchOverlay />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DESKTOP TOPBAR
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View
      style={{ minHeight: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, position: 'relative', zIndex: 1000 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity onPress={onMenuPress} style={{ padding: 8, borderRadius: 8 }}>
          <Feather name="menu" size={22} color="#64748b" />
        </TouchableOpacity>
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: isUserPath ? '#0066FF' : '#0F172A', letterSpacing: -0.3 }}>
            {getTitle(pathname)}
          </Text>
          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
            {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, width: 220, height: 38 }}>
          <Feather name="search" size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search here"
            placeholderTextColor="#94A3B8"
            value={searchQ}
            onChangeText={setSearchQ}
            style={{ flex: 1, fontSize: 13, color: '#0F172A', ...Platform.select({ web: { outline: 'none' } }) }}
          />
          {searchQ.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQ('')}>
              <Feather name="x" size={13} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => router.push(isUserPath ? '/user/settings' : '/doctor/settings')}
          style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
        >
          <Feather name="settings" size={17} color="#475569" />
        </TouchableOpacity>



        {/* Bell */}
        <View style={{ position: 'relative', zIndex: 50 }}>
          <TouchableOpacity onPress={() => setShowNotif(!showNotif)} style={{ padding: 8, borderRadius: 20 }}>
            <Feather name="bell" size={20} color="#64748b" />
            {unreadNotifs > 0 && <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#3B82F6', borderRadius: 4 }} />}
          </TouchableOpacity>
          <NotifPanel />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('current_user');
              await AsyncStorage.removeItem('csrf_token');
              await AsyncStorage.removeItem('logout_token');
            } catch (e) { console.error(e); }
            router.replace('/login');
          }}
          style={{ padding: 8, borderRadius: 20 }}
        >
          <Feather name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', borderWidth: 1.5, borderColor: '#93C5FD', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1D4ED8' }}>{getInitials()}</Text>
        </View>
      </View>
    </View>
  );
}
