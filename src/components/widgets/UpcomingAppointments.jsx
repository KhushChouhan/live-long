import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const AppointmentItem = ({ name, date, waitlist, checkupDuration }) => (
  <View className="flex-row flex-wrap items-center justify-between py-4 border-b border-slate-100">
    <View className="mb-2 sm:mb-0">
      <Text className="text-sm font-medium text-slate-900">{name}</Text>
      <Text className="text-xs text-slate-500 mt-1">{date}</Text>
    </View>
    <View className="flex-row items-center gap-2">
      {waitlist && (
        <View className="bg-green-50 px-3 py-1 rounded-full border border-green-200">
          <Text className="text-xs font-medium text-green-700">Add to Waitlist</Text>
        </View>
      )}
      <View className="bg-slate-700 px-3 py-1 rounded-full">
        <Text className="text-xs font-medium text-white">Check-up ({checkupDuration})</Text>
      </View>
    </View>
  </View>
);

export default function UpcomingAppointments() {
  const router = useRouter();

  return (
    <View className="bg-white rounded-xl p-6 border border-slate-200 flex-1">
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-lg font-bold text-slate-900 mb-1">Upcoming Appointments</Text>
          <Text className="text-sm text-slate-500">Your upcoming appointments for the week</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/appointments/list')}>
          <Text className="text-blue-600 font-medium text-sm">View All</Text>
        </TouchableOpacity>
      </View>
      
      <View className="border border-slate-100 rounded-lg px-4 bg-white">
        <AppointmentItem 
          name="Radhika Kumawat" 
          date="May 24, 2026 06:30 AM" 
          waitlist={true} 
          checkupDuration="30 min" 
        />
        <AppointmentItem 
          name="Mayur Vasuja" 
          date="May 26, 2026 06:30 AM" 
          waitlist={false} 
          checkupDuration="30 min" 
        />
        <View className="py-4 border-b-0" />
      </View>
    </View>
  );
}
