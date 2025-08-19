import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  useTheme,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { AuthContext } from '@/store/AuthContext';
import { authService } from '@/services/auth';

type OTPVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;

type OTPVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

export function OTPVerificationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { login } = useContext(AuthContext);
  const { phone, sessionId } = route.params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus on the next empty field or last field
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next field
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
    
    if (error) setError('');
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(sessionId, { otp: otpString });
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken, isNewUser } = response.data;
        
        // Store tokens
        await authService.setTokens(accessToken, refreshToken);
        
        // Update auth context
        await login(user);
        
        // Navigate based on user status
        if (isNewUser) {
          navigation.navigate('RoleSelection');
        } else if (!user.profile?.firstName) {
          navigation.navigate('ProfileSetup');
        } else {
          // User is fully set up, navigation will be handled by AppNavigator
        }
      } else {
        setError(response.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await authService.resendOTP(sessionId);
      
      if (response.success) {
        setCanResend(false);
        setResendTimer(30);
        
        // Restart timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatPhone = (phoneNumber: string) => {
    return phoneNumber.replace('+91', '+91 ');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Button
              mode="text"
              onPress={handleGoBack}
              style={styles.backButton}
              contentStyle={styles.backButtonContent}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
            </Button>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="mail" size={48} color={theme.colors.primary} />
            </View>

            {/* Title and Description */}
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Verify your number
            </Text>
            <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              We've sent a 6-digit verification code to{' '}
              <Text style={[styles.phoneNumber, { color: theme.colors.primary }]}>
                {formatPhone(phone)}
              </Text>
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    {
                      borderColor: error
                        ? theme.colors.error
                        : digit
                        ? theme.colors.primary
                        : theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.onSurface,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={6} // Allow paste
                  textAlign="center"
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>
            
            {error ? (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            {/* Verify Button */}
            <Button
              mode="contained"
              onPress={handleVerifyOTP}
              disabled={otp.join('').length !== 6 || loading}
              style={styles.verifyButton}
              contentStyle={styles.verifyButtonContent}
              labelStyle={styles.verifyButtonText}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                'Verify OTP'
              )}
            </Button>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={[styles.resendText, { color: theme.colors.onSurfaceVariant }]}>
                Didn't receive the code?
              </Text>
              
              {canResend ? (
                <Button
                  mode="text"
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                  style={styles.resendButton}
                  labelStyle={[styles.resendButtonText, { color: theme.colors.primary }]}
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Button>
              ) : (
                <Text style={[styles.timerText, { color: theme.colors.onSurfaceVariant }]}>
                  Resend in {resendTimer}s
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    margin: 0,
  },
  backButtonContent: {
    margin: 0,
    padding: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  phoneNumber: {
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 32,
  },
  verifyButtonContent: {
    height: 56,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    margin: 0,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});