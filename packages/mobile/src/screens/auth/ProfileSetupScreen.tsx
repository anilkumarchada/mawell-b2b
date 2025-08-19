import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  useTheme,
  HelperText,
  ActivityIndicator,
  Menu,
  Avatar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { AuthContext } from '@/store/AuthContext';
import { authService } from '@/services/auth';

type ProfileSetupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ProfileSetup'
>;

interface Props {
  navigation: ProfileSetupScreenNavigationProp;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  avatar: string | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
}

export function ProfileSetupScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user, updateUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    dateOfBirth: null,
    gender: null,
    avatar: null,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dateOfBirth', selectedDate);
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingAvatar(true);
      
      try {
        const response = await authService.uploadProfilePicture({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: 'profile.jpg',
        });
        
        if (response.success && response.data) {
          handleInputChange('avatar', response.data.url);
        } else {
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        dateOfBirth: formData.dateOfBirth?.toISOString(),
        gender: formData.gender || undefined,
      };

      const response = await authService.completeOnboarding(profileData);
      
      if (response.success && response.data) {
        await updateUser(response.data);
        navigation.navigate('Onboarding');
      } else {
        Alert.alert('Error', response.error || 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMaxDate = (): Date => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 13); // Minimum age 13
    return today;
  };

  const getMinDate = (): Date => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 100); // Maximum age 100
    return today;
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Complete your profile
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Help us personalize your experience
            </Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : formData.avatar ? (
                <Avatar.Image size={100} source={{ uri: formData.avatar }} />
              ) : (
                <>
                  <Ionicons
                    name="camera"
                    size={32}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.avatarText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Add Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <TextInput
              mode="outlined"
              label="First Name *"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              error={!!errors.firstName}
              style={styles.input}
              disabled={loading}
            />
            {errors.firstName && (
              <HelperText type="error">{errors.firstName}</HelperText>
            )}

            {/* Last Name */}
            <TextInput
              mode="outlined"
              label="Last Name *"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              error={!!errors.lastName}
              style={styles.input}
              disabled={loading}
            />
            {errors.lastName && (
              <HelperText type="error">{errors.lastName}</HelperText>
            )}

            {/* Email */}
            <TextInput
              mode="outlined"
              label="Email (Optional)"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
              disabled={loading}
            />
            {errors.email && (
              <HelperText type="error">{errors.email}</HelperText>
            )}

            {/* Date of Birth */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <TextInput
                mode="outlined"
                label="Date of Birth (Optional)"
                value={formData.dateOfBirth ? formatDate(formData.dateOfBirth) : ''}
                editable={false}
                right={
                  <TextInput.Icon
                    icon="calendar"
                    onPress={() => setShowDatePicker(true)}
                  />
                }
                style={styles.input}
              />
            </TouchableOpacity>

            {/* Gender */}
            <Menu
              visible={showGenderMenu}
              onDismiss={() => setShowGenderMenu(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setShowGenderMenu(true)}
                  disabled={loading}
                >
                  <TextInput
                    mode="outlined"
                    label="Gender (Optional)"
                    value={formData.gender || ''}
                    editable={false}
                    right={
                      <TextInput.Icon
                        icon="chevron-down"
                        onPress={() => setShowGenderMenu(true)}
                      />
                    }
                    style={styles.input}
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  handleInputChange('gender', 'MALE');
                  setShowGenderMenu(false);
                }}
                title="Male"
              />
              <Menu.Item
                onPress={() => {
                  handleInputChange('gender', 'FEMALE');
                  setShowGenderMenu(false);
                }}
                title="Female"
              />
              <Menu.Item
                onPress={() => {
                  handleInputChange('gender', 'OTHER');
                  setShowGenderMenu(false);
                }}
                title="Other"
              />
            </Menu>
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonText}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              'Continue'
            )}
          </Button>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.dateOfBirth || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={getMaxDate()}
              minimumDate={getMinDate()}
            />
          )}
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
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    height: 56,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});