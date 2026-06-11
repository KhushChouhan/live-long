import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function IconButton({ 
  icon: Icon, 
  onPress, 
  size = 20, 
  color = '#64748b', 
  className = '',
  disabled = false
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors items-center justify-center ${
        disabled ? 'opacity-50' : 'hover:bg-slate-100 active:bg-slate-200'
      } ${className}`}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </TouchableOpacity>
  );
}
