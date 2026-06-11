import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

const VARIANTS = {
  primary: 'bg-primary border-primary',
  secondary: 'bg-slate-100 border-slate-100',
  outline: 'bg-transparent border border-slate-300',
  ghost: 'bg-transparent border-transparent',
  danger: 'bg-red-500 border-red-500',
};

const TEXT_VARIANTS = {
  primary: 'text-white',
  secondary: 'text-slate-900',
  outline: 'text-slate-700',
  ghost: 'text-slate-700',
  danger: 'text-white',
};

const SIZES = {
  sm: 'py-1.5 px-3 rounded-md',
  md: 'py-2.5 px-4 rounded-lg',
  lg: 'py-3.5 px-6 rounded-xl',
};

const TEXT_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  children,
  className = '',
  textClassName = '',
  disabled,
  onPress,
  ...props
}) {
  const isInteractive = !disabled && !isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!isInteractive}
      onPress={onPress}
      className={`flex-row items-center justify-center border ${VARIANTS[variant]} ${SIZES[size]} ${!isInteractive ? 'opacity-50' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#3b82f6'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {IconLeft && <View className="mr-2">{IconLeft}</View>}
          <Text className={`font-semibold ${TEXT_VARIANTS[variant]} ${TEXT_SIZES[size]} ${textClassName}`}>
            {children}
          </Text>
          {IconRight && <View className="ml-2">{IconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}
