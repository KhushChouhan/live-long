import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '../store/AuthContext';

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigationState = useRootNavigationState();

  // If auth is loading or navigation state is not fully ready, show the loading spinner
  if (loading || !navigationState?.key) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  // Once ready, perform the redirect declaratively
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
      return <Redirect href="/admin/dashboard" />;
    } else if (isDocRole) {
      return <Redirect href="/doctor/dashboard" />;
    } else {
      return <Redirect href="/user/dashboard" />;
    }
  }

  // If not authenticated, redirect to login
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
  },
});
