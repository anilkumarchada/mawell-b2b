import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  Card,
  Button,
  IconButton,
  Chip,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { Consignment } from '@/types';

type MapScreenNavigationProp = StackNavigationProp<DriverStackParamList, 'Map'>;

interface Props {
  navigation: MapScreenNavigationProp;
}

interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

interface ConsignmentMarker extends Consignment {
  coordinate: LocationCoordinate;
}

const { width, height } = Dimensions.get('window');

// Mock consignments with coordinates
const mockConsignments: ConsignmentMarker[] = [
  {
    id: '1',
    consignmentNumber: 'CON-2024-001',
    orderId: 'ORD-2024-001',
    status: 'assigned',
    priority: 'high',
    coordinate: { latitude: 19.0760, longitude: 72.8777 },
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
    ],
    totalWeight: 0.5,
    totalValue: 1299,
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
    coordinate: { latitude: 19.0896, longitude: 72.8656 },
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
    status: 'picked_up',
    priority: 'low',
    coordinate: { latitude: 19.1136, longitude: 72.8697 },
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
    ],
    totalWeight: 0.2,
    totalValue: 299,
    estimatedDeliveryTime: '2024-01-24T19:00:00Z',
    assignedAt: '2024-01-24T07:00:00Z',
    pickedUpAt: '2024-01-24T09:00:00Z',
    distance: 15.2,
    deliveryFee: 120,
  },
];

// Mock warehouse location
const warehouseLocation: LocationCoordinate = {
  latitude: 19.0825,
  longitude: 72.8417,
};

