import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApiBaseUrl, getWsBaseUrl } from '../config/apiConfig';

const DoctorContext = createContext();

// ─── Date helpers ───────────────────────────────────────────────
const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const TODAY_STR = fmt(new Date());
const TOMORROW_STR = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return fmt(d); })();
const FUTURE1 = (() => { const d = new Date(); d.setDate(d.getDate() + 3); return fmt(d); })();
const FUTURE2 = (() => { const d = new Date(); d.setDate(d.getDate() + 5); return fmt(d); })();
const FUTURE3 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return fmt(d); })();

// ─── Initial Patients Registry ──────────────────────────────────
const INITIAL_PATIENTS = [
  { id: 'p1', name: 'Karan', phone: '918890204260', identity: 'AADH-8890', gender: 'Male', age: 28, bloodGroup: 'B+' },
  { id: 'p2', name: 'Chinu', phone: '919680796461', identity: 'AADH-9680', gender: 'Female', age: 25, bloodGroup: 'O+' },
  { id: 'p3', name: 'Karan Singh', phone: '918890204260', identity: 'AADH-1001', gender: 'Male', age: 45, bloodGroup: 'A+' },
  { id: 'p4', name: 'Priya Sharma', phone: '919876001002', identity: 'AADH-1002', gender: 'Female', age: 32, bloodGroup: 'B-' },
  { id: 'p5', name: 'John Tan', phone: '919876001003', identity: 'AADH-1003', gender: 'Male', age: 38, bloodGroup: 'O+' },
  { id: 'p6', name: 'Lisa Wong', phone: '919876001004', identity: 'AADH-1004', gender: 'Female', age: 29, bloodGroup: 'AB+' },
  { id: 'p7', name: 'David Lim', phone: '919876001005', identity: 'AADH-1005', gender: 'Male', age: 55, bloodGroup: 'A-' },
  { id: 'p8', name: 'Sara Ali', phone: '919876001006', identity: 'AADH-1006', gender: 'Female', age: 41, bloodGroup: 'B+' },
  { id: 'p9', name: 'Omar Hassan', phone: '919876001007', identity: 'AADH-1007', gender: 'Male', age: 50, bloodGroup: 'O-' },
  { id: 'p10', name: 'Emily Chen', phone: '919876001008', identity: 'AADH-1008', gender: 'Female', age: 27, bloodGroup: 'A+' },
  { id: 'p11', name: 'Mark Raj', phone: '919876001009', identity: 'AADH-1009', gender: 'Male', age: 62, bloodGroup: 'AB-' },
  { id: 'p12', name: 'Nadia Yusof', phone: '919876001010', identity: 'AADH-1010', gender: 'Female', age: 35, bloodGroup: 'O+' },
  { id: 'p13', name: 'Sonia', phone: '95713299819', identity: 'AADH-9981', gender: 'Female', age: 27, bloodGroup: 'B+' },
];

