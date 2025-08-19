import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Driver Screens
import { ConsignmentsScreen } from '@/screens/driver/ConsignmentsScreen';
import { ConsignmentDetailsScreen } from '@/screens/driver/ConsignmentDetailsScreen';
import { MapScreen } from '@/screens/driver/MapScreen';
import { NavigationScreen } from '@/screens/driver/NavigationScreen';
import { ProfileScreen } from '@/screens/driver/ProfileScreen';
import { DeliveryConfirmationScreen } from '@/screens/driver/DeliveryConfirmationScreen';
import { EarningsScreen } from '@/screens/driver/EarningsScreen';
import { VehicleInfoScreen } from '@/screens/driver/VehicleInfoScreen';
import { DocumentsScreen } from '@/screens/driver/DocumentsScreen';

export type DriverStackParamList = {
  // Tab Screens
  ConsignmentsTab: undefined;
  MapTab: undefined;
  ProfileTab: undefined;
  
  // Stack Screens
  ConsignmentDetail: {
    consignmentId: string;
  };
  Navigation: {
    consignmentId: string;
    destination: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  DeliveryConfirmation: {
    consignmentId: string;
    orderId: string;
  };
  Earnings: undefined;
  VehicleInfo: undefined;
  Documents: undefined;
};

const Tab = createBottomTabNavigator<DriverStackParamList>();
const Stack = createStackNavigator<DriverStackParamList>();

function ConsignmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConsignmentsTab" component={ConsignmentsScreen} />
      <Stack.Screen name="ConsignmentDetail" component={ConsignmentDetailsScreen} />
      <Stack.Screen name="Navigation" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmationScreen} />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapTab" component={MapScreen} />
      <Stack.Screen name="Navigation" component={NavigationScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileTab" component={ProfileScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
    </Stack.Navigator>
  );
}

export function DriverNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'ConsignmentsTab':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'MapTab':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      })}
    >
      <Tab.Screen
        name="ConsignmentsTab"
        component={ConsignmentsStack}
        options={{ tabBarLabel: 'Deliveries' }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}