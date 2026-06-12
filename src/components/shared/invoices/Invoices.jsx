import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import {
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  List,
  CreditCard,
  Lock,
  X,
  FileText,
  BellRing,
  PlusCircle,
  IndianRupee
} from 'lucide-react-native';

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
  red: '#EF4444',
  redSoft: '#FFF0F0',
  amber: '#F59E0B',
  amberSoft: '#FFF8E7',
  text: '#0D1829',
  textMid: '#4A5568',
  textLight: '#94A3B8',
  border: '#E4E9F2',
  bg: '#F3F6FD',
  card: '#FFFFFF',
};

// ── Patient Invoices Data ──
const PATIENT_INVOICES = [
  { id: 'INV-2901', date: '2026-05-28', service: 'Cardiology Consult - Dr. Catherine L.', amount: 1500, status: 'Paid' },
  { id: 'INV-2844', date: '2026-05-15', service: 'Dermatology consultation - Dr. Jenkins', amount: 1200, status: 'Paid' },
  { id: 'INV-3012', date: '2026-05-29', service: 'Diagnostics - Thyroid & CBC Panels', amount: 850, status: 'Pending' },
  { id: 'INV-2598', date: '2026-04-10', service: 'Dental Care Clinic - Root Canal Procedure', amount: 4500, status: 'Overdue' }
];

// ── Doctor Revenue Billings Data ──
const DOCTOR_INVOICES = [
  { id: 'INV-3001', date: '2026-06-01', patient: 'Karan', service: 'Video Consultation Session', amount: 1500, status: 'Paid' },
  { id: 'INV-3002', date: '2026-06-01', patient: 'Sonia', service: 'Video Consultation Session', amount: 1500, status: 'Paid' }
];

