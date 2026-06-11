import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';

// Components
import StatCard from '../../../../components/widgets/StatCard';
import Tabs from '../../../../components/widgets/Tabs';
import ScheduleWidget from '../../../../components/widgets/ScheduleWidget';
import UpcomingAppointments from '../../../../components/widgets/UpcomingAppointments';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
      
      {/* Greeting Header */}
      <View className="mb-8">
        <Text className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
          Admin Dashboard
        </Text>
        <Text className="text-sm text-slate-500">
          System overview and hospital statistics
        </Text>
      </View>

      {/* Stat Cards Grid */}
      <View className="flex-row flex-wrap gap-4 mb-8">
        <StatCard 
          title="Total Doctors" 
          count="45" 
          subtitle="Active doctors" 
          icon="activity" 
          iconColor="#3b82f6" 
          href="/admin/patients/patient-list"
        />
        <StatCard 
          title="Appointments" 
          count="11" 
          subtitle="Total consultations" 
          icon="link" 
          iconColor="#22c55e" 
          href="/admin/appointments/appointment-list"
        />
        <StatCard 
          title="Total Patients" 
          count="1,248" 
          subtitle="Registered patients" 
          icon="users" 
          iconColor="#eab308"
          badge="12 new" 
          href="/admin/patients/patient-list"
        />
        <StatCard 
          title="Total Revenue" 
          count="₹2,450.00" 
          subtitle="This month" 
          icon="pie-chart" 
          iconColor="#ef4444" 
          href="/admin/billing/billing-list"
        />
      </View>

      {/* Tabs & Lower Section */}
      <View className="mb-6">
        <Tabs 
          tabs={['Overview', 'Activity', 'Stats']} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </View>

      {/* 60/40 Split Columns */}
      <View className={`flex-row flex-wrap gap-6 ${Platform.OS === 'web' ? 'lg:flex-nowrap' : 'flex-col'}`}>
        <View className={Platform.OS === 'web' ? 'flex-[6] min-w-[300px]' : 'w-full mb-6'}>
          <ScheduleWidget />
        </View>
        
        <View className={Platform.OS === 'web' ? 'flex-[4] min-w-[300px]' : 'w-full'}>
          <UpcomingAppointments />
        </View>
      </View>

    </ScrollView>
  );
}
