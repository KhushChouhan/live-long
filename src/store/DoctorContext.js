import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApiBaseUrl, getWsBaseUrl } from '../config/apiConfig';
import { useAuth } from './AuthContext';
import { normalizePhone, getJitsiRoomName } from '../utils/roomUtils';

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
  { id: 'p13', name: 'Sonia', phone: '95713299819', identity: 'AADH-9981', gender: 'Female', age: 27, bloodGroup: 'B+' },
];

// ─── Initial Appointments (unified — single source of truth) ─────
const INITIAL_APPOINTMENTS = [
  { id: 'a3',  patientId: 'p1', name: 'Karan',         phone: '918890204260', identity: 'AADH-8890', gender: 'Male',   time: '10:00 AM', date: TODAY_STR,    type: 'Video',    status: 'Pending', complaint: 'Follow-up consultation', amount: 250 },
  { id: 'a13', patientId: 'p13',name: 'Sonia',         phone: '95713299819', identity: 'AADH-9981', gender: 'Female', time: '03:00 PM', date: TODAY_STR,    type: 'Physical', status: 'Pending', complaint: 'General Consultation' },
];

// ─── Initial Queue ──────────────────────────────────────────────
const INITIAL_UPCOMING_QUEUE = [];

const INITIAL_MISSED_QUEUE = [];

// ─── Initial Checkout ───────────────────────────────────────────
const INITIAL_CHECKOUT = [];

// ─── Initial Chats ──────────────────────────────────────────────
const INITIAL_CHATS = {
  'p1': [
    { id: 'c-k-1', text: 'Hello Doctor, this is Karan.', sender: 'patient', timestamp: '11:45 AM' },
    { id: 'c-k-2', text: 'Hi Karan, I am ready to start our Video Consult. Are you online?', sender: 'doctor', timestamp: '11:50 AM' },
    { id: 'c-k-3', text: 'Yes Doctor, ready.', sender: 'patient', timestamp: '11:52 AM' }
  ],
  'p13': [
    { id: 'c-s-1', text: 'Hello Doctor, this is Sonia.', sender: 'patient', timestamp: '12:00 PM' }
  ]
};

// ─── Initial Prescriptions ─────────────────────────────────────
const INITIAL_PRESCRIPTIONS = [
  {
    id: 'P102',
    date: '2026-06-08',
    patientId: 'p13',
    patientName: 'Sonia',
    doctorName: 'Dr. Catherine L.',
    specialty: 'Senior Cardiologist',
    diagnosis: 'Mild Chest Discomfort',
    medicationsSummary: 'Aspirin 75mg',
    status: 'active',
    refills: 0,
    details: [
      { name: 'Aspirin 75mg', dosage: '1 tablet once daily after breakfast', duration: '5 days' }
    ]
  },
  {
    id: 'P103',
    date: '2026-06-05',
    patientId: 'p1',
    patientName: 'Karan',
    doctorName: 'Dr. Catherine L.',
    specialty: 'Senior Cardiologist',
    diagnosis: 'Acute Cardiac Fatigue',
    medicationsSummary: 'Sorbitrate 5mg',
    status: 'past',
    refills: 0,
    details: [
      { name: 'Sorbitrate 5mg', dosage: '1 tablet sublingually as needed', duration: '5 days' }
    ]
  }
];

