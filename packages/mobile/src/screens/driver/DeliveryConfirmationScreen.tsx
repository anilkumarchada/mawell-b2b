import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Button,
  TextInput,
  Chip,
  RadioButton,
  Checkbox,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { Consignment } from '@/types';

type DeliveryConfirmationScreenNavigationProp = StackNavigationProp<
  DriverStackParamList,
  'DeliveryConfirmation'
>;

type DeliveryConfirmationScreenRouteProp = RouteProp<
  DriverStackParamList,
  'DeliveryConfirmation'
>;

interface Props {
  navigation: DeliveryConfirmationScreenNavigationProp;
  route: DeliveryConfirmationScreenRouteProp;
}

interface DeliveryData {
  deliveryStatus: 'delivered' | 'failed' | 'partial';
  recipientName: string;
  recipientPhone: string;
  deliveryNotes: string;
  failureReason?: string;
  signatureImage?: string;
  deliveryProofImages: string[];
  itemsDelivered: { [itemId: string]: boolean };
  otp?: string;
}

const { width } = Dimensions.get('window');

// Mock consignment data
const mockConsignment: Consignment = {
  id: '1',
  consignmentNumber: 'CON-2024-001',
  orderId: 'ORD-2024-001',
  status: 'in_transit',
  priority: 'high',
  pickupAddress: {
    id: '1',
    type: 'warehouse',
    name: 'Main Warehouse',
    phone: '+91 9876543210',
    addressLine1: 'Plot 123, Industrial Area',
    addressLine2: 'Sector 15',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400070',
    country: 'India',
    isDefault: false,
  },
  deliveryAddress: {
    id: '2',
    type: 'home',
    name: 'John Doe',
    phone: '+91 9876543210',
    addressLine1: '123 Main Street',
    addressLine2: 'Apartment 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    isDefault: true,
  },
  items: [
    {
      id: '1',
      productId: '1',
      productName: 'Premium Wireless Headphones',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 1,
      weight: 0.5,
      dimensions: { length: 20, width: 15, height: 8 },
    },
    {
      id: '2',
      productId: '2',
      productName: 'Smartphone Case',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 2,
      weight: 0.2,
      dimensions: { length: 15, width: 8, height: 2 },
    },
  ],
  totalWeight: 0.9,
  totalValue: 2597,
  estimatedDeliveryTime: '2024-01-25T18:00:00Z',
  assignedAt: '2024-01-24T09:00:00Z',
  distance: 12.5,
  deliveryFee: 150,
  requiresOTP: true,
  deliveryOTP: '1234',
};

const failureReasons = [
  'Customer not available',
  'Wrong address',
  'Customer refused delivery',
  'Damaged package',
  'Incomplete payment',
  'Security concerns',
  'Other',
];

