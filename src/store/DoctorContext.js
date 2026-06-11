import React, { createContext, useState, useContext, useEffect } from 'react';

const DoctorContext = createContext();

const INITIAL_APPOINTMENTS = [
  {
    id: '1',
    name: 'Amit Patel',
    time: '09:00 AM',
    date: 'Today',
    type: 'video',
    avatar: 'AP',
    status: 'Completed',
    risk: 'Low Risk',
    complaint: 'Chronic Hypertension checkup',
    service: 'Cardio Review',
    amount: 150
  },
  {
    id: '2',
    name: 'Kiran Shah',
    time: '10:15 AM',
    date: 'Today',
    type: 'physical',
    avatar: 'KS',
    status: 'Completed',
    risk: 'Low Risk',
    complaint: 'Routine Prenatal Consultation',
    service: 'OB-GYN Consult',
    amount: 200
  },
  {
    id: '3',
    name: 'Khushwant',
    time: '11:30 AM',
    date: 'Today',
    type: 'video',
    avatar: 'K',
    status: 'Active', // Active patient
    risk: 'High Risk',
    complaint: 'Acute chest pain & fever',
    service: 'ECG + Consult',
    amount: 350
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    time: '01:00 PM',
    date: 'Today',
    type: 'physical',
    avatar: 'SR',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'Thyroid review & blood panel',
    service: 'Endo Consult',
    amount: 180
  },
  {
    id: '5',
    name: 'Vikram Malhotra',
    time: '02:15 PM',
    date: 'Today',
    type: 'video',
    avatar: 'VM',
    status: 'Pending',
    risk: 'High Risk',
    complaint: 'Severe migraine since 3 days',
    service: 'Neurology Review',
    amount: 250
  },
  {
    id: '6',
    name: 'Priya Sharma',
    time: '03:30 PM',
    date: 'Today',
    type: 'physical',
    avatar: 'PS',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'Skin rash on upper arm',
    service: 'Dermatology Consult',
    amount: 120
  },
  {
    id: '7',
    name: 'Arjun Singh',
    time: '04:45 PM',
    date: 'Today',
    type: 'physical',
    avatar: 'AS',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'Diabetes follow-up',
    service: 'General Checkup',
    amount: 100
  },
  // Tomorrow & Upcoming
  {
    id: 'u1',
    name: 'Rajesh Sen',
    time: '09:30 AM',
    date: 'Tomorrow',
    type: 'video',
    avatar: 'RS',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'ECG Screening review',
    service: 'ECG Screening',
    amount: 150
  },
  {
    id: 'u2',
    name: 'Meera Nair',
    time: '11:00 AM',
    date: 'Tomorrow',
    type: 'physical',
    avatar: 'MN',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'General Physical & vitals',
    service: 'General Physical',
    amount: 100
  },
  {
    id: 'u3',
    name: 'Anil Gupta',
    time: '02:00 PM',
    date: 'Upcoming',
    type: 'physical',
    avatar: 'AG',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'Post-Op Follow-up stitches',
    service: 'Post-Op Follow-up',
    amount: 180
  },
  {
    id: 'u4',
    name: 'Sunita Rao',
    time: '04:15 PM',
    date: 'Upcoming',
    type: 'video',
    avatar: 'SR',
    status: 'Pending',
    risk: 'Low Risk',
    complaint: 'Ultrasound Scan review',
    service: 'Ultrasound Scan',
    amount: 220
  }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: 'New Video Booking', description: 'Sneha Reddy booked a Video Consultation for 01:00 PM today.', time: '10 mins ago', read: false },
  { id: 'n2', title: 'Appointment Rescheduled', description: 'Rajesh Sen rescheduled his Tomorrow 09:30 AM slot to 10:30 AM.', time: '30 mins ago', read: false },
  { id: 'n3', title: 'Message from Amit Patel', description: '"Doctor, should I continue the Amlodipine 5mg dosage?"', time: '1 hour ago', read: false }
];

