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
import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { Consignment } from '@/types';

type ConsignmentsScreenNavigationProp = StackNavigationProp<
  DriverStackParamList,
  'Consignments'
>;

interface Props {
  navigation: ConsignmentsScreenNavigationProp;
}

const consignmentStatuses = [
  { key: 'all', label: 'All', color: '#6B7280' },
  { key: 'assigned', label: 'Assigned', color: '#F59E0B' },
  { key: 'picked_up', label: 'Picked Up', color: '#3B82F6' },
  { key: 'in_transit', label: 'In Transit', color: '#8B5CF6' },
  { key: 'delivered', label: 'Delivered', color: '#10B981' },
  { key: 'failed', label: 'Failed', color: '#EF4444' },
];

// Mock data
const mockConsignments: Consignment[] = [
  {
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
  },
  {
    id: '2',
    consignmentNumber: 'CON-2024-002',
    orderId: 'ORD-2024-002',
    status: 'in_transit',
    priority: 'medium',
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
      id: '3',
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
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Bluetooth Speaker',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        weight: 1.2,
        dimensions: { length: 25, width: 12, height: 10 },
      },
    ],
    totalWeight: 1.2,
    totalValue: 1299,
    estimatedDeliveryTime: '2024-01-24T16:00:00Z',
    assignedAt: '2024-01-24T08:00:00Z',
    pickedUpAt: '2024-01-24T10:30:00Z',
    distance: 8.3,
    deliveryFee: 100,
  },
  {
    id: '3',
    consignmentNumber: 'CON-2024-003',
    orderId: 'ORD-2024-003',
    status: 'delivered',
    priority: 'low',
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
      id: '4',
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
    items: [
      {
        id: '4',
        productId: '4',
        productName: 'USB Cable',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 2,
        weight: 0.1,
        dimensions: { length: 10, width: 5, height: 2 },
      },
      {
        id: '5',
        productId: '5',
        productName: 'Power Bank',
        productImage: 'https://via.placeholder.com/300x300',
        quantity: 1,
        weight: 0.4,
        dimensions: { length: 12, width: 6, height: 3 },
      },
    ],
    totalWeight: 0.6,
    totalValue: 997,
    estimatedDeliveryTime: '2024-01-23T17:00:00Z',
    assignedAt: '2024-01-23T09:00:00Z',
    pickedUpAt: '2024-01-23T11:00:00Z',
    deliveredAt: '2024-01-23T16:30:00Z',
    distance: 15.2,
    deliveryFee: 120,
  },
];

