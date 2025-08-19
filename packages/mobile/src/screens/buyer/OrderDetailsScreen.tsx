import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  useTheme,
  ActivityIndicator,
  Card,
  Divider,
  Chip,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Order } from '@/types';

type OrderDetailsScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'OrderDetails'
>;

type OrderDetailsScreenRouteProp = RouteProp<
  BuyerStackParamList,
  'OrderDetails'
>;

interface Props {
  navigation: OrderDetailsScreenNavigationProp;
  route: OrderDetailsScreenRouteProp;
}

interface OrderTimeline {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isActive: boolean;
}

// Mock order data
const mockOrder: Order = {
  id: '1',
  orderNumber: 'ORD-2024-001',
  status: 'delivered',
  total: 2450,
  itemCount: 3,
  orderDate: '2024-01-15T10:30:00Z',
  deliveryDate: '2024-01-18T14:20:00Z',
  items: [
    {
      id: '1',
      productId: '1',
      productName: 'Premium Wireless Headphones',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 1,
      price: 1999,
      total: 1999,
    },
    {
      id: '2',
      productId: '2',
      productName: 'Smartphone Case',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 2,
      price: 299,
      total: 598,
    },
    {
      id: '3',
      productId: '3',
      productName: 'USB Cable',
      productImage: 'https://via.placeholder.com/300x300',
      quantity: 1,
      price: 199,
      total: 199,
    },
  ],
  shippingAddress: {
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
  paymentMethod: {
    id: '1',
    type: 'card',
    provider: 'visa',
    last4: '1234',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  trackingNumber: 'TRK123456789',
  subtotal: 2296,
  deliveryFee: 0,
  tax: 154,
};

const mockTimeline: OrderTimeline[] = [
  {
    id: '1',
    status: 'placed',
    title: 'Order Placed',
    description: 'Your order has been placed successfully',
    timestamp: '2024-01-15T10:30:00Z',
    isCompleted: true,
    isActive: false,
  },
  {
    id: '2',
    status: 'confirmed',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed by the seller',
    timestamp: '2024-01-15T11:45:00Z',
    isCompleted: true,
    isActive: false,
  },
  {
    id: '3',
    status: 'processing',
    title: 'Processing',
    description: 'Your order is being prepared for shipment',
    timestamp: '2024-01-16T09:20:00Z',
    isCompleted: true,
    isActive: false,
  },
  {
    id: '4',
    status: 'shipped',
    title: 'Shipped',
    description: 'Your order has been shipped',
    timestamp: '2024-01-17T14:15:00Z',
    isCompleted: true,
    isActive: false,
  },
  {
    id: '5',
    status: 'delivered',
    title: 'Delivered',
    description: 'Your order has been delivered successfully',
    timestamp: '2024-01-18T14:20:00Z',
    isCompleted: true,
    isActive: true,
  },
];

export function OrderDetailsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // Load order details from API
      // const [orderData, timelineData] = await Promise.all([
      //   orderService.getOrderDetails(orderId),
      //   orderService.getOrderTimeline(orderId),
      // ]);
      // setOrder(orderData);
      // setTimeline(timelineData);
      
      // Using mock data for now
      setTimeout(() => {
        setOrder(mockOrder);
        setTimeline(mockTimeline);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading order details:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      processing: '#8B5CF6',
      shipped: '#06B6D4',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return statusColors[status] || '#6B7280';
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

  const handleTrackOrder = () => {
    if (order?.trackingNumber) {
      // Open tracking URL or navigate to tracking screen
      const trackingUrl = `https://example-courier.com/track/${order.trackingNumber}`;
      Linking.openURL(trackingUrl).catch(() => {
        Alert.alert('Error', 'Unable to open tracking link');
      });
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Implement cancel order logic
            console.log('Cancel order:', orderId);
          },
        },
      ]
    );
  };

  const handleReorder = () => {
    if (order) {
      // Add all items to cart and navigate to cart
      Alert.alert(
        'Reorder Items',
        'All items from this order will be added to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add to Cart',
            onPress: () => {
              // Implement reorder logic
              console.log('Reorder:', orderId);
              navigation.navigate('Cart');
            },
          },
        ]
      );
    }
  };

  const handleReturnOrder = () => {
    Alert.alert(
      'Return Order',
      'Do you want to return this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          onPress: () => {
            // Navigate to return flow
            console.log('Return order:', orderId);
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    // Navigate to support or open contact options
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL('tel:+911234567890'),
        },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@mawell.com'),
        },
      ]
    );
  };

  const renderOrderHeader = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
              {order?.orderNumber}
            </Text>
            <Text style={[styles.orderDate, { color: theme.colors.onSurfaceVariant }]}>
              Placed on {formatDate(order?.orderDate || '')}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(order?.status || '') }]}
            textStyle={styles.statusChipText}
          >
            {order?.status.toUpperCase()}
          </Chip>
        </View>
        
        {order?.trackingNumber && (
          <TouchableOpacity style={styles.trackingContainer} onPress={handleTrackOrder}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={[styles.trackingText, { color: theme.colors.primary }]}>
              Track Order: {order.trackingNumber}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  const renderOrderTimeline = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Order Timeline
        </Text>
        
        <View style={styles.timeline}>
          {timeline.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: item.isCompleted
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                >
                  {item.isCompleted && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                {index < timeline.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: item.isCompleted
                          ? theme.colors.primary
                          : theme.colors.outline,
                      },
                    ]}
                  />
                )}
              </View>
              
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    {
                      color: item.isActive
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                      fontWeight: item.isActive ? 'bold' : '600',
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.timelineDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {item.description}
                </Text>
                <Text style={[styles.timelineTimestamp, { color: theme.colors.onSurfaceVariant }]}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderOrderItems = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Order Items ({order?.itemCount})
        </Text>
        
        {order?.items.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.orderItem}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.productId })}
            >
              <Image
                source={{ uri: item.productImage }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemName, { color: theme.colors.onSurface }]}
                  numberOfLines={2}
                >
                  {item.productName}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                    ₹{item.price.toLocaleString()}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: theme.colors.onSurfaceVariant }]}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: theme.colors.onSurface }]}>
                  Total: ₹{item.total.toLocaleString()}
                </Text>
              </View>
              
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            
            {index < (order?.items.length || 0) - 1 && <Divider style={styles.itemDivider} />}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderShippingAddress = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Shipping Address
        </Text>
        
        <View style={styles.addressContainer}>
          <View style={styles.addressHeader}>
            <Text style={[styles.addressName, { color: theme.colors.onSurface }]}>
              {order?.shippingAddress.name}
            </Text>
            <Chip size="small" style={styles.addressTypeChip}>
              {order?.shippingAddress.type.toUpperCase()}
            </Chip>
          </View>
          
          <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
            {order?.shippingAddress.addressLine1}
            {order?.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
          </Text>
          <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
            {order?.shippingAddress.city}, {order?.shippingAddress.state} {order?.shippingAddress.pincode}
          </Text>
          <Text style={[styles.addressPhone, { color: theme.colors.onSurfaceVariant }]}>
            Phone: {order?.shippingAddress.phone}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPaymentInfo = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Payment Information
        </Text>
        
        <View style={styles.paymentContainer}>
          <View style={styles.paymentHeader}>
            <Ionicons
              name={order?.paymentMethod.type === 'card' ? 'card' : 'phone-portrait'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.paymentDetails}>
              <Text style={[styles.paymentName, { color: theme.colors.onSurface }]}>
                {order?.paymentMethod.type === 'card'
                  ? `**** **** **** ${order.paymentMethod.last4}`
                  : order?.paymentMethod.upiId}
              </Text>
              <Text style={[styles.paymentType, { color: theme.colors.onSurfaceVariant }]}>
                {order?.paymentMethod.type === 'card'
                  ? `${order.paymentMethod.provider?.toUpperCase()} Card`
                  : 'UPI'}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOrderSummary = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Order Summary
        </Text>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
            Subtotal ({order?.itemCount} items)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
            ₹{order?.subtotal?.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
            Delivery Fee
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
            {(order?.deliveryFee || 0) === 0 ? 'FREE' : `₹${order?.deliveryFee?.toLocaleString()}`}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
            Tax (GST 18%)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
            ₹{order?.tax?.toLocaleString()}
          </Text>
        </View>
        
        <Divider style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
            Total Amount
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            ₹{order?.total.toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderActionButtons = () => {
    if (!order) return null;

    const actions = [];

    switch (order.status) {
      case 'pending':
      case 'confirmed':
        actions.push(
          <Button
            key="cancel"
            mode="outlined"
            onPress={handleCancelOrder}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            labelStyle={{ color: theme.colors.error }}
          >
            Cancel Order
          </Button>
        );
        break;
      case 'shipped':
        actions.push(
          <Button
            key="track"
            mode="contained"
            onPress={handleTrackOrder}
            style={styles.actionButton}
          >
            Track Order
          </Button>
        );
        break;
      case 'delivered':
        actions.push(
          <Button
            key="reorder"
            mode="contained"
            onPress={handleReorder}
            style={styles.actionButton}
          >
            Reorder
          </Button>,
          <Button
            key="return"
            mode="outlined"
            onPress={handleReturnOrder}
            style={styles.actionButton}
          >
            Return
          </Button>
        );
        break;
    }

    actions.push(
      <Button
        key="support"
        mode="text"
        onPress={handleContactSupport}
        style={styles.actionButton}
      >
        Contact Support
      </Button>
    );

    return (
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.actionButtons}>
            {actions}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Order not found
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          iconColor={theme.colors.onBackground}
        />
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Order Details
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderHeader()}
        {renderOrderTimeline()}
        {renderOrderItems()}
        {renderShippingAddress()}
        {renderPaymentInfo()}
        {renderOrderSummary()}
        {renderActionButtons()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    fontSize: 14,
  },
  statusChip: {
    marginLeft: 16,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  trackingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  timelineTimestamp: {
    fontSize: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDivider: {
    marginVertical: 8,
  },
  addressContainer: {
    paddingVertical: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressTypeChip: {
    height: 24,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    marginTop: 4,
  },
  paymentContainer: {
    paddingVertical: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
  },
});