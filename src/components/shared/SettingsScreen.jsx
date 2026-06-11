import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 items-center max-w-md w-full">
        <Text className="text-3xl font-bold text-slate-900 mb-2">Settings</Text>
        <Text className="text-slate-500 text-center">Your account preferences and system settings will appear here.</Text>
      </View>
    </ScrollView>
  );
}
