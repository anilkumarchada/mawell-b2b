import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  useTheme,
  ActivityIndicator,
  Card,
  Divider,
  RadioButton,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Address, PaymentMethod, Product } from '@/types';

type CheckoutScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Checkout'
>;

type CheckoutScreenRouteProp = RouteProp<
  BuyerStackParamList,
  'Checkout'
>;

interface Props {
  navigation: CheckoutScreenNavigationProp;
  route: CheckoutScreenRouteProp;
}

interface CheckoutItem {
  product: Product;
  quantity: number;
}

// Mock data
const mockAddresses: Address[] = [
  {
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
  {
    id: '2',
    type: 'work',
    name: 'John Doe',
    phone: '+91 9876543210',
    addressLine1: '456 Business Park',
    addressLine2: 'Floor 5, Office 502',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400070',
    country: 'India',
    isDefault: false,
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    provider: 'visa',
    last4: '1234',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: '2',
    type: 'upi',
    provider: 'upi',
    upiId: 'john@paytm',
    isDefault: false,
  },
];

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: '5-7 business days',
    price: 50,
    estimatedDays: '5-7',
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: '2-3 business days',
    price: 150,
    estimatedDays: '2-3',
  },
  {
    id: 'same_day',
    name: 'Same Day Delivery',
    description: 'Within 24 hours',
    price: 300,
    estimatedDays: '1',
  },
];