export function MapScreen({ navigation }: Props) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationCoordinate | null>(null);
  const [consignments, setConsignments] = useState<ConsignmentMarker[]>([]);
  const [selectedConsignment, setSelectedConsignment] = useState<ConsignmentMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<LocationCoordinate[]>([]);

  useEffect(() => {
    initializeMap();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const initializeMap = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your position on the map.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      setHasLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // For demo, using mock location in Mumbai
      const demoCurrentLocation = { latitude: 19.0825, longitude: 72.8417 };
      setCurrentLocation(demoCurrentLocation);

      // Load consignments
      setConsignments(mockConsignments);

      // Start location tracking
      startLocationTracking();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const getMarkerColor = (status: string, priority: string) => {
    if (status === 'delivered') return '#10B981';
    if (status === 'failed') return '#EF4444';
    if (status === 'in_transit') return '#8B5CF6';
    if (status === 'picked_up') return '#3B82F6';
    
    // For assigned status, use priority colors
    if (priority === 'high') return '#EF4444';
    if (priority === 'medium') return '#F59E0B';
    return '#10B981';
  };

  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'in_transit': return 'car';
      case 'picked_up': return 'cube';
      default: return 'location';
    }
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const showAllConsignments = () => {
    if (consignments.length > 0 && mapRef.current) {
      const coordinates = consignments.map(c => c.coordinate);
      if (currentLocation) {
        coordinates.push(currentLocation);
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  const optimizeRoute = () => {
    if (!currentLocation || consignments.length === 0) return;

    // Simple route optimization (in reality, this would use a proper algorithm)
    const pendingConsignments = consignments.filter(c => 
      c.status === 'assigned' || c.status === 'picked_up'
    );

    if (pendingConsignments.length === 0) {
      Alert.alert('No Pending Deliveries', 'All consignments have been completed.');
      return;
    }

    // Sort by priority and distance (simplified)
    const sortedConsignments = [...pendingConsignments].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.distance - b.distance;
    });

    // Create optimized route
    const route = [currentLocation];
    sortedConsignments.forEach(consignment => {
      route.push(consignment.coordinate);
    });

    setOptimizedRoute(route);
    setShowOptimizedRoute(true);

    // Fit map to show the route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(route, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }

    Alert.alert(
      'Route Optimized',
      `Optimized route for ${sortedConsignments.length} deliveries. Follow the blue line for the most efficient path.`
    );
  };

  const handleMarkerPress = (consignment: ConsignmentMarker) => {
    setSelectedConsignment(consignment);
  };

  const navigateToConsignment = (consignmentId: string) => {
    navigation.navigate('Navigation', { consignmentId });
  };

  const viewConsignmentDetails = (consignmentId: string) => {
    navigation.navigate('ConsignmentDetails', { consignmentId });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading Map...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 19.0760,
          longitude: currentLocation?.longitude || 72.8777,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        showsTraffic={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor={theme.colors.primary}
          >
            <View style={[styles.currentLocationMarker, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="navigate" size={16} color="white" />
            </View>
          </Marker>
        )}

        {/* Warehouse Marker */}
        <Marker
          coordinate={warehouseLocation}
          title="Main Warehouse"
          description="Pickup Location"
        >
          <View style={[styles.warehouseMarker, { backgroundColor: '#6B7280' }]}>
            <Ionicons name="business" size={20} color="white" />
          </View>
        </Marker>

        {/* Consignment Markers */}
        {consignments.map((consignment) => (
          <Marker
            key={consignment.id}
            coordinate={consignment.coordinate}
            onPress={() => handleMarkerPress(consignment)}
          >
            <View style={[
              styles.consignmentMarker,
              { backgroundColor: getMarkerColor(consignment.status, consignment.priority) }
            ]}>
              <Ionicons
                name={getMarkerIcon(consignment.status) as any}
                size={16}
                color="white"
              />
            </View>
            <Callout tooltip>
              <View style={[styles.callout, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.calloutTitle, { color: theme.colors.onSurface }]}>
                  {consignment.consignmentNumber}
                </Text>
                <Text style={[styles.calloutSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {consignment.deliveryAddress.name}
                </Text>
                <Text style={[styles.calloutStatus, { color: getMarkerColor(consignment.status, consignment.priority) }]}>
                  {consignment.status.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={[styles.calloutTime, { color: theme.colors.onSurfaceVariant }]}>
                  ETA: {formatTime(consignment.estimatedDeliveryTime)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Optimized Route */}
        {showOptimizedRoute && optimizedRoute.length > 1 && (
          <Polyline
            coordinates={optimizedRoute}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <IconButton
          icon="crosshairs-gps"
          size={24}
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={centerOnCurrentLocation}
        />
        <IconButton
          icon="map"
          size={24}
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={showAllConsignments}
        />
        <IconButton
          icon={showOptimizedRoute ? 'eye-off' : 'eye'}
          size={24}
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setShowOptimizedRoute(!showOptimizedRoute)}
        />
      </View>

      {/* Selected Consignment Card */}
      {selectedConsignment && (
        <Card style={[styles.selectedCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedInfo}>
                <Text style={[styles.selectedTitle, { color: theme.colors.onSurface }]}>
                  {selectedConsignment.consignmentNumber}
                </Text>
                <Text style={[styles.selectedSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedConsignment.deliveryAddress.name}
                </Text>
                <Text style={[styles.selectedAddress, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedConsignment.deliveryAddress.addressLine1}, {selectedConsignment.deliveryAddress.city}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedConsignment(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedMeta}>
              <Chip
                style={[styles.statusChip, { backgroundColor: getMarkerColor(selectedConsignment.status, selectedConsignment.priority) }]}
                textStyle={styles.statusChipText}
                compact
              >
                {selectedConsignment.status.replace('_', ' ').toUpperCase()}
              </Chip>
              <Text style={[styles.selectedDistance, { color: theme.colors.onSurfaceVariant }]}>
                {selectedConsignment.distance}km • ₹{selectedConsignment.deliveryFee}
              </Text>
            </View>

            <View style={styles.selectedActions}>
              <Button
                mode="outlined"
                onPress={() => viewConsignmentDetails(selectedConsignment.id)}
                style={styles.actionButton}
                compact
              >
                Details
              </Button>
              {(selectedConsignment.status === 'assigned' || selectedConsignment.status === 'picked_up') && (
                <Button
                  mode="contained"
                  onPress={() => navigateToConsignment(selectedConsignment.id)}
                  style={styles.actionButton}
                  icon="navigation"
                  compact
                >
                  Navigate
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Route Optimization FAB */}
      <FAB
        icon="map-marker-path"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={optimizeRoute}
        label="Optimize Route"
      />

      {/* Legend */}
      <Card style={[styles.legend, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.legendContent}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>High Priority</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>In Transit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Delivered</Text>
          </View>
        </Card.Content>
      </Card>
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
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  warehouseMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  consignmentMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  callout: {
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calloutTime: {
    fontSize: 10,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 8,
  },
  controlButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  selectedSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedAddress: {
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  selectedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {},
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedDistance: {
    fontSize: 12,
  },
  selectedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  legend: {
    position: 'absolute',
    top: 60,
    left: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  legendContent: {
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});