// ─── Initial Appointments (unified — single source of truth) ─────
const INITIAL_APPOINTMENTS = [
  { id: 'a1',  patientId: 'p3', name: 'Karan Singh',  phone: '918890204260', identity: 'AADH-1001', gender: 'Male',   time: '09:00 AM', date: TODAY_STR,    type: 'Physical', status: 'Scheduled', complaint: 'Chest pain, follow-up' },
  { id: 'a2',  patientId: 'p4', name: 'Priya Sharma',  phone: '919876001002', identity: 'AADH-1002', gender: 'Female', time: '09:30 AM', date: TODAY_STR,    type: 'Video',    status: 'Scheduled', complaint: 'Blood pressure review' },
  { id: 'a3',  patientId: 'p1', name: 'Karan',         phone: '918890204260', identity: 'AADH-8890', gender: 'Male',   time: '10:00 AM', date: TODAY_STR,    type: 'Video',    status: 'Scheduled', complaint: 'Follow-up consultation', amount: 250 },
  { id: 'a4',  patientId: 'p2', name: 'Chinu',         phone: '919680796461', identity: 'AADH-9680', gender: 'Female', time: '10:30 AM', date: TODAY_STR,    type: 'Video',    status: 'Scheduled', complaint: 'Routine checkup', amount: 350 },
  { id: 'a5',  patientId: 'p5', name: 'John Tan',      phone: '919876001003', identity: 'AADH-1003', gender: 'Male',   time: '11:00 AM', date: TODAY_STR,    type: 'Physical', status: 'Scheduled', complaint: 'Annual cardiac screening' },
  { id: 'a6',  patientId: 'p6', name: 'Lisa Wong',     phone: '919876001004', identity: 'AADH-1004', gender: 'Female', time: '11:30 AM', date: TODAY_STR,    type: 'Physical', status: 'Scheduled', complaint: 'ECG evaluation' },
  { id: 'a7',  patientId: 'p7', name: 'David Lim',     phone: '919876001005', identity: 'AADH-1005', gender: 'Male',   time: '09:00 AM', date: TOMORROW_STR, type: 'Video',    status: 'Scheduled', complaint: 'Post-surgery review' },
  { id: 'a8',  patientId: 'p8', name: 'Sara Ali',      phone: '919876001006', identity: 'AADH-1006', gender: 'Female', time: '10:00 AM', date: TOMORROW_STR, type: 'Physical', status: 'Scheduled', complaint: 'Medication adjustment' },
  { id: 'a9',  patientId: 'p9', name: 'Omar Hassan',   phone: '919876001007', identity: 'AADH-1007', gender: 'Male',   time: '11:00 AM', date: TOMORROW_STR, type: 'Physical', status: 'Scheduled', complaint: 'Heart valve assessment' },
  { id: 'a10', patientId: 'p10',name: 'Emily Chen',    phone: '919876001008', identity: 'AADH-1008', gender: 'Female', time: '09:30 AM', date: FUTURE1,      type: 'Video',    status: 'Scheduled', complaint: 'Cholesterol follow-up' },
  { id: 'a11', patientId: 'p11',name: 'Mark Raj',      phone: '919876001009', identity: 'AADH-1009', gender: 'Male',   time: '10:30 AM', date: FUTURE2,      type: 'Physical', status: 'Scheduled', complaint: 'Pacemaker evaluation' },
  { id: 'a12', patientId: 'p12',name: 'Nadia Yusof',   phone: '919876001010', identity: 'AADH-1010', gender: 'Female', time: '02:00 PM', date: FUTURE3,      type: 'Video',    status: 'Scheduled', complaint: 'Post-angioplasty follow-up' },
  { id: 'a13', patientId: 'p13',name: 'Sonia',         phone: '95713299819', identity: 'AADH-9981', gender: 'Female', time: '03:00 PM', date: TODAY_STR,    type: 'Physical', status: 'Scheduled', complaint: 'General Consultation' },
];

// ─── Initial Queue ──────────────────────────────────────────────
const INITIAL_UPCOMING_QUEUE = [
  { id: '48', name: 'Nick Young',       identity: 'IC-821948', gender: 'Male',   status: 'Confirmed' },
  { id: '49', name: 'Muhammad Imran',   identity: 'IC-293847', gender: 'Male',   status: 'Unconfirmed' },
  { id: '50', name: 'Yi Ting Tan',      identity: 'IC-192836', gender: 'Female', status: 'Unconfirmed' },
  { id: '51', name: 'Lady Arabella',    identity: 'IC-384756', gender: 'Female', status: 'Unconfirmed' },
  { id: '52', name: 'Narberal Gamma',   identity: 'IC-475869', gender: 'Female', status: 'Unconfirmed' },
];

const INITIAL_MISSED_QUEUE = [
  { id: 'm1', name: 'Charlie Wu',  identity: 'IC-374859', gender: 'Male' },
  { id: 'm2', name: 'Rachel Wong', identity: 'IC-192837', gender: 'Female' },
];

// ─── Initial Checkout ───────────────────────────────────────────
const INITIAL_CHECKOUT = [
  { id: 'ck1', name: 'Huisan Li',  identity: 'IC-283746', gender: 'Female', meds: [{ n: 'Panadol 500mg', q: '2x daily' }, { n: 'Omeprazole 20mg', q: '1x daily' }], amount: '₹750.00',  numericAmount: 750,  status: 'Paid' },
  { id: 'ck2', name: 'Joe White',  identity: 'IC-938271', gender: 'Male',   meds: [{ n: 'Amoxicillin 250mg', q: '3x daily' }, { n: 'Ibuprofen 400mg', q: 'As needed' }], amount: '₹580.00', numericAmount: 580, status: 'Unpaid' },
];

