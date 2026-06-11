import React from 'react';
import { View, Text } from 'react-native';

export function Card({ children, className = '' }) {
  return (
    <View className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <View className={`px-5 py-4 border-b border-slate-100 flex-row items-center justify-between ${className}`}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <Text className={`text-base font-semibold text-slate-800 ${className}`}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <View className={`p-5 ${className}`}>
      {children}
    </View>
  );
}
