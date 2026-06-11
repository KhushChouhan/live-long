import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Search,
  User,
  UserPlus,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  IndianRupee,
  Receipt,
  CalendarDays,
  Hash,
  Percent,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  Mail,
  Send,
} from 'lucide-react-native';

import { useDoctor } from '../../../store/DoctorContext';

// ─── Color Palette ────────────────────────────────────────────
const C = {
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  primaryDark: '#3730A3',
  accent: '#0EA5E9',
  accentSoft: '#E0F2FE',
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  text: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  dark: '#1E293B',
};

// ─── Generate Invoice Number ───────────────────────────────────
const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${timestamp}${random}`;
};

// ─── Format Date ───────────────────────────────────────────────
const formatDate = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AddInvoiceScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  // Get patients from DoctorContext if available
  const ctx = useDoctor();
  const patients = ctx?.patients || [];
  const addToCheckoutFn = ctx?.addToCheckout || null;

  // ─── Invoice Metadata ────────────────────────────────────────
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate] = useState(formatDate(new Date()));
  const [dueDate, setDueDate] = useState(
    formatDate(new Date(Date.now() + 15 * 86400000))
  );

  // ─── Patient Selection ────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [customPatient, setCustomPatient] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // ─── Line Items ──────────────────────────────────────────────
  const [lineItems, setLineItems] = useState([
    { id: '1', description: 'General Consultation', qty: '1', rate: '800', hsn: 'SAC-9993' },
  ]);

  // ─── Additional Charges ──────────────────────────────────────
  const [taxRate, setTaxRate] = useState('0');
  const [discountRate, setDiscountRate] = useState('0');
  const [notes, setNotes] = useState('Thank you for choosing Live-Long Healthcare. Payment is due within 15 days.');

  // ─── Payment States ──────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('Pending'); // 'Full', 'Partial', 'Pending'
  const [depositAmount, setDepositAmount] = useState('');

  // ─── UI States ───────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── Filtered Patients ────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.identity?.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  // ─── Calculations ────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + qty * rate;
    }, 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return (subtotal * (parseFloat(taxRate) || 0)) / 100;
  }, [subtotal, taxRate]);

  const discountAmount = useMemo(() => {
    return (subtotal * (parseFloat(discountRate) || 0)) / 100;
  }, [subtotal, discountRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - discountAmount);
  }, [subtotal, taxAmount, discountAmount]);

  const depositValue = useMemo(() => {
    if (paymentType === 'Full') return grandTotal;
    if (paymentType === 'Pending') return 0;
    return parseFloat(depositAmount) || 0;
  }, [paymentType, depositAmount, grandTotal]);

  const amountDue = useMemo(() => {
    return Math.max(0, grandTotal - depositValue);
  }, [grandTotal, depositValue]);

  // ─── Line Item Handlers ──────────────────────────────────────
  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: '', qty: '1', rate: '0', hsn: '' },
    ]);
  }, []);

  const removeLineItem = useCallback((id) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateLineItem = useCallback((id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  // ─── Submit Invoice ──────────────────────────────────────────
  const handleSubmit = () => {
    const patientInfo = selectedPatient || {
      name: customPatient.name || 'Walk-in Patient',
      phone: customPatient.phone || '',
      identity: '',
      gender: '',
    };

    if (!patientInfo.name.trim()) {
      return;
    }

    // Build medications/services list for checkout
    const meds = lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        n: item.description,
        q: `${item.qty}x @ ₹${item.rate}`,
      }));

    // Add to DoctorContext checkout if available
    if (addToCheckoutFn) {
      addToCheckoutFn(
        patientInfo,
        meds.length > 0 ? meds : [{ n: 'General Consultation', q: '1x' }],
        grandTotal,
        paymentType,
        depositValue
      );
    }

    setIsSuccess(true);
  };

  // ─── Success Screen ──────────────────────────────────────────
  if (isSuccess) {
    const patientName = selectedPatient?.name || customPatient.name || 'Walk-in Patient';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
        <View style={styles.successContainer}>
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 100 }}
          >
            <View style={styles.successIconRing}>
              <View style={styles.successIconInner}>
                <CheckCircle size={52} color={C.success} />
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 400 }}
          >
            <Text style={styles.successTitle}>Invoice Created</Text>
            <Text style={styles.successSub}>
              {invoiceNumber} • ₹{grandTotal.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.successPatient}>Billed to {patientName}</Text>
          </MotiView>

          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 700 }}
            style={styles.successActions}
          >
            <TouchableOpacity
              onPress={() => {
                setIsSuccess(false);
                const basePath = isDoctor ? '/doctor' : '/user';
                router.push(`${basePath}/invoices/invoice-list`);
              }}
              style={styles.successPrimaryBtn}
            >
              <Receipt size={16} color="#FFF" />
              <Text style={styles.successPrimaryBtnText}>View All Invoices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsSuccess(false);
                setSelectedPatientId('');
                setCustomPatient({ name: '', phone: '', email: '', address: '' });
                setLineItems([{ id: '1', description: 'General Consultation', qty: '1', rate: '800', hsn: 'SAC-9993' }]);
                setTaxRate('0');
                setDiscountRate('0');
              }}
              style={styles.successSecondaryBtn}
            >
              <Plus size={16} color={C.primary} />
              <Text style={styles.successSecondaryBtnText}>Create Another</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Form ───────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color={C.textMid} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle}>Create Invoice</Text>
            <Text style={styles.topBarSub}>Fill in the details below to generate a professional invoice</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ SECTION 1: Invoice Header ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 0 }}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.primarySoft }]}>
                <Receipt size={16} color={C.primary} />
              </View>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <Hash size={12} color={C.textLight} />
                  <Text style={styles.metaLabel}>INVOICE NO.</Text>
                </View>
                <Text style={styles.metaValue}>{invoiceNumber}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <CalendarDays size={12} color={C.textLight} />
                  <Text style={styles.metaLabel}>ISSUE DATE</Text>
                </View>
                <Text style={styles.metaValue}>{invoiceDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={styles.metaIconRow}>
                  <CalendarDays size={12} color={C.warning} />
                  <Text style={styles.metaLabel}>DUE DATE</Text>
                </View>
                <Text style={[styles.metaValue, { color: C.warning }]}>{dueDate}</Text>
              </View>
            </View>
          </MotiView>

          {/* ═══ SECTION 2: Patient / Bill To ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 80 }}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.accentSoft }]}>
                <User size={16} color={C.accent} />
              </View>
              <Text style={styles.sectionTitle}>Bill To</Text>
            </View>

            {/* Patient Search */}
            {patients.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.fieldLabel}>SELECT FROM REGISTRY</Text>
                <TouchableOpacity
                  onPress={() => setShowPatientDropdown(!showPatientDropdown)}
                  style={styles.selectButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <User size={14} color={selectedPatient ? C.primary : C.textLight} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: selectedPatient ? '700' : '500',
                        color: selectedPatient ? C.text : C.textLight,
                      }}
                      numberOfLines={1}
                    >
                      {selectedPatient
                        ? `${selectedPatient.name}  •  ${selectedPatient.phone}`
                        : 'Search or pick a registered patient...'}
                    </Text>
                  </View>
                  {showPatientDropdown ? (
                    <ChevronUp size={16} color={C.textLight} />
                  ) : (
                    <ChevronDown size={16} color={C.textLight} />
                  )}
                </TouchableOpacity>

                {showPatientDropdown && (
                  <MotiView
                    from={{ opacity: 0, scaleY: 0.95 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    style={styles.dropdown}
                  >
                    <View style={styles.dropdownSearch}>
                      <Search size={14} color={C.textLight} />
                      <TextInput
                        placeholder="Type to search..."
                        placeholderTextColor={C.textLight}
                        style={styles.dropdownSearchInput}
                        value={patientSearch}
                        onChangeText={setPatientSearch}
                        autoFocus
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                      {/* Walk-in option */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPatientId('');
                          setShowPatientDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          selectedPatientId === '' && styles.dropdownItemActive,
                        ]}
                      >
                        <UserPlus size={14} color={selectedPatientId === '' ? C.primary : C.textLight} />
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedPatientId === '' && { color: C.primary, fontWeight: '700' },
                          ]}
                        >
                          Walk-in / Custom Patient
                        </Text>
                      </TouchableOpacity>

                      {filteredPatients.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedPatientId(p.id);
                            setShowPatientDropdown(false);
                            setPatientSearch('');
                          }}
                          style={[
                            styles.dropdownItem,
                            selectedPatientId === p.id && styles.dropdownItemActive,
                          ]}
                        >
                          <View style={styles.dropdownAvatar}>
                            <Text style={styles.dropdownAvatarText}>
                              {p.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedPatientId === p.id && { color: C.primary, fontWeight: '700' },
                              ]}
                            >
                              {p.name}
                            </Text>
                            <Text style={styles.dropdownItemSub}>
                              {p.phone} • {p.gender} • {p.age}y
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </MotiView>
                )}
              </View>
            )}

            {/* Custom Patient Fields (shown when no registry patient selected) */}
            {!selectedPatient && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.fieldLabel}>PATIENT NAME *</Text>
                  <View style={styles.inputWithIcon}>
                    <User size={14} color={C.textLight} />
                    <TextInput
                      placeholder="Enter full name..."
                      placeholderTextColor="#CBD5E1"
                      style={styles.inputField}
                      value={customPatient.name}
                      onChangeText={(v) => setCustomPatient({ ...customPatient, name: v })}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>PHONE</Text>
                    <View style={styles.inputWithIcon}>
                      <Phone size={14} color={C.textLight} />
                      <TextInput
                        placeholder="91XXXXXXXXXX"
                        placeholderTextColor="#CBD5E1"
                        style={styles.inputField}
                        value={customPatient.phone}
                        onChangeText={(v) => setCustomPatient({ ...customPatient, phone: v })}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>EMAIL</Text>
                    <View style={styles.inputWithIcon}>
                      <Mail size={14} color={C.textLight} />
                      <TextInput
                        placeholder="patient@email.com"
                        placeholderTextColor="#CBD5E1"
                        style={styles.inputField}
                        value={customPatient.email}
                        onChangeText={(v) => setCustomPatient({ ...customPatient, email: v })}
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={styles.fieldLabel}>ADDRESS</Text>
                  <View style={styles.inputWithIcon}>
                    <Building2 size={14} color={C.textLight} />
                    <TextInput
                      placeholder="Address line..."
                      placeholderTextColor="#CBD5E1"
                      style={styles.inputField}
                      value={customPatient.address}
                      onChangeText={(v) => setCustomPatient({ ...customPatient, address: v })}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Selected Patient Card */}
            {selectedPatient && (
              <View style={styles.selectedPatientCard}>
                <View style={styles.selectedPatientAvatar}>
                  <Text style={styles.selectedPatientAvatarText}>
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedPatientName}>{selectedPatient.name}</Text>
                  <Text style={styles.selectedPatientMeta}>
                    {selectedPatient.phone} • {selectedPatient.gender} • {selectedPatient.age} yrs • Blood {selectedPatient.bloodGroup || 'N/A'}
                  </Text>
                  <Text style={styles.selectedPatientId}>ID: {selectedPatient.identity}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPatientId('')}
                  style={styles.clearPatientBtn}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.danger }}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </MotiView>

          {/* ═══ SECTION 3: Line Items ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 160 }}
            style={styles.section}
          >
            <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.successSoft }]}>
                <FileText size={16} color={C.success} />
              </View>
              <Text style={[styles.sectionTitle, { flex: 1 }]}>Services & Items</Text>
              <TouchableOpacity onPress={addLineItem} style={styles.addItemBtn}>
                <Plus size={14} color={C.primary} />
                <Text style={styles.addItemBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Column Headers */}
            <View style={styles.itemHeaderRow}>
              <Text style={[styles.itemHeaderText, { flex: 3 }]}>DESCRIPTION</Text>
              <Text style={[styles.itemHeaderText, { flex: 0.8, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.itemHeaderText, { flex: 1.2, textAlign: 'center' }]}>RATE (₹)</Text>
              <Text style={[styles.itemHeaderText, { flex: 1.2, textAlign: 'right' }]}>AMOUNT</Text>
              <View style={{ width: 28 }} />
            </View>

            {lineItems.map((item, index) => {
              const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
              return (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 50 }}
                  style={styles.lineItemRow}
                >
                  <TextInput
                    placeholder="Service / Medicine name"
                    placeholderTextColor="#CBD5E1"
                    style={[styles.lineItemInput, { flex: 3 }]}
                    value={item.description}
                    onChangeText={(v) => updateLineItem(item.id, 'description', v)}
                  />
                  <TextInput
                    placeholder="1"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    style={[styles.lineItemInput, { flex: 0.8, textAlign: 'center' }]}
                    value={item.qty}
                    onChangeText={(v) => updateLineItem(item.id, 'qty', v)}
                  />
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    style={[styles.lineItemInput, { flex: 1.2, textAlign: 'center' }]}
                    value={item.rate}
                    onChangeText={(v) => updateLineItem(item.id, 'rate', v)}
                  />
                  <Text style={styles.lineItemAmount}>
                    ₹{itemAmount.toLocaleString('en-IN')}
                  </Text>
                  {lineItems.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => removeLineItem(item.id)}
                      style={styles.removeItemBtn}
                    >
                      <Trash2 size={14} color={C.danger} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 28 }} />
                  )}
                </MotiView>
              );
            })}
          </MotiView>

          {/* ═══ SECTION 4: Advanced — Tax, Discount, Notes ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 240 }}
            style={styles.section}
          >
            <TouchableOpacity
              onPress={() => setShowAdvanced(!showAdvanced)}
              style={styles.advancedToggle}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sectionIconBg, { backgroundColor: C.warningSoft }]}>
                  <Percent size={14} color={C.warning} />
                </View>
                <Text style={styles.sectionTitle}>Tax, Discount & Notes</Text>
              </View>
              {showAdvanced ? (
                <ChevronUp size={16} color={C.textLight} />
              ) : (
                <ChevronDown size={16} color={C.textLight} />
              )}
            </TouchableOpacity>

            {showAdvanced && (
              <View style={{ marginTop: 16, gap: 14 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TAX RATE (%)</Text>
                    <View style={styles.inputWithIcon}>
                      <Percent size={14} color={C.textLight} />
                      <TextInput
                        placeholder="0"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="numeric"
                        style={styles.inputField}
                        value={taxRate}
                        onChangeText={setTaxRate}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>DISCOUNT (%)</Text>
                    <View style={styles.inputWithIcon}>
                      <Percent size={14} color={C.textLight} />
                      <TextInput
                        placeholder="0"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="numeric"
                        style={styles.inputField}
                        value={discountRate}
                        onChangeText={setDiscountRate}
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>NOTES / TERMS</Text>
                  <View style={[styles.inputWithIcon, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                    <StickyNote size={14} color={C.textLight} style={{ marginTop: 2 }} />
                    <TextInput
                      placeholder="Add payment terms, notes, or disclaimers..."
                      placeholderTextColor="#CBD5E1"
                      style={[styles.inputField, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </View>
            )}
          </MotiView>

          {/* ═══ SECTION 5: Payment Details ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 280 }}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: C.successSoft }]}>
                <IndianRupee size={16} color={C.success} />
              </View>
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>

            <Text style={styles.fieldLabel}>PAYMENT STATUS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: paymentType === 'Partial' ? 16 : 0 }}>
              {['Full', 'Partial', 'Pending'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setPaymentType(type)}
                  style={[
                    styles.paymentTypeChip,
                    paymentType === type && styles.paymentTypeChipActive
                  ]}
                >
                  <Text style={[
                    styles.paymentTypeChipText,
                    paymentType === type && styles.paymentTypeChipTextActive
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentType === 'Partial' && (
              <MotiView 
                from={{ opacity: 0, translateY: -10 }} 
                animate={{ opacity: 1, translateY: 0 }}
                style={{ marginTop: 16 }}
              >
                <Text style={styles.fieldLabel}>DEPOSIT AMOUNT (₹)</Text>
                <View style={styles.inputWithIcon}>
                  <IndianRupee size={14} color={C.textLight} />
                  <TextInput
                    placeholder="Enter amount paid upfront..."
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    style={styles.inputField}
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                  />
                </View>
              </MotiView>
            )}
          </MotiView>

          {/* ═══ SECTION 6: Totals Summary ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 320 }}
            style={[styles.section, { backgroundColor: C.dark }]}
          >
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {parseFloat(taxRate) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
                <Text style={[styles.totalValue, { color: '#FCA5A5' }]}>
                  +₹{taxAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            {parseFloat(discountRate) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount ({discountRate}%)</Text>
                <Text style={[styles.totalValue, { color: '#86EFAC' }]}>
                  -₹{discountAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={[styles.grandTotalValue, { fontSize: 20 }]}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Deposited</Text>
              <Text style={[styles.totalValue, { color: '#86EFAC' }]}>
                -₹{depositValue.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Amount Due</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IndianRupee size={22} color="#FFFFFF" />
                <Text style={styles.grandTotalValue}>
                  {amountDue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </MotiView>

          {/* ═══ SUBMIT BUTTON ═══ */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400 }}
          >
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} activeOpacity={0.85}>
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Generate Invoice</Text>
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              Invoice will be saved to billing records and can be printed or emailed.
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
    ...Platform.select({
      android: { paddingTop: 40 },
    }),
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 2,
  },

  // Sections
  section: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },

  // Field label
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  // Input with icon
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    paddingVertical: 10,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },

  // Select button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Dropdown
  dropdown: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: C.primarySoft,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMid,
  },
  dropdownItemSub: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 2,
  },
  dropdownAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.primary,
  },

  // Selected patient card
  selectedPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primarySoft,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectedPatientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPatientAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedPatientName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  selectedPatientMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMid,
    marginTop: 2,
  },
  selectedPatientId: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textLight,
    marginTop: 3,
  },
  clearPatientBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: C.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Line items
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.primarySoft,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addItemBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 8,
    gap: 8,
  },
  itemHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 0.5,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  lineItemInput: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  lineItemAmount: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
    textAlign: 'right',
  },
  removeItemBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.dangerSoft,
  },

  // Advanced toggle
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 12,
    marginBottom: 20,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  successPatient: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  successActions: {
    width: '100%',
    marginTop: 36,
    gap: 12,
  },
  successPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  successPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primarySoft,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  successSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },
  paymentTypeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTypeChipActive: {
    backgroundColor: C.primarySoft,
    borderColor: C.primary,
  },
  paymentTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
  },
  paymentTypeChipTextActive: {
    color: C.primary,
    fontWeight: '800',
  },
});