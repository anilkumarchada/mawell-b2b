import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();

  const handleGetStarted = () => {
    navigation.navigate('PhoneInput');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="cube" size={80} color="white" />
            </View>
            <Text style={styles.logoText}>MAWELL</Text>
            <Text style={styles.tagline}>B2B Supply Chain Platform</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.feature}>
              <Ionicons name="storefront-outline" size={24} color="white" />
              <Text style={styles.featureText}>Browse Products</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="car-outline" size={24} color="white" />
              <Text style={styles.featureText}>Track Deliveries</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="analytics-outline" size={24} color="white" />
              <Text style={styles.featureText}>Manage Operations</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to MAWELL</Text>
            <Text style={styles.welcomeSubtitle}>
              Your complete B2B supply chain solution. Connect with suppliers,
              manage inventory, and streamline your business operations.
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              onPress={handleGetStarted}
              style={[
                styles.getStartedButton,
                { backgroundColor: 'white' },
              ]}
              labelStyle={[
                styles.getStartedButtonText,
                { color: theme.colors.primary },
              ]}
              contentStyle={styles.getStartedButtonContent}
            >
              Get Started
            </Button>
            
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionSection: {
    alignItems: 'center',
  },
  getStartedButton: {
    width: width - 48,
    borderRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  getStartedButtonContent: {
    height: 56,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});