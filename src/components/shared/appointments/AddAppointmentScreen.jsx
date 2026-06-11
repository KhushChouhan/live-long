import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { CalendarPlus } from 'lucide-react-native';

export default function AddAppointmentScreen() {
  const router = useRouter();
  const { setApptModalOpen } = useDoctor();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', padding: 24 }}>
      <View style={{ backgroundColor: '#ECFDF5', borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <CalendarPlus size={40} color="#059669" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>Book Appointment</Text>
      <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, maxWidth: 300 }}>
        Schedule a new appointment for a patient. Select patient, date, time, and type.
      </Text>
      <TouchableOpacity
        onPress={() => { setApptModalOpen(true); router.push('/doctor/dashboard'); }}
        style={{ backgroundColor: '#059669', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Open Appointment Booking</Text>
      </TouchableOpacity>
    </View>
  );
}
