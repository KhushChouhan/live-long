import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import Logo from '../Logo';
import { 
  ChevronDown,
  LogOut
} from 'lucide-react-native';

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

export default function Sidebar({ isOpen, onClose, menuData = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Start with items collapsed by default so the hover effect is visible
  const [expandedItems, setExpandedItems] = useState([]);
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const toggleItem = (id) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <View className={`bg-white border-r border-slate-200 h-full ${Platform.OS === 'web' ? 'w-64' : 'w-4/5 absolute z-50'}`}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-5 border-b border-slate-200">
        <Logo width={140} height={40} style={{ marginBottom: 4 }} />
        {Platform.OS !== 'web' && (
          <TouchableOpacity className="ml-auto" onPress={onClose}>
            <Text className="text-slate-400 font-bold text-lg">X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Web Scrollbar Styles */}
      {Platform.OS === 'web' && <style>{scrollbarStyles}</style>}

      {/* Navigation */}
      <ScrollView className="flex-1 px-2 py-4 space-y-1 custom-scrollbar" showsVerticalScrollIndicator={true}>
        {menuData.map((item) => {
          const Icon = item.icon;
          const hasSub = item.subItems.length > 0;
          const isActive = pathname.startsWith(item.path);
          // Item is expanded if clicked OR hovered
          const isExpanded = expandedItems.includes(item.id) || hoveredMenu === item.id;

          return (
            <View 
              key={item.id} 
              className="mb-1"
              onMouseEnter={() => { if (Platform.OS === 'web') setHoveredMenu(item.id); }}
              onMouseLeave={() => { if (Platform.OS === 'web') setHoveredMenu(null); }}
            >
              {/* Main Item */}
              <TouchableOpacity 
                onPress={() => {
                  if (hasSub) {
                    toggleItem(item.id);
                  } else {
                    router.push(item.path);
                    if (Platform.OS !== 'web') onClose();
                  }
                }}
                className={`flex-row w-full items-center justify-between rounded-md px-3 py-2 transition-all duration-200 ease-in-out menu-item-class-main ${isActive && !hasSub ? 'bg-primary/10 translate-x-1' : 'hover:bg-muted hover:text-foreground hover:translate-x-1'}`}
              >
                <View className="flex-row items-center">
                  <Icon size={16} color={isActive && !hasSub ? '#3b82f6' : '#64748b'} strokeWidth={2} />
                  <Text className={`ml-2 text-sm font-medium ${isActive && !hasSub ? 'text-primary' : 'text-foreground'}`}>
                    {item.label}
                  </Text>
                </View>

                {hasSub && (
                  <MotiView
                    animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <ChevronDown size={16} color="#64748b" className="h-4 w-4 transition-transform" />
                  </MotiView>
                )}
              </TouchableOpacity>

              {/* Sub Items (Animated Accordion) */}
              {hasSub && isExpanded && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'timing', duration: 250 }}
                  style={{ overflow: 'hidden' }}
                >
                  <View className="mt-1 space-y-1">
                    {item.subItems.map((subItem, index) => {
                      const isSubActive = pathname === subItem.path || (pathname === '/' && subItem.path === '/dashboard');
                      return (
                        <TouchableOpacity 
                          key={index}
                          onPress={() => {
                            router.push(subItem.path);
                            if (Platform.OS !== 'web') onClose();
                          }}
                          className={`w-full flex-row items-center rounded-md px-3 py-2 ml-4 transition-all duration-200 ease-in-out ${isSubActive ? 'bg-primary/10 translate-x-1' : 'hover:bg-muted hover:translate-x-1'}`}
                        >
                          <Text className={`text-sm ${isSubActive ? 'font-medium text-primary' : 'font-medium text-mutedForeground hover:text-foreground'}`}>
                            {subItem.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </MotiView>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Logout Button */}
      <View className="p-4 border-t border-slate-200">
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
          className="flex-row items-center w-full rounded-md px-3 py-2.5 bg-red-50 hover:bg-red-100/80 transition-all duration-200"
        >
          <LogOut size={16} color="#ef4444" strokeWidth={2.5} />
          <Text className="ml-2.5 text-sm font-semibold text-red-600">
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
