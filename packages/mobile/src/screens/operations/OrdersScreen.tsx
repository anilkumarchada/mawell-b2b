import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Searchbar,
  Button,
  Chip,
  IconButton,
  Badge,
  SegmentedButtons,
  Menu,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { Order, OrderItem } from '@/types';

type OrdersScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'Orders'>;

interface Props {
  navigation: OrdersScreenNavigationProp;
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type FilterType = 'all' | OrderStatus;
type SortType = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'status';

interface ExtendedOrder extends Order {
  customerPhone: string;
  assignedDriver?: string;
  estimatedDelivery: string;
  priority: 'high' | 'medium' | 'low';
  paymentMethod: string;
  notes?: string;
}

// Mock orders data
const mockOrders: ExtendedOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerId: '1',
    customerName: 'John Doe',
    customerPhone: '+91 9876543210',
    status: 'pending',
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
    ],
    subtotal: 1299,
    deliveryFee: 50,
    tax: 234,
    total: 1583,
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
    updatedAt: '2024-01-24T10:30:00Z',
    estimatedDelivery: '2024-01-25T18:00:00Z',
    priority: 'high',
    paymentMethod: 'UPI',
    notes: 'Urgent delivery required',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerId: '2',
    customerName: 'Jane Smith',
    customerPhone: '+91 9876543211',
    status: 'processing',
    items: [
      {
        id: '2',
        productId: '2',
        productName: 'Smart Fitness Watch',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        price: 2499,
        total: 2499,
      },
    ],
    subtotal: 2499,
    deliveryFee: 0,
    tax: 450,
    total: 2949,
    deliveryAddress: {
      id: '2',
      type: 'work',
      name: 'Jane Smith',
      phone: '+91 9876543211',
      addressLine1: '456 Business Park',
      addressLine2: 'Floor 5, Office 502',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070',
      country: 'India',
      isDefault: false,
    },
    createdAt: '2024-01-24T09:15:00Z',
    updatedAt: '2024-01-24T11:45:00Z',
    estimatedDelivery: '2024-01-26T16:00:00Z',
    priority: 'medium',
    paymentMethod: 'Credit Card',
    assignedDriver: 'DRV-001',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerId: '3',
    customerName: 'Mike Johnson',
    customerPhone: '+91 9876543212',
    status: 'shipped',
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Bluetooth Speaker',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        price: 899,
        total: 899,
      },
    ],
    subtotal: 899,
    deliveryFee: 50,
    tax: 162,
    total: 1111,
    deliveryAddress: {
      id: '3',
      type: 'home',
      name: 'Mike Johnson',
      phone: '+91 9876543212',
      addressLine1: '789 Residential Complex',
      addressLine2: 'Building A, Flat 301',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      country: 'India',
      isDefault: false,
    },
    createdAt: '2024-01-24T08:45:00Z',
    updatedAt: '2024-01-24T14:20:00Z',
    estimatedDelivery: '2024-01-25T20:00:00Z',
    priority: 'low',
    paymentMethod: 'Cash on Delivery',
    assignedDriver: 'DRV-002',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customerId: '4',
    customerName: 'Sarah Wilson',
    customerPhone: '+91 9876543213',
    status: 'delivered',
    items: [
      {
        id: '4',
        productId: '4',
        productName: 'USB-C Cable',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 2,
        price: 299,
        total: 598,
      },
    ],
    subtotal: 598,
    deliveryFee: 50,
    tax: 108,
    total: 756,
    deliveryAddress: {
      id: '4',
      type: 'home',
      name: 'Sarah Wilson',
      phone: '+91 9876543213',
      addressLine1: '321 Garden Street',
      addressLine2: 'House No. 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400025',
      country: 'India',
      isDefault: true,
    },
    createdAt: '2024-01-23T16:20:00Z',
    updatedAt: '2024-01-24T12:30:00Z',
    estimatedDelivery: '2024-01-24T18:00:00Z',
    priority: 'medium',
    paymentMethod: 'UPI',
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-005',
    customerId: '5',
    customerName: 'David Brown',
    customerPhone: '+91 9876543214',
    status: 'cancelled',
    items: [
      {
        id: '5',
        productId: '1',
        productName: 'Premium Wireless Headphones',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        price: 1299,
        total: 1299,
      },
    ],
    subtotal: 1299,
    deliveryFee: 50,
    tax: 234,
    total: 1583,
    deliveryAddress: {
      id: '5',
      type: 'home',
      name: 'David Brown',
      phone: '+91 9876543214',
      addressLine1: '654 Park Avenue',
      addressLine2: 'Apartment 2A',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400015',
      country: 'India',
      isDefault: true,
    },
    createdAt: '2024-01-23T14:10:00Z',
    updatedAt: '2024-01-23T15:45:00Z',
    estimatedDelivery: '2024-01-24T16:00:00Z',
    priority: 'low',
    paymentMethod: 'Credit Card',
    notes: 'Customer requested cancellation',
  },
];

