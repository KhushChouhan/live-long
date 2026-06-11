import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../store/AuthContext';

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    const navigateToDashboard = async () => {
      if (isAuthenticated && user) {
        const roles = user.roles || [user.role] || [];
        const userName = user.name || '';
        const nameToCheck = userName.toLowerCase();

        const isDocRole = roles.some((r) =>
          String(r).toLowerCase().includes('doctor'),
        ) || nameToCheck.includes('doctor');

        const isAdminRole = roles.some((r) =>
          String(r).toLowerCase().includes('admin') ||
          String(r).toLowerCase().includes('administrator'),
        ) || nameToCheck.includes('admin');

        if (isAdminRole) {
          router.replace('/admin/dashboard');
        } else if (isDocRole) {
          router.replace('/doctor/dashboard');
        } else {
          router.replace('/user/dashboard');
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    navigateToDashboard();
  }, [loading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1A56DB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
  },
});
