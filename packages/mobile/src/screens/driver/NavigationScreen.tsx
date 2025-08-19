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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DriverStackParamList } from '@/navigation/DriverNavigator';
import { Consignment } from '@/types';

type NavigationScreenNavigationProp = StackNavigationProp<
  DriverStackParamList,
  'Navigation'
>;

type NavigationScreenRouteProp = RouteProp<
  DriverStackParamList,
  'Navigation'
>;

interface Props {
  navigation: NavigationScreenNavigationProp;
  route: NavigationScreenRouteProp;
}

interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

interface NavigationState {
  currentLocation: LocationCoordinate | null;
  destination: LocationCoordinate | null;
  route: LocationCoordinate[];
  distance: number;
  duration: number;
  isNavigating: boolean;
  hasLocationPermission: boolean;
}

const { width, height } = Dimensions.get('window');

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
  items: [],
  totalWeight: 0.9,
  totalValue: 2597,
  estimatedDeliveryTime: '2024-01-25T18:00:00Z',
  assignedAt: '2024-01-24T09:00:00Z',
  distance: 12.5,
  deliveryFee: 150,
};

// Mock coordinates for Mumbai locations
const mockDestination: LocationCoordinate = {
  latitude: 19.0760,
  longitude: 72.8777,
};

const mockRoute: LocationCoordinate[] = [
  { latitude: 19.0896, longitude: 72.8656 }, // Starting point
  { latitude: 19.0850, longitude: 72.8700 },
  { latitude: 19.0800, longitude: 72.8750 },
  { latitude: 19.0760, longitude: 72.8777 }, // Destination
];

