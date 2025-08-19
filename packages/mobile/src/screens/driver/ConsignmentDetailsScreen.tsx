import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { Consignment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type ConsignmentDetailsScreenNavigationProp = StackNavigationProp<
  DriverStackParamList,
  'ConsignmentDetails'
>;

type ConsignmentDetailsScreenRouteProp = RouteProp<
  DriverStackParamList,
  'ConsignmentDetails'
>;

interface Props {
  navigation: ConsignmentDetailsScreenNavigationProp;
  route: ConsignmentDetailsScreenRouteProp;
}

// Mock data - same as in ConsignmentsScreen
const mockConsignment: Consignment = {
  id: '1',
  consignmentNumber: 'CON-2024-001',
  orderId: 'ORD-2024-001',
  status: 'assigned',
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
  specialInstructions: 'Handle with care. Fragile items. Ring doorbell twice.',
  customerNotes: 'Please deliver between 5-7 PM. Will be available at home.',
};

export function ConsignmentDetailsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { consignmentId, action } = route.params;
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadConsignmentDetails();
  }, [consignmentId]);

  useEffect(() => {
    if (action && consignment) {
      handleAction(action);
    }
  }, [action, consignment]);

  const loadConsignmentDetails = async () => {
    try {
      setLoading(true);
      // Load consignment details from API
      // const consignmentData = await consignmentService.getConsignmentDetails(consignmentId);
      // setConsignment(consignmentData);
      
      // Using mock data for now
      setTimeout(() => {
        setConsignment(mockConsignment);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading consignment details:', error);
      setLoading(false);
    }
  };

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'pickup':
        handleStartPickup();
        break;
      case 'report_issue':
        handleReportIssue();
        break;
    }
  };

  const handleStartPickup = () => {
    Alert.alert(
      'Start Pickup',
      'Are you ready to start the pickup process?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setUpdating(true);
            try {
              // Update consignment status to picked_up
              // await consignmentService.updateStatus(consignmentId, 'picked_up');
              
              // Mock update
              setTimeout(() => {
                if (consignment) {
                  setConsignment({
                    ...consignment,
                    status: 'picked_up',
                    pickedUpAt: new Date().toISOString(),
                  });
                }
                setUpdating(false);
                Alert.alert('Success', 'Pickup started successfully!');
              }, 1000);
            } catch (error) {
              setUpdating(false);
              Alert.alert('Error', 'Failed to start pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStartDelivery = () => {
    navigation.navigate('Navigation', { consignmentId });
  };

  const handleMarkDelivered = () => {
    navigation.navigate('DeliveryConfirmation', { consignmentId });
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'What type of issue would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Customer Not Available',
          onPress: () => reportIssue('customer_not_available'),
        },
        {
          text: 'Address Not Found',
          onPress: () => reportIssue('address_not_found'),
        },
        {
          text: 'Damaged Package',
          onPress: () => reportIssue('damaged_package'),
        },
        {
          text: 'Other',
          onPress: () => reportIssue('other'),
        },
      ]
    );
  };

  const reportIssue = async (issueType: string) => {
    setUpdating(true);
    try {
      // Report issue via API
      // await consignmentService.reportIssue(consignmentId, issueType);
      
      // Mock update
      setTimeout(() => {
        setUpdating(false);
        Alert.alert('Issue Reported', 'Your issue has been reported successfully. Support team will contact you soon.');
      }, 1000);
    } catch (error) {
      setUpdating(false);
      Alert.alert('Error', 'Failed to report issue. Please try again.');
    }
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (address: any) => {
    const query = `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.state} ${address.pincode}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      assigned: '#F59E0B',
      picked_up: '#3B82F6',
      in_transit: '#8B5CF6',
      delivered: '#10B981',
      failed: '#EF4444',
    };
    return statusColors[status as keyof typeof statusColors] || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
    };
    return priorityColors[priority as keyof typeof priorityColors] || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionButtons = () => {
    if (!consignment) return [];

    switch (consignment.status) {
      case 'assigned':
        return [
          {
            label: 'Start Pickup',
            action: handleStartPickup,
            mode: 'contained' as const,
            icon: 'play',
          },
        ];
      case 'picked_up':
        return [
          {
            label: 'Start Delivery',
            action: handleStartDelivery,
            mode: 'contained' as const,
            icon: 'navigation',
          },
        ];
      case 'in_transit':
        return [
          {
            label: 'Mark Delivered',
            action: handleMarkDelivered,
            mode: 'contained' as const,
            icon: 'checkmark',
          },
          {
            label: 'Report Issue',
            action: handleReportIssue,
            mode: 'outlined' as const,
            icon: 'alert',
          },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!consignment) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Consignment not found
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const actionButtons = getActionButtons();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <Text style={[styles.consignmentNumber, { color: theme.colors.onSurface }]}>
                  {consignment.consignmentNumber}
                </Text>
                <Text style={[styles.orderNumber, { color: theme.colors.onSurfaceVariant }]}>
                  Order: {consignment.orderId}
                </Text>
              </View>
              <View style={styles.badges}>
                <Chip
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor(consignment.priority) }]}
                  textStyle={styles.chipText}
                  compact
                >
                  {consignment.priority.toUpperCase()}
                </Chip>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(consignment.status) }]}
                  textStyle={styles.chipText}
                  compact
                >
                  {consignment.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  ETA: {formatDate(consignment.estimatedDeliveryTime)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="navigate" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.distance}km
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash" size={16} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                  ₹{consignment.deliveryFee}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Pickup Address */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Pickup Address
              </Text>
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressName, { color: theme.colors.onSurface }]}>
                  {consignment.pickupAddress.name}
                </Text>
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.pickupAddress.addressLine1}
                </Text>
                {consignment.pickupAddress.addressLine2 && (
                  <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                    {consignment.pickupAddress.addressLine2}
                  </Text>
                )}
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.pickupAddress.city}, {consignment.pickupAddress.state} {consignment.pickupAddress.pincode}
                </Text>
              </View>
              <View style={styles.addressActions}>
                <IconButton
                  icon="phone"
                  size={20}
                  onPress={() => makePhoneCall(consignment.pickupAddress.phone)}
                />
                <IconButton
                  icon="map"
                  size={20}
                  onPress={() => openMaps(consignment.pickupAddress)}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Delivery Address */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="home" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Delivery Address
              </Text>
            </View>
            <View style={styles.addressContainer}>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressName, { color: theme.colors.onSurface }]}>
                  {consignment.deliveryAddress.name}
                </Text>
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.deliveryAddress.addressLine1}
                </Text>
                {consignment.deliveryAddress.addressLine2 && (
                  <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                    {consignment.deliveryAddress.addressLine2}
                  </Text>
                )}
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.deliveryAddress.city}, {consignment.deliveryAddress.state} {consignment.deliveryAddress.pincode}
                </Text>
              </View>
              <View style={styles.addressActions}>
                <IconButton
                  icon="phone"
                  size={20}
                  onPress={() => makePhoneCall(consignment.deliveryAddress.phone)}
                />
                <IconButton
                  icon="map"
                  size={20}
                  onPress={() => openMaps(consignment.deliveryAddress)}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Items */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Items ({consignment.items.length})
              </Text>
              <Text style={[styles.totalWeight, { color: theme.colors.onSurfaceVariant }]}>
                {consignment.totalWeight}kg
              </Text>
            </View>
            {consignment.items.map((item, index) => (
              <View key={item.id}>
                <View style={styles.itemContainer}>
                  <Image
                    source={{ uri: item.productImage }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
                      {item.productName}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text style={[styles.itemQuantity, { color: theme.colors.onSurfaceVariant }]}>
                        Qty: {item.quantity}
                      </Text>
                      <Text style={[styles.itemWeight, { color: theme.colors.onSurfaceVariant }]}>
                        {item.weight}kg
                      </Text>
                    </View>
                    <Text style={[styles.itemDimensions, { color: theme.colors.onSurfaceVariant }]}>
                      {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}cm
                    </Text>
                  </View>
                </View>
                {index < consignment.items.length - 1 && (
                  <Divider style={styles.itemDivider} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Special Instructions */}
        {(consignment.specialInstructions || consignment.customerNotes) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Instructions
                </Text>
              </View>
              {consignment.specialInstructions && (
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Special Instructions:
                  </Text>
                  <Text style={[styles.instructionText, { color: theme.colors.onSurface }]}>
                    {consignment.specialInstructions}
                  </Text>
                </View>
              )}
              {consignment.customerNotes && (
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Customer Notes:
                  </Text>
                  <Text style={[styles.instructionText, { color: theme.colors.onSurface }]}>
                    {consignment.customerNotes}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Timeline */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Timeline
              </Text>
            </View>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: theme.colors.onSurface }]}>
                    Assigned
                  </Text>
                  <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                    {formatDate(consignment.assignedAt)}
                  </Text>
                </View>
              </View>
              {consignment.pickedUpAt && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: theme.colors.onSurface }]}>
                      Picked Up
                    </Text>
                    <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(consignment.pickedUpAt)}
                    </Text>
                  </View>
                </View>
              )}
              {consignment.deliveredAt && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: theme.colors.onSurface }]}>
                      Delivered
                    </Text>
                    <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(consignment.deliveredAt)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      {actionButtons.length > 0 && (
        <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.actionButtons}>
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                mode={button.mode}
                onPress={button.action}
                style={[styles.actionButton, index > 0 && styles.secondaryButton]}
                icon={button.icon}
                loading={updating}
                disabled={updating}
              >
                {button.label}
              </Button>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  consignmentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
  },
  badges: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    marginBottom: 4,
  },
  statusChip: {},
  chipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  totalWeight: {
    fontSize: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemWeight: {
    fontSize: 12,
  },
  itemDimensions: {
    fontSize: 12,
  },
  itemDivider: {
    marginVertical: 8,
  },
  instructionItem: {
    marginBottom: 12,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
  },
  actionContainer: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  secondaryButton: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
  },
});