import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';

export default function ScheduleWidget() {
  const router = useRouter();

  return (
    <View className="bg-white rounded-xl p-6 border border-slate-200 flex-1">
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-lg font-bold text-slate-900 mb-1">Today&apos;s Schedule</Text>
          <Text className="text-sm text-slate-500">You have 0 appointments scheduled for today</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/appointments/list')}>
          <Text className="text-blue-600 font-medium text-sm">View All</Text>
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl items-center justify-center p-8 min-h-[250px]">
        <Text className="text-slate-400 font-medium">No appointments for today.</Text>
      </View>
    </View>
  );
}
