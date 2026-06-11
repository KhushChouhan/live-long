import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

export default function Input({
  label,
  error,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = '',
  containerClassName = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </Text>
      )}
      
      <View 
        className={`flex-row items-center bg-white border rounded-lg px-3 h-11 transition-all ${
          error 
            ? 'border-red-500' 
            : isFocused 
              ? 'border-primary shadow-sm' 
              : 'border-slate-300'
        } ${className}`}
      >
        {IconLeft && <View className="mr-2">{IconLeft}</View>}
        
        <TextInput
          className="flex-1 text-slate-900 text-sm h-full outline-none"
          placeholderTextColor="#94a3b8"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {IconRight && <View className="ml-2">{IconRight}</View>}
      </View>

      {error && (
        <Text className="text-xs text-red-500 mt-1 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
}
