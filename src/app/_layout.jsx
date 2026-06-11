import { Stack } from 'expo-router';
import { DoctorProvider } from '../store/DoctorContext';
import { AuthProvider } from '../store/AuthContext';
import '../output.css';

export default function Layout() {
  return (
    <AuthProvider>
      <DoctorProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(doctor)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(user)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </DoctorProvider>
    </AuthProvider>
  );
}
