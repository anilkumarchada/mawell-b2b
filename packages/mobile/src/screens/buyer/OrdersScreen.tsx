import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  ActivityIndicator,
  Card,
  Chip,
  Button,
  Searchbar,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Order } from '@/types';

type OrdersScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Orders'
>;

interface Props {
  navigation: OrdersScreenNavigationProp;
}

const orderStatuses = [
  { key: 'all', label: 'All', color: '#6B7280' },
  { key: 'pending', label: 'Pending', color: '#F59E0B' },
  { key: 'confirmed', label: 'Confirmed', color: '#3B82F6' },
  { key: 'processing', label: 'Processing', color: '#8B5CF6' },
  { key: 'shipped', label: 'Shipped', color: '#06B6D4' },
  { key: 'delivered', label: 'Delivered', color: '#10B981' },
  { key: 'cancelled', label: 'Cancelled', color: '#EF4444' },
];

// Mock data
const mockOrders: Order[] = [
  {
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
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    status: 'shipped',
    total: 1299,
    itemCount: 1,
    orderDate: '2024-01-20T09:15:00Z',
    estimatedDeliveryDate: '2024-01-23T18:00:00Z',
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Bluetooth Speaker',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        price: 1299,
        total: 1299,
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
    trackingNumber: 'TRK987654321',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    status: 'processing',
    total: 899,
    itemCount: 2,
    orderDate: '2024-01-22T16:45:00Z',
    estimatedDeliveryDate: '2024-01-26T18:00:00Z',
    items: [
      {
        id: '4',
        productId: '4',
        productName: 'USB Cable',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 2,
        price: 199,
        total: 398,
      },
      {
        id: '5',
        productId: '5',
        productName: 'Power Bank',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        price: 599,
        total: 599,
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
      id: '2',
      type: 'upi',
      provider: 'upi',
      upiId: 'john@paytm',
      isDefault: false,
    },
  },
];

export function OrdersScreen({ navigation }: Props) {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Load orders from API
      // const ordersData = await orderService.getOrders();
      // setOrders(ordersData);
      
      // Using mock data for now
      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(query)
        )
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = orderStatuses.find(s => s.key === status);
    return statusConfig?.color || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return [
          {
            label: 'Cancel Order',
            action: () => handleCancelOrder(order.id),
            color: theme.colors.error,
          },
        ];
      case 'shipped':
        return [
          {
            label: 'Track Order',
            action: () => handleTrackOrder(order.trackingNumber!),
            color: theme.colors.primary,
          },
        ];
      case 'delivered':
        return [
          {
            label: 'Reorder',
            action: () => handleReorder(order.id),
            color: theme.colors.primary,
          },
          {
            label: 'Return',
            action: () => handleReturnOrder(order.id),
            color: theme.colors.secondary,
          },
        ];
      default:
        return [];
    }
  };

  const handleCancelOrder = (orderId: string) => {
    // Implement cancel order logic
    console.log('Cancel order:', orderId);
  };

  const handleTrackOrder = (trackingNumber: string) => {
    // Implement track order logic
    console.log('Track order:', trackingNumber);
  };

  const handleReorder = (orderId: string) => {
    // Implement reorder logic
    console.log('Reorder:', orderId);
  };

  const handleReturnOrder = (orderId: string) => {
    // Implement return order logic
    console.log('Return order:', orderId);
  };

  const renderStatusFilter = () => (
    <View style={styles.statusFilter}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={orderStatuses}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.statusFilterContent}
        renderItem={({ item }) => {
          const isSelected = selectedStatus === item.key;
          return (
            <Chip
              selected={isSelected}
              onPress={() => setSelectedStatus(item.key)}
              style={[
                styles.statusChip,
                isSelected && { backgroundColor: item.color },
              ]}
              textStyle={[
                styles.statusChipText,
                isSelected && { color: '#FFFFFF' },
              ]}
            >
              {item.label}
            </Chip>
          );
        }}
      />
    </View>
  );

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const statusActions = getStatusActions(order);
    const firstItem = order.items[0];
    const remainingItems = order.items.length - 1;

    return (
      <Card style={styles.orderCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
        >
          <Card.Content>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
                  {order.orderNumber}
                </Text>
                <Text style={[styles.orderDate, { color: theme.colors.onSurfaceVariant }]}>
                  {formatDate(order.orderDate)}
                </Text>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                textStyle={styles.statusChipWhiteText}
              >
                {order.status.toUpperCase()}
              </Chip>
            </View>

            {/* Order Items Preview */}
            <View style={styles.orderItems}>
              <Image
                source={{ uri: firstItem.productImage }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemName, { color: theme.colors.onSurface }]}
                  numberOfLines={2}
                >
                  {firstItem.productName}
                </Text>
                {remainingItems > 0 && (
                  <Text style={[styles.moreItems, { color: theme.colors.onSurfaceVariant }]}>
                    +{remainingItems} more item{remainingItems > 1 ? 's' : ''}
                  </Text>
                )}
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemCount, { color: theme.colors.onSurfaceVariant }]}>
                    {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.orderTotal, { color: theme.colors.primary }]}>
                    ₹{order.total.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Info */}
            {(order.deliveryDate || order.estimatedDeliveryDate) && (
              <View style={styles.deliveryInfo}>
                <Ionicons
                  name={order.deliveryDate ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={order.deliveryDate ? '#10B981' : theme.colors.onSurfaceVariant}
                />
                <Text style={[styles.deliveryText, { color: theme.colors.onSurfaceVariant }]}>
                  {order.deliveryDate
                    ? `Delivered on ${formatDate(order.deliveryDate)}`
                    : `Expected by ${formatDate(order.estimatedDeliveryDate!)}`}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {statusActions.length > 0 && (
              <View style={styles.actionButtons}>
                {statusActions.map((action, index) => (
                  <Button
                    key={index}
                    mode="outlined"
                    onPress={action.action}
                    style={[styles.actionButton, { borderColor: action.color }]}
                    labelStyle={{ color: action.color }}
                    compact
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            )}
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="receipt-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        No Orders Found
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}>
        {selectedStatus === 'all'
          ? "You haven't placed any orders yet."
          : `No orders with status "${selectedStatus}".`}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Catalog')}
        style={styles.shopNowButton}
      >
        Start Shopping
      </Button>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Catalog')}
        label="Shop Now"
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 0,
  },
  statusFilter: {
    paddingVertical: 8,
  },
  statusFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  statusChipText: {
    fontSize: 12,
  },
  statusChipWhiteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
  },
  orderItems: {
    flexDirection: 'row',
    marginBottom: 12,
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
    lineHeight: 18,
  },
  moreItems: {
    fontSize: 12,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 12,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopNowButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});