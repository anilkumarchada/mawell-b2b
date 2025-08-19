import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Avatar,
  Badge,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { Consignment, ConsignmentStatus } from '@/types';

type ConsignmentDetailsScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'ConsignmentDetails'>;
type ConsignmentDetailsScreenRouteProp = RouteProp<OperationsStackParamList, 'ConsignmentDetails'>;

interface Props {
  navigation: ConsignmentDetailsScreenNavigationProp;
  route: ConsignmentDetailsScreenRouteProp;
}

const statusColors = {
  pending: '#ff9800',
  assigned: '#2196f3',
  in_transit: '#9c27b0',
  delivered: '#4caf50',
  cancelled: '#f44336',
};

const statusLabels = {
  pending: 'Pending Assignment',
  assigned: 'Assigned to Driver',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function ConsignmentDetailsScreen({ navigation, route }: Props) {
  const { consignmentId } = route.params;
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsignment();
  }, [consignmentId]);

  const loadConsignment = async () => {
    try {
      setLoading(true);
      // Mock consignment data
      const mockConsignment: Consignment = {
        id: consignmentId,
        consignmentNumber: 'CON-2024-001',
        status: 'in_transit',
        priority: 'high',
        pickupAddress: {
          street: '123 Warehouse Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near Central Mall',
        },
        deliveryAddress: {
          street: '456 Customer Avenue',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          landmark: 'Opposite City Hospital',
        },
        driver: {
          id: 'driver-1',
          name: 'Rajesh Kumar',
          phone: '+91 9876543210',
          vehicleNumber: 'MH-12-AB-1234',
          vehicleType: 'Truck',
        },
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-2024-001',
            customerName: 'ABC Retail Store',
            items: 5,
            weight: 25.5,
            value: 12500,
          },
          {
            id: 'order-2',
            orderNumber: 'ORD-2024-002',
            customerName: 'XYZ Supermarket',
            items: 8,
            weight: 40.2,
            value: 18750,
          },
        ],
        totalWeight: 65.7,
        totalValue: 31250,
        estimatedDistance: 150,
        estimatedDuration: 180, // minutes
        scheduledPickupTime: new Date('2024-01-15T09:00:00'),
        scheduledDeliveryTime: new Date('2024-01-15T15:00:00'),
        actualPickupTime: new Date('2024-01-15T09:15:00'),
        actualDeliveryTime: null,
        createdAt: new Date('2024-01-14T10:00:00'),
        updatedAt: new Date('2024-01-15T09:15:00'),
        trackingHistory: [
          {
            status: 'pending',
            timestamp: new Date('2024-01-14T10:00:00'),
            location: 'Mumbai Warehouse',
            notes: 'Consignment created',
          },
          {
            status: 'assigned',
            timestamp: new Date('2024-01-14T14:30:00'),
            location: 'Mumbai Warehouse',
            notes: 'Assigned to driver Rajesh Kumar',
          },
          {
            status: 'in_transit',
            timestamp: new Date('2024-01-15T09:15:00'),
            location: 'Mumbai Warehouse',
            notes: 'Pickup completed, en route to delivery',
          },
        ],
      };
      setConsignment(mockConsignment);
    } catch (error) {
      Alert.alert('Error', 'Failed to load consignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallDriver = () => {
    if (consignment?.driver?.phone) {
      Linking.openURL(`tel:${consignment.driver.phone}`);
    }
  };

  const handleTrackLocation = () => {
    // Mock GPS coordinates
    const latitude = 19.0760;
    const longitude = 72.8777;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleUpdateStatus = (newStatus: ConsignmentStatus) => {
    Alert.alert(
      'Update Status',
      `Change status to ${statusLabels[newStatus]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            if (consignment) {
              setConsignment({
                ...consignment,
                status: newStatus,
                updatedAt: new Date(),
              });
              Alert.alert('Success', 'Status updated successfully');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading || !consignment) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Title>{consignment.consignmentNumber}</Title>
              <Paragraph>Created: {formatDateTime(consignment.createdAt)}</Paragraph>
            </View>
            <View style={styles.statusContainer}>
              <Chip
                mode="outlined"
                style={[styles.statusChip, { borderColor: statusColors[consignment.status] }]}
                textStyle={{ color: statusColors[consignment.status] }}
              >
                {statusLabels[consignment.status]}
              </Chip>
              {consignment.priority === 'high' && (
                <Badge style={styles.priorityBadge}>HIGH</Badge>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Driver Information */}
      {consignment.driver && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Driver Information</Title>
            <View style={styles.driverInfo}>
              <Avatar.Icon size={50} icon="account" style={styles.driverAvatar} />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{consignment.driver.name}</Text>
                <Text style={styles.driverPhone}>{consignment.driver.phone}</Text>
                <Text style={styles.vehicleInfo}>
                  {consignment.driver.vehicleType} - {consignment.driver.vehicleNumber}
                </Text>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
                  <Ionicons name="call" size={24} color="#2196f3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleTrackLocation}>
                  <Ionicons name="location" size={24} color="#4caf50" />
                </TouchableOpacity>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Route Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Route Information</Title>
          
          <View style={styles.routeInfo}>
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={20} color="#4caf50" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressLabel}>Pickup Address</Text>
                <Text style={styles.addressText}>
                  {consignment.pickupAddress.street}, {consignment.pickupAddress.city}
                </Text>
                <Text style={styles.addressText}>
                  {consignment.pickupAddress.state} - {consignment.pickupAddress.pincode}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.addressContainer}>
              <Ionicons name="flag" size={20} color="#f44336" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressLabel}>Delivery Address</Text>
                <Text style={styles.addressText}>
                  {consignment.deliveryAddress.street}, {consignment.deliveryAddress.city}
                </Text>
                <Text style={styles.addressText}>
                  {consignment.deliveryAddress.state} - {consignment.deliveryAddress.pincode}
                </Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{consignment.estimatedDistance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatDuration(consignment.estimatedDuration)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Schedule */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Schedule</Title>
          
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Scheduled Pickup</Text>
              <Text style={styles.scheduleTime}>
                {formatDateTime(consignment.scheduledPickupTime)}
              </Text>
            </View>
            
            {consignment.actualPickupTime && (
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Actual Pickup</Text>
                <Text style={[styles.scheduleTime, styles.actualTime]}>
                  {formatDateTime(consignment.actualPickupTime)}
                </Text>
              </View>
            )}
            
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Scheduled Delivery</Text>
              <Text style={styles.scheduleTime}>
                {formatDateTime(consignment.scheduledDeliveryTime)}
              </Text>
            </View>
            
            {consignment.actualDeliveryTime && (
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Actual Delivery</Text>
                <Text style={[styles.scheduleTime, styles.actualTime]}>
                  {formatDateTime(consignment.actualDeliveryTime)}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Orders */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Orders ({consignment.orders.length})</Title>
          
          {consignment.orders.map((order, index) => (
            <View key={order.id}>
              <List.Item
                title={order.orderNumber}
                description={`${order.customerName} • ${order.items} items • ${order.weight} kg`}
                right={() => (
                  <View style={styles.orderValue}>
                    <Text style={styles.orderValueText}>₹{order.value.toLocaleString()}</Text>
                  </View>
                )}
                onPress={() => {
                  // Navigate to order details
                }}
              />
              {index < consignment.orders.length - 1 && <Divider />}
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.totals}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Weight</Text>
              <Text style={styles.totalValue}>{consignment.totalWeight} kg</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Value</Text>
              <Text style={styles.totalValue}>₹{consignment.totalValue.toLocaleString()}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tracking History */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Tracking History</Title>
          
          {consignment.trackingHistory.map((event, index) => (
            <View key={index} style={styles.trackingEvent}>
              <View style={styles.trackingDot} />
              <View style={styles.trackingContent}>
                <Text style={styles.trackingStatus}>{statusLabels[event.status]}</Text>
                <Text style={styles.trackingTime}>{formatDateTime(event.timestamp)}</Text>
                <Text style={styles.trackingLocation}>{event.location}</Text>
                {event.notes && (
                  <Text style={styles.trackingNotes}>{event.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {consignment.status !== 'delivered' && consignment.status !== 'cancelled' && (
        <View style={styles.actionButtons}>
          {consignment.status === 'pending' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus('assigned')}
              style={styles.actionButton}
            >
              Assign Driver
            </Button>
          )}
          
          {consignment.status === 'assigned' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus('in_transit')}
              style={styles.actionButton}
            >
              Start Transit
            </Button>
          )}
          
          {consignment.status === 'in_transit' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus('delivered')}
              style={styles.actionButton}
            >
              Mark Delivered
            </Button>
          )}
          
          <Button
            mode="outlined"
            onPress={() => handleUpdateStatus('cancelled')}
            style={[styles.actionButton, styles.cancelButton]}
            textColor="#f44336"
          >
            Cancel
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  priorityBadge: {
    backgroundColor: '#ff5722',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  driverAvatar: {
    backgroundColor: '#2196f3',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  driverActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
    padding: 8,
  },
  routeInfo: {
    marginTop: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 9,
    marginVertical: 4,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleContainer: {
    marginTop: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#333',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
  },
  actualTime: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  orderValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196f3',
    marginTop: 4,
  },
  trackingContent: {
    flex: 1,
    marginLeft: 16,
  },
  trackingStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trackingLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trackingNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  cancelButton: {
    borderColor: '#f44336',
  },
  divider: {
    marginVertical: 16,
  },
});