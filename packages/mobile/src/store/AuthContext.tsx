import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'BUYER' | 'DRIVER' | 'OPERATIONS' | 'ADMIN';
  isVerified: boolean;
  profileComplete: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (user: User, token: string) => {
    try {
      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      dispatch({ type: 'SET_USER', payload: { user, token } });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      dispatch({ type: 'CLEAR_USER' });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Still clear the state even if storage operations fail
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    
    // Update stored user data
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [token, userData] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        AsyncStorage.getItem('user_data'),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        dispatch({ type: 'SET_USER', payload: { user, token } });
      } else {
        dispatch({ type: 'CLEAR_USER' });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    state,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}