export default function Invoices() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const [invoices, setInvoices] = useState(
    isDoctor ? DOCTOR_INVOICES : PATIENT_INVOICES
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | Paid | Pending | Overdue
  
  // Payment Gateway Modal State (Patient)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentStep, setPaymentStep] = useState('form'); // form | processing | success
  const [processingMsg, setProcessingMsg] = useState('');
  
  // Custom Invoice Creator Modal State (Doctor)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invPatientName, setInvPatientName] = useState('Karan Sharma');
  const [invService, setInvService] = useState('General Consultation Review');
  const [invAmount, setInvAmount] = useState('1500');
  const [isSavingInv, setIsSavingInv] = useState(false);

  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCVV, setCardCVV] = useState('123');

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [remindingInvoiceId, setRemindingInvoiceId] = useState(null);

  const triggerPaymentFlow = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentStep('form');
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    setPaymentStep('processing');
    setProcessingMsg('Connecting to secure gateway...');
    
    setTimeout(() => {
      setProcessingMsg('Securing transaction channels...');
      setTimeout(() => {
        setProcessingMsg('Verifying credentials...');
        setTimeout(() => {
          setPaymentStep('success');
          setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'Paid' } : inv));
          
          setToastMsg(`Successfully Paid ${selectedInvoice.id}!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const triggerReminder = (id, patient) => {
    setRemindingInvoiceId(id);
    setTimeout(() => {
      setRemindingInvoiceId(null);
      setToastMsg(`Payment reminder SMS alert sent to ${patient}.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const handleCreateInvoice = () => {
    if (!invService || !invAmount) {
      Alert.alert('Incomplete Form', 'Please provide service name and cost.');
      return;
    }
    setIsSavingInv(true);
    setTimeout(() => {
      setIsSavingInv(false);
      setInvoiceModalOpen(false);
      
      const newInv = {
        id: 'INV-' + Math.floor(3100 + Math.random() * 900),
        date: new Date().toISOString().split('T')[0],
        patient: invPatientName,
        service: invService,
        amount: parseInt(invAmount) || 0,
        status: 'Pending'
      };
      
      setInvoices([newInv, ...invoices]);
      setToastMsg(`Successfully issued ${newInv.id} to ${invPatientName}!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  // Calculations
  const filteredData = useMemo(() => {
    return invoices.filter(item => {
      const matchesType = filterType === 'all' || item.status === filterType;
      
      const q = searchQuery.toLowerCase();
      const textToMatch = isDoctor
        ? `${item.id} ${item.patient} ${item.service}`
        : `${item.id} ${item.service}`;
        
      const matchesSearch = textToMatch.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [invoices, filterType, searchQuery, isDoctor]);

  const stats = useMemo(() => {
    return {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'Paid').length,
      partial: invoices.filter(i => i.status === 'Partial').length,
      pending: invoices.filter(i => i.status === 'Pending').length,
      overdue: invoices.filter(i => i.status === 'Overdue').length,
      revenue: invoices.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0)
    };
  }, [invoices]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return C.green;
      case 'Partial': return '#EA580C'; // Orange-600
      case 'Overdue': return C.red;
      default: return C.amber;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Paid': return C.greenSoft;
      case 'Partial': return '#FFF7ED'; // Orange-50
      case 'Overdue': return C.redSoft;
      default: return C.amberSoft;
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isDoctor ? 'Revenue & Billings' : 'My Invoices'}
          </Text>
          <Text style={styles.headerSub}>
            {stats.total} total • {stats.paid} paid • {stats.pending} pending
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (isDoctor) {
              setInvoiceModalOpen(true);
            } else {
              Alert.alert('Details', 'Contact clinic admin for details relating to card integrations.');
            }
          }}
          style={styles.addBtn}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>{isDoctor ? 'Create Invoice' : 'Add Invoice'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat Cards Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            {isDoctor ? <IndianRupee size={18} color={C.purple} /> : <Receipt size={18} color={C.purple} />}
          </View>
          <Text style={styles.statValue}>
            {isDoctor ? `₹${stats.revenue}` : stats.total}
          </Text>
          <Text style={styles.statLabel}>{isDoctor ? 'REVENUE COLLECTED' : 'TOTAL'}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.greenSoft }]}>
            <CheckCircle size={18} color={C.green} />
          </View>
          <Text style={styles.statValue}>{stats.paid}</Text>
          <Text style={styles.statLabel}>SETTLED (PAID)</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Clock size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>UNPAID (PENDING)</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.redSoft }]}>
            <AlertTriangle size={18} color={C.red} />
          </View>
          <Text style={styles.statValue}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>OVERDUE</Text>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchBar}>
        <Search size={18} color={C.textLight} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isDoctor ? "Search by invoice ID, patient, or service..." : "Search by invoice ID or description..."}
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
      </View>

      {/* ── Filter Tabs Container ── */}
      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>FILTER BY STATUS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setFilterType('all')}
            style={[styles.pill, filterType === 'all' && styles.pillActive]}
          >
            <List size={12} color={filterType === 'all' ? '#FFF' : C.textMid} />
            <Text style={[styles.pillText, filterType === 'all' && styles.pillTextActive]}>All</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'all' ? C.purpleSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'all' ? C.purple : C.textMid }}>{stats.total}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('Paid')}
            style={[styles.pill, filterType === 'Paid' && styles.pillActivePaid]}
          >
            <CheckCircle size={12} color={filterType === 'Paid' ? '#FFF' : C.green} />
            <Text style={[styles.pillText, filterType === 'Paid' && styles.pillTextActivePaid]}>Paid</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'Paid' ? C.greenSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'Paid' ? C.green : C.textMid }}>{stats.paid}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('Pending')}
            style={[styles.pill, filterType === 'Pending' && styles.pillActivePending]}
          >
            <Clock size={12} color={filterType === 'Pending' ? '#FFF' : C.blue} />
            <Text style={[styles.pillText, filterType === 'Pending' && styles.pillTextActivePending]}>Pending</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'Pending' ? C.blueSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'Pending' ? C.blue : C.textMid }}>{stats.pending}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('Overdue')}
            style={[styles.pill, filterType === 'Overdue' && styles.pillActiveOverdue]}
          >
            <AlertTriangle size={12} color={filterType === 'Overdue' ? '#FFF' : C.red} />
            <Text style={[styles.pillText, filterType === 'Overdue' && styles.pillTextActiveOverdue]}>Overdue</Text>
            <View style={[styles.badge, { backgroundColor: filterType === 'Overdue' ? C.redSoft : '#F1F5F9' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: filterType === 'Overdue' ? C.red : C.textMid }}>{stats.overdue}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Invoices Data Table ── */}
      <View style={styles.tablePanel}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Invoice ID</Text>
          <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.tableColHeader, { flex: isDoctor ? 2.5 : 3.5 }]}>{isDoctor ? 'Patient Name' : 'Service'}</Text>
          {isDoctor && <Text style={[styles.tableColHeader, { flex: 2.2, display: Platform.OS === 'web' ? 'flex' : 'none' }]}>Service Performed</Text>}
          <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
          <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
          <Text style={[styles.tableColHeader, { flex: 1.8, textAlign: 'right' }]}>Action</Text>
        </View>

        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Receipt size={32} color={C.textLight} />
            <Text style={styles.emptyTitle}>No Invoices found</Text>
            <Text style={styles.emptySub}>No invoices match your filter parameters.</Text>
          </View>
        ) : (
          filteredData.map((item, idx) => {
            const isUnpaid = item.status !== 'Paid';
            return (
              <View key={item.id} style={[styles.rowContainer, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.tableBodyRow}>
                  <Text style={[styles.cellText, { flex: 1.2, fontWeight: '800', color: C.text }]}>{item.id}</Text>
                  <Text style={[styles.cellText, { flex: 1.2 }]}>{item.date}</Text>
                  
                  {/* Doctor vs Patient naming */}
                  <Text style={[styles.cellText, { flex: isDoctor ? 2.5 : 3.5, color: C.textMid }]} numberOfLines={1}>
                    {isDoctor ? item.patient : item.service}
                  </Text>
                  
                  {isDoctor && (
                    <Text style={[styles.cellText, { flex: 2.2, color: C.textLight, display: Platform.OS === 'web' ? 'flex' : 'none' }]} numberOfLines={1}>
                      {item.service}
                    </Text>
                  )}

                  <Text style={[styles.cellText, { flex: 1.2, textAlign: 'right', fontWeight: '800' }]}>₹{item.amount}</Text>
                  
                  {/* Color-Coded Status Badge */}
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                      <Text style={[styles.statusBadgeTxt, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Action Columns */}
                  <View style={{ flex: 1.8, alignItems: 'flex-end' }}>
                    {isDoctor ? (
                      /* Doctor Actions: Send reminder vs print */
                      isUnpaid ? (
                        remindingInvoiceId === item.id ? (
                          <ActivityIndicator size="small" color={C.blue} style={{ paddingHorizontal: 12 }} />
                        ) : (
                          <TouchableOpacity
                            onPress={() => triggerReminder(item.id, item.patient)}
                            style={[styles.payBtn, { backgroundColor: C.amber }]}
                          >
                            <BellRing size={12} color="#FFF" />
                            <Text style={styles.payBtnTxt}>Remind</Text>
                          </TouchableOpacity>
                        )
                      ) : (
                        <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.8}>
                          <FileText size={12} color={C.textMid} />
                          <Text style={styles.receiptBtnTxt}>Details</Text>
                        </TouchableOpacity>
                      )
                    ) : (
                      /* Patient Actions: Pay Now vs receipt */
                      isUnpaid ? (
                        <TouchableOpacity
                          onPress={() => triggerPaymentFlow(item)}
                          style={styles.payBtn}
                        >
                          <CreditCard size={12} color="#FFF" />
                          <Text style={styles.payBtnTxt}>Pay Now</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.8}>
                          <FileText size={12} color={C.textMid} />
                          <Text style={styles.receiptBtnTxt}>Receipt</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Secure Payment Gateway Modal (Patient View Only) ── */}
      {!isDoctor && (
        <Modal
          visible={paymentModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPaymentModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => paymentStep !== 'processing' && setPaymentModalOpen(false)} />
            {selectedInvoice && (
              <MotiView
                from={{ opacity: 0, scale: 0.95, translateY: 40 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 280 }}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Lock size={16} color={C.blue} />
                    <Text style={styles.modalTitle}>Secure Checkout Gateway</Text>
                  </View>
                  {paymentStep !== 'processing' && (
                    <TouchableOpacity onPress={() => setPaymentModalOpen(false)} style={styles.modalCloseBtn}>
                      <X size={16} color={C.textMid} />
                    </TouchableOpacity>
                  )}
                </View>

                {paymentStep === 'form' && (
                  <View style={{ padding: 20 }}>
                    <View style={styles.paymentInvoiceDetails}>
                      <Text style={styles.paymentLabel}>INVOICE DETAILS</Text>
                      <Text style={styles.paymentInvName}>{selectedInvoice.service}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        {selectedInvoice.status === 'Partial' && selectedInvoice.amountPaid > 0 && (
                          <>
                            <View style={styles.rcptRow}>
                              <Text style={styles.rcptRowLabel}>Deposited</Text>
                              <Text style={[styles.rcptRowValue, { color: C.green }]}>₹{selectedInvoice.amountPaid}</Text>
                            </View>
                            <View style={styles.rcptRow}>
                              <Text style={styles.rcptRowLabel}>Due Amount</Text>
                              <Text style={[styles.rcptRowValue, { color: C.amber }]}>₹{selectedInvoice.amountDue}</Text>
                            </View>
                          </>
                        )}
                        
                        <View style={styles.rcptRow}>
                          <Text style={styles.rcptRowLabel}>Payment Status</Text>
                          <Text style={[styles.rcptRowValue, { color: getStatusColor(selectedInvoice.status) }]}>{selectedInvoice.status}</Text>
                        </View>
                        <Text style={styles.paymentLabel}>Total Billing</Text>
                        <Text style={styles.paymentInvPrice}>₹{selectedInvoice.amount}</Text>
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>CARD NUMBER</Text>
                      <TextInput
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        style={styles.textInput}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={[styles.formGroup, { flex: 1.5 }]}>
                        <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                        <TextInput
                          value={cardExpiry}
                          onChangeText={setCardExpiry}
                          style={styles.textInput}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>CVV CODE</Text>
                        <TextInput
                          value={cardCVV}
                          onChangeText={setCardCVV}
                          secureTextEntry
                          style={styles.textInput}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handlePaymentSubmit}
                      style={styles.confirmPayBtn}
                    >
                      <Lock size={14} color="#FFF" />
                      <Text style={styles.confirmPayBtnTxt}>Authorize Payment (₹{selectedInvoice.amount})</Text>
                    </TouchableOpacity>
                    <Text style={styles.secureText}>🔒 PCI-DSS Compliant 256-bit encryption channels.</Text>
                  </View>
                )}

                {paymentStep === 'processing' && (
                  <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color={C.blue} />
                    <Text style={styles.stateTitle}>{processingMsg}</Text>
                  </View>
                )}

                {paymentStep === 'success' && (
                  <View style={styles.stateContainer}>
                    <CheckCircle size={44} color={C.green} />
                    <Text style={[styles.stateTitle, { color: C.green }]}>Payment Successful</Text>
                    <Text style={styles.stateSub}>Invoice has been settled.</Text>
                    <TouchableOpacity
                      onPress={() => setPaymentModalOpen(false)}
                      style={styles.completeBtn}
                    >
                      <Text style={styles.completeBtnTxt}>Close window</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </MotiView>
            )}
          </View>
        </Modal>
      )}

      {/* ── Create Invoice Modal (Doctor View Only) ── */}
      {isDoctor && (
        <Modal
          visible={invoiceModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setInvoiceModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setInvoiceModalOpen(false)} />
            
            <MotiView
              from={{ opacity: 0, translateY: 60 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <PlusCircle size={18} color={C.blue} />
                  <Text style={styles.modalTitle}>Issue Patient Invoice</Text>
                </View>
                <TouchableOpacity onPress={() => setInvoiceModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={16} color={C.textMid} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>PATIENT NAME</Text>
                  <TextInput
                    value={invPatientName}
                    onChangeText={setInvPatientName}
                    style={styles.formTextInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>SERVICE DETAILS</Text>
                  <TextInput
                    value={invService}
                    onChangeText={setInvService}
                    style={styles.formTextInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>AMOUNT BILLED (₹)</Text>
                  <TextInput
                    value={invAmount}
                    onChangeText={setInvAmount}
                    keyboardType="numeric"
                    style={styles.formTextInput}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setInvoiceModalOpen(false)} style={styles.cancelCheckoutBtn}>
                  <Text style={styles.cancelCheckoutBtnTxt}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateInvoice}
                  disabled={isSavingInv}
                  style={styles.placeOrderBtn}
                >
                  {isSavingInv ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.placeOrderBtnTxt}>Issue Invoice</Text>
                  )}
                </TouchableOpacity>
              </View>

            </MotiView>
          </View>
        </Modal>
      )}

      {/* Simulated Toast */}
      {showToast && (
        <MotiView
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.toast}
        >
          <CheckCircle size={16} color="#FFF" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </MotiView>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textLight,
    marginTop: 3,
  },
  addBtn: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 3,
    shadowColor: C.blue,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    marginLeft: 6,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0D1829',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  searchBar: {
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  filtersPanel: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMid,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  pillTextActive: {
    color: '#FFF',
  },
  pillActivePaid: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  pillTextActivePaid: {
    color: '#FFF',
  },
  pillActivePending: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  pillTextActivePending: {
    color: '#FFF',
  },
  pillActiveOverdue: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  pillTextActiveOverdue: {
    color: '#FFF',
  },
  tablePanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#0D1829',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
    textTransform: 'uppercase',
  },
  rowContainer: {
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cellText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  statusBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  payBtnTxt: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '850',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  receiptBtnTxt: {
    color: C.textMid,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.textMid,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 24, 41, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.card,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: C.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  paymentInvoiceDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 16,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  paymentInvName: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
    marginTop: 4,
  },
  paymentInvPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: C.blue,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '850',
    color: C.textLight,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: '#FAFBFD',
    fontWeight: '600',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  confirmPayBtn: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    gap: 6,
  },
  confirmPayBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  secureText: {
    fontSize: 10,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  stateContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: C.text,
    marginTop: 16,
    textAlign: 'center',
  },
  stateSub: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
    lineHeight: 16,
  },
  completeBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  completeBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  formTextInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: C.text,
    backgroundColor: '#FAFBFD',
    fontWeight: '600',
    marginTop: 6,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: '#F8FAFC',
  },
  cancelCheckoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelCheckoutBtnTxt: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '800',
  },
  placeOrderBtn: {
    backgroundColor: C.blue,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  placeOrderBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
