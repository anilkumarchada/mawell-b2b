import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { BuyerNavigator } from './BuyerNavigator';
import { DriverNavigator } from './DriverNavigator';
import { OperationsNavigator } from './OperationsNavigator';

const Stack = createStackNavigator();

export function AppNavigator() {
  const { state } = useAuth();

  if (state.isLoading) {
    return <LoadingScreen />;
  }

  if (!state.isAuthenticated || !state.user) {
    return <AuthNavigator />;
  }

  // Route based on user role
  switch (state.user.role) {
    case 'BUYER':
      return <BuyerNavigator />;
    case 'DRIVER':
      return <DriverNavigator />;
    case 'OPERATIONS':
    case 'ADMIN':
      return <OperationsNavigator />;
    default:
      return <AuthNavigator />;
  }
}