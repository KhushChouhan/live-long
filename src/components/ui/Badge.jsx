import React from 'react';
import { View, Text } from 'react-native';

const VARIANTS = {
  success: 'bg-green-100 border border-green-200',
  warning: 'bg-amber-100 border border-amber-200',
  error: 'bg-red-100 border border-red-200',
  neutral: 'bg-slate-100 border border-slate-200',
  primary: 'bg-blue-100 border border-blue-200',
};

const TEXT_VARIANTS = {
  success: 'text-green-700',
  warning: 'text-amber-700',
  error: 'text-red-700',
  neutral: 'text-slate-600',
  primary: 'text-blue-700',
};

export default function Badge({ 
  children, 
  variant = 'neutral', 
  className = '', 
  textClassName = '' 
}) {
  return (
    <View className={`px-2.5 py-0.5 rounded-full flex-row items-center justify-center ${VARIANTS[variant]} ${className}`}>
      <Text className={`text-[11px] font-bold uppercase tracking-wider ${TEXT_VARIANTS[variant]} ${textClassName}`}>
        {children}
      </Text>
    </View>
  );
}
