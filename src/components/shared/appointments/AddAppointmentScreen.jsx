import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { useAuth } from '../../../store/AuthContext';
import { normalizePhone } from '../../../utils/roomUtils';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  blue: '#0066FF',
  blueSoft: '#E8F0FF',
  blueDark: '#004FCC',
  teal: '#00B3A4',
  tealSoft: '#E0FAF7',
  tealDark: '#008C80',
  purple: '#7C3AED',
  purpleSoft: '#F3E8FF',
  green: '#16A34A',
  greenSoft: '#F0FDF4',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

export default function AddAppointmentScreen() {
  const router = useRouter();
  const { addAppointment, TODAY_STR, TOMORROW_STR, patients } = useDoctor();
  const { user } = useAuth();

  // Selected states
  const [selectedFormat, setSelectedFormat] = useState('video'); // video | physical
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate date options (Today, Tomorrow, and next 3 days)
  const dateOptions = [
    { label: 'Today', value: TODAY_STR },
    { label: 'Tomorrow', value: TOMORROW_STR },
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return {
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }),
        value: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    })(),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return {
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }),
        value: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    })(),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      return {
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }),
        value: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    })()
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '03:00 PM'
  ];

  const handleBook = () => {
    if (!complaint.trim()) {
      Alert.alert('Details Required', 'Please enter your symptoms or reason for visit.');
      return;
    }

    setIsSubmitting(true);

    // Resolve patient profile
    const normUserPhone = user ? normalizePhone(user.phone) : '';
    const matchedPatient = patients.find(p => normalizePhone(p.phone) === normUserPhone) || patients[0];

    const newAppt = {
      patientId: matchedPatient?.id || 'p1',
      name: user?.name || matchedPatient?.name || 'Patient',
      phone: user?.phone || matchedPatient?.phone || '918890204260',
      identity: matchedPatient?.identity || 'AADH-8890',
      gender: matchedPatient?.gender || 'Male',
      date: selectedDate,
      time: selectedTime,
      type: selectedFormat,
      status: 'Pending', // ALWAYS starts as Pending
      complaint: complaint.trim(),
      amount: selectedFormat === 'video' ? 250 : 0
    };

    setTimeout(() => {
      addAppointment(newAppt);
      setIsSubmitting(false);
      Alert.alert(
        'Request Submitted',
        'Your appointment request has been sent to the doctor. Status is currently Pending.',
        [{ text: 'OK', onPress: () => router.push('/user/dashboard') }]
      );
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.card}
        >
          <LinearGradient
            colors={[C.blueDark, C.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <Feather name="calendar" size={24} color="#FFF" />
            <View>
              <Text style={styles.headerTitle}>Request Appointment</Text>
              <Text style={styles.headerSub}>Book slot with Dr. Catherine Lawrence</Text>
            </View>
          </LinearGradient>

          <View style={styles.formContent}>
            {/* Format Selection */}
            <Text style={styles.label}>Select Consult Format</Text>
            <View style={styles.formatContainer}>
              <TouchableOpacity
                onPress={() => setSelectedFormat('video')}
                style={[styles.formatBtn, selectedFormat === 'video' && styles.formatBtnActive]}
                activeOpacity={0.8}
              >
                <Feather name="video" size={18} color={selectedFormat === 'video' ? '#FFF' : C.blue} />
                <Text style={[styles.formatText, selectedFormat === 'video' && styles.formatTextActive]}>Video Consult</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedFormat('physical')}
                style={[styles.formatBtn, selectedFormat === 'physical' && styles.formatBtnActiveTeal]}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={18} color={selectedFormat === 'physical' ? '#FFF' : C.teal} />
                <Text style={[styles.formatText, selectedFormat === 'physical' && styles.formatTextActive]}>In-Clinic Visit</Text>
              </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <Text style={styles.label}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
              {dateOptions.map((opt, i) => {
                const active = selectedDate === opt.value;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedDate(opt.value)}
                    style={[styles.dateBtn, active && styles.dateBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateLabel, active && styles.dateTextActive]}>{opt.label}</Text>
                    <Text style={[styles.dateVal, active && styles.dateSubTextActive]}>
                      {opt.value.split(' ')[0]} {opt.value.split(' ')[1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slot Selection */}
            <Text style={styles.label}>Select Time Slot</Text>
            <View style={styles.slotsGrid}>
              {timeSlots.map((slot) => {
                const active = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedTime(slot)}
                    style={[styles.slotBtn, active && styles.slotBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reason / Complaint Input */}
            <Text style={styles.label}>Reason for Visit / Symptoms</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe what you are experiencing (e.g. chest discomfort, routine checkup)..."
              placeholderTextColor={C.textLight}
              multiline
              numberOfLines={4}
              value={complaint}
              onChangeText={setComplaint}
            />

            {/* Price badge for video */}
            {selectedFormat === 'video' && (
              <View style={styles.priceContainer}>
                <Feather name="info" size={14} color={C.blue} style={{ marginTop: 1 }} />
                <Text style={styles.priceText}>
                  Video Consultation fee: <Text style={{ fontWeight: '900' }}>₹250.00</Text> (payable after session completion)
                </Text>
              </View>
            )}

            {/* Book Button */}
            <TouchableOpacity
              onPress={handleBook}
              disabled={isSubmitting}
              style={styles.bookBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.bookBtnText}>
                {isSubmitting ? 'Submitting Request...' : 'Submit Booking Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 540,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  headerGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  formContent: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textMid,
    marginBottom: 10,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  formatBtnActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  formatBtnActiveTeal: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textMid,
  },
  formatTextActive: {
    color: '#FFF',
  },
  datesContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  dateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.bg,
    alignItems: 'center',
    minWidth: 76,
  },
  dateBtnActive: {
    backgroundColor: C.blue,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    textTransform: 'uppercase',
  },
  dateVal: {
    fontSize: 12,
    fontWeight: '900',
    color: C.text,
    marginTop: 4,
  },
  dateTextActive: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  dateSubTextActive: {
    color: '#FFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  slotBtnActive: {
    backgroundColor: C.blue,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  slotTextActive: {
    color: '#FFF',
  },
  textInput: {
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: C.text,
    textAlignVertical: 'top',
    height: 90,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: C.blueSoft,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  priceText: {
    fontSize: 10,
    color: C.blueDark,
    flex: 1,
    lineHeight: 14,
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
