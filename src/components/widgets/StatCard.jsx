import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

export default function StatCard({ title, count, subtitle, icon, iconColor = "#3b82f6", badge, href }) {
  const router = useRouter();
  
  return (
    <View 
      className={`bg-white rounded-xl p-5 border border-slate-200 ${Platform.OS === 'web' ? 'flex-1 min-w-[200px]' : 'w-full mb-4'}`}
      style={Platform.OS === 'web' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } : {}}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center flex-1">
          <Text className="text-sm font-semibold text-slate-900 flex-1">{title}</Text>
          {badge && (
            <View className="bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 ml-2">
              <Text className="text-xs font-medium text-yellow-700">{badge}</Text>
            </View>
          )}
        </View>
        <View className={`w-8 h-8 rounded-full items-center justify-center`} style={{ backgroundColor: iconColor + '15' }}>
          <Feather name={icon} size={16} color={iconColor} />
        </View>
      </View>
      
      <Text className="text-3xl font-bold text-slate-900 my-1">{count}</Text>
      <Text className="text-xs text-slate-500 mb-4">{subtitle}</Text>
      
      {href ? (
        <TouchableOpacity 
          className="flex-row items-center mt-auto pt-4 border-t border-slate-100"
          onPress={() => router.push(href)}
        >
          <Text className="text-sm font-medium" style={{ color: iconColor }}>View</Text>
          <Feather name="arrow-up-right" size={14} color={iconColor} className="ml-1" />
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center mt-auto pt-4 border-t border-slate-100 opacity-50">
          <Text className="text-sm font-medium" style={{ color: iconColor }}>View</Text>
          <Feather name="arrow-up-right" size={14} color={iconColor} className="ml-1" />
        </View>
      )}
    </View>
  );
}
