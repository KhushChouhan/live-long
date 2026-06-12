import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  SafeAreaView,
  Platform
} from 'react-native';
import { useDoctor } from '../../../../store/DoctorContext';
import { 
  Calendar, 
  Clock, 
  Search, 
  Video, 
  MapPin, 
  AlertTriangle, 
  X, 
  ShieldAlert,
  Bell
} from 'lucide-react-native';
import { MotiView } from 'moti';

const NOTIFICATION_TEMPLATES = {
  'Delay Alert': 'Hello! Dr. Lawrence is currently running 15 minutes behind schedule. We appreciate your patience.',
  'Appointment Reminder': 'Reminder: Your scheduled consultation with Dr. Lawrence is today. Please be online/present 5 minutes early.',
  'Lab Results': 'Hello! Your recent lab reports have been reviewed by Dr. Lawrence. Please check the portal or book a follow-up.',
  'Follow-Up Request': 'Dr. Lawrence would like to schedule a quick 1-week follow-up session to review your progress.',
  'Custom Message': ''
};

export default function DoctorAppointmentListScreen() {
  const { 
    appointments, 
    rescheduleAppointment, 
    cancelAppointment, 
    bulkRescheduleRemaining,
    notifyPatient,
    acceptAppointment,
    rejectAppointment,
    TODAY_STR,
    TOMORROW_STR
  } = useDoctor();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDateTab, setActiveDateTab] = useState('Today'); // 'Today' | 'Tomorrow' | 'Upcoming'
  const [activeTypeFilter, setActiveTypeFilter] = useState('All'); // 'All' | 'physical' | 'video'

  // Modals state
  const [rescheduleData, setRescheduleData] = useState(null);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDate, setNewDate] = useState('Today');
  
  const [cancelData, setCancelData] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Notify Patient Modal States
  const [notifyPatientData, setNotifyPatientData] = useState(null);
  const [notifyTemplate, setNotifyTemplate] = useState('Delay Alert');
  const [notifyCustomMessage, setNotifyCustomMessage] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  // Sync message template selection
  useEffect(() => {
    if (notifyTemplate && notifyTemplate !== 'Custom Message') {
      setNotifyCustomMessage(NOTIFICATION_TEMPLATES[notifyTemplate]);
    } else if (notifyTemplate === 'Custom Message') {
      setNotifyCustomMessage('');
    }
  }, [notifyTemplate]);

  // Trigger toast feedback
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Reschedule submit
  const handleRescheduleSubmit = () => {
    if (rescheduleData) {
      rescheduleAppointment(rescheduleData.id, newDate, newTime);
      setRescheduleData(null);
      triggerToast(`📅 Successfully rescheduled ${rescheduleData.name} to ${newDate} at ${newTime}`);
    }
  };

  // Cancel submit
  const handleCancelSubmit = () => {
    if (cancelData) {
      cancelAppointment(cancelData.id);
      setCancelData(null);
      setShowCancelConfirm(false);
      triggerToast(`❌ Slot for ${cancelData.name} cancelled. Notification text sent.`);
    }
  };

  // Bulk action
  const handleBulkAction = () => {
    bulkRescheduleRemaining();
    triggerToast(`⚡ Emergency: All remaining pending appointments rescheduled to Tomorrow.`);
  };

  // Filter logic
  const filteredAppointments = appointments.filter(appt => {
    // 1. Date Filter
    if (activeDateTab === 'Today' && appt.date !== TODAY_STR) return false;
    if (activeDateTab === 'Tomorrow' && appt.date !== TOMORROW_STR) return false;
    if (activeDateTab === 'Upcoming' && (appt.date === TODAY_STR || appt.date === TOMORROW_STR)) return false;

    // 2. Type Filter
    if (activeTypeFilter !== 'All' && appt.type?.toLowerCase() !== activeTypeFilter.toLowerCase()) return false;

    // 3. Search Query
    const serviceName = appt.service || appt.complaint || '';
    const matchesSearch = appt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {/* --- TOAST PANEL --- */}
      {toastMessage !== '' && (
        <MotiView 
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -30 }}
          className="absolute top-6 left-4 right-4 z-[99] bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center justify-between"
        >
          <Text className="text-white text-xs font-semibold flex-1 pr-2">{toastMessage}</Text>
          <TouchableOpacity onPress={() => setToastMessage('')} className="bg-slate-800 p-1 rounded-full">
            <X size={12} color="#94a3b8" />
          </TouchableOpacity>
        </MotiView>
      )}

      {/* --- TOP HEADER AND SEARCH BAR --- */}
      <View 
        className="bg-white border-b border-slate-200 px-6 pb-4"
        style={{
          paddingTop: Platform.OS === 'android' ? 36 : 12
        }}
      >
        <Text className="text-slate-800 text-lg font-black tracking-tight">Appointment Manager</Text>
        <Text className="text-slate-400 text-xs font-medium mt-0.5">Edit slots, reschedule dates, or trigger emergencies</Text>

        {/* Beautiful Search Bar */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 mt-4 gap-3">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search patient names, services..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-xs font-semibold text-slate-800"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        className="flex-1"
      >
        {/* --- DATE CATEGORY TABS --- */}
        <View className="flex-row bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/40 mb-4">
          {['Today', 'Tomorrow', 'Upcoming'].map((tab) => {
            const active = activeDateTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveDateTab(tab)}
                className={`flex-1 py-2.5 rounded-xl items-center ${active ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-xs font-black ${active ? 'text-[#003366]' : 'text-slate-500'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- TYPE FILTER PILLS --- */}
        <View className="flex-row gap-2 mb-5">
          {['All', 'physical', 'video'].map((type) => {
            const active = activeTypeFilter === type;
            const label = type === 'All' ? 'All Formats' : type === 'physical' ? '🏥 In-Clinic' : '📹 Video Consult';
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setActiveTypeFilter(type)}
                className={`px-4 py-2 rounded-xl border ${active ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200/80'}`}
              >
                <Text className={`text-[10px] font-extrabold ${active ? 'text-white' : 'text-slate-600'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- EMERGENCY BULK MODE BANNER --- */}
        {activeDateTab === 'Today' && (
          <MotiView
            from={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-5 gap-3"
          >
            <View className="flex-row gap-2">
              <AlertTriangle size={18} color="#d97706" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text className="text-amber-800 text-xs font-black uppercase tracking-wide">Clinic Emergency Trigger</Text>
                <Text className="text-amber-700 text-[10px] font-medium leading-relaxed mt-0.5">
                  Need to step out early? Bulk reschedule all remaining slots for today. Automated push/SMS alerts will alert patients instantly.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleBulkAction}
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 py-3 rounded-2xl items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase">Reschedule Remaining Today</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* --- LIST APPOINTMENTS GRID --- */}
        <View className="gap-3.5 pb-8">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => {
              const pending = appt.status === 'Pending';
              const cancelled = appt.status === 'Cancelled';
              const rescheduled = appt.status === 'Rescheduled';
              const completed = appt.status === 'Completed';

              return (
                <MotiView
                  key={appt.id}
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white border rounded-2xl p-5 relative overflow-hidden ${cancelled ? 'border-red-150 bg-red-50/10 opacity-60' : 'border-slate-200/80 shadow-sm'}`}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 flex-row items-center gap-3">
                      {/* Format icon indicator */}
                      <View className={`w-9 h-9 rounded-full border items-center justify-center ${appt.type?.toLowerCase() === 'video' ? 'bg-cyan-50 border-cyan-150' : 'bg-indigo-50 border-indigo-150'}`}>
                        {appt.type?.toLowerCase() === 'video' ? (
                          <Video size={16} color="#0891b2" />
                        ) : (
                          <MapPin size={16} color="#4f46e5" />
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text className={`text-xs font-black text-slate-800 ${cancelled ? 'line-through' : ''}`}>
                            {appt.name}
                          </Text>

                          <View className={`px-1.5 py-0.5 rounded-md ${appt.type?.toLowerCase() === 'video' ? 'bg-cyan-50' : 'bg-indigo-50'}`}>
                            <Text className={`text-[7px] font-black uppercase ${appt.type?.toLowerCase() === 'video' ? 'text-cyan-700' : 'text-indigo-700'}`}>
                              {appt.type?.toLowerCase() === 'video' ? 'Video' : 'Clinic'}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center gap-1 mt-1">
                          <Clock size={10} color="#94a3b8" />
                          <Text className="text-slate-400 text-[10px] font-bold">
                            {appt.time} • {appt.date}
                          </Text>
                        </View>
                        <Text className="text-slate-500 text-[10px] font-semibold mt-0.5">{appt.service || appt.complaint || 'General Consultation'}</Text>
                      </View>
                    </View>

                    {/* Status Pill */}
                    <View>
                      {completed && (
                        <View className="bg-emerald-50 px-2 py-1 rounded-lg">
                          <Text className="text-emerald-700 text-[8px] font-black uppercase">Completed</Text>
                        </View>
                      )}
                      {cancelled && (
                        <View className="bg-rose-50 px-2 py-1 rounded-lg">
                          <Text className="text-rose-700 text-[8px] font-black uppercase">Cancelled</Text>
                        </View>
                      )}
                      {rescheduled && (
                        <View className="bg-amber-50 px-2 py-1 rounded-lg">
                          <Text className="text-amber-700 text-[8px] font-black uppercase">Rescheduled</Text>
                        </View>
                      )}
                      {appt.status === 'Pending' && (
                        <View className="bg-amber-50 px-2 py-1 rounded-lg">
                          <Text className="text-amber-700 text-[8px] font-black uppercase">Pending</Text>
                        </View>
                      )}
                      {appt.status === 'Confirmed' && (
                        <View className="bg-sky-50 px-2 py-1 rounded-lg">
                          <Text className="text-sky-700 text-[8px] font-black uppercase">Confirmed</Text>
                        </View>
                      )}
                      {appt.status === 'Rejected' && (
                        <View className="bg-rose-50 px-2 py-1 rounded-lg">
                          <Text className="text-rose-700 text-[8px] font-black uppercase">Rejected</Text>
                        </View>
                      )}
                      {appt.status === 'Scheduled' && (
                        <View className="bg-sky-50 px-2 py-1 rounded-lg">
                          <Text className="text-sky-700 text-[8px] font-black uppercase">Scheduled</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Description / Complaint */}
                  <View className="bg-slate-50 rounded-xl p-3.5 mt-3.5">
                    <Text className="text-slate-600 text-[10px] font-medium leading-normal">
                      Complaint: <Text className="font-bold text-slate-700 italic">&quot;{appt.complaint}&quot;</Text>
                    </Text>
                  </View>

                  {/* Actions Deck */}
                  {appt.status === 'Pending' ? (
                    <View className="flex-row gap-2 border-t border-slate-100 pt-4 mt-4">
                      <TouchableOpacity 
                        onPress={() => {
                          acceptAppointment(appt.id);
                          triggerToast(`✅ Appointment for ${appt.name} accepted/confirmed.`);
                        }}
                        style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                        className="flex-1 py-2.5 rounded-xl items-center justify-center border"
                      >
                        <Text className="text-white text-[10px] font-black uppercase">Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => {
                          rejectAppointment(appt.id);
                          triggerToast(`❌ Appointment for ${appt.name} rejected.`);
                        }}
                        style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                        className="flex-1 py-2.5 rounded-xl items-center justify-center border"
                      >
                        <Text className="text-white text-[10px] font-black uppercase">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (!completed && !cancelled && appt.status !== 'Rejected' && (
                    <View className="flex-row gap-2 border-t border-slate-100 pt-4 mt-4">
                      <TouchableOpacity 
                        onPress={() => {
                          setRescheduleData(appt);
                          setNewTime(appt.time);
                          setNewDate(appt.date);
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-2 rounded-xl items-center justify-center"
                      >
                        <Text className="text-slate-700 text-[10px] font-black uppercase">Resched</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => {
                          setCancelData(appt);
                          setShowCancelConfirm(true);
                        }}
                        className="flex-1 bg-rose-50 border border-rose-200 py-2 rounded-xl items-center justify-center"
                      >
                        <Text className="text-rose-600 text-[10px] font-black uppercase">Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => setNotifyPatientData(appt)}
                        className="flex-1 bg-amber-50 border border-amber-200 py-2 rounded-xl items-center justify-center"
                      >
                        <Text className="text-amber-700 text-[10px] font-black uppercase">Notify</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </MotiView>
              );
            })
          ) : (
            <View className="py-16 bg-white border border-slate-200 rounded-3xl items-center justify-center">
              <Calendar size={36} color="#cbd5e1" />
              <Text className="text-slate-400 text-xs font-bold mt-2">No matching slots scheduled</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- MODAL RESCHEDULE CALENDAR SELECTOR --- */}
      <Modal visible={rescheduleData !== null} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center p-5">
          <MotiView 
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-[340px] border border-slate-200"
          >
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <Text className="text-slate-800 text-sm font-black">Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleData(null)} className="bg-slate-100 p-1 rounded-full">
                <X size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Patient Name</Text>
            <Text className="text-slate-800 text-xs font-black mb-4">{rescheduleData?.name}</Text>

            {/* Date Picker Selection */}
            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">New Date</Text>
            <View className="flex-row bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4">
              {['Today', 'Tomorrow', 'Upcoming'].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setNewDate(d)}
                  className={`flex-1 py-1.5 rounded-lg items-center ${newDate === d ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-[10px] font-black ${newDate === d ? 'text-[#003366]' : 'text-slate-500'}`}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time slot picker */}
            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1.5">New Time Slot</Text>
            <TextInput
              value={newTime}
              onChangeText={setNewTime}
              placeholder="e.g. 02:30 PM"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-[#003366] text-center mb-5"
            />

            <TouchableOpacity 
              onPress={handleRescheduleSubmit}
              className="bg-[#003366] py-3 rounded-2xl items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase">Confirm Date &amp; Time</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      {/* --- MODAL CANCEL SLOT --- */}
      <Modal visible={showCancelConfirm} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center p-5">
          <MotiView 
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-[320px] border border-slate-200 items-center text-center"
          >
            <View className="bg-rose-50 border border-rose-100 p-3 rounded-full mb-3.5">
              <ShieldAlert size={28} color="#e11d48" />
            </View>

            <Text className="text-slate-800 text-sm font-black text-center">Cancel Appointment?</Text>
            <Text className="text-slate-500 text-[10px] font-medium text-center mt-2 leading-relaxed">
              Are you sure you want to cancel the appointment for <Text className="font-extrabold text-slate-800">{cancelData?.name}</Text> at {cancelData?.time}? This will trigger an automated SMS notification back to the patient.
            </Text>

            <View className="flex-row gap-3 w-full mt-6">
              <TouchableOpacity 
                onPress={() => setShowCancelConfirm(false)}
                className="flex-1 bg-slate-100 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-600 text-xs font-extrabold uppercase">Keep Slot</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCancelSubmit}
                className="flex-1 bg-rose-600 active:bg-rose-700 py-3 rounded-2xl items-center"
              >
                <Text className="text-white text-xs font-extrabold uppercase">Cancel Slot</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* --- MODAL D: SEND PATIENT NOTIFICATION ALERT --- */}
      <Modal visible={notifyPatientData !== null} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center p-5">
          <MotiView 
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-[340px] border border-slate-200"
          >
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <View className="flex-row items-center gap-1.5">
                <Bell size={16} color="#d97706" />
                <Text className="text-slate-800 text-sm font-black">Notify Patient</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifyPatientData(null)} className="bg-slate-100 p-1 rounded-full">
                <X size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Send Alert To</Text>
            <Text className="text-slate-800 text-xs font-black mb-4">{notifyPatientData?.name}</Text>

            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">Message Template</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              {Object.keys(NOTIFICATION_TEMPLATES).map((templateName) => {
                const active = notifyTemplate === templateName;
                return (
                  <TouchableOpacity
                    key={templateName}
                    onPress={() => setNotifyTemplate(templateName)}
                    className={`px-3 py-1.5 rounded-xl border ${active ? 'bg-amber-600 border-amber-600' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-[9px] font-bold ${active ? 'text-white' : 'text-slate-600'}`}>
                      {templateName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">Message Content</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={notifyCustomMessage}
              onChangeText={setNotifyCustomMessage}
              placeholder="Type custom message to send..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 h-24 mb-5"
              style={{ textAlignVertical: 'top' }}
            />

            <TouchableOpacity 
              onPress={() => {
                if (notifyPatientData) {
                  notifyPatient(notifyPatientData.id, notifyTemplate, notifyCustomMessage);
                  setNotifyPatientData(null);
                  triggerToast(`✉️ Dispatched Push Alert & SMS to ${notifyPatientData.name}!`);
                }
              }}
              className="bg-amber-600 active:bg-amber-700 py-3 rounded-2xl items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase">Dispatch Notification</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
