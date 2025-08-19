import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  useTheme,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { AuthContext } from '@/store/AuthContext';
import { authService } from '@/services/auth';
import { UserRole } from '@/types';

const { width } = Dimensions.get('window');

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'RoleSelection'
>;

interface Props {
  navigation: RoleSelectionScreenNavigationProp;
}

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'BUYER',
    title: 'Buyer',
    description: 'Browse products, place orders, and track deliveries',
    icon: 'storefront',
    features: [
      'Browse product catalog',
      'Place and manage orders',
      'Track order status',
      'Manage delivery addresses',
      'View order history',
    ],
    color: '#4CAF50',
  },
  {
    id: 'DRIVER',
    title: 'Driver',
    description: 'Deliver orders and manage consignments',
    icon: 'car',
    features: [
      'View assigned deliveries',
      'Navigate to destinations',
      'Update delivery status',
      'Capture delivery proof',
      'Track earnings',
    ],
    color: '#2196F3',
  },
  {
    id: 'OPERATIONS',
    title: 'Operations',
    description: 'Manage inventory, orders, and business operations',
    icon: 'analytics',
    features: [
      'Manage product inventory',
      'Process orders',
      'Assign deliveries',
      'Generate reports',
      'Monitor operations',
    ],
    color: '#FF9800',
  },
];

export function RoleSelectionScreen({ navigation }: Props) {
  const theme = useTheme();
  const { updateUser } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (error) setError('');
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.selectRole(selectedRole);
      
      if (response.success && response.data) {
        // Update user in context
        await updateUser(response.data);
        
        // Navigate to profile setup
        navigation.navigate('ProfileSetup');
      } else {
        setError(response.error || 'Failed to select role. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleCard = (role: RoleOption) => {
    const isSelected = selectedRole === role.id;
    
    return (
      <TouchableOpacity
        key={role.id}
        onPress={() => handleRoleSelect(role.id)}
        style={styles.roleCardContainer}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.roleCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isSelected ? role.color : theme.colors.outline,
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <View style={styles.roleCardContent}>
            {/* Icon and Title */}
            <View style={styles.roleHeader}>
              <View
                style={[
                  styles.roleIconContainer,
                  {
                    backgroundColor: isSelected
                      ? role.color
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Ionicons
                  name={role.icon}
                  size={32}
                  color={isSelected ? 'white' : theme.colors.onSurfaceVariant}
                />
              </View>
              
              <View style={styles.roleTitleContainer}>
                <Text
                  style={[
                    styles.roleTitle,
                    {
                      color: isSelected ? role.color : theme.colors.onSurface,
                    },
                  ]}
                >
                  {role.title}
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {role.description}
                </Text>
              </View>
              
              {isSelected && (
                <View
                  style={[
                    styles.selectedIndicator,
                    { backgroundColor: role.color },
                  ]}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {role.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={isSelected ? role.color : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Choose your role
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Select the role that best describes how you'll use MAWELL
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {roleOptions.map(renderRoleCard)}
        </View>

        {/* Error Message */}
        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : null}

        {/* Continue Button */}
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonText}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            'Continue'
          )}
        </Button>

        {/* Info Text */}
        <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
          You can change your role later in the app settings if needed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  rolesContainer: {
    marginBottom: 24,
  },
  roleCardContainer: {
    marginBottom: 16,
  },
  roleCard: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roleCardContent: {
    padding: 20,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleTitleContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  continueButtonContent: {
    height: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});