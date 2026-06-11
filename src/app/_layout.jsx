import { Stack } from 'expo-router';
import { DoctorProvider } from '../store/DoctorContext';
import '../output.css';

export default function Layout() {
  return (
    <DoctorProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(doctor)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </DoctorProvider>
  );
}
