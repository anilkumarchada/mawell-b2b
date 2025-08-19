import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  useTheme,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { authService } from '@/services/auth';

type PhoneInputScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'PhoneInput'
>;

interface Props {
  navigation: PhoneInputScreenNavigationProp;
}

export function PhoneInputScreen({ navigation }: Props) {
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phoneInputRef = useRef<any>(null);

  const validatePhone = (phoneNumber: string): boolean => {
    // Indian phone number validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const formatPhone = (text: string): string => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
    if (error) setError('');
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.sendOTP({ phone: `+91${phone}` });
      
      if (response.success && response.data) {
        navigation.navigate('OTPVerification', {
          phone: `+91${phone}`,
          sessionId: response.data.sessionId,
        });
      } else {
        setError(response.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
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
              <Ionicons name="phone-portrait" size={48} color={theme.colors.primary} />
            </View>

            {/* Title and Description */}
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Enter your mobile number
            </Text>
            <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              We'll send you a verification code to confirm your number
            </Text>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.phoneInputWrapper}>
                <View style={[styles.countryCode, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.countryCodeText, { color: theme.colors.onSurfaceVariant }]}>
                    🇮🇳 +91
                  </Text>
                </View>
                <TextInput
                  ref={phoneInputRef}
                  mode="outlined"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.phoneInput}
                  contentStyle={styles.phoneInputContent}
                  outlineStyle={styles.phoneInputOutline}
                  error={!!error}
                  disabled={loading}
                  autoFocus
                />
              </View>
              
              {error ? (
                <HelperText type="error" visible={!!error}>
                  {error}
                </HelperText>
              ) : (
                <HelperText type="info" visible={true}>
                  Enter your 10-digit mobile number
                </HelperText>
              )}
            </View>

            {/* Send OTP Button */}
            <Button
              mode="contained"
              onPress={handleSendOTP}
              disabled={!phone || phone.length !== 10 || loading}
              style={styles.sendButton}
              contentStyle={styles.sendButtonContent}
              labelStyle={styles.sendButtonText}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                'Send OTP'
              )}
            </Button>

            {/* Info Text */}
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              By proceeding, you agree to receive SMS messages from MAWELL.
              Message and data rates may apply.
            </Text>
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
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  phoneInputContent: {
    fontSize: 18,
    paddingHorizontal: 16,
  },
  phoneInputOutline: {
    borderRadius: 8,
  },
  sendButton: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 24,
  },
  sendButtonContent: {
    height: 56,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});