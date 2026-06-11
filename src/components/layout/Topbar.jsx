import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Topbar({ onMenuPress }) {
  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <TouchableOpacity onPress={onMenuPress} className="p-2 -ml-2 rounded-md hover:bg-slate-100">
        <Feather name="menu" size={24} color="#64748b" />
      </TouchableOpacity>
      
      <View className="flex-row items-center gap-4">
        <TouchableOpacity className="relative p-2 rounded-full hover:bg-slate-100">
          <Feather name="bell" size={20} color="#64748b" />
          <View className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity 
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('current_user');
              await AsyncStorage.removeItem('csrf_token');
              await AsyncStorage.removeItem('logout_token');
            } catch (e) {
              console.error(e);
            }
            router.replace('/login');
          }}
          className="p-2 rounded-full hover:bg-red-50"
        >
          <Feather name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>
        
        <View className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 items-center justify-center">
          <Text className="text-slate-600 font-medium">DL</Text>
        </View>
      </View>
    </View>
  );
}
