import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDoctor } from '../../../store/DoctorContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle,
  IndianRupee,
  PlusCircle,
  FileSpreadsheet,
  ArrowLeft,
  UserCheck
} from 'lucide-react-native';
import { MotiView } from 'moti';

export default function AddBillingScreen() {
  const router = useRouter();
  const { patients, addToCheckout } = useDoctor();

  // Search patient
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');

  // Items list
  const [items, setItems] = useState([
    { name: 'General Consultation', qty: '1', price: '500' }
  ]);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  // Filtered patients for selector
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 5);
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Total calculation
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseFloat(item.qty) || 1;
      return sum + (price * qty);
    }, 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { name: '', qty: '1', price: '0' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const handleSaveInvoice = () => {
    const finalPatient = selectedPatient || {
      name: customPatientName || 'Walk-in Patient',
      identity: `IC-${Math.floor(100000 + Math.random() * 900000)}`,
      gender: 'Male'
    };

    const formattedMeds = items
      .filter(item => item.name.trim() !== '')
      .map(item => ({
        n: item.name,
        q: `${item.qty}x (₹${item.price} each)`
      }));

    addToCheckout(
      finalPatient,
      formattedMeds.length > 0 ? formattedMeds : [{ n: 'General Consultation', q: '1x' }],
      totalAmount
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      router.push('/doctor/billing/billing-list');
    }, 1500);
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="items-center"
        >
          <View className="w-20 h-20 bg-emerald-50 rounded-full items-center justify-center mb-6">
            <CheckCircle size={48} color="#10b981" />
          </View>
          <Text className="text-slate-800 text-xl font-black">Invoice Generated</Text>
          <Text className="text-slate-400 text-xs font-semibold mt-1">Successfully recorded in billing history.</Text>
        </MotiView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View 
        className="bg-white border-b border-slate-200 px-6 pb-4 flex-row items-center gap-3"
        style={{
          paddingTop: Platform.OS === 'android' ? 36 : 12
        }}
      >
        <TouchableOpacity 
          onPress={() => router.push('/doctor/billing/billing-list')}
          className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
        >
          <ArrowLeft size={16} color="#64748b" />
        </TouchableOpacity>
        <View>
          <Text className="text-slate-800 text-lg font-black tracking-tight">Create New Invoice</Text>
          <Text className="text-slate-400 text-xs font-medium mt-0.5">Charge for consultations, drugs, or procedures</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Step 1: Select Patient */}
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-sm"
        >
          <View className="flex-row items-center gap-2 mb-3">
            <UserCheck size={16} color="#4f46e5" />
            <Text className="text-slate-800 text-xs font-black uppercase tracking-wider">1. Select Patient</Text>
          </View>

          {/* Search bar inside container */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200/85 rounded-2xl px-3.5 py-2.5 mb-4 gap-2.5">
            <Search size={14} color="#94a3b8" />
            <TextInput
              placeholder="Search patient registry..."
              placeholderTextColor="#94a3b8"
              className="flex-1 text-slate-800 text-xs font-semibold p-0"
              value={patientSearch}
              onChangeText={setPatientSearch}
            />
          </View>

          {/* Quick lists */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedPatientId('')}
              className={`px-3 py-2 rounded-xl border ${selectedPatientId === '' ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-200'}`}
            >
              <Text className={`text-xs font-bold ${selectedPatientId === '' ? 'text-indigo-600' : 'text-slate-500'}`}>
                Walk-in Patient
              </Text>
            </TouchableOpacity>

            {filteredPatients.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedPatientId(p.id);
                  setPatientSearch('');
                }}
                className={`px-3 py-2 rounded-xl border ${selectedPatientId === p.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-200'}`}
              >
                <Text className={`text-xs font-bold ${selectedPatientId === p.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPatientId === '' ? (
            <View>
              <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1.5">Custom Patient Name</Text>
              <TextInput
                placeholder="Walk-in Patient Name..."
                placeholderTextColor="#cbd5e1"
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 text-xs font-semibold"
                value={customPatientName}
                onChangeText={setCustomPatientName}
              />
            </View>
          ) : (
            <View className="bg-slate-50 rounded-2xl p-3 flex-row justify-between items-center border border-slate-100">
              <View>
                <Text className="text-slate-800 text-xs font-black">{selectedPatient?.name}</Text>
                <Text className="text-slate-400 text-[9px] mt-0.5">{selectedPatient?.gender} • {selectedPatient?.age} yrs old</Text>
              </View>
              <Text className="text-slate-500 text-[10px] font-bold">{selectedPatient?.phone}</Text>
            </View>
          )}
        </MotiView>

        {/* Step 2: Line Items */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <FileSpreadsheet size={16} color="#4f46e5" />
              <Text className="text-slate-800 text-xs font-black uppercase tracking-wider">2. Line Items</Text>
            </View>
            
            <TouchableOpacity onPress={handleAddItem} className="flex-row items-center gap-1">
              <PlusCircle size={14} color="#4f46e5" />
              <Text className="text-indigo-600 text-[11px] font-bold">Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} className="flex-row gap-2 mb-3 items-center">
              <TextInput
                placeholder="Description"
                placeholderTextColor="#cbd5e1"
                className="flex-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-bold"
                value={item.name}
                onChangeText={(val) => handleItemChange(index, 'name', val)}
              />
              <TextInput
                placeholder="Qty"
                placeholderTextColor="#cbd5e1"
                keyboardType="numeric"
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-bold text-center"
                value={item.qty}
                onChangeText={(val) => handleItemChange(index, 'qty', val)}
              />
              <TextInput
                placeholder="Price (₹)"
                placeholderTextColor="#cbd5e1"
                keyboardType="numeric"
                className="flex-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-bold text-center"
                value={item.price}
                onChangeText={(val) => handleItemChange(index, 'price', val)}
              />
              {items.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </MotiView>

        {/* Step 3: Total and Save */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm items-center"
        >
          <View className="flex-row justify-between w-full items-center mb-6">
            <Text className="text-slate-400 font-bold text-xs uppercase">Grand Total</Text>
            <View className="flex-row items-center gap-0.5">
              <IndianRupee size={22} color="#1e293b" />
              <Text className="text-slate-800 text-2xl font-black">{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSaveInvoice}
            className="w-full bg-slate-900 rounded-2xl py-4 items-center justify-center shadow-sm"
          >
            <Text className="text-white text-xs font-extrabold uppercase tracking-wider">Generate & Record Invoice</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}