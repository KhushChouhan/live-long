import { 
  LayoutGrid, User, Calendar, FileText, Pill, Receipt, ClipboardList, Settings
} from 'lucide-react-native';

const BASE_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/dashboard', subItems: [
    { label: 'Doctor Dashboard', path: '/dashboard' }
  ]},
  { id: 'patients', label: 'Patients', icon: User, path: '/patients', subItems: [
    { label: 'Add Patient', path: '/patients/add-patient' },
    { label: 'Patients', path: '/patients/patient-list' }
  ]},
  { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/appointments', subItems: [
    { label: 'Add Appointment', path: '/appointments/add-appointment' },
    { label: 'Appointments Calendar', path: '/appointments/calendar' },
    { label: 'Appointments', path: '/appointments/appointment-list' }
  ]},
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, path: '/prescriptions', subItems: [
    { label: 'Add Prescriptions', path: '/prescriptions/add-prescription' },
    { label: 'All Prescriptions', path: '/prescriptions/prescription-list' }
  ]},
  { id: 'medication', label: 'Medication', icon: Pill, path: '/medication', subItems: [
    { label: 'Add Medication', path: '/medication/add-medication' },
    { label: 'Medication', path: '/medication/medication-list' }
  ]},
  { id: 'invoices', label: 'Invoices', icon: Receipt, path: '/invoices', subItems: [
    { label: 'Add Invoices', path: '/invoices/add-invoice' },
    { label: 'Invoices', path: '/invoices/invoice-list' }
  ]},
  { id: 'lab-reports', label: 'Lab Reports', icon: ClipboardList, path: '/lab-reports', subItems: [
    { label: 'Add Lab Report', path: '/lab-reports/add-lab-report' },
    { label: 'Lab Reports', path: '/lab-reports/lab-report-list' }
  ]},
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', subItems: [] }
];

const generateMenu = (prefix) => {
  return BASE_MENU.map(item => ({
    ...item,
    path: '/' + prefix + item.path,
    subItems: item.subItems.map(sub => ({
      ...sub,
      path: '/' + prefix + sub.path
    }))
  }));
};

export const DOCTOR_MENU = generateMenu('doctor');
export const ADMIN_MENU = generateMenu('admin').map(item => {
  if (item.id === 'dashboard') {
    return { ...item, subItems: [{ label: 'Admin Dashboard', path: item.subItems[0].path }] };
  }
  return item;
});

export const USER_MENU = generateMenu('user')
  .filter(item => item.id !== 'patients')
  .map(item => {
  // Shallow clone with spread
  const newItem = { ...item, subItems: [...item.subItems] };
  
  if (newItem.id === 'dashboard') {
    newItem.label = 'My Dashboard';
    newItem.subItems = [{ label: 'My Dashboard', path: newItem.subItems[0].path }];
  } else if (newItem.id === 'appointments') {
    newItem.label = 'My Appointments';
    newItem.subItems = newItem.subItems.filter(sub => !sub.label.includes('Add'));
  } else if (newItem.id === 'prescriptions') {
    newItem.label = 'My Prescriptions';
    newItem.subItems = newItem.subItems.filter(sub => !sub.label.includes('Add'));
  } else if (newItem.id === 'medication') {
    newItem.label = 'My Medication';
    newItem.subItems = newItem.subItems.map(sub => {
      if (sub.label.includes('Add') || sub.label.includes('Order')) {
        return { ...sub, label: 'Order Medication' };
      }
      return { ...sub, label: 'Medication' };
    });
  } else if (newItem.id === 'invoices') {
    newItem.label = 'My Invoices';
    newItem.subItems = newItem.subItems.filter(sub => !sub.label.includes('Add'));
  } else if (newItem.id === 'lab-reports') {
    newItem.label = 'My Lab Reports';
    newItem.subItems = newItem.subItems.filter(sub => !sub.label.includes('Add'));
  }
  
  return newItem;
});