export function DoctorProvider({ children }) {
  const { user } = useAuth();
  // ─── Core State ────────────────────────────────────────────────
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [upcomingQueue, setUpcomingQueue] = useState(INITIAL_UPCOMING_QUEUE);
  const [missedQueue, setMissedQueue] = useState(INITIAL_MISSED_QUEUE);
  const [checkout, setCheckout] = useState(INITIAL_CHECKOUT);
  const [notifications, setNotifications] = useState([
    { id: 'n2', title: 'Appointment Scheduled', description: 'Karan scheduled a Video Consultation for 10:00 AM today.', time: '30 mins ago', read: false }
  ]);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [searchQ, setSearchQ] = useState('');
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  const [notifLog, setNotifLog] = useState([
    { id: 'n1', patient: 'Karan', msg: 'Please check your appointment status.', time: '08:45 AM', read: false }
  ]);


  const [activeChatPatientId, setActiveChatPatientId] = useState(null);
  const wsRef = useRef(null);
  const appointmentsRef = useRef(appointments);
  const patientsRef = useRef(patients);
  useEffect(() => {
    appointmentsRef.current = appointments;
  }, [appointments]);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  // Helper to resolve thread key (normalized phone) from appointment/patient ID
  const getThreadKey = (idOrPhone) => {
    if (!idOrPhone) return '';
    if (String(idOrPhone).startsWith('a')) {
      const appt = appointments.find(a => a.id === idOrPhone);
      if (appt) return normalizePhone(appt.phone);
    }
    if (String(idOrPhone).startsWith('p') || String(idOrPhone).includes('-')) {
      const pat = patients.find(p => p.id === idOrPhone);
      if (pat) return normalizePhone(pat.phone);
      const appt = appointments.find(a => a.patientId === idOrPhone || a.id === idOrPhone);
      if (appt) return normalizePhone(appt.phone);
    }
    return normalizePhone(idOrPhone);
  };

  // Mapped chats that can be accessed by phone, appointment ID, or user ID
  const accessibleChats = useMemo(() => {
    const result = { ...chats };
    patients.forEach(pat => {
      const phoneKey = normalizePhone(pat.phone);
      if (phoneKey) {
        result[pat.id] = chats[phoneKey] || [];
      }
    });
    appointments.forEach(appt => {
      const phoneKey = normalizePhone(appt.phone);
      if (phoneKey) {
        result[appt.id] = chats[phoneKey] || [];
        result[appt.patientId] = chats[phoneKey] || [];
      }
    });
    return result;
  }, [chats, patients, appointments]);

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

      ws.onopen = () => {
        console.log('[DoctorContext] WebSocket connected');
        if (user) {
          ws.send(JSON.stringify({
            type: 'join',
            role: user.role,
            userId: user.id || user.uid,
            phone: user.phone
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[DoctorContext] WebSocket incoming:', data);

          if (data.type === 'chat') {
            const phoneKey = normalizePhone(data.phone || data.patientId);
            if (!phoneKey) return;

            const message = data.message;
            setChats(prev => {
              const thread = prev[phoneKey] || [];
              if (thread.some(m => m.id === message.id)) return prev;
              const updated = { ...prev, [phoneKey]: [...thread, message] };
              AsyncStorage.setItem('livelong_chats', JSON.stringify(updated)).catch(() => {});
              return updated;
            });

            const appt = appointmentsRef.current.find(a => normalizePhone(a.phone) === phoneKey);
            const patientName = appt?.name || 'Patient';

            if (user?.role === 'doctor' && message.sender === 'patient') {
              setNotifLog(prev => [{ id: 'notif_msg_' + Date.now(), patientId: appt?.id || phoneKey, patient: patientName, msg: message.text, time: message.timestamp || 'Just now', read: false, isChat: true }, ...prev]);
              setNotifications(prev => [{ id: 'n_' + Date.now(), title: `New Message from ${patientName}`, description: `"${message.text.substring(0, 55)}"`, time: 'Just now', read: false }, ...prev]);
            }
          } else if (data.type === 'call_start') {
            if (user && user.role === 'patient' && normalizePhone(user.phone) === normalizePhone(data.targetPhone)) {
              setVideoCall({
                isActive: true,
                incoming: true,
                roomName: data.roomName,
                appointmentId: data.appointmentId,
                doctorName: data.doctorName,
                duration: 0
              });
            }
          } else if (data.type === 'call_accept') {
            if (user && user.role === 'doctor') {
              setVideoCall(prev => ({
                ...prev,
                isActive: true,
                incoming: false,
                duration: 0
              }));
            }
          } else if (data.type === 'call_decline') {
            if (user && user.role === 'doctor') {
              setVideoCall({ isActive: false, patient: null, duration: 0 });
              setAppointments(prev => prev.map(a => a.id === data.appointmentId ? { ...a, status: 'Scheduled' } : a));
            }
          } else if (data.type === 'call_end') {
            setVideoCall({ isActive: false, patient: null, duration: 0 });
          } else if (data.type === 'appointment_book') {
            setAppointments(prev => {
              if (prev.some(a => a.id === data.appointment.id)) return prev;
              return [...prev, data.appointment];
            });
            if (user?.role === 'doctor') {
              setNotifications(prev => [{
                id: 'n_' + Date.now(),
                title: 'New Appointment Requested',
                description: `${data.appointment.name} requested a slot on ${data.appointment.date} at ${data.appointment.time}`,
                time: 'Just now',
                read: false
              }, ...prev]);
            }
          } else if (data.type === 'appointment_status') {
            setAppointments(prev => prev.map(a => a.id === data.appointmentId ? { ...a, status: data.status } : a));
          }
        } catch (err) { console.error('[DoctorContext] WS message error:', err); }
      };

      ws.onclose = () => { reconnectTimer = setTimeout(connect, 5000); };
      ws.onerror = () => { ws.close(); };
    };

    connect();
    return () => { if (ws) ws.close(); if (reconnectTimer) clearTimeout(reconnectTimer); };
  }, [user]);


  // Handle re-sending join message if user logging in/out triggers change on active socket
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        role: user.role,
        userId: user.id || user.uid,
        phone: user.phone
      }));
    }
  }, [user]);

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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'appointment_book',
        appointment: newAppt
      }));
    }
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
    const phoneKey = getThreadKey(patientId);
    if (!phoneKey) return;

    const newMessage = { id: 'm_' + Date.now(), text, sender, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChats(prev => {
      const thread = prev[phoneKey] || [];
      const updated = { ...prev, [phoneKey]: [...thread, newMessage] };
      AsyncStorage.setItem('livelong_chats', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const appt = appointments.find(a => normalizePhone(a.phone) === phoneKey);
      const patientName = appt?.name || 'Patient';
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        phone: phoneKey,
        patientId,
        message: { ...newMessage, patientName }
      }));
    }
  };



  const startVideoConsult = (patientId) => {
    const patientObj = appointments.find(a => a.id === patientId);
    if (patientObj) {
      const roomName = getJitsiRoomName(patientId);
      console.log(`[DoctorContext] Starting WebSocket call for ${patientObj.name} (ID: ${patientId}, room: ${roomName})`);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call_start',
          targetPhone: patientObj.phone,
          appointmentId: patientId,
          roomName: roomName,
          doctorName: user?.name || 'Dr. Catherine Lawrence'
        }));
      }

      setVideoCall({ isActive: true, incoming: false, calling: true, patient: patientObj, roomName, appointmentId: patientId, duration: 0 });
      setAppointments(prev => prev.map(a => {
        if (a.id === patientId) return { ...a, status: 'Active' };
        if (a.status === 'Active') return { ...a, status: 'Completed' };
        return a;
      }));
    }
  };

  const endVideoConsult = () => {
    const activePat = videoCall.patient;
    const apptId = videoCall.appointmentId || (activePat ? activePat.id : null);
    
    console.log(`[DoctorContext] Ending WebSocket call. ApptId: ${apptId}`);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_end',
        appointmentId: apptId
      }));
    }

    setVideoCall({ isActive: false, patient: null, duration: 0 });

    if (activePat) {
      setAppointments(prev => prev.map(a => a.id === activePat.id ? { ...a, status: 'Completed' } : a));
      setNotifications(prev => [{ id: 'n_' + Date.now(), title: 'Consultation Completed', description: `Video consult with ${activePat.name} ended.`, time: 'Just now', read: false }, ...prev]);
    }
  };

  const acceptVideoConsult = () => {
    console.log(`[DoctorContext] Accept video call for appointment: ${videoCall.appointmentId}`);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_accept',
        appointmentId: videoCall.appointmentId
      }));
    }
    setVideoCall(prev => ({ ...prev, incoming: false }));
  };

  const declineVideoConsult = () => {
    console.log(`[DoctorContext] Decline video call for appointment: ${videoCall.appointmentId}`);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_decline',
        appointmentId: videoCall.appointmentId
      }));
    }
    setVideoCall({ isActive: false, patient: null, duration: 0 });
  };

  const rejectAppointment = (apptId) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'Rejected' } : a));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'appointment_status', appointmentId: apptId, status: 'Rejected' }));
    }
  };

  const acceptAppointment = (apptId) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'Scheduled' } : a));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'appointment_status', appointmentId: apptId, status: 'Scheduled' }));
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

  const addPrescription = (rx) => {
    const newRx = {
      id: 'P' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      ...rx
    };
    setPrescriptions(prev => [newRx, ...prev]);
    return newRx;
  };

  // ─── Context Value ────────────────────────────────────────────
  return (
    <DoctorContext.Provider value={{
      // Data
      patients, appointments, upcomingQueue, missedQueue, checkout,
      notifications, chats: accessibleChats, activePatient, videoCall, notifLog, searchQ, stats,
      activeChatPatientId, prescriptions,
      // Setters
      setVideoCall, setActivePatient, setSearchQ, setNotifLog,
      setActiveChatPatientId, setPrescriptions,
      // Modal controls
      apptModalOpen, setApptModalOpen,
      patientModalOpen, setPatientModalOpen,
      // Patient actions
      addPatient,
      // Appointment actions
      addAppointment, setAppointmentActive, completeAppointment,
      rescheduleAppointment, cancelAppointment, bulkRescheduleRemaining,
      acceptAppointment, rejectAppointment,
      // Queue actions
      confirmQueuePatient, cancelQueuePatient, rejoinQueue, addToQueue,
      // Checkout actions
      toggleCheckoutStatus, addToCheckout,
      // Chat actions
      sendMessage,
      // Video actions
      startVideoConsult, endVideoConsult, acceptVideoConsult, declineVideoConsult,
      // Notification actions
      notifyPatient, markNotificationRead, markAllNotificationsRead, markAllNotifLogRead,
      // Prescription actions
      addPrescription,
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