export function DeliveryConfirmationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { consignmentId } = route.params;
  const [consignment, setConsignment] = useState<Consignment>(mockConsignment);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    deliveryStatus: 'delivered',
    recipientName: consignment.deliveryAddress.name,
    recipientPhone: consignment.deliveryAddress.phone,
    deliveryNotes: '',
    deliveryProofImages: [],
    itemsDelivered: consignment.items.reduce((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {} as { [itemId: string]: boolean }),
  });

  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera>(null);

  const handleStatusChange = (status: 'delivered' | 'failed' | 'partial') => {
    setDeliveryData(prev => ({
      ...prev,
      deliveryStatus: status,
      failureReason: status === 'failed' ? failureReasons[0] : undefined,
    }));
  };

  const handleItemToggle = (itemId: string, delivered: boolean) => {
    setDeliveryData(prev => ({
      ...prev,
      itemsDelivered: {
        ...prev.itemsDelivered,
        [itemId]: delivered,
      },
    }));
  };

  const takePicture = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        setDeliveryData(prev => ({
          ...prev,
          deliveryProofImages: [...prev.deliveryProofImages, photo.uri],
        }));
        
        setShowCamera(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDeliveryData(prev => ({
          ...prev,
          deliveryProofImages: [...prev.deliveryProofImages, result.assets[0].uri],
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setDeliveryData(prev => ({
      ...prev,
      deliveryProofImages: prev.deliveryProofImages.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (deliveryData.deliveryStatus === 'delivered') {
      if (consignment.requiresOTP && !deliveryData.otp) {
        Alert.alert('OTP Required', 'Please enter the delivery OTP.');
        return false;
      }
      
      if (consignment.requiresOTP && deliveryData.otp !== consignment.deliveryOTP) {
        Alert.alert('Invalid OTP', 'The entered OTP is incorrect.');
        return false;
      }
    }

    if (deliveryData.deliveryStatus === 'failed' && !deliveryData.failureReason) {
      Alert.alert('Failure Reason Required', 'Please select a reason for delivery failure.');
      return false;
    }

    if (deliveryData.deliveryStatus === 'partial') {
      const deliveredItems = Object.values(deliveryData.itemsDelivered).filter(Boolean);
      if (deliveredItems.length === 0) {
        Alert.alert('No Items Selected', 'Please select at least one item as delivered.');
        return false;
      }
    }

    if (!deliveryData.recipientName.trim()) {
      Alert.alert('Recipient Name Required', 'Please enter the recipient name.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Submit delivery confirmation to API
      // await consignmentService.confirmDelivery(consignmentId, deliveryData);
      
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Delivery Confirmed',
        `Delivery has been ${deliveryData.deliveryStatus} successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Consignments' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusSelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Delivery Status
        </Text>
        <RadioButton.Group
          onValueChange={(value) => handleStatusChange(value as any)}
          value={deliveryData.deliveryStatus}
        >
          <View style={styles.radioOption}>
            <RadioButton value="delivered" />
            <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
              Successfully Delivered
            </Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="partial" />
            <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
              Partially Delivered
            </Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton value="failed" />
            <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
              Delivery Failed
            </Text>
          </View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );

  const renderItemsList = () => {
    if (deliveryData.deliveryStatus !== 'partial') return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Items Delivered
          </Text>
          {consignment.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Checkbox
                status={deliveryData.itemsDelivered[item.id] ? 'checked' : 'unchecked'}
                onPress={() => handleItemToggle(item.id, !deliveryData.itemsDelivered[item.id])}
              />
              <Image source={{ uri: item.productImage }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
                  {item.productName}
                </Text>
                <Text style={[styles.itemQuantity, { color: theme.colors.onSurfaceVariant }]}>
                  Qty: {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderFailureReason = () => {
    if (deliveryData.deliveryStatus !== 'failed') return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Failure Reason
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setDeliveryData(prev => ({ ...prev, failureReason: value }))}
            value={deliveryData.failureReason || ''}
          >
            {failureReasons.map((reason) => (
              <View key={reason} style={styles.radioOption}>
                <RadioButton value={reason} />
                <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                  {reason}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>
    );
  };

  const renderOTPInput = () => {
    if (deliveryData.deliveryStatus !== 'delivered' || !consignment.requiresOTP) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Delivery OTP
          </Text>
          <TextInput
            label="Enter OTP"
            value={deliveryData.otp || ''}
            onChangeText={(text) => setDeliveryData(prev => ({ ...prev, otp: text }))}
            keyboardType="numeric"
            maxLength={4}
            style={styles.otpInput}
            mode="outlined"
          />
          <Text style={[styles.otpHint, { color: theme.colors.onSurfaceVariant }]}>
            Ask the customer for the 4-digit OTP to confirm delivery
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderRecipientInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Recipient Information
        </Text>
        <TextInput
          label="Recipient Name"
          value={deliveryData.recipientName}
          onChangeText={(text) => setDeliveryData(prev => ({ ...prev, recipientName: text }))}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Recipient Phone"
          value={deliveryData.recipientPhone}
          onChangeText={(text) => setDeliveryData(prev => ({ ...prev, recipientPhone: text }))}
          keyboardType="phone-pad"
          style={styles.input}
          mode="outlined"
        />
      </Card.Content>
    </Card>
  );

  const renderDeliveryProof = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Delivery Proof
        </Text>
        
        {/* Photo Actions */}
        <View style={styles.photoActions}>
          <Button
            mode="outlined"
            onPress={takePicture}
            icon="camera"
            style={styles.photoButton}
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            onPress={pickImageFromGallery}
            icon="image"
            style={styles.photoButton}
          >
            Gallery
          </Button>
        </View>

        {/* Captured Images */}
        {deliveryData.deliveryProofImages.length > 0 && (
          <View style={styles.imageGrid}>
            {deliveryData.deliveryProofImages.map((imageUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.proofImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderNotes = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Delivery Notes
        </Text>
        <TextInput
          label="Additional Notes (Optional)"
          value={deliveryData.deliveryNotes}
          onChangeText={(text) => setDeliveryData(prev => ({ ...prev, deliveryNotes: text }))}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
          mode="outlined"
        />
      </Card.Content>
    </Card>
  );

  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={capturePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Consignment Info */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={[styles.consignmentNumber, { color: theme.colors.onSurface }]}>
              {consignment.consignmentNumber}
            </Text>
            <Text style={[styles.deliveryAddress, { color: theme.colors.onSurfaceVariant }]}>
              {consignment.deliveryAddress.addressLine1}, {consignment.deliveryAddress.city}
            </Text>
          </Card.Content>
        </Card>

        {renderStatusSelection()}
        {renderItemsList()}
        {renderFailureReason()}
        {renderOTPInput()}
        {renderRecipientInfo()}
        {renderDeliveryProof()}
        {renderNotes()}
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
          icon="checkmark"
        >
          {submitting ? 'Confirming...' : 'Confirm Delivery'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
  },
  consignmentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
  },
  input: {
    marginBottom: 12,
  },
  otpInput: {
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  proofImage: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  notesInput: {
    height: 80,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    paddingVertical: 4,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});