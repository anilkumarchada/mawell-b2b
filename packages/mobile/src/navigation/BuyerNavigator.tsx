import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Buyer Screens
import { CatalogScreen } from '@/screens/buyer/CatalogScreen';
import { ProductDetailsScreen } from '@/screens/buyer/ProductDetailsScreen';
import { CartScreen } from '@/screens/buyer/CartScreen';
import { CheckoutScreen } from '@/screens/buyer/CheckoutScreen';
import { OrdersScreen } from '@/screens/buyer/OrdersScreen';
import { OrderDetailsScreen } from '@/screens/buyer/OrderDetailsScreen';
import { ProfileScreen } from '@/screens/buyer/ProfileScreen';
import { SearchScreen } from '@/screens/buyer/SearchScreen';
import { CategoryScreen } from '@/screens/buyer/CategoryScreen';
import { AddressManagementScreen } from '@/screens/buyer/AddressManagementScreen';
import { PaymentMethodsScreen } from '@/screens/buyer/PaymentMethodsScreen';

export type BuyerStackParamList = {
  // Tab Screens
  CatalogTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
  
  // Stack Screens
  ProductDetail: {
    productId: string;
  };
  Search: {
    query?: string;
  };
  Category: {
    categoryId: string;
    categoryName: string;
  };
  Checkout: undefined;
  OrderDetail: {
    orderId: string;
  };
  AddressManagement: undefined;
  PaymentMethods: undefined;
};

const Tab = createBottomTabNavigator<BuyerStackParamList>();
const Stack = createStackNavigator<BuyerStackParamList>();

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CatalogTab" component={CatalogScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartTab" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersTab" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileTab" component={ProfileScreen} />
      <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </Stack.Navigator>
  );
}

export function BuyerNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'CatalogTab':
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            case 'CartTab':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'OrdersTab':
              iconName = focused ? 'receipt' : 'receipt-outline';
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
        name="CatalogTab"
        component={CatalogStack}
        options={{ tabBarLabel: 'Catalog' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{ tabBarLabel: 'Cart' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}