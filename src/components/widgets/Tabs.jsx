import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <View className="flex-row bg-slate-50 p-1 rounded-lg self-start border border-slate-200">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onTabChange(tab)}
          className={`px-4 py-2 rounded-md ${activeTab === tab ? 'bg-slate-900' : 'bg-transparent'}`}
        >
          <Text 
            className={`text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
