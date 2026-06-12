import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDoctor } from '../../../../store/DoctorContext';
import { Send, User, Phone, Video } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function ChatScreen() {
  const { patientId: paramPatientId } = useLocalSearchParams();
  const { patients, chats, sendMessage, startVideoConsult } = useDoctor();

  // Find patients with chat logs or scheduled slots
  const chatPatients = patients;
  
  // Set selected patient
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || chatPatients[0]?.id);
  const [inputText, setInputText] = useState('');
  
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (paramPatientId) {
      setSelectedPatientId(paramPatientId);
    }
  }, [paramPatientId]);

  const activePatient = chatPatients.find(p => p.id === selectedPatientId);
  const messageList = chats[selectedPatientId];

  // Scroll to bottom when message list changes
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messageList]);

  const handleSend = () => {
    if (inputText.trim() === '') return;
    sendMessage(selectedPatientId, inputText.trim(), 'doctor');
    setInputText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Keyboard Avoiding Container */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* --- HEADER PATIENT CAROUSEL SELECTOR --- */}
        <View 
          className="bg-white border-b border-slate-200 px-4 pb-3"
          style={{
            paddingTop: Platform.OS === 'android' ? 36 : 12
          }}
        >
          <Text className="text-[10px] text-slate-400 font-extrabold uppercase mb-2 tracking-wider pl-1">Conversations Sandbox</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {chatPatients.map((patient) => {
              const active = patient.id === selectedPatientId;
              const hasMessages = chats[patient.id] && chats[patient.id].length > 0;
              const lastMsg = hasMessages ? chats[patient.id][chats[patient.id].length - 1] : null;

              return (
                <TouchableOpacity
                  key={patient.id}
                  onPress={() => setSelectedPatientId(patient.id)}
                  className={`flex-row items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${active ? 'bg-[#003366] border-[#003366]' : 'bg-slate-50 border-slate-200'}`}
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${active ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <Text className={`text-xs font-black ${active ? 'text-white' : 'text-slate-700'}`}>{patient.avatar || patient.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text className={`text-[10px] font-black ${active ? 'text-white' : 'text-slate-800'}`}>{patient.name}</Text>
                    {lastMsg ? (
                      <Text className={`text-[8px] max-w-[80px] font-semibold truncate ${active ? 'text-slate-200/80' : 'text-slate-400'}`}>
                        {lastMsg.text}
                      </Text>
                    ) : (
                      <Text className={`text-[8px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>No messages</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- DYNAMIC ACTIVE CHAT HEADER --- */}
        {activePatient ? (
          <View className="bg-white border-b border-slate-100 px-6 py-3.5 flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                <Text className="text-slate-700 font-extrabold text-xs">{activePatient.avatar || activePatient.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text className="text-xs font-extrabold text-slate-800">{activePatient.name}</Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-slate-400 text-[8px] font-black uppercase tracking-wider">Patient Online</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions (Join call placeholder) */}
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => {
                  startVideoConsult(selectedPatientId);
                  router.push('/doctor/video');
                }}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200"
              >
                <Phone size={14} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  startVideoConsult(selectedPatientId);
                  router.push('/doctor/video');
                }}
                className="p-2 rounded-xl bg-cyan-50 border border-cyan-150"
              >
                <Video size={14} color="#0891b2" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-4 items-center bg-white border-b border-slate-100">
            <Text className="text-slate-400 text-xs font-bold">Select a patient to begin messaging</Text>
          </View>
        )}

        {/* --- CHAT FEED BUBBLES --- */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messageList && messageList.length > 0 ? (
            messageList.map((message) => {
              const isDoctor = message.sender === 'doctor';
              return (
                <MotiView
                  key={message.id}
                  from={{ opacity: 0, translateY: 10, scale: 0.95 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className={`mb-3.5 max-w-[80%] rounded-2xl p-3.5 ${isDoctor ? 'bg-[#003366] self-end rounded-tr-none' : 'bg-white border border-slate-200/80 self-start rounded-tl-none'}`}
                >
                  <Text className={`text-[11px] font-medium leading-relaxed ${isDoctor ? 'text-white' : 'text-slate-800'}`}>
                    {message.text}
                  </Text>
                  <Text 
                    className={`text-[7px] font-black text-right mt-1.5 tracking-wider ${isDoctor ? 'text-blue-200/80' : 'text-slate-400'}`}
                  >
                    {message.timestamp}
                  </Text>
                </MotiView>
              );
            })
          ) : (
            <View className="py-24 items-center justify-center">
              <User size={36} color="#cbd5e1" />
              <Text className="text-slate-400 text-xs font-bold mt-2">No message history with this patient</Text>
              <Text className="text-slate-400 text-[10px] font-medium text-center max-w-[180px] mt-1">
                Type a message below to start a secure, encrypted conversation.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* --- MESSAGE INPUT BOX --- */}
        <View className="bg-white border-t border-slate-200 p-4 flex-row gap-3 items-center">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Reply to ${activePatient?.name || 'patient'}...`}
            placeholderTextColor="#94a3b8"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={inputText.trim() === ''}
            className={`p-3 rounded-2xl items-center justify-center ${inputText.trim() === '' ? 'bg-slate-100' : 'bg-[#003366] shadow-md shadow-blue-900/10'}`}
          >
            <Send size={16} color={inputText.trim() === '' ? '#94a3b8' : 'white'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
