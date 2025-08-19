import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Operations Screens
import { DashboardScreen } from '@/screens/operations/DashboardScreen';
import { InventoryScreen } from '@/screens/operations/InventoryScreen';
import { ProductDetailScreen } from '@/screens/operations/ProductDetailScreen';
import { AddProductScreen } from '@/screens/operations/AddProductScreen';
import { OrdersScreen } from '@/screens/operations/OrdersScreen';
import { OrderDetailsScreen } from '@/screens/operations/OrderDetailsScreen';
import { ConsignmentsScreen } from '@/screens/operations/ConsignmentsScreen';
import { ConsignmentDetailsScreen } from '@/screens/operations/ConsignmentDetailsScreen';
import { ReportsScreen } from '@/screens/operations/ReportsScreen';
import { ProfileScreen } from '@/screens/operations/ProfileScreen';
import { WarehouseScreen } from '@/screens/operations/WarehouseScreen';
import { ScannerScreen } from '@/screens/operations/ScannerScreen';
import { StockAdjustmentScreen } from '@/screens/operations/StockAdjustmentScreen';

export type OperationsStackParamList = {
  // Tab Screens
  DashboardTab: undefined;
  InventoryTab: undefined;
  OrdersTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
  
  // Stack Screens
  ProductDetail: {
    productId: string;
  };
  AddProduct: undefined;
  OrderDetail: {
    orderId: string;
  };
  ConsignmentDetail: {
    consignmentId: string;
  };
  Warehouse: {
    warehouseId: string;
  };
  Scanner: {
    mode: 'inventory' | 'order' | 'consignment';
  };
  StockAdjustment: {
    productId: string;
    warehouseId: string;
  };
  Consignments: undefined;
};

const Tab = createBottomTabNavigator<OperationsStackParamList>();
const Stack = createStackNavigator<OperationsStackParamList>();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardTab" component={DashboardScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
    </Stack.Navigator>
  );
}

function InventoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventoryTab" component={InventoryScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="Warehouse" component={WarehouseScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersTab" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailsScreen} />
      <Stack.Screen name="Consignments" component={ConsignmentsScreen} />
      <Stack.Screen name="ConsignmentDetails" component={ConsignmentDetailsScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsTab" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileTab" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export function OperationsNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'InventoryTab':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'OrdersTab':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'ReportsTab':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
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
        name="DashboardTab"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryStack}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}