export function CheckoutScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { items, total } = route.params;
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [selectedAddress, setSelectedAddress] = useState<string>(addresses.find(a => a.isDefault)?.id || addresses[0]?.id || '');
  const [selectedPayment, setSelectedPayment] = useState<string>(paymentMethods.find(p => p.isDefault)?.id || paymentMethods[0]?.id || '');
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Load user addresses and payment methods
      // const [addressData, paymentData] = await Promise.all([
      //   userService.getAddresses(),
      //   userService.getPaymentMethods(),
      // ]);
      // setAddresses(addressData);
      // setPaymentMethods(paymentData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setPlacingOrder(true);
      
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        addressId: selectedAddress,
        paymentMethodId: selectedPayment,
        deliveryOption: selectedDelivery,
        subtotal: getSubtotal(),
        deliveryFee: getDeliveryFee(),
        total: getTotal(),
      };

      // Place order API call
      // const order = await orderService.createOrder(orderData);
      
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully. You will receive a confirmation shortly.',
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Catalog' },
                  { name: 'OrderDetails', params: { orderId: 'mock-order-id' } },
                ],
              });
            },
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Catalog' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    const selectedOption = deliveryOptions.find(option => option.id === selectedDelivery);
    const subtotal = getSubtotal();
    
    // Free delivery for orders above ₹500 with standard delivery
    if (selectedDelivery === 'standard' && subtotal >= 500) {
      return 0;
    }
    
    return selectedOption?.price || 0;
  };

  const getTax = () => {
    return Math.round(getSubtotal() * 0.18); // 18% GST
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee() + getTax();
  };

  const renderOrderItems = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Order Items ({items.length})
        </Text>
        
        {items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Image
              source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/60' }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            
            <View style={styles.itemDetails}>
              <Text
                style={[styles.itemName, { color: theme.colors.onSurface }]}
                numberOfLines={2}
              >
                {item.product.name}
              </Text>
              <Text style={[styles.itemBrand, { color: theme.colors.onSurfaceVariant }]}>
                {item.product.brand}
              </Text>
              <View style={styles.itemPriceRow}>
                <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                  ₹{item.product.price.toLocaleString()}
                </Text>
                <Text style={[styles.itemQuantity, { color: theme.colors.onSurfaceVariant }]}>
                  Qty: {item.quantity}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderDeliveryAddress = () => {
    const address = addresses.find(a => a.id === selectedAddress);
    
    return (
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Delivery Address
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('AddressManagement')}
              compact
            >
              Change
            </Button>
          </View>
          
          {address ? (
            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <Text style={[styles.addressName, { color: theme.colors.onSurface }]}>
                  {address.name}
                </Text>
                <Chip size="small" style={styles.addressTypeChip}>
                  {address.type.toUpperCase()}
                </Chip>
              </View>
              
              <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </Text>
              <Text style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}>
                {address.city}, {address.state} {address.pincode}
              </Text>
              <Text style={[styles.addressPhone, { color: theme.colors.onSurfaceVariant }]}>
                Phone: {address.phone}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('AddressManagement')}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
              <Text style={[styles.addAddressText, { color: theme.colors.primary }]}>
                Add Delivery Address
              </Text>
            </TouchableOpacity>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderDeliveryOptions = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Delivery Options
        </Text>
        
        <RadioButton.Group
          onValueChange={setSelectedDelivery}
          value={selectedDelivery}
        >
          {deliveryOptions.map((option) => {
            const isFree = option.id === 'standard' && getSubtotal() >= 500;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.deliveryOption}
                onPress={() => setSelectedDelivery(option.id)}
              >
                <RadioButton value={option.id} />
                <View style={styles.deliveryOptionContent}>
                  <View style={styles.deliveryOptionHeader}>
                    <Text style={[styles.deliveryOptionName, { color: theme.colors.onSurface }]}>
                      {option.name}
                    </Text>
                    <Text style={[styles.deliveryOptionPrice, { color: theme.colors.primary }]}>
                      {isFree ? 'FREE' : `₹${option.price}`}
                    </Text>
                  </View>
                  <Text style={[styles.deliveryOptionDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );

  const renderPaymentMethod = () => {
    const payment = paymentMethods.find(p => p.id === selectedPayment);
    
    return (
      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Payment Method
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('PaymentMethods')}
              compact
            >
              Change
            </Button>
          </View>
          
          {payment ? (
            <View style={styles.paymentContainer}>
              <View style={styles.paymentHeader}>
                <Ionicons
                  name={payment.type === 'card' ? 'card' : 'phone-portrait'}
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.paymentDetails}>
                  <Text style={[styles.paymentName, { color: theme.colors.onSurface }]}>
                    {payment.type === 'card'
                      ? `**** **** **** ${payment.last4}`
                      : payment.upiId}
                  </Text>
                  <Text style={[styles.paymentType, { color: theme.colors.onSurfaceVariant }]}>
                    {payment.type === 'card'
                      ? `${payment.provider?.toUpperCase()} Card`
                      : 'UPI'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
              <Text style={[styles.addPaymentText, { color: theme.colors.primary }]}>
                Add Payment Method
              </Text>
            </TouchableOpacity>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderOrderSummary = () => {
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const tax = getTax();
    const total = getTotal();
    
    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Order Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Subtotal ({items.length} items)
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              ₹{subtotal.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Delivery Fee
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString()}`}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Tax (GST 18%)
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              ₹{tax.toLocaleString()}
            </Text>
          </View>
          
          <Divider style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              ₹{total.toLocaleString()}
            </Text>
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
          Checkout
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderItems()}
        {renderDeliveryAddress()}
        {renderDeliveryOptions()}
        {renderPaymentMethod()}
        {renderOrderSummary()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.bottomActions, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.bottomTotal, { color: theme.colors.primary }]}>
            ₹{getTotal().toLocaleString()}
          </Text>
          <Text style={[styles.bottomTotalLabel, { color: theme.colors.onSurfaceVariant }]}>
            Total Amount
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={placingOrder}
          disabled={placingOrder || !selectedAddress || !selectedPayment}
          style={styles.placeOrderButton}
          contentStyle={styles.placeOrderButtonContent}
        >
          {placingOrder ? 'Placing Order...' : 'Place Order'}
        </Button>
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
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
  itemBrand: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 14,
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deliveryOptionContent: {
    flex: 1,
    marginLeft: 8,
  },
  deliveryOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryOptionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryOptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryOptionDescription: {
    fontSize: 14,
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
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addPaymentText: {
    fontSize: 16,
    fontWeight: '500',
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
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
  bottomTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomTotalLabel: {
    fontSize: 12,
  },
  placeOrderButton: {
    minWidth: 140,
  },
  placeOrderButtonContent: {
    height: 48,
  },
});