export function OrdersScreen({ navigation }: Props) {
  const theme = useTheme();
  
  const [orders, setOrders] = useState<ExtendedOrder[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, filter, sortBy]);

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_high':
          return b.total - a.total;
        case 'amount_low':
          return a.total - b.total;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
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

  const getStatusActions = (order: ExtendedOrder) => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirm', action: () => updateOrderStatus(order.id, 'confirmed'), color: '#10B981' },
          { label: 'Cancel', action: () => updateOrderStatus(order.id, 'cancelled'), color: '#EF4444' },
        ];
      case 'confirmed':
        return [
          { label: 'Start Processing', action: () => updateOrderStatus(order.id, 'processing'), color: '#8B5CF6' },
          { label: 'Cancel', action: () => updateOrderStatus(order.id, 'cancelled'), color: '#EF4444' },
        ];
      case 'processing':
        return [
          { label: 'Ship', action: () => updateOrderStatus(order.id, 'shipped'), color: '#06B6D4' },
        ];
      case 'shipped':
        return [
          { label: 'Mark Delivered', action: () => updateOrderStatus(order.id, 'delivered'), color: '#10B981' },
        ];
      default:
        return [];
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Change order status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setOrders(prev => prev.map(order => 
              order.id === orderId 
                ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
                : order
            ));
            Alert.alert('Success', `Order status updated to ${newStatus}`);
          },
        },
      ]
    );
  };

  const assignDriver = (orderId: string) => {
    Alert.alert(
      'Assign Driver',
      'Select a driver for this order',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Driver 1 (DRV-001)', onPress: () => assignDriverToOrder(orderId, 'DRV-001') },
        { text: 'Driver 2 (DRV-002)', onPress: () => assignDriverToOrder(orderId, 'DRV-002') },
        { text: 'Driver 3 (DRV-003)', onPress: () => assignDriverToOrder(orderId, 'DRV-003') },
      ]
    );
  };

  const assignDriverToOrder = (orderId: string, driverId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, assignedDriver: driverId, updatedAt: new Date().toISOString() }
        : order
    ));
    Alert.alert('Success', `Driver ${driverId} assigned to order`);
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

  const renderOrderItem = ({ item: order }: { item: ExtendedOrder }) => {
    const statusActions = getStatusActions(order);
    
    return (
      <Card style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
                {order.orderNumber}
              </Text>
              <Text style={[styles.customerName, { color: theme.colors.onSurfaceVariant }]}>
                {order.customerName}
              </Text>
              <Text style={[styles.customerPhone, { color: theme.colors.onSurfaceVariant }]}>
                {order.customerPhone}
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
          
          <View style={styles.orderDetails}>
            <View style={styles.orderDetailItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.orderDetailText, { color: theme.colors.onSurfaceVariant }]}>
                Created: {formatDateTime(order.createdAt)}
              </Text>
            </View>
            
            <View style={styles.orderDetailItem}>
              <Ionicons name="location-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.orderDetailText, { color: theme.colors.onSurfaceVariant }]}>
                {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
              </Text>
            </View>
            
            {order.assignedDriver && (
              <View style={styles.orderDetailItem}>
                <Ionicons name="person-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.orderDetailText, { color: theme.colors.onSurfaceVariant }]}>
                  Driver: {order.assignedDriver}
                </Text>
              </View>
            )}
            
            <View style={styles.orderDetailItem}>
              <Ionicons name="card-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.orderDetailText, { color: theme.colors.onSurfaceVariant }]}>
                {order.paymentMethod}
              </Text>
            </View>
          </View>
          
          {order.notes && (
            <View style={styles.orderNotes}>
              <Text style={[styles.notesLabel, { color: theme.colors.onSurfaceVariant }]}>
                Notes:
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.onSurface }]}>
                {order.notes}
              </Text>
            </View>
          )}
          
          <View style={styles.orderItems}>
            <Text style={[styles.itemsLabel, { color: theme.colors.onSurfaceVariant }]}>
              Items ({order.items.length}):
            </Text>
            {order.items.slice(0, 2).map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
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
            ))}
            {order.items.length > 2 && (
              <Text style={[styles.moreItems, { color: theme.colors.onSurfaceVariant }]}>
                +{order.items.length - 2} more items
              </Text>
            )}
          </View>
          
          <View style={styles.orderActions}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
              style={styles.actionButton}
              compact
            >
              View Details
            </Button>
            
            {!order.assignedDriver && (order.status === 'confirmed' || order.status === 'processing') && (
              <Button
                mode="outlined"
                onPress={() => assignDriver(order.id)}
                style={styles.actionButton}
                icon="person-add"
                compact
              >
                Assign Driver
              </Button>
            )}
            
            {statusActions.map((action, index) => (
              <Button
                key={index}
                mode={index === 0 ? 'contained' : 'outlined'}
                onPress={action.action}
                style={[styles.actionButton, { borderColor: action.color }]}
                buttonColor={index === 0 ? action.color : undefined}
                textColor={index === 0 ? 'white' : action.color}
                compact
              >
                {action.label}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search and Filters */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filters}>
          <SegmentedButtons
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
            buttons={filterButtons.slice(0, 4)}
            style={styles.segmentedButtons}
          />
        </View>
        
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.colors.onSurfaceVariant }]}>
            Sort by:
          </Text>
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowSortMenu(true)}
                compact
              >
                {sortBy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSortBy('newest'); setShowSortMenu(false); }} title="Newest First" />
            <Menu.Item onPress={() => { setSortBy('oldest'); setShowSortMenu(false); }} title="Oldest First" />
            <Divider />
            <Menu.Item onPress={() => { setSortBy('amount_high'); setShowSortMenu(false); }} title="Amount: High to Low" />
            <Menu.Item onPress={() => { setSortBy('amount_low'); setShowSortMenu(false); }} title="Amount: Low to High" />
            <Divider />
            <Menu.Item onPress={() => { setSortBy('status'); setShowSortMenu(false); }} title="Status" />
          </Menu>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No orders found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    gap: 12,
  },
  searchbar: {
    elevation: 2,
  },
  filters: {},
  segmentedButtons: {},
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
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
  orderDetails: {
    gap: 6,
    marginBottom: 12,
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDetailText: {
    fontSize: 12,
  },
  orderNotes: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 10,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreItems: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});