const INITIAL_CHATS = {
  '3': [
    { id: 'c-3-1', text: 'Hello Doctor, I am experiencing chest discomfort since morning.', sender: 'patient', timestamp: '11:15 AM' },
    { id: 'c-3-2', text: 'Please take deep breaths Khushwant. I am ready to start our Video Consult. Are you online?', sender: 'doctor', timestamp: '11:20 AM' },
    { id: 'c-3-3', text: 'Yes Doctor, joining in a second.', sender: 'patient', timestamp: '11:22 AM' }
  ],
  '4': [
    { id: 'c-4-1', text: 'Hi Catherine, I updated my blood report details.', sender: 'patient', timestamp: '09:00 AM' },
    { id: 'c-4-2', text: 'Thanks Sneha, I will review it during our scheduled consult at 01:00 PM today.', sender: 'doctor', timestamp: '09:15 AM' }
  ]
};

const BOT_REPLIES = [
  "Thank you for the update, Doctor. I will note that down.",
  "Understood. Should I adjust my daily routine as well?",
  "Perfect, I'll see you during the video call then.",
  "Okay Doctor, I will take the medications as prescribed.",
  "Thank you, Doctor. Appreciate your quick response!"
];

export function DoctorProvider({ children }) {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [chats, setChats] = useState(INITIAL_CHATS);
  
  // Find initial active patient
  const initialActive = appointments.find(a => a.status === 'Active') || appointments[2];
  const [activePatient, setActivePatient] = useState(initialActive);

  const [videoCall, setVideoCall] = useState({
    isActive: false,
    patient: null,
    muted: false,
    videoOff: false,
    duration: 0
  });

  // Sync state to localStorage on write (Web only)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = JSON.stringify(videoCall);
        const stored = localStorage.getItem('livelong_videocall_state');
        if (stored !== serialized) {
          localStorage.setItem('livelong_videocall_state', serialized);
        }
      } catch (err) {
        console.error('Failed to sync video call to localStorage:', err);
      }
    }
  }, [videoCall]);

  // Sync state from localStorage on change in other tabs (Web only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    const handleStorageChange = (e) => {
      if (e.key === 'livelong_videocall_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const serializedCurrent = JSON.stringify(videoCall);
          if (serializedCurrent !== e.newValue) {
            setVideoCall(parsed);
          }
        } catch (err) {
          console.error('Failed to parse synchronized video call state:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [videoCall]);

  // Keep activePatient state in sync if appointments list updates its active state
  useEffect(() => {
    const currentActive = appointments.find(a => a.status === 'Active');
    if (currentActive) {
      setActivePatient(currentActive);
    }
  }, [appointments]);

  // Action: Reschedule Appointment
  const rescheduleAppointment = (id, newDate, newTime) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id === id) {
        return { 
          ...appt, 
          date: newDate, 
          time: newTime,
          status: 'Rescheduled'
        };
      }
      return appt;
    }));

    // Trigger Notification
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      const newNotif = {
        id: 'n_' + Date.now(),
        title: 'Appointment Rescheduled',
        description: `Automated alert: ${appt.name}'s slot changed to ${newDate} at ${newTime}. Notification dispatched to patient.`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Action: Cancel Appointment
  const cancelAppointment = (id) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id === id) {
        return { ...appt, status: 'Cancelled' };
      }
      return appt;
    }));

    // Trigger Notification
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      const newNotif = {
        id: 'n_' + Date.now(),
        title: 'Appointment Cancelled',
        description: `Slot for ${appt.name} at ${appt.time} was cancelled. Patient has been notified.`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Action: Bulk Reschedule Remaining Appointments for Today
  const bulkRescheduleRemaining = () => {
    let affectedCount = 0;
    
    setAppointments(prev => prev.map(appt => {
      if (appt.date === 'Today' && appt.status === 'Pending') {
        affectedCount++;
        return { 
          ...appt, 
          date: 'Tomorrow', 
          status: 'Rescheduled' 
        };
      }
      return appt;
    }));

    if (affectedCount > 0) {
      const newNotif = {
        id: 'n_' + Date.now(),
        title: 'Bulk Reschedule Triggered',
        description: `Emergency Mode: Rescheduled ${affectedCount} pending appointments to Tomorrow. Sent SMS/Push notifications to all patients.`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Action: Send Message
  const sendMessage = (patientId, text, sender = 'doctor') => {
    const newMessage = {
      id: 'm_' + Date.now(),
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => {
      const currentThread = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [...currentThread, newMessage]
      };
    });

    // If sender is doctor, simulate patient typing/replying after 1.5s
    if (sender === 'doctor') {
      setTimeout(() => {
        const randomReply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
        const replyMsg = {
          id: 'm_' + (Date.now() + 1),
          text: randomReply,
          sender: 'patient',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChats(prevChats => {
          const currentThread = prevChats[patientId] || [];
          return {
            ...prevChats,
            [patientId]: [...currentThread, replyMsg]
          };
        });

        // Add message notification
        const patientName = appointments.find(a => a.id === patientId)?.name || 'Patient';
        const newNotif = {
          id: 'n_' + Date.now(),
          title: `New Message from ${patientName}`,
          description: `"${randomReply.substring(0, 50)}${randomReply.length > 50 ? '...' : ''}"`,
          time: 'Just now',
          read: false
        };
        setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
      }, 1500);
    }
  };

  // Action: Mark Notification Read
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(notif => {
      if (notif.id === id) {
        return { ...notif, read: true };
      }
      return notif;
    }));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // Video Consult Controls
  const startVideoConsult = (patientId) => {
    const patientObj = appointments.find(a => a.id === patientId);
    if (patientObj) {
      // Update KV signaling store
      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + patientId + '/active', {
        method: 'POST'
      }).catch(err => console.error('Signaling error (start):', err));

      setVideoCall({
        isActive: true,
        patient: patientObj,
        muted: false,
        videoOff: false,
        duration: 0
      });
      // Set patient to active
      setAppointments(prev => prev.map(a => {
        if (a.id === patientId) {
          return { ...a, status: 'Active' };
        }
        if (a.status === 'Active') {
          return { ...a, status: 'Completed' };
        }
        return a;
      }));
    }
  };

  const endVideoConsult = () => {
    const activePat = videoCall.patient;
    setVideoCall(prev => ({ ...prev, isActive: false }));
    
    if (activePat) {
      // Update KV signaling store
      fetch('https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/mm0xw0az/call_state_' + activePat.id + '/inactive', {
        method: 'POST'
      }).catch(err => console.error('Signaling error (end):', err));

      // Mark as completed
      setAppointments(prev => prev.map(a => {
        if (a.id === activePat.id) {
          return { ...a, status: 'Completed' };
        }
        return a;
      }));

      // Add Notification
      const newNotif = {
        id: 'n_' + Date.now(),
        title: 'Consultation Completed',
        description: `Video consult with ${activePat.name} ended. Medical logs and prescription sandbox closed.`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const notifyPatient = (patientId, messageType, messageText) => {
    const patientName = appointments.find(a => a.id === patientId)?.name || 'Patient';
    const newNotif = {
      id: 'n_' + Date.now(),
      title: `Sent Alert: ${messageType}`,
      description: `Dispatched message to ${patientName}: "${messageText}"`,
      time: 'Just now',
      read: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <DoctorContext.Provider value={{
      appointments,
      notifications,
      chats,
      activePatient,
      videoCall,
      setVideoCall,
      rescheduleAppointment,
      cancelAppointment,
      bulkRescheduleRemaining,
      sendMessage,
      markNotificationRead,
      markAllNotificationsRead,
      startVideoConsult,
      endVideoConsult,
      setActivePatient,
      notifyPatient
    }}>
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctor() {
  return useContext(DoctorContext);
}