export function ConsignmentsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [filteredConsignments, setFilteredConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConsignments();
  }, []);

  useEffect(() => {
    filterConsignments();
  }, [consignments, selectedStatus, searchQuery]);

  const loadConsignments = async () => {
    try {
      setLoading(true);
      // Load consignments from API
      // const consignmentsData = await consignmentService.getDriverConsignments();
      // setConsignments(consignmentsData);
      
      // Using mock data for now
      setTimeout(() => {
        setConsignments(mockConsignments);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading consignments:', error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConsignments();
    setRefreshing(false);
  }, []);

  const filterConsignments = () => {
    let filtered = consignments;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(consignment => consignment.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(consignment =>
        consignment.consignmentNumber.toLowerCase().includes(query) ||
        consignment.orderId.toLowerCase().includes(query) ||
        consignment.deliveryAddress.name.toLowerCase().includes(query) ||
        consignment.items.some(item => 
          item.productName.toLowerCase().includes(query)
        )
      );
    }

    // Sort by priority and estimated delivery time
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.estimatedDeliveryTime).getTime() - new Date(b.estimatedDeliveryTime).getTime();
    });

    setFilteredConsignments(filtered);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = consignmentStatuses.find(s => s.key === status);
    return statusConfig?.color || '#6B7280';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusActions = (consignment: Consignment) => {
    switch (consignment.status) {
      case 'assigned':
        return [
          {
            label: 'Start Pickup',
            action: () => handleStartPickup(consignment.id),
            color: theme.colors.primary,
            icon: 'play',
          },
        ];
      case 'picked_up':
        return [
          {
            label: 'Start Delivery',
            action: () => handleStartDelivery(consignment.id),
            color: theme.colors.primary,
            icon: 'navigation',
          },
        ];
      case 'in_transit':
        return [
          {
            label: 'Mark Delivered',
            action: () => handleMarkDelivered(consignment.id),
            color: '#10B981',
            icon: 'checkmark',
          },
          {
            label: 'Report Issue',
            action: () => handleReportIssue(consignment.id),
            color: theme.colors.error,
            icon: 'alert',
          },
        ];
      default:
        return [];
    }
  };

  const handleStartPickup = (consignmentId: string) => {
    navigation.navigate('ConsignmentDetails', { consignmentId, action: 'pickup' });
  };

  const handleStartDelivery = (consignmentId: string) => {
    navigation.navigate('Navigation', { consignmentId });
  };

  const handleMarkDelivered = (consignmentId: string) => {
    navigation.navigate('DeliveryConfirmation', { consignmentId });
  };

  const handleReportIssue = (consignmentId: string) => {
    navigation.navigate('ConsignmentDetails', { consignmentId, action: 'report_issue' });
  };

  const renderStatusFilter = () => (
    <View style={styles.statusFilter}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={consignmentStatuses}
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

  const renderConsignmentItem = ({ item: consignment }: { item: Consignment }) => {
    const statusActions = getStatusActions(consignment);
    const firstItem = consignment.items[0];
    const remainingItems = consignment.items.length - 1;

    return (
      <Card style={styles.consignmentCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConsignmentDetails', { consignmentId: consignment.id })}
        >
          <Card.Content>
            {/* Consignment Header */}
            <View style={styles.consignmentHeader}>
              <View style={styles.consignmentInfo}>
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
                  textStyle={styles.priorityChipText}
                  compact
                >
                  {consignment.priority.toUpperCase()}
                </Chip>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(consignment.status) }]}
                  textStyle={styles.statusChipWhiteText}
                  compact
                >
                  {consignment.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>

            {/* Items Preview */}
            <View style={styles.itemsPreview}>
              <Image
                source={{ uri: firstItem.productImage }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {firstItem.productName}
                </Text>
                {remainingItems > 0 && (
                  <Text style={[styles.moreItems, { color: theme.colors.onSurfaceVariant }]}>
                    +{remainingItems} more item{remainingItems > 1 ? 's' : ''}
                  </Text>
                )}
                <View style={styles.itemStats}>
                  <Text style={[styles.itemStat, { color: theme.colors.onSurfaceVariant }]}>
                    {consignment.items.length} item{consignment.items.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.itemStat, { color: theme.colors.onSurfaceVariant }]}>
                    {consignment.totalWeight}kg
                  </Text>
                  <Text style={[styles.deliveryFee, { color: theme.colors.primary }]}>
                    ₹{consignment.deliveryFee}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Info */}
            <View style={styles.deliveryInfo}>
              <View style={styles.addressInfo}>
                <Ionicons name="location" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                  {consignment.deliveryAddress.name} • {consignment.deliveryAddress.city}
                </Text>
              </View>
              <View style={styles.timeInfo}>
                <Ionicons name="time" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
                  {formatDate(consignment.estimatedDeliveryTime)}
                </Text>
              </View>
            </View>

            {/* Distance and Value */}
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="navigate" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.distance}km
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  ₹{consignment.totalValue.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            {statusActions.length > 0 && (
              <View style={styles.actionButtons}>
                {statusActions.map((action, index) => (
                  <Button
                    key={index}
                    mode={index === 0 ? 'contained' : 'outlined'}
                    onPress={action.action}
                    style={[
                      styles.actionButton,
                      index > 0 && { borderColor: action.color },
                    ]}
                    labelStyle={index > 0 ? { color: action.color } : undefined}
                    icon={action.icon}
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
        name="cube-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        No Consignments Found
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}>
        {selectedStatus === 'all'
          ? "You don't have any consignments assigned yet."
          : `No consignments with status "${selectedStatus}".`}
      </Text>
      <Button
        mode="contained"
        onPress={onRefresh}
        style={styles.refreshButton}
        icon="refresh"
      >
        Refresh
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
          placeholder="Search consignments..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Consignments List */}
      <FlatList
        data={filteredConsignments}
        keyExtractor={(item) => item.id}
        renderItem={renderConsignmentItem}
        contentContainerStyle={[
          styles.listContent,
          filteredConsignments.length === 0 && styles.emptyListContent,
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
        icon="map"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Map')}
        label="Map View"
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
  priorityChip: {
    marginBottom: 4,
  },
  priorityChipText: {
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
  consignmentCard: {
    marginBottom: 16,
  },
  consignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  consignmentInfo: {
    flex: 1,
  },
  consignmentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 12,
  },
  badges: {
    alignItems: 'flex-end',
  },
  itemsPreview: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStat: {
    fontSize: 12,
  },
  deliveryFee: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
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
  refreshButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});