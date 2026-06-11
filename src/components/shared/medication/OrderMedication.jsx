import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { MotiView } from 'moti';
import { usePathname } from 'expo-router';
import {
  ShoppingCart,
  Clock,
  PackageCheck,
  XCircle,
  Search,
  Plus,
  Minus,
  UploadCloud,
  FileText,
  CreditCard,
  MapPin,
  CheckCircle,
  ChevronRight,
  Trash2,
  X,
  Package,
  AlertTriangle,
  ClipboardList
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

// ── Drug Catalog Data ──
const DRUG_CATALOG = [
  { id: 'm1', name: 'Metformin 500mg', category: 'Diabetes', price: 180, pack: '60 Tablets', stock: 'In Stock', count: 140 },
  { id: 'm2', name: 'Glipizide 5mg', category: 'Diabetes', price: 210, pack: '30 Tablets', stock: 'In Stock', count: 85 },
  { id: 'm3', name: 'Atorvastatin 20mg', category: 'Cardiac', price: 350, pack: '30 Tablets', stock: 'Low Stock', count: 4 },
  { id: 'm4', name: 'Amlodipine 5mg', category: 'Cardiac', price: 120, pack: '30 Tablets', stock: 'In Stock', count: 200 },
  { id: 'm5', name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 80, pack: '20 Tablets', stock: 'Out of Stock', count: 0 },
  { id: 'm6', name: 'Paracetamol 650mg', category: 'Pain Relief', price: 40, pack: '15 Tablets', stock: 'In Stock', count: 320 },
  { id: 'm7', name: 'Vitamin D3 1000 IU', category: 'Vitamins', price: 420, pack: '60 Softgels', stock: 'In Stock', count: 90 },
];

const INITIAL_ORDERS = [
  { id: 'ORD-9821', date: '2026-05-24', total: 680, status: 'delivered', items: 'Metformin 500mg x2, Amlodipine 5mg x1' },
  { id: 'ORD-4412', date: '2026-05-29', total: 420, status: 'pending', items: 'Vitamin D3 1000 IU x1' },
];

// ── Doctor View: Patient Refill Requests ──
const INITIAL_REFILL_REQUESTS = [
  { id: 'RF-90', date: '2026-06-01', patient: 'Karan Sharma', medicine: 'Metformin 500mg', refillsLeft: 2, status: 'Pending' },
  { id: 'RF-77', date: '2026-05-31', patient: 'Chinu Choudhary', medicine: 'Telmisartan 40mg', refillsLeft: 4, status: 'Pending' },
  { id: 'RF-42', date: '2026-05-28', patient: 'Amit Patel', medicine: 'Atorvastatin 40mg', refillsLeft: 0, status: 'Approved' }
];

export default function OrderMedication() {
  const pathname = usePathname();
  const isDoctor = pathname.includes('/doctor');

  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [refillRequests, setRefillRequests] = useState(INITIAL_REFILL_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | pending | delivered
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Shopping Cart state (Patient View)
  const [cart, setCart] = useState([]);
  
  // Checkout Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('12, Green Park Avenue, New Delhi, 110016');
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Prescription Upload Simulation state
  const [uploadState, setUploadState] = useState('idle');
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [actioningRequestId, setActioningRequestId] = useState(null);

  // Cart operations (Patient)
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const nextQ = item.quantity + delta;
        return nextQ > 0 ? { ...item, quantity: nextQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Prescription Upload Trigger
  const handlePrescriptionSelect = () => {
    setUploadState('uploading');
    setUploadedFileName('loading...');
    setTimeout(() => {
      setUploadState('success');
      setUploadedFileName('Rx_CatherineCardio_May2026.pdf');
      addToCart(DRUG_CATALOG[0]); // Metformin
      addToCart(DRUG_CATALOG[3]); // Amlodipine
      
      setToastMessage('Prescription uploaded & parsed. Added Metformin and Amlodipine!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 2000);
  };

  const placeOrder = () => {
    setIsCheckoutOpen(false);
    setUploadState('idle');
    setUploadedFileName('');
    const newOrdId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newOrd = {
      id: newOrdId,
      date: new Date().toISOString().split('T')[0],
      total: cartTotal.total,
      status: 'pending',
      items: cart.map(i => `${i.name} x${i.quantity}`).join(', ')
    };
    
    setTimeout(() => {
      setOrders([newOrd, ...orders]);
      setCart([]);
      setToastMessage(`Order placed successfully! ID: ${newOrdId}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 500);
  };

  // Doctor: Approve/Deny Refills
  const handleRefillAction = (id, status) => {
    setActioningRequestId(id);
    setTimeout(() => {
      setActioningRequestId(null);
      setRefillRequests(refillRequests.map(r => r.id === id ? { ...r, status } : r));
      setToastMessage(`Refill request ${id} marked as ${status}.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return DRUG_CATALOG.filter(prod => {
      const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory;
      const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);

  // Order stats
  const stats = useMemo(() => {
    if (isDoctor) {
      return {
        total: DRUG_CATALOG.length,
        outOfStock: DRUG_CATALOG.filter(d => d.count === 0).length,
        lowStock: DRUG_CATALOG.filter(d => d.count > 0 && d.count <= 10).length,
        refills: refillRequests.filter(r => r.status === 'Pending').length,
      };
    }
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders, refillRequests, isDoctor]);

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'Approved':
        return C.green;
      case 'cancelled':
      case 'Denied':
        return C.red;
      default: return C.blue;
    }
  };

  const getOrderStatusBg = (status) => {
    switch (status) {
      case 'delivered':
      case 'Approved':
        return C.greenSoft;
      case 'cancelled':
      case 'Denied':
        return C.redSoft;
      default: return C.blueSoft;
    }
  };

  // Render Doctor Layout
  if (isDoctor) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* ── Page Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Pharmacy Control Panel</Text>
            <Text style={styles.headerSub}>
              {stats.total} medicines cataloged • {stats.lowStock} low stock items • {stats.refills} refills pending
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Add Drug', 'Redirecting to pharmacy catalog input...')}
            style={styles.addBtn}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Add Drug Item</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4 Doctor Stat Cards Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
              <Package size={18} color={C.purple} />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>CATALOG DRUGS</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.redSoft }]}>
              <XCircle size={18} color={C.red} />
            </View>
            <Text style={styles.statValue}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>OUT OF STOCK</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.amberSoft }]}>
              <AlertTriangle size={18} color={C.amber} />
            </View>
            <Text style={styles.statValue}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>LOW STOCK</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
              <ClipboardList size={18} color={C.blue} />
            </View>
            <Text style={styles.statValue}>{stats.refills}</Text>
            <Text style={styles.statLabel}>PENDING REFILLS</Text>
          </View>
        </View>

        <View style={styles.splitLayout}>
          {/* Left Column: Pharmacy Catalog Grid */}
          <View style={styles.leftColumn}>
            <Text style={styles.sectionHeaderTitle}>In-House Drug Catalog Stock</Text>
            <View style={styles.gridContainer}>
              {DRUG_CATALOG.map((prod) => {
                const isLow = prod.count > 0 && prod.count <= 10;
                const isOut = prod.count === 0;
                return (
                  <View key={prod.id} style={styles.drugCard}>
                    <View style={styles.drugHeader}>
                      <Text style={styles.drugCategory}>{prod.category}</Text>
                      <Text style={[styles.drugStock, isLow && { color: C.amber }, isOut && { color: C.red }]}>
                        {prod.stock} ({prod.count})
                      </Text>
                    </View>
                    <Text style={styles.drugName}>{prod.name}</Text>
                    <Text style={styles.drugPack}>{prod.pack}</Text>
                    
                    <View style={styles.drugFooter}>
                      <Text style={styles.drugPrice}>₹{prod.price}</Text>
                      <TouchableOpacity
                        onPress={() => Alert.alert('Edit Inventory', `Modify stock levels for ${prod.name}`)}
                        style={[styles.addToCartBtn, { backgroundColor: C.textMid }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addToCartBtnTxt}>Adjust Stock</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right Column: Refill Request Approvals */}
          <View style={styles.rightColumn}>
            <Text style={styles.sectionHeaderTitle}>Patient Refill Requests</Text>
            
            <View style={styles.refillListPanel}>
              {refillRequests.map(req => {
                const isPending = req.status === 'Pending';
                return (
                  <View key={req.id} style={styles.refillRequestCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={styles.refillPatientName}>{req.patient}</Text>
                        <Text style={styles.refillMedText}>{req.medicine}</Text>
                        <Text style={styles.refillMetaTxt}>Date: {req.date} · Authorized refills left: {req.refillsLeft}</Text>
                      </View>
                      <View style={[styles.orderBadge, { backgroundColor: getOrderStatusBg(req.status), alignSelf: 'flex-start' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: getOrderStatusColor(req.status) }}>{req.status}</Text>
                      </View>
                    </View>

                    {isPending && (
                      <View style={styles.refillActionRow}>
                        {actioningRequestId === req.id ? (
                          <ActivityIndicator size="small" color={C.blue} style={{ paddingVertical: 6 }} />
                        ) : (
                          <>
                            <TouchableOpacity
                              onPress={() => handleRefillAction(req.id, 'Approved')}
                              style={[styles.refillActBtn, { backgroundColor: C.green }]}
                            >
                              <Text style={styles.refillActBtnTxt}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleRefillAction(req.id, 'Denied')}
                              style={[styles.refillActBtn, { backgroundColor: C.red }]}
                            >
                              <Text style={styles.refillActBtnTxt}>Deny</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Toast */}
        {showToast && (
          <MotiView
            from={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.toast}
          >
            <CheckCircle size={16} color="#FFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </MotiView>
        )}
      </ScrollView>
    );
  }

  // Render Patient Layout (E-Commerce)
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order Medication</Text>
          <Text style={styles.headerSub}>
            {stats.total} total orders • {stats.pending} pending • {stats.delivered} delivered
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setSelectedCategory('All')}
          style={styles.addBtn}
          activeOpacity={0.85}
        >
          <ShoppingCart size={16} color="#FFF" />
          <Text style={styles.addBtnText}>View Catalog</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat Cards Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.purpleSoft }]}>
            <ShoppingCart size={18} color={C.purple} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL ORDERS</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.blueSoft }]}>
            <Clock size={18} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>PENDING</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.tealSoft }]}>
            <PackageCheck size={18} color={C.teal} />
          </View>
          <Text style={styles.statValue}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>DELIVERED</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: C.redSoft }]}>
            <XCircle size={18} color={C.red} />
          </View>
          <Text style={styles.statValue}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>CANCELLED</Text>
        </View>
      </View>

      {/* ── Split Layout ── */}
      <View style={styles.splitLayout}>
        <View style={styles.leftColumn}>
          <View style={styles.categoriesBar}>
            {['All', 'Diabetes', 'Cardiac', 'Pain Relief', 'Vitamins'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.catTab,
                  selectedCategory === cat && styles.catTabActive
                ]}
              >
                <Text style={[styles.catTabTxt, selectedCategory === cat && styles.catTabTxtActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color={C.textLight} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by drug name..."
              placeholderTextColor={C.textLight}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.gridContainer}>
            {filteredCatalog.map((prod) => (
              <View key={prod.id} style={styles.drugCard}>
                <View style={styles.drugHeader}>
                  <Text style={styles.drugCategory}>{prod.category}</Text>
                  <Text style={styles.drugStock}>{prod.stock}</Text>
                </View>
                <Text style={styles.drugName}>{prod.name}</Text>
                <Text style={styles.drugPack}>{prod.pack}</Text>
                
                <View style={styles.drugFooter}>
                  <Text style={styles.drugPrice}>₹{prod.price}</Text>
                  <TouchableOpacity
                    onPress={() => addToCart(prod)}
                    style={styles.addToCartBtn}
                    activeOpacity={0.8}
                  >
                    <Plus size={14} color="#FFF" />
                    <Text style={styles.addToCartBtnTxt}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 30 }}>
            <Text style={styles.sectionHeaderTitle}>Recent Orders History</Text>
            <View style={styles.ordersTable}>
              {orders.map((ord) => (
                <View key={ord.id} style={styles.orderRow}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.orderId}>{ord.id}</Text>
                    <Text style={styles.orderDate}>{ord.date}</Text>
                  </View>
                  <View style={{ flex: 4 }}>
                    <Text style={styles.orderItems} numberOfLines={1}>{ord.items}</Text>
                  </View>
                  <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                    <Text style={styles.orderPrice}>₹{ord.total}</Text>
                    <View style={[styles.orderBadge, { backgroundColor: getOrderStatusBg(ord.status) }]}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: getOrderStatusColor(ord.status) }}>{ord.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </View>

        <View style={styles.rightColumn}>
          
          <View style={styles.prescriptionUploadCard}>
            <Text style={styles.uploadCardTitle}>Prescription Upload Portal</Text>
            <Text style={styles.uploadCardSubtitle}>Upload scan to automatically add prescribed items to cart.</Text>
            
            {uploadState === 'idle' && (
              <TouchableOpacity
                onPress={handlePrescriptionSelect}
                style={styles.uploadDropZone}
                activeOpacity={0.7}
              >
                <UploadCloud size={28} color={C.blue} />
                <Text style={styles.dropZoneMainText}>Select or Drop Prescription PDF</Text>
                <Text style={styles.dropZoneSubText}>Max size 5MB (PDF, JPEG, PNG)</Text>
              </TouchableOpacity>
            )}

            {uploadState === 'uploading' && (
              <View style={[styles.uploadDropZone, { borderColor: C.blue }]}>
                <ActivityIndicator size="large" color={C.blue} />
                <Text style={[styles.dropZoneMainText, { color: C.blue, marginTop: 8 }]}>OCR parsing prescription...</Text>
              </View>
            )}

            {uploadState === 'success' && (
              <View style={[styles.uploadDropZone, { borderColor: C.green, backgroundColor: C.greenSoft }]}>
                <CheckCircle size={24} color={C.green} />
                <Text style={[styles.dropZoneMainText, { color: C.green }]}>{uploadedFileName}</Text>
                <Text style={styles.dropZoneSubText}>Direct parse: 2 medications mapped.</Text>
                
                <TouchableOpacity
                  onPress={() => { setUploadState('idle'); setUploadedFileName(''); }}
                  style={styles.clearUploadBtn}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.red }}>Reset</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.cartCard}>
            <View style={styles.cartHeader}>
              <ShoppingCart size={18} color={C.text} />
              <Text style={styles.cartHeaderTitle}>Cart Summary</Text>
              {cart.length > 0 && (
                <View style={styles.cartCountBadge}>
                  <Text style={styles.cartCountBadgeTxt}>{cart.reduce((a, b) => a + b.quantity, 0)}</Text>
                </View>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.cartEmptyState}>
                <ShoppingCart size={28} color={C.textLight} />
                <Text style={styles.cartEmptyStateTxt}>Your cart is empty.</Text>
                <Text style={styles.cartEmptyStateSub}>Select medicines from the catalog above to build your order.</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>₹{item.price} each</Text>
                      </View>
                      
                      <View style={styles.qtyControls}>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                          <Minus size={10} color={C.textMid} />
                        </TouchableOpacity>
                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                          <Plus size={10} color={C.textMid} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.cartDeleteBtn}>
                        <Trash2 size={13} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartSummaryFooter}>
                  <View style={styles.summaryItemRow}>
                    <Text style={styles.summaryItemLabel}>Subtotal</Text>
                    <Text style={styles.summaryItemVal}>₹{cartTotal.subtotal}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Text style={styles.summaryItemLabel}>Pharmacy GST (12%)</Text>
                    <Text style={styles.summaryItemVal}>₹{cartTotal.tax}</Text>
                  </View>
                  <View style={[styles.summaryItemRow, { borderTopWidth: 1, borderColor: C.border, paddingTop: 10, marginTop: 6 }]}>
                    <Text style={[styles.summaryItemLabel, { fontWeight: '900', color: C.text }]}>Total Amount</Text>
                    <Text style={[styles.summaryItemVal, { fontWeight: '900', color: C.blue, fontSize: 16 }]}>₹{cartTotal.total}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsCheckoutOpen(true)}
                    style={styles.checkoutBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.checkoutBtnTxt}>Proceed to Checkout</Text>
                    <ChevronRight size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>

        </View>
      </View>

      {/* Checkout Modal */}
      <Modal
        visible={isCheckoutOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCheckoutOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsCheckoutOpen(false)} />
          
          <MotiView
            from={{ opacity: 0, translateY: 60 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color={C.blue} />
                <Text style={styles.modalTitle}>Order Checkout</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCheckoutOpen(false)} style={styles.modalCloseBtn}>
                <X size={16} color={C.textMid} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.checkoutGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <MapPin size={14} color={C.textLight} />
                  <Text style={styles.checkoutGroupLabel}>SHIPPING ADDRESS</Text>
                </View>
                <TextInput
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                  multiline
                  numberOfLines={2}
                  style={styles.addressInput}
                />
              </View>

              <View style={styles.checkoutGroup}>
                <Text style={[styles.checkoutGroupLabel, { marginBottom: 8 }]}>PAYMENT METHOD</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('card')}
                    style={[styles.payMethodBtn, paymentMethod === 'card' && styles.payMethodBtnActive]}
                  >
                    <CreditCard size={14} color={paymentMethod === 'card' ? C.blue : C.textMid} />
                    <Text style={[styles.payMethodBtnTxt, paymentMethod === 'card' && styles.payMethodBtnTxtActive]}>Card</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cod')}
                    style={[styles.payMethodBtn, paymentMethod === 'cod' && styles.payMethodBtnActive]}
                  >
                    <ShoppingCart size={14} color={paymentMethod === 'cod' ? C.blue : C.textMid} />
                    <Text style={[styles.payMethodBtnTxt, paymentMethod === 'cod' && styles.payMethodBtnTxtActive]}>COD</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.checkoutBillCard}>
                <Text style={styles.billCardTitle}>Bill Details</Text>
                {cart.map(i => (
                  <View key={i.id} style={styles.billCardItemRow}>
                    <Text style={styles.billCardItemName}>{i.name} x{i.quantity}</Text>
                    <Text style={styles.billCardItemVal}>₹{i.price * i.quantity}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
                <View style={styles.billCardItemRow}>
                  <Text style={styles.billCardItemName}>GST & Handling</Text>
                  <Text style={styles.billCardItemVal}>₹{cartTotal.tax}</Text>
                </View>
                <View style={[styles.billCardItemRow, { marginTop: 6 }]}>
                  <Text style={[styles.billCardItemName, { fontWeight: '900', color: C.text }]}>Total Pay</Text>
                  <Text style={[styles.billCardItemVal, { fontWeight: '900', color: C.blue }]}>₹{cartTotal.total}</Text>
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsCheckoutOpen(false)} style={styles.cancelCheckoutBtn}>
                <Text style={styles.cancelCheckoutBtnTxt}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={placeOrder} style={styles.placeOrderBtn}>
                <Text style={styles.placeOrderBtnTxt}>Confirm & Pay</Text>
              </TouchableOpacity>
            </View>

          </MotiView>
        </View>
      </Modal>

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
          <Text style={styles.toastText}>{toastMessage}</Text>
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
  splitLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  leftColumn: {
    flex: 1.8,
  },
  rightColumn: {
    flex: 1.2,
    gap: 20,
  },
  categoriesBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  catTabActive: {
    backgroundColor: C.blueSoft,
    borderColor: C.blue,
  },
  catTabTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  catTabTxtActive: {
    color: C.blue,
    fontWeight: '900',
  },
  searchBar: {
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  drugCard: {
    width: Platform.OS === 'web' ? 'calc(50% - 6px)' : '100%',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  drugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drugCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: C.blue,
    textTransform: 'uppercase',
  },
  drugStock: {
    fontSize: 9,
    fontWeight: '750',
    color: C.green,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '850',
    color: C.text,
  },
  drugPack: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '600',
  },
  drugFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  drugPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: C.text,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addToCartBtnTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  prescriptionUploadCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  uploadCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  uploadCardSubtitle: {
    fontSize: 10,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 14,
  },
  uploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#FAFBFD',
  },
  dropZoneMainText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMid,
    marginTop: 8,
  },
  dropZoneSubText: {
    fontSize: 9,
    color: C.textLight,
    marginTop: 3,
    fontWeight: '550',
  },
  clearUploadBtn: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: C.redSoft,
    borderRadius: 6,
  },
  cartCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  cartHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  cartCountBadge: {
    backgroundColor: C.blue,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBadgeTxt: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cartEmptyState: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartEmptyStateTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textMid,
    marginTop: 10,
  },
  cartEmptyStateSub: {
    fontSize: 9,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  cartItemName: {
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
  },
  cartItemPrice: {
    fontSize: 10,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 1,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FD',
    borderRadius: 8,
    padding: 3,
    gap: 6,
    marginHorizontal: 8,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    fontSize: 11,
    fontWeight: '800',
    color: C.text,
  },
  cartDeleteBtn: {
    padding: 5,
  },
  cartSummaryFooter: {
    marginTop: 12,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: '700',
  },
  summaryItemVal: {
    fontSize: 11,
    color: C.textMid,
    fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    gap: 4,
  },
  checkoutBtnTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.text,
    marginBottom: 12,
  },
  ordersTable: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  orderId: {
    fontSize: 11,
    fontWeight: '850',
    color: C.text,
  },
  orderDate: {
    fontSize: 9,
    color: C.textLight,
    fontWeight: '600',
    marginTop: 1,
  },
  orderItems: {
    fontSize: 11,
    color: C.textMid,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
  },
  orderBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
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
  checkoutGroup: {
    marginBottom: 16,
  },
  checkoutGroupLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textLight,
    letterSpacing: 0.8,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: C.text,
    backgroundColor: '#FAFBFD',
    fontWeight: '600',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  payMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  payMethodBtnActive: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
  },
  payMethodBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
  },
  payMethodBtnTxtActive: {
    color: C.blue,
    fontWeight: '900',
  },
  checkoutBillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginTop: 8,
  },
  billCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billCardItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  billCardItemName: {
    fontSize: 11,
    color: C.textMid,
    fontWeight: '650',
  },
  billCardItemVal: {
    fontSize: 11,
    color: C.text,
    fontWeight: '800',
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
  refillListPanel: {
    gap: 12,
  },
  refillRequestCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  refillPatientName: {
    fontSize: 13,
    fontWeight: '900',
    color: C.text,
  },
  refillMedText: {
    fontSize: 11,
    color: C.textMid,
    fontWeight: '650',
    marginTop: 2,
  },
  refillMetaTxt: {
    fontSize: 9,
    color: C.textLight,
    fontWeight: '550',
    marginTop: 4,
  },
  refillActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 0.5,
    borderColor: C.border,
    paddingTop: 10,
  },
  refillActBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillActBtnTxt: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