// ─── Initial Chats ──────────────────────────────────────────────
const INITIAL_CHATS = {
  'a3': [
    { id: 'c-k-1', text: 'Hello Doctor, this is Karan.', sender: 'patient', timestamp: '11:45 AM' },
    { id: 'c-k-2', text: 'Hi Karan, I am ready to start our Video Consult. Are you online?', sender: 'doctor', timestamp: '11:50 AM' },
    { id: 'c-k-3', text: 'Yes Doctor, ready.', sender: 'patient', timestamp: '11:52 AM' }
  ],
  'a4': [
    { id: 'c-3-1', text: 'Hello Doctor, I am experiencing chest discomfort since morning.', sender: 'patient', timestamp: '01:15 PM' },
    { id: 'c-3-2', text: 'Please take deep breaths Chinu. I am ready to start our Video Consult. Are you online?', sender: 'doctor', timestamp: '01:20 PM' },
    { id: 'c-3-3', text: 'Yes Doctor, joining in a second.', sender: 'patient', timestamp: '01:22 PM' }
  ]
};

export function DoctorProvider({ children }) {
  // ─── Core State ────────────────────────────────────────────────
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [upcomingQueue, setUpcomingQueue] = useState(INITIAL_UPCOMING_QUEUE);
  const [missedQueue, setMissedQueue] = useState(INITIAL_MISSED_QUEUE);
  const [checkout, setCheckout] = useState(INITIAL_CHECKOUT);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New Video Booking', description: 'Chinu booked a Video Consultation for 10:30 AM today.', time: '10 mins ago', read: false },
    { id: 'n2', title: 'Appointment Scheduled', description: 'Karan scheduled a Video Consultation for 10:00 AM today.', time: '30 mins ago', read: false }
  ]);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [searchQ, setSearchQ] = useState('');
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  const [notifLog, setNotifLog] = useState([
    { id: 'n1', patient: 'Karan Singh', msg: 'Please come 15 mins early for your 09:00 AM slot.', time: '08:45 AM', read: false },
    { id: 'n2', patient: 'Priya Sharma', msg: 'Your video call link has been sent to your email.', time: '10:00 AM', read: true },
  ]);

  const [activeChatPatientId, setActiveChatPatientId] = useState(null);
  const wsRef = useRef(null);

  // ─── Computed Stats (live from data) ──────────────────────────
  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => a.date === TODAY_STR);
    const completedToday = todayAppts.filter(a => a.status === 'Completed').length;
    const cancelledToday = todayAppts.filter(a => a.status === 'Cancelled').length;
    const activeToday = todayAppts.filter(a => !['Cancelled', 'Completed'].includes(a.status)).length;
    const paidCheckout = checkout.filter(c => c.status === 'Paid');
    const totalRevenue = paidCheckout.reduce((sum, c) => sum + (c.numericAmount || 0), 0);
    return {
      totalPatients: patients.length,
      todayAppointments: todayAppts.length,
      activeToday,
      completedToday,
      cancelledToday,
      pendingQueue: upcomingQueue.length,
      missedQueueCount: missedQueue.length,
      totalRevenue,
      checkoutCount: checkout.length,
    };
  }, [appointments, patients, upcomingQueue, missedQueue, checkout]);

  // ─── Load chats from AsyncStorage ─────────────────────────────
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('livelong_chats');
        if (storedChats) setChats(JSON.parse(storedChats));
      } catch (e) { console.error('Failed to load chats', e); }
    };
    loadChats();
  }, []);

  useEffect(() => {
    const saveChats = async () => {
      try { await AsyncStorage.setItem('livelong_chats', JSON.stringify(chats)); }
      catch (e) { console.error('Failed to save chats', e); }
    };
    if (chats !== INITIAL_CHATS) saveChats();
  }, [chats]);

  // ─── WebSocket ────────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      const wsUrl = getWsBaseUrl();
      console.log('[DoctorContext] Connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log('[DoctorContext] WebSocket connected');

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[DoctorContext] WebSocket incoming:', data);

          if (data.type === 'chat' && data.patientId && data.message) {
            const { patientId, message } = data;
            setChats(prev => {
              const thread = prev[patientId] || [];
              if (thread.some(m => m.id === message.id)) return prev;
              const updated = { ...prev, [patientId]: [...thread, message] };
              AsyncStorage.setItem('livelong_chats', JSON.stringify(updated)).catch(() => {});
              return updated;
            });

            if (message.sender === 'patient') {
              const patientName = message.patientName || 'Patient';
              setNotifLog(prev => [{ id: 'notif_msg_' + Date.now(), patientId, patient: patientName, msg: message.text, time: message.timestamp || 'Just now', read: false, isChat: true }, ...prev]);
              setNotifications(prev => [{ id: 'n_' + Date.now(), title: `New Message from ${patientName}`, description: `"${message.text.substring(0, 55)}"`, time: 'Just now', read: false }, ...prev]);
            }
          }
        } catch (err) { console.error('[DoctorContext] WS message error:', err); }
      };

      ws.onclose = () => { reconnectTimer = setTimeout(connect, 5000); };
      ws.onerror = () => { ws.close(); };
    };

    connect();
    return () => { if (ws) ws.close(); if (reconnectTimer) clearTimeout(reconnectTimer); };
  }, []);

  // ─── Notification helpers ─────────────────────────────────────
  const markAllNotifLogRead = () => setNotifLog(prev => prev.map(n => ({ ...n, read: true })));
  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // ─── Patient Actions ──────────────────────────────────────────
  const addPatient = (patient) => {
    const newPatient = { id: 'p' + Date.now(), ...patient };
    setPatients(prev => [...prev, newPatient]);
    setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'New Patient Registered', description: `${patient.name} has been added to the patient registry.`, time: 'Just now', read: false }, ...prev]);
    return newPatient;
  };

  // ─── Appointment Actions ──────────────────────────────────────
  const addAppointment = (appt) => {
    const newAppt = { id: 'a' + Date.now(), status: 'Scheduled', ...appt };
    setAppointments(prev => [...prev, newAppt]);
    setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'New Appointment Booked', description: `${appt.name} — ${appt.type} on ${appt.date} at ${appt.time}`, time: 'Just now', read: false }, ...prev]);
    return newAppt;
  };

  const setAppointmentActive = (id) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) return { ...a, status: 'Active' };
      if (a.status === 'Active') return { ...a, status: 'Scheduled' };
      return a;
    }));
  };

  const completeAppointment = (id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Completed' } : a));
  };

  const rescheduleAppointment = (id, newDate, newTime) => {
    const appt = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, date: newDate, time: newTime, status: 'Rescheduled' } : a));
    if (appt) {
      setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'Appointment Rescheduled', description: `${appt.name}'s slot changed to ${newDate} at ${newTime}.`, time: 'Just now', read: false }, ...prev]);
    }
  };

  const cancelAppointment = (id) => {
    const appt = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    if (appt) {
      setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'Appointment Cancelled', description: `Slot for ${appt.name} at ${appt.time} was cancelled.`, time: 'Just now', read: false }, ...prev]);
    }
  };

  // ─── Queue Actions ────────────────────────────────────────────
  const confirmQueuePatient = (id) => {
    setUpcomingQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'Confirmed' } : q));
  };

  const cancelQueuePatient = (id) => {
    setUpcomingQueue(prev => prev.filter(q => q.id !== id));
  };

  const rejoinQueue = (patient) => {
    setMissedQueue(prev => prev.filter(m => m.id !== patient.id));
    const nextNo = String(upcomingQueue.reduce((m, x) => Math.max(m, parseInt(x.id) || 0), 52) + 1);
    setUpcomingQueue(prev => [...prev, { id: nextNo, name: patient.name, identity: patient.identity, gender: patient.gender, status: 'Unconfirmed' }]);
  };

  const addToQueue = (patient) => {
    const nextNo = String(upcomingQueue.reduce((m, x) => Math.max(m, parseInt(x.id) || 0), 52) + 1);
    setUpcomingQueue(prev => [...prev, { id: nextNo, name: patient.name, identity: patient.identity || '', gender: patient.gender || 'Male', status: 'Confirmed' }]);
    return nextNo;
  };

  // ─── Checkout/Billing Actions ─────────────────────────────────
  const toggleCheckoutStatus = (id) => {
    setCheckout(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Paid' ? 'Unpaid' : 'Paid' } : c));
  };

  const addToCheckout = (patient, meds, amount, paymentType = 'Pending', amountPaid = 0) => {
    const numericAmt = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    const paidAmt = parseFloat(String(amountPaid).replace(/[^0-9.]/g, '')) || 0;
    const dueAmt = Math.max(0, numericAmt - paidAmt);
    
    // Determine status based on payment type and amounts
    let finalStatus = 'Unpaid';
    if (paymentType === 'Full' || paidAmt >= numericAmt) {
      finalStatus = 'Paid';
    } else if (paymentType === 'Partial' && paidAmt > 0) {
      finalStatus = 'Partial';
    }

    setCheckout(prev => [...prev, {
      id: 'ck' + Date.now(),
      name: patient.name,
      identity: patient.identity || '',
      gender: patient.gender || '',
      meds: meds || [{ n: 'General Consultation', q: '1x' }],
      amount: `₹${numericAmt.toFixed(2)}`,
      numericAmount: numericAmt,
      amountPaid: paidAmt,
      amountDue: dueAmt,
      paymentType: finalStatus === 'Paid' ? 'Full' : (finalStatus === 'Partial' ? 'Partial' : 'Pending'),
      status: finalStatus
    }]);
  };

  // ─── Video Call State ─────────────────────────────────────────
  const initialActive = appointments.find(a => a.status === 'Active') || appointments[0];
  const [activePatient, setActivePatient] = useState(initialActive);
  const [videoCall, setVideoCall] = useState({ isActive: false, patient: null, muted: false, videoOff: false, duration: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = JSON.stringify(videoCall);
        const stored = localStorage.getItem('livelong_videocall_state');
        if (stored !== serialized) localStorage.setItem('livelong_videocall_state', serialized);
      } catch (err) { /* ignore */ }
    }
  }, [videoCall]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const handleStorageChange = (e) => {
      if (e.key === 'livelong_videocall_state' && e.newValue) {
        try { setVideoCall(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [videoCall]);

  useEffect(() => {
    const currentActive = appointments.find(a => a.status === 'Active');
    if (currentActive) setActivePatient(currentActive);
  }, [appointments]);

  // ─── Chat Actions ─────────────────────────────────────────────
  const sendMessage = (patientId, text, sender = 'doctor') => {
    const newMessage = { id: 'm_' + Date.now(), text, sender, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChats(prev => {
      const thread = prev[patientId] || [];
      const updated = { ...prev, [patientId]: [...thread, newMessage] };
      AsyncStorage.setItem('livelong_chats', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const patientName = appointments.find(a => a.id === patientId)?.name || 'Patient';
      wsRef.current.send(JSON.stringify({ type: 'chat', patientId, message: { ...newMessage, patientName } }));
    }
  };

  // ─── Video Consult ────────────────────────────────────────────
  const getCleanSignalName = (name) => {
    const n = String(name || '').toLowerCase();
    if (n.includes('khushwant')) return 'khushwant';
    if (n.includes('karan')) return 'karan';
    if (n.includes('chinu')) return 'chinu';
    if (n.includes('amit')) return 'amit';
    if (n.includes('kiran')) return 'kiran';
    if (n.includes('sneha')) return 'sneha';
    if (n.includes('vikram')) return 'vikram';
    return n.replace(/[^a-z0-9]/g, '');
  };

  const startVideoConsult = (patientId) => {
    const patientObj = appointments.find(a => a.id === patientId);
    if (patientObj) {
      const cleanName = getCleanSignalName(patientObj.name);
      console.log(`[DoctorContext] Starting call for ${patientObj.name} (ID: ${patientId}, cleanName: ${cleanName})`);

      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + patientId + '/active', { method: 'POST' })
        .then(r => r.text()).then(t => console.log(`[DoctorContext] KV Update ID Response:`, t.trim()))
        .catch(err => console.error('[DoctorContext] KV Update ID Error:', err));

      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + cleanName + '/active', { method: 'POST' })
        .then(r => r.text()).then(t => console.log(`[DoctorContext] KV Update Name Response:`, t.trim()))
        .catch(err => console.error('[DoctorContext] KV Update Name Error:', err));

      setVideoCall({ isActive: true, patient: patientObj, muted: false, videoOff: false, duration: 0 });
      setAppointments(prev => prev.map(a => {
        if (a.id === patientId) return { ...a, status: 'Active' };
        if (a.status === 'Active') return { ...a, status: 'Completed' };
        return a;
      }));
    }
  };

  const endVideoConsult = () => {
    const activePat = videoCall.patient;
    setVideoCall(prev => ({ ...prev, isActive: false }));

    if (activePat) {
      const cleanName = getCleanSignalName(activePat.name);
      console.log(`[DoctorContext] Ending call for ${activePat.name} (ID: ${activePat.id}, cleanName: ${cleanName})`);

      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + activePat.id + '/inactive', { method: 'POST' })
        .then(r => r.text()).then(t => console.log(`[DoctorContext] KV Update ID Response:`, t.trim()))
        .catch(err => console.error('[DoctorContext] KV Update ID Error:', err));

      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + cleanName + '/inactive', { method: 'POST' })
        .then(r => r.text()).then(t => console.log(`[DoctorContext] KV Update Name Response:`, t.trim()))
        .catch(err => console.error('[DoctorContext] KV Update Name Error:', err));

      setAppointments(prev => prev.map(a => a.id === activePat.id ? { ...a, status: 'Completed' } : a));
      setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'Consultation Completed', description: `Video consult with ${activePat.name} ended.`, time: 'Just now', read: false }, ...prev]);
    }
  };

  const notifyPatient = async (patientId, messageType, messageText) => {
    const appt = appointments.find(a => a.id === patientId);
    const patientName = appt?.name || 'Patient';
    const patientPhone = appt?.phone || '';

    // Add in-app notification immediately
    setNotifications(prev => [{ id: 'n_' + Date.now(), title: `Sent Alert: ${messageType}`, description: `Dispatched message to ${patientName}: "${messageText}"`, time: 'Just now', read: true }, ...prev]);

    // Also send actual WhatsApp message via backend API
    try {
      const apiUrl = getApiBaseUrl();
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = appt?.time || today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      const response = await fetch(`${apiUrl}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_number: patientPhone,
          template: {
            body_1: patientName,
            body_2: `${dateStr} at ${timeStr}`,
            body_3: messageText || 'Please arrive 15 minutes early for your appointment.',
            body_4: 'Dr. Catherine L.'
          }
        })
      });

      const data = await response.json();
      if (!response.ok || data.status === 'fail') {
        console.error('[DoctorContext] WhatsApp send failed:', data);
      } else {
        console.log('[DoctorContext] WhatsApp message sent successfully to', patientName, '(', patientPhone, '):', data);
      }
    } catch (err) {
      console.error('[DoctorContext] WhatsApp API error:', err.message);
    }
  };

  const bulkRescheduleRemaining = () => {
    let count = 0;
    setAppointments(prev => prev.map(a => {
      if (a.date === TODAY_STR && a.status === 'Pending') { count++; return { ...a, date: TOMORROW_STR, status: 'Rescheduled' }; }
      return a;
    }));
    if (count > 0) {
      setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'Bulk Reschedule', description: `Rescheduled ${count} pending appointments to tomorrow.`, time: 'Just now', read: false }, ...prev]);
    }
  };

  // ─── Context Value ────────────────────────────────────────────
  return (
    <DoctorContext.Provider value={{
      // Data
      patients, appointments, upcomingQueue, missedQueue, checkout,
      notifications, chats, activePatient, videoCall, notifLog, searchQ, stats,
      activeChatPatientId,
      // Setters
      setVideoCall, setActivePatient, setSearchQ, setNotifLog,
      setActiveChatPatientId,
      // Modal controls
      apptModalOpen, setApptModalOpen,
      patientModalOpen, setPatientModalOpen,
      // Patient actions
      addPatient,
      // Appointment actions
      addAppointment, setAppointmentActive, completeAppointment,
      rescheduleAppointment, cancelAppointment, bulkRescheduleRemaining,
      // Queue actions
      confirmQueuePatient, cancelQueuePatient, rejoinQueue, addToQueue,
      // Checkout actions
      toggleCheckoutStatus, addToCheckout,
      // Chat actions
      sendMessage,
      // Video actions
      startVideoConsult, endVideoConsult,
      // Notification actions
      notifyPatient, markNotificationRead, markAllNotificationsRead, markAllNotifLogRead,
      // Helpers
      TODAY_STR, TOMORROW_STR,
    }}>
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctor() {
  return useContext(DoctorContext);
}
