import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Platform,
  Modal
} from 'react-native';
import { useDoctor } from '../../../store/DoctorContext';
import { 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Printer, 
  RefreshCw,
  User,
  PlusCircle,
  Trash2
} from 'lucide-react-native';
import { MotiView } from 'moti';

export default function BillingListScreen() {
  const { 
    checkout, 
    patients, 
    toggleCheckoutStatus, 
    addToCheckout 
  } = useDoctor();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Unpaid' | 'Partial'
  
  // Add invoice modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [medsList, setMedsList] = useState([{ n: 'Consultation Fee', q: '1x' }]);
  const [amountVal, setAmountVal] = useState('500');

  // Print invoice modal
  const [printingInvoice, setPrintingInvoice] = useState(null);

  // Stats computation
  const totalInvoiced = checkout.reduce((sum, item) => sum + (item.numericAmount || parseFloat(item.amount?.replace(/[^0-9.]/g, '')) || 0), 0);
  const totalPaid = checkout.reduce((sum, item) => {
    if (item.status === 'Paid') return sum + (item.numericAmount || parseFloat(item.amount?.replace(/[^0-9.]/g, '')) || 0);
    if (item.status === 'Partial') return sum + (item.amountPaid || 0);
    return sum;
  }, 0);
  const totalUnpaid = totalInvoiced - totalPaid;

  // Filter & Search
  const filteredCheckout = checkout.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.identity && item.identity.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddMedRow = () => {
    setMedsList([...medsList, { n: '', q: '' }]);
  };

  const handleRemoveMedRow = (index) => {
    setMedsList(medsList.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, val) => {
    const updated = [...medsList];
    updated[index][field] = val;
    setMedsList(updated);
  };

  const handleCreateInvoice = () => {
    let patientObj = null;
    if (selectedPatientId) {
      patientObj = patients.find(p => p.id === selectedPatientId);
    }
    
    const finalPatient = patientObj || {
      name: customPatientName || 'Walk-in Patient',
      identity: `IC-${Math.floor(100000 + Math.random() * 900000)}`,
      gender: 'Male'
    };

    const cleanMeds = medsList.filter(m => m.n.trim() !== '');

    addToCheckout(
      finalPatient,
      cleanMeds.length > 0 ? cleanMeds : [{ n: 'General Consultation', q: '1x' }],
      parseFloat(amountVal) || 500
    );

    setShowAddModal(false);
    setSelectedPatientId('');
    setCustomPatientName('');
    setMedsList([{ n: 'Consultation Fee', q: '1x' }]);
    setAmountVal('500');
  };

  const handlePrint = (item) => {
    setPrintingInvoice(item);
    if (Platform.OS === 'web') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View 
        className="bg-white border-b border-slate-200 px-6 pb-4"
        style={{
          paddingTop: Platform.OS === 'android' ? 36 : 12
        }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-800 text-lg font-black tracking-tight">Billing & Invoices</Text>
            <Text className="text-slate-400 text-xs font-medium mt-0.5">Collect payments, track sales, print receipts</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAddModal(true)}
            className="bg-indigo-600 px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-xs font-bold">New Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Tabs */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 mt-4 gap-3">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search invoice by patient..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-800 text-xs font-semibold p-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2 mt-4 flex-wrap">
          {['All', 'Paid', 'Partial', 'Unpaid'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl border ${statusFilter === tab ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-[10px] font-bold ${statusFilter === tab ? 'text-white' : 'text-slate-500'}`}>
                {tab} Invoices
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Summary Panel */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Invoiced</Text>
            <DollarSign size={14} color="#4f46e5" />
          </View>
          <Text className="text-slate-800 text-lg font-black mt-1">₹{totalInvoiced.toLocaleString('en-IN')}</Text>
        </View>
        <View className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Received</Text>
            <CheckCircle2 size={14} color="#10b981" />
          </View>
          <Text className="text-emerald-600 text-lg font-black mt-1">₹{totalPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Pending</Text>
            <Clock size={14} color="#f59e0b" />
          </View>
          <Text className="text-amber-500 text-lg font-black mt-1">₹{totalUnpaid.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Main List */}
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {filteredCheckout.length === 0 ? (
          <View className="items-center justify-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
            <Text className="text-slate-400 text-sm font-semibold">No invoices found</Text>
          </View>
        ) : (
          filteredCheckout.map((item, idx) => {
            const isPaid = item.status === 'Paid';
            const isPartial = item.status === 'Partial';
            
            return (
              <MotiView
                key={item.id || idx}
                from={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 mb-3.5 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-slate-800 text-sm font-black">{item.name}</Text>
                    <Text className="text-slate-400 text-[10px] mt-0.5">{item.identity || 'Walk-in'}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-xl ${isPaid ? 'bg-emerald-50' : (isPartial ? 'bg-orange-50' : 'bg-amber-50')}`}>
                    <Text className={`text-[9px] font-black uppercase ${isPaid ? 'text-emerald-700' : (isPartial ? 'text-orange-700' : 'text-amber-700')}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Medicines List */}
                <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
                  {item.meds && item.meds.map((m, mIdx) => (
                    <View key={mIdx} className="flex-row justify-between py-1 border-b border-slate-100/50 last:border-0">
                      <Text className="text-slate-600 text-xs font-medium">{m.n || m.name}</Text>
                      <Text className="text-slate-400 text-xs font-semibold">{m.q || m.dosage || '1x'}</Text>
                    </View>
                  ))}
                </View>

                {/* Amount and Actions */}
                <View className="flex-row justify-between items-center border-t border-slate-100 pt-4">
                  <View>
                    <Text className="text-slate-400 text-[9px] font-bold uppercase">Total Amount</Text>
                    <Text className="text-slate-800 text-base font-black mt-0.5">{item.amount}</Text>
                    {isPartial && item.amountPaid > 0 && (
                      <View className="mt-1">
                        <Text className="text-emerald-600 text-[10px] font-bold">Paid: ₹{item.amountPaid}</Text>
                        <Text className="text-amber-600 text-[10px] font-bold">Due: ₹{item.amountDue}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => toggleCheckoutStatus(item.id)}
                      className={`p-2.5 rounded-xl border flex-row items-center gap-1.5 ${isPaid ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50 border-indigo-200'}`}
                    >
                      <RefreshCw size={12} color={isPaid ? '#64748b' : '#4f46e5'} />
                      <Text className={`text-[10px] font-bold ${isPaid ? 'text-slate-600' : 'text-indigo-600'}`}>
                        Mark {isPaid ? 'Unpaid' : 'Paid'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handlePrint(item)}
                      className="bg-slate-900 p-2.5 rounded-xl flex-row items-center gap-1.5"
                    >
                      <Printer size={12} color="#ffffff" />
                      <Text className="text-white text-[10px] font-bold">Print Receipt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </MotiView>
            );
          })
        )}
      </ScrollView>

      {/* Add Invoice Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%] border-t border-slate-100 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row justify-between items-start mb-5">
              <View>
                <Text className="text-slate-800 text-lg font-black">Create Invoice</Text>
                <Text className="text-slate-400 text-xs">Record services or medications provided</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowAddModal(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4 mb-6">
              {/* Select Patient */}
              <View>
                <Text className="text-slate-500 text-[10px] font-bold uppercase mb-2">Select Registered Patient</Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  <TouchableOpacity
                    onPress={() => setSelectedPatientId('')}
                    className={`px-3 py-2 rounded-xl border ${selectedPatientId === '' ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-xs font-bold ${selectedPatientId === '' ? 'text-indigo-600' : 'text-slate-500'}`}>
                      Walk-in Patient
                    </Text>
                  </TouchableOpacity>
                  {patients.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPatientId(p.id)}
                      className={`px-3 py-2 rounded-xl border ${selectedPatientId === p.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <Text className={`text-xs font-bold ${selectedPatientId === p.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Patient Name if Walk-in */}
              {selectedPatientId === '' && (
                <View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Patient Name</Text>
                  <TextInput
                    placeholder="Enter patient name..."
                    placeholderTextColor="#cbd5e1"
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 text-xs font-semibold"
                    value={customPatientName}
                    onChangeText={setCustomPatientName}
                  />
                </View>
              )}

              {/* Total Billing Amount */}
              <View>
                <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Fee / Bill Amount (₹)</Text>
                <TextInput
                  placeholder="e.g. 500"
                  placeholderTextColor="#cbd5e1"
                  className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 text-xs font-semibold"
                  value={amountVal}
                  onChangeText={setAmountVal}
                  keyboardType="numeric"
                />
              </View>

              {/* Medications List */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase">Services & Prescriptions</Text>
                  <TouchableOpacity onPress={handleAddMedRow} className="flex-row items-center gap-1">
                    <PlusCircle size={12} color="#4f46e5" />
                    <Text className="text-indigo-600 text-[10px] font-bold">Add Item</Text>
                  </TouchableOpacity>
                </View>
                
                {medsList.map((med, index) => (
                  <View key={index} className="flex-row gap-2 mb-2 items-center">
                    <TextInput
                      placeholder="Item/Medicine Name"
                      placeholderTextColor="#cbd5e1"
                      className="flex-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold"
                      value={med.n}
                      onChangeText={(val) => handleMedChange(index, 'n', val)}
                    />
                    <TextInput
                      placeholder="Qty/Dosage"
                      placeholderTextColor="#cbd5e1"
                      className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold"
                      value={med.q}
                      onChangeText={(val) => handleMedChange(index, 'q', val)}
                    />
                    {medsList.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveMedRow(index)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleCreateInvoice}
              className="bg-indigo-600 rounded-xl py-3.5 items-center justify-center shadow-sm"
            >
              <Text className="text-white text-xs font-bold">Record Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Receipt Preview Dialog */}
      <Modal
        visible={printingInvoice !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPrintingInvoice(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <View>
                <Text className="text-slate-800 font-black text-lg">LIVE-LONG receipt</Text>
                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Healthcare Clinic</Text>
              </View>
              <TouchableOpacity onPress={() => setPrintingInvoice(null)} className="bg-slate-100 p-1.5 rounded-full">
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Bill Details */}
            <View className="space-y-4">
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs font-medium">Receipt No.</Text>
                <Text className="text-slate-700 text-xs font-bold">{printingInvoice?.id || 'ck123'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs font-medium">Date</Text>
                <Text className="text-slate-700 text-xs font-bold">03 Jun 2026</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs font-medium">Patient</Text>
                <Text className="text-slate-700 text-xs font-bold">{printingInvoice?.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs font-medium">ID Ref</Text>
                <Text className="text-slate-700 text-xs font-bold">{printingInvoice?.identity || 'N/A'}</Text>
              </View>

              {/* Line items */}
              <View className="border-t border-slate-200 border-b border-slate-200 py-3 my-2">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[10px] font-bold uppercase text-slate-400">Description</Text>
                  <Text className="text-[10px] font-bold uppercase text-slate-400">Qty</Text>
                </View>
                {printingInvoice?.meds && printingInvoice.meds.map((m, idx) => (
                  <View key={idx} className="flex-row justify-between py-1">
                    <Text className="text-slate-700 text-xs font-semibold">{m.n || m.name}</Text>
                    <Text className="text-slate-750 text-xs font-bold">{m.q || m.dosage || '1x'}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between items-center py-2">
                <Text className="text-slate-800 font-bold text-sm">Grand Total</Text>
                <Text className="text-slate-900 font-black text-lg">{printingInvoice?.amount}</Text>
              </View>

              {printingInvoice?.status === 'Partial' && printingInvoice?.amountPaid > 0 && (
                <>
                  <View className="flex-row justify-between items-center pt-2">
                    <Text className="text-slate-500 font-bold text-xs">Amount Deposited</Text>
                    <Text className="text-emerald-600 font-bold text-sm">₹{printingInvoice?.amountPaid}</Text>
                  </View>
                  <View className="flex-row justify-between items-center pb-2">
                    <Text className="text-slate-500 font-bold text-xs">Amount Due</Text>
                    <Text className="text-amber-600 font-bold text-sm">₹{printingInvoice?.amountDue}</Text>
                  </View>
                </>
              )}
              
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-slate-400 text-xs">Payment Status</Text>
                <Text className={`text-xs font-black uppercase ${printingInvoice?.status === 'Paid' ? 'text-emerald-600' : (printingInvoice?.status === 'Partial' ? 'text-orange-600' : 'text-amber-500')}`}>
                  {printingInvoice?.status}
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setPrintingInvoice(null);
                  alert('Receipt printed/downloaded successfully!');
                }}
                className="flex-1 bg-slate-900 rounded-xl py-3.5 items-center justify-center shadow-sm"
              >
                <Text className="text-white text-xs font-bold">Print/PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}