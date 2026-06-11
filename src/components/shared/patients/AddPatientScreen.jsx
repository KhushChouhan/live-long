import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { UserPlus } from 'lucide-react-native';

export default function AddPatientScreen() {
  const router = useRouter();
  const { setPatientModalOpen } = useDoctor();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', padding: 24 }}>
      <View style={{ backgroundColor: '#EFF6FF', borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <UserPlus size={40} color="#2563EB" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>Add New Patient</Text>
      <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, maxWidth: 300 }}>
        Register a new patient in the system. You can add their details from the dashboard.
      </Text>
      <TouchableOpacity
        onPress={() => { setPatientModalOpen(true); router.push('/doctor/dashboard'); }}
        style={{ backgroundColor: '#2563EB', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Open Patient Registration</Text>
      </TouchableOpacity>
    </View>
  );
}
