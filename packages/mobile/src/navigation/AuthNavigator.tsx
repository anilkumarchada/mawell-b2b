import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { PhoneInputScreen } from '@/screens/auth/PhoneInputScreen';
import { OTPVerificationScreen } from '@/screens/auth/OTPVerificationScreen';
import { RoleSelectionScreen } from '@/screens/auth/RoleSelectionScreen';
import { ProfileSetupScreen } from '@/screens/auth/ProfileSetupScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneInput: undefined;
  OTPVerification: {
    phone: string;
    isSignUp?: boolean;
  };
  RoleSelection: {
    phone: string;
    isNewUser: boolean;
  };
  ProfileSetup: {
    phone: string;
    role: 'BUYER' | 'DRIVER' | 'OPERATIONS';
  };
  Onboarding: {
    role: 'BUYER' | 'DRIVER' | 'OPERATIONS';
  };
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}