export function NavigationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { consignmentId } = route.params;
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentLocation: null,
    destination: null,
    route: [],
    distance: 0,
    duration: 0,
    isNavigating: false,
    hasLocationPermission: false,
  });

  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeNavigation();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const initializeNavigation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required for navigation.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      setNavigationState(prev => ({ ...prev, hasLocationPermission: true }));

      // Load consignment details
      // const consignmentData = await consignmentService.getConsignmentDetails(consignmentId);
      // setConsignment(consignmentData);
      
      // Using mock data
      setConsignment(mockConsignment);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // For demo, using mock coordinates
      const demoCurrentLocation = { latitude: 19.0896, longitude: 72.8656 };

      setNavigationState(prev => ({
        ...prev,
        currentLocation: demoCurrentLocation,
        destination: mockDestination,
        route: mockRoute,
        distance: 12.5,
        duration: 25,
      }));

      // Start location tracking
      startLocationTracking();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing navigation:', error);
      Alert.alert('Error', 'Failed to initialize navigation.');
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setNavigationState(prev => ({
            ...prev,
            currentLocation: newLocation,
          }));

          // Update route and ETA based on new location
          updateRouteAndETA(newLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const updateRouteAndETA = (currentLocation: LocationCoordinate) => {
    // In a real app, this would call a routing service like Google Directions API
    // For now, we'll simulate route updates
    
    // Calculate remaining distance (simplified)
    const remainingDistance = calculateDistance(
      currentLocation,
      navigationState.destination!
    );
    
    // Estimate remaining time (assuming 30 km/h average speed)
    const remainingTime = Math.round((remainingDistance / 30) * 60);
    
    setNavigationState(prev => ({
      ...prev,
      distance: remainingDistance,
      duration: remainingTime,
    }));
  };

  const calculateDistance = (point1: LocationCoordinate, point2: LocationCoordinate): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startNavigation = () => {
    setNavigationState(prev => ({ ...prev, isNavigating: true }));
    
    // Center map on current location
    if (navigationState.currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...navigationState.currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const stopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          onPress: () => {
            setNavigationState(prev => ({ ...prev, isNavigating: false }));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const centerOnCurrentLocation = () => {
    if (navigationState.currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...navigationState.currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const centerOnDestination = () => {
    if (navigationState.destination && mapRef.current) {
      mapRef.current.animateToRegion({
        ...navigationState.destination,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const showFullRoute = () => {
    if (navigationState.currentLocation && navigationState.destination && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [navigationState.currentLocation, navigationState.destination],
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        }
      );
    }
  };

  const handleArrived = () => {
    Alert.alert(
      'Arrived at Destination',
      'Have you arrived at the delivery location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: () => {
            navigation.navigate('DeliveryConfirmation', { consignmentId });
          },
        },
      ]
    );
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Initializing Navigation...
        </Text>
      </SafeAreaView>
    );
  }

  if (!navigationState.hasLocationPermission) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="location-outline" size={64} color={theme.colors.onSurfaceVariant} />
        <Text style={[styles.errorTitle, { color: theme.colors.onSurface }]}>
          Location Permission Required
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.onSurfaceVariant }]}>
          Please enable location permissions to use navigation.
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
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: navigationState.currentLocation?.latitude || 19.0760,
          longitude: navigationState.currentLocation?.longitude || 72.8777,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
        followsUserLocation={navigationState.isNavigating}
      >
        {/* Current Location Marker */}
        {navigationState.currentLocation && (
          <Marker
            coordinate={navigationState.currentLocation}
            title="Your Location"
            pinColor={theme.colors.primary}
          >
            <View style={[styles.currentLocationMarker, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="navigate" size={16} color="white" />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {navigationState.destination && (
          <Marker
            coordinate={navigationState.destination}
            title="Delivery Location"
            description={consignment?.deliveryAddress.name}
            pinColor={theme.colors.error}
          >
            <View style={[styles.destinationMarker, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="location" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {navigationState.route.length > 0 && (
          <Polyline
            coordinates={navigationState.route}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Navigation Info Card */}
      <Card style={[styles.navigationCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.navigationContent}>
          <View style={styles.navigationInfo}>
            <View style={styles.navigationStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {navigationState.distance.toFixed(1)} km
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Distance
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {formatDuration(navigationState.duration)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  ETA
                </Text>
              </View>
            </View>
            
            <View style={styles.destinationInfo}>
              <Text style={[styles.destinationName, { color: theme.colors.onSurface }]}>
                {consignment?.deliveryAddress.name}
              </Text>
              <Text style={[styles.destinationAddress, { color: theme.colors.onSurfaceVariant }]}>
                {consignment?.deliveryAddress.addressLine1}, {consignment?.deliveryAddress.city}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <View style={styles.mapControls}>
          <IconButton
            icon="crosshairs-gps"
            size={24}
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={centerOnCurrentLocation}
          />
          <IconButton
            icon="map-marker"
            size={24}
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={centerOnDestination}
          />
          <IconButton
            icon="map"
            size={24}
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={showFullRoute}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.actionButtons}>
          {!navigationState.isNavigating ? (
            <>
              <Button
                mode="outlined"
                onPress={stopNavigation}
                style={styles.secondaryButton}
                icon="close"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={startNavigation}
                style={styles.primaryButton}
                icon="navigation"
              >
                Start Navigation
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="outlined"
                onPress={stopNavigation}
                style={styles.secondaryButton}
                icon="stop"
              >
                Stop
              </Button>
              <Button
                mode="contained"
                onPress={handleArrived}
                style={styles.primaryButton}
                icon="checkmark"
              >
                I've Arrived
              </Button>
            </>
          )}
        </View>
      </View>

      {/* Status Indicator */}
      {navigationState.isNavigating && (
        <View style={[styles.statusIndicator, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="navigation" size={16} color="white" />
          <Text style={styles.statusText}>Navigating</Text>
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
    padding: 32,
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
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  navigationCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  navigationContent: {
    paddingVertical: 12,
  },
  navigationInfo: {
    gap: 12,
  },
  navigationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  destinationInfo: {
    alignItems: 'center',
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 12,
    textAlign: 'center',
  },
  controlButtons: {
    position: 'absolute',
    right: 16,
    bottom: 120,
  },
  mapControls: {
    gap: 8,
  },
  controlButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flex: 1,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
  },
});