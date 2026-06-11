import React from 'react';
import { View, Text } from 'react-native';

export default function BillingListScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white rounded-2xl shadow-sm p-6">
      <Text className="text-2xl font-bold text-slate-800">Invoices List</Text>
      <Text className="text-slate-500 mt-2">This is the dummy page for Invoices List.</Text>
    </View>
  );
}