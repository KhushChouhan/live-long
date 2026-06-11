import React, { useState, useEffect } from 'react';
import { View, Platform, SafeAreaView, StatusBar, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { DOCTOR_MENU } from '../../config/navigation';
import { useDoctor } from '../../store/DoctorContext';
import { Home, Calendar, MessageSquare, Video, LogOut } from 'lucide-react-native';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Layout contents inside provider
function LayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { chats } = useDoctor();

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = isWeb && dimensions.width > 768;

  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);

  // Tab configurations
  const tabs = [
    {
      name: 'Home',
      icon: Home,
      path: '/doctor/dashboard',
      badge: null
    },
    {
      name: 'Appointments',
      icon: Calendar,
      path: '/doctor/appointments/appointment-list',
      badge: null
    },
    {
      name: 'Chats',
      icon: MessageSquare,
      path: '/doctor/chat',
      badge: Object.values(chats).reduce((sum, list) => sum + list.filter(m => m.sender === 'patient').length, 0)
    },
    {
      name: 'Video',
      icon: Video,
      path: '/doctor/video',
      badge: null
    },
    {
      name: 'Logout',
      icon: LogOut,
      path: 'logout',
      badge: null
    }
  ];

  // Helper to check if a tab is active
  const isTabActive = (tabPath) => {
    if (tabPath === 'logout') return false;
    if (tabPath === '/doctor/dashboard') {
      return pathname === '/doctor/dashboard' || pathname === '/doctor';
    }
    return pathname.startsWith(tabPath);
  };

  const handleTabPress = async (path) => {
    if (path === 'logout') {
      try {
        await AsyncStorage.removeItem('current_user');
        await AsyncStorage.removeItem('csrf_token');
        await AsyncStorage.removeItem('logout_token');
      } catch (e) {
        console.error(e);
      }
      router.replace('/login');
      return;
    }
    router.push(path);
  };

  // 1. Desktop Layout (Large Screen)
  if (isLargeScreen) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 flex-row">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} menuData={DOCTOR_MENU} />
          <View className="flex-1 bg-slate-50">
            <Topbar onMenuPress={() => setSidebarOpen(!sidebarOpen)} />
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Mobile / Narrow Layout
  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Main Screen content */}
      <View className="flex-1">
        <Slot />
      </View>

      {/* Beautiful Animated Bottom Navigation Bar */}
      <View 
        className="bg-white border-t border-slate-200/80 px-4 py-2 flex-row justify-around items-center z-50 shadow-lg"
        style={{
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
          paddingBottom: Platform.OS === 'ios' ? 22 : 12,
          minHeight: 65,
        }}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const active = isTabActive(tab.path);
          
          // Badge calculations
          let unreadBadgeCount = 0;
          if (tab.name === 'Chats') {
            // Count total unread/incoming patient messages
            const incomingMsgs = Object.values(chats).flat().filter(m => m.sender === 'patient');
            unreadBadgeCount = Math.min(9, incomingMsgs.length);
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(tab.path)}
              className="items-center justify-center py-1 px-3 flex-1 relative"
              activeOpacity={0.7}
            >
              {/* Active Tab Glow/Background Effect */}
              {active && (
                <MotiView
                  layout={Transition}
                  from={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute w-12 h-12 rounded-full bg-[#003366]"
                />
              )}

              {/* Icon */}
              <MotiView
                animate={{
                  scale: active ? 1.15 : 1,
                  translateY: active ? -2 : 0,
                }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <IconComponent
                  size={22}
                  color={active ? '#003366' : '#94a3b8'}
                  strokeWidth={active ? 2.5 : 2}
                />
              </MotiView>

              {/* Tab Name Label */}
              <Text 
                className="text-[10px] mt-1 font-bold tracking-tight transition-colors duration-150"
                style={{ color: active ? '#003366' : '#94a3b8' }}
              >
                {tab.name}
              </Text>

              {/* Unread Badge Overlay */}
              {unreadBadgeCount > 0 && (
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-4 bg-rose-500 rounded-full w-4 h-4 items-center justify-center border border-white"
                >
                  <Text className="text-white text-[8px] font-extrabold">{unreadBadgeCount}</Text>
                </MotiView>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Simple transition helper for layout animations
const Transition = {
  type: 'timing',
  duration: 200,
};

export default function DashboardLayout() {
  return <LayoutContent />;
}
