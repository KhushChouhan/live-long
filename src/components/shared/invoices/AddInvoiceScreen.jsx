import React from 'react';
import { View, Text } from 'react-native';

export default function AddInvoiceScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white rounded-2xl shadow-sm p-6">
      <Text className="text-2xl font-bold text-slate-800">Add Invoices</Text>
      <Text className="text-slate-500 mt-2">This is the dummy page for Add Invoices.</Text>
    </View>
  );
}