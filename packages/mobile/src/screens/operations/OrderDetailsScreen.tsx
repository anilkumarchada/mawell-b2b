import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Button,
  Chip,
  IconButton,
  Divider,
  List,
  Menu,
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { Order, OrderItem } from '@/types';

type OrderDetailsScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'OrderDetails'>;
type OrderDetailsScreenRouteProp = RouteProp<OperationsStackParamList, 'OrderDetails'>;

interface Props {
  navigation: OrderDetailsScreenNavigationProp;
  route: OrderDetailsScreenRouteProp;
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusUpdate {
  id: string;
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

interface ExtendedOrder extends Order {
  customerPhone: string;
  customerEmail: string;
  assignedDriver?: string;
  estimatedDelivery: string;
  priority: 'high' | 'medium' | 'low';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  statusHistory: OrderStatusUpdate[];
  trackingNumber?: string;
  warehouse: string;
  specialInstructions?: string;
}

// Mock order data
const mockOrder: ExtendedOrder = {
  id: '1',
  orderNumber: 'ORD-2024-001',
  customerId: '1',
  customerName: 'John Doe',
  customerPhone: '+91 9876543210',
  customerEmail: 'john.doe@example.com',
  status: 'processing',
  items: [
    {
      id: '1',
      productId: '1',
      productName: 'Premium Wireless Headphones',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 1,
      price: 1299,
      total: 1299,
    },
    {
      id: '2',
      productId: '2',
      productName: 'USB-C Cable',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 2,
      price: 299,
      total: 598,
    },
  ],
  subtotal: 1897,
  deliveryFee: 50,
  tax: 341,
  total: 2288,
  deliveryAddress: {
    id: '1',
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
  createdAt: '2024-01-24T10:30:00Z',
  updatedAt: '2024-01-24T14:45:00Z',
  estimatedDelivery: '2024-01-25T18:00:00Z',
  priority: 'high',
  paymentMethod: 'UPI',
  paymentStatus: 'paid',
  notes: 'Urgent delivery required',
  assignedDriver: 'DRV-001',
  trackingNumber: 'TRK-2024-001',
  warehouse: 'WH-Mumbai-01',
  specialInstructions: 'Handle with care - fragile items',
  statusHistory: [
    {
      id: '1',
      status: 'pending',
      timestamp: '2024-01-24T10:30:00Z',
      note: 'Order placed by customer',
      updatedBy: 'System',
    },
    {
      id: '2',
      status: 'confirmed',
      timestamp: '2024-01-24T11:15:00Z',
      note: 'Order confirmed and payment verified',
      updatedBy: 'OPS-001',
    },
    {
      id: '3',
      status: 'processing',
      timestamp: '2024-01-24T14:45:00Z',
      note: 'Items picked and packed',
      updatedBy: 'OPS-002',
    },
  ],
};

export function OrderDetailsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<ExtendedOrder>(mockOrder);
  const [loading, setLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'processing': return '#8B5CF6';
      case 'shipped': return '#06B6D4';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.colors.outline;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return theme.colors.outline;
    }
  };

  const updateOrderStatus = (newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Change order status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const statusUpdate: OrderStatusUpdate = {
              id: Date.now().toString(),
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: `Status updated to ${newStatus}`,
              updatedBy: 'OPS-001',
            };
            
            setOrder(prev => ({
              ...prev,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: [...prev.statusHistory, statusUpdate],
            }));
            
            setShowStatusMenu(false);
            Alert.alert('Success', `Order status updated to ${newStatus}`);
          },
        },
      ]
    );
  };

  const assignDriver = (driverId: string) => {
    setOrder(prev => ({
      ...prev,
      assignedDriver: driverId,
      updatedAt: new Date().toISOString(),
    }));
    setShowDriverMenu(false);
    Alert.alert('Success', `Driver ${driverId} assigned to order`);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const statusUpdate: OrderStatusUpdate = {
      id: Date.now().toString(),
      status: order.status,
      timestamp: new Date().toISOString(),
      note: newNote.trim(),
      updatedBy: 'OPS-001',
    };
    
    setOrder(prev => ({
      ...prev,
      statusHistory: [...prev.statusHistory, statusUpdate],
    }));
    
    setNewNote('');
    setShowNotesModal(false);
    Alert.alert('Success', 'Note added to order');
  };

  const callCustomer = () => {
    Linking.openURL(`tel:${order.customerPhone}`);
  };

  const emailCustomer = () => {
    Linking.openURL(`mailto:${order.customerEmail}`);
  };

  const openMap = () => {
    const address = order.deliveryAddress;
    const query = `${address.addressLine1}, ${address.city}, ${address.state} ${address.pincode}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableStatusUpdates = () => {
    switch (order.status) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered'];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
                  {order.orderNumber}
                </Text>
                <Text style={[styles.orderDate, { color: theme.colors.onSurfaceVariant }]}>
                  Created: {formatDateTime(order.createdAt)}
                </Text>
                <Text style={[styles.orderDate, { color: theme.colors.onSurfaceVariant }]}>
                  Updated: {formatDateTime(order.updatedAt)}
                </Text>
              </View>
              
              <View style={styles.orderMeta}>
                <Text style={[styles.orderTotal, { color: theme.colors.onSurface }]}>
                  {formatCurrency(order.total)}
                </Text>
                <View style={styles.orderChips}>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                    textStyle={styles.statusChipText}
                    compact
                  >
                    {order.status.toUpperCase()}
                  </Chip>
                  <Chip
                    style={[styles.priorityChip, { backgroundColor: getPriorityColor(order.priority) }]}
                    textStyle={styles.priorityChipText}
                    compact
                  >
                    {order.priority.toUpperCase()}
                  </Chip>
                </View>
              </View>
            </View>
            
            {order.trackingNumber && (
              <View style={styles.trackingInfo}>
                <Text style={[styles.trackingLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Tracking Number:
                </Text>
                <Text style={[styles.trackingNumber, { color: theme.colors.primary }]}>
                  {order.trackingNumber}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Customer Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Customer Information
            </Text>
            
            <View style={styles.customerInfo}>
              <View style={styles.customerDetail}>
                <Ionicons name="person-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.customerText, { color: theme.colors.onSurface }]}>
                  {order.customerName}
                </Text>
              </View>
              
              <View style={styles.customerDetail}>
                <Ionicons name="call-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.customerText, { color: theme.colors.onSurface }]}>
                  {order.customerPhone}
                </Text>
                <IconButton
                  icon="call"
                  size={20}
                  onPress={callCustomer}
                  style={styles.contactButton}
                />
              </View>
              
              <View style={styles.customerDetail}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.customerText, { color: theme.colors.onSurface }]}>
                  {order.customerEmail}
                </Text>
                <IconButton
                  icon="email"
                  size={20}
                  onPress={emailCustomer}
                  style={styles.contactButton}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Order Items */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Order Items ({order.items.length})
            </Text>
            
            {order.items.map((item, index) => (
              <View key={item.id}>
                <View style={styles.orderItem}>
                  <Image source={{ uri: item.productImage }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
                      {item.productName}
                    </Text>
                    <Text style={[styles.itemDetails, { color: theme.colors.onSurfaceVariant }]}>
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: theme.colors.onSurface }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
                {index < order.items.length - 1 && <Divider style={styles.itemDivider} />}
              </View>
            ))}
            
            <Divider style={styles.totalDivider} />
            
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Subtotal
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(order.subtotal)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Delivery Fee
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(order.deliveryFee)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Tax (GST)
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(order.tax)}
                </Text>
              </View>
              
              <Divider style={styles.totalDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
                  Total
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(order.total)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Delivery Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Delivery Information
              </Text>
              <IconButton
                icon="map"
                size={20}
                onPress={openMap}
                style={styles.mapButton}
              />
            </View>
            
            <View style={styles.addressInfo}>
              <Text style={[styles.addressName, { color: theme.colors.onSurface }]}>
                {order.deliveryAddress.name}
              </Text>
              <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                {order.deliveryAddress.addressLine1}
              </Text>
              {order.deliveryAddress.addressLine2 && (
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                  {order.deliveryAddress.addressLine2}
                </Text>
              )}
              <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
              </Text>
              <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                Phone: {order.deliveryAddress.phone}
              </Text>
            </View>
            
            <View style={styles.deliveryMeta}>
              <View style={styles.deliveryDetail}>
                <Ionicons name="time-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.deliveryText, { color: theme.colors.onSurfaceVariant }]}>
                  Est. Delivery: {formatDateTime(order.estimatedDelivery)}
                </Text>
              </View>
              
              <View style={styles.deliveryDetail}>
                <Ionicons name="business-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.deliveryText, { color: theme.colors.onSurfaceVariant }]}>
                  Warehouse: {order.warehouse}
                </Text>
              </View>
              
              {order.assignedDriver && (
                <View style={styles.deliveryDetail}>
                  <Ionicons name="person-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.deliveryText, { color: theme.colors.onSurfaceVariant }]}>
                    Driver: {order.assignedDriver}
                  </Text>
                </View>
              )}
            </View>
            
            {order.specialInstructions && (
              <View style={styles.instructionsContainer}>
                <Text style={[styles.instructionsLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Special Instructions:
                </Text>
                <Text style={[styles.instructionsText, { color: theme.colors.onSurface }]}>
                  {order.specialInstructions}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Payment Information
            </Text>
            
            <View style={styles.paymentInfo}>
              <View style={styles.paymentDetail}>
                <Text style={[styles.paymentLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Method:
                </Text>
                <Text style={[styles.paymentValue, { color: theme.colors.onSurface }]}>
                  {order.paymentMethod}
                </Text>
              </View>
              
              <View style={styles.paymentDetail}>
                <Text style={[styles.paymentLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Status:
                </Text>
                <Chip
                  style={[styles.paymentStatusChip, { backgroundColor: getPaymentStatusColor(order.paymentStatus) }]}
                  textStyle={styles.paymentStatusText}
                  compact
                >
                  {order.paymentStatus.toUpperCase()}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Order Timeline */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Order Timeline
            </Text>
            
            {order.statusHistory.map((update, index) => (
              <View key={update.id} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View style={[styles.timelineDot, { backgroundColor: getStatusColor(update.status) }]} />
                  {index < order.statusHistory.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.colors.outline }]} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineStatus, { color: theme.colors.onSurface }]}>
                      {update.status.toUpperCase()}
                    </Text>
                    <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDateTime(update.timestamp)}
                    </Text>
                  </View>
                  
                  {update.note && (
                    <Text style={[styles.timelineNote, { color: theme.colors.onSurfaceVariant }]}>
                      {update.note}
                    </Text>
                  )}
                  
                  <Text style={[styles.timelineUser, { color: theme.colors.onSurfaceVariant }]}>
                    by {update.updatedBy}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Order Notes
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.onSurface }]}>
                {order.notes}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.actionButtons}>
              {/* Status Update */}
              {getAvailableStatusUpdates().length > 0 && (
                <Menu
                  visible={showStatusMenu}
                  onDismiss={() => setShowStatusMenu(false)}
                  anchor={
                    <Button
                      mode="contained"
                      onPress={() => setShowStatusMenu(true)}
                      style={styles.actionButton}
                      icon="update"
                    >
                      Update Status
                    </Button>
                  }
                >
                  {getAvailableStatusUpdates().map((status) => (
                    <Menu.Item
                      key={status}
                      onPress={() => updateOrderStatus(status as OrderStatus)}
                      title={status.charAt(0).toUpperCase() + status.slice(1)}
                    />
                  ))}
                </Menu>
              )}
              
              {/* Assign Driver */}
              {!order.assignedDriver && (order.status === 'confirmed' || order.status === 'processing') && (
                <Menu
                  visible={showDriverMenu}
                  onDismiss={() => setShowDriverMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowDriverMenu(true)}
                      style={styles.actionButton}
                      icon="person-add"
                    >
                      Assign Driver
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => assignDriver('DRV-001')} title="Driver 1 (DRV-001)" />
                  <Menu.Item onPress={() => assignDriver('DRV-002')} title="Driver 2 (DRV-002)" />
                  <Menu.Item onPress={() => assignDriver('DRV-003')} title="Driver 3 (DRV-003)" />
                </Menu>
              )}
              
              {/* Add Note */}
              <Button
                mode="outlined"
                onPress={() => setShowNotesModal(true)}
                style={styles.actionButton}
                icon="note-plus"
              >
                Add Note
              </Button>
              
              {/* Print */}
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Print', 'Print functionality would be implemented here')}
                style={styles.actionButton}
                icon="printer"
              >
                Print
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Note Modal */}
      <Portal>
        <Modal
          visible={showNotesModal}
          onDismiss={() => setShowNotesModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Add Note
          </Text>
          
          <TextInput
            label="Note"
            value={newNote}
            onChangeText={setNewNote}
            multiline
            numberOfLines={4}
            style={styles.noteInput}
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowNotesModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addNote}
              style={styles.modalButton}
              disabled={!newNote.trim()}
            >
              Add Note
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderChips: {
    gap: 4,
  },
  statusChip: {},
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priorityChip: {},
  priorityChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  trackingLabel: {
    fontSize: 12,
  },
  trackingNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    gap: 8,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerText: {
    flex: 1,
    fontSize: 14,
  },
  contactButton: {
    margin: 0,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDivider: {
    marginVertical: 4,
  },
  totalDivider: {
    marginVertical: 12,
  },
  orderSummary: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapButton: {
    margin: 0,
  },
  addressInfo: {
    marginBottom: 12,
  },
  addressName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    marginBottom: 2,
  },
  deliveryMeta: {
    gap: 6,
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
  },
  paymentInfo: {
    gap: 8,
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentStatusChip: {},
  paymentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 12,
  },
  timelineNote: {
    fontSize: 12,
    marginBottom: 2,
  },
  timelineUser: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noteInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 80,
  },
});