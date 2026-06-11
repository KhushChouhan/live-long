import React, { useState } from 'react';
import { View, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { USER_MENU } from '../../config/navigation';

export default function PatientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(Platform.OS === 'web');

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 flex-row">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} menuData={USER_MENU} />

        <View className="flex-1 bg-slate-50">
          <Topbar onMenuPress={() => setSidebarOpen(!sidebarOpen)} />
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}
