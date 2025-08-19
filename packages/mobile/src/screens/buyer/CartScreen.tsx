import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  useTheme,
  ActivityIndicator,
  Card,
  Divider,
  Checkbox,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { CartItem, Product } from '@/types';

type CartScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Cart'
>;

interface Props {
  navigation: CartScreenNavigationProp;
}

interface CartItemWithProduct extends CartItem {
  product: Product;
}

// Mock cart data
const mockCartItems: CartItemWithProduct[] = [
  {
    id: '1',
    productId: 'prod1',
    quantity: 2,
    price: 25999,
    product: {
      id: 'prod1',
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      price: 25999,
      originalPrice: 29999,
      discount: 13,
      images: ['https://via.placeholder.com/200'],
      stock: 10,
      rating: 4.8,
      reviewCount: 1250,
      description: 'Latest iPhone with advanced features',
      category: 'electronics',
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: '2',
    productId: 'prod2',
    quantity: 1,
    price: 1299,
    product: {
      id: 'prod2',
      name: 'Wireless Bluetooth Headphones',
      brand: 'Sony',
      price: 1299,
      originalPrice: 1599,
      discount: 19,
      images: ['https://via.placeholder.com/200'],
      stock: 25,
      rating: 4.5,
      reviewCount: 890,
      description: 'Premium wireless headphones with noise cancellation',
      category: 'electronics',
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: '3',
    productId: 'prod3',
    quantity: 3,
    price: 899,
    product: {
      id: 'prod3',
      name: 'Cotton T-Shirt',
      brand: 'Nike',
      price: 899,
      originalPrice: 1199,
      discount: 25,
      images: ['https://via.placeholder.com/200'],
      stock: 0, // Out of stock
      rating: 4.2,
      reviewCount: 456,
      description: 'Comfortable cotton t-shirt for everyday wear',
      category: 'clothing',
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

export function CartScreen({ navigation }: Props) {
  const theme = useTheme();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>(mockCartItems);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Initialize with all available items selected
    const availableItems = cartItems.filter(item => item.product.stock > 0);
    setSelectedItems(availableItems.map(item => item.id));
    setSelectAll(availableItems.length === cartItems.filter(item => item.product.stock > 0).length);
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      // Load cart from API
      // const cartData = await cartService.getCart();
      // setCartItems(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      showSnackbar('Failed to load cart');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    if (newQuantity > item.product.stock) {
      showSnackbar(`Only ${item.product.stock} items available`);
      return;
    }

    try {
      setUpdatingItem(itemId);
      // Update quantity in API
      // await cartService.updateQuantity(itemId, newQuantity);
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      showSnackbar('Failed to update quantity');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from API
              // await cartService.removeItem(itemId);
              
              setCartItems(prev => prev.filter(item => item.id !== itemId));
              setSelectedItems(prev => prev.filter(id => id !== itemId));
              showSnackbar('Item removed from cart');
            } catch (error) {
              console.error('Error removing item:', error);
              showSnackbar('Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleSelectItem = (itemId: string) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item || item.product.stock === 0) return;

    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      const availableItems = cartItems.filter(item => item.product.stock > 0);
      setSelectAll(newSelected.length === availableItems.length);
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const availableItems = cartItems.filter(item => item.product.stock > 0);
    
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
      setSelectAll(true);
    }
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      showSnackbar('Please select items to checkout');
      return;
    }

    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
    const total = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    navigation.navigate('Checkout', {
      items: selectedCartItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
      })),
      total,
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const getSubtotal = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = cartItems.find(item => item.id === itemId);
      return item ? total + (item.price * item.quantity) : total;
    }, 0);
  };

  const getSavings = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = cartItems.find(item => item.id === itemId);
      if (!item || !item.product.originalPrice) return total;
      const savings = (item.product.originalPrice - item.price) * item.quantity;
      return total + savings;
    }, 0);
  };

  const renderCartItem = (item: CartItemWithProduct) => {
    const isSelected = selectedItems.includes(item.id);
    const isOutOfStock = item.product.stock === 0;
    const isUpdating = updatingItem === item.id;

    return (
      <Card key={item.id} style={[styles.cartItem, isOutOfStock && styles.outOfStockItem]}>
        <View style={styles.itemContent}>
          {/* Checkbox */}
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => handleSelectItem(item.id)}
            disabled={isOutOfStock}
          />

          {/* Product Image */}
          <TouchableOpacity
            onPress={() => handleProductPress(item.product.id)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/80' }}
              style={[styles.productImage, isOutOfStock && styles.outOfStockImage]}
              resizeMode="cover"
            />
            {isOutOfStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Product Details */}
          <View style={styles.productDetails}>
            <TouchableOpacity onPress={() => handleProductPress(item.product.id)}>
              <Text
                style={[
                  styles.productName,
                  { color: theme.colors.onSurface },
                  isOutOfStock && { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {item.product.name}
              </Text>
              <Text
                style={[
                  styles.productBrand,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.product.brand}
              </Text>
            </TouchableOpacity>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text
                style={[
                  styles.currentPrice,
                  { color: theme.colors.primary },
                  isOutOfStock && { color: theme.colors.onSurfaceVariant },
                ]}
              >
                ₹{item.price.toLocaleString()}
              </Text>
              {item.product.originalPrice && item.product.originalPrice > item.price && (
                <Text
                  style={[
                    styles.originalPrice,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  ₹{item.product.originalPrice.toLocaleString()}
                </Text>
              )}
            </View>

            {/* Quantity Controls */}
            <View style={styles.quantityContainer}>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={16}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isOutOfStock || isUpdating || item.quantity <= 1}
                  style={styles.quantityButton}
                />
                <Text
                  style={[
                    styles.quantityText,
                    { color: theme.colors.onSurface },
                    isOutOfStock && { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {item.quantity}
                </Text>
                <IconButton
                  icon="plus"
                  size={16}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isOutOfStock || isUpdating || item.quantity >= item.product.stock}
                  style={styles.quantityButton}
                />
              </View>
              
              {isUpdating && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>
          </View>

          {/* Remove Button */}
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => handleRemoveItem(item.id)}
            iconColor={theme.colors.error}
            style={styles.removeButton}
          />
        </View>

        {/* Stock Warning */}
        {!isOutOfStock && item.product.stock <= 5 && (
          <View style={[styles.stockWarning, { backgroundColor: `${theme.colors.error}10` }]}>
            <Ionicons name="warning" size={16} color={theme.colors.error} />
            <Text style={[styles.stockWarningText, { color: theme.colors.error }]}>
              Only {item.product.stock} left in stock
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderSummary = () => {
    const subtotal = getSubtotal();
    const savings = getSavings();
    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery above ₹500
    const total = subtotal + deliveryFee;

    if (selectedItems.length === 0) return null;

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
            Order Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Subtotal ({selectedItems.length} items)
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              ₹{subtotal.toLocaleString()}
            </Text>
          </View>

          {savings > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.error }]}>
                You Save
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                -₹{savings.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Delivery Fee
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              ₹{total.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="cart-outline"
        size={80}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
        Add some products to get started
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Catalog')}
        style={styles.shopButton}
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

  if (cartItems.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            iconColor={theme.colors.onBackground}
          />
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Cart
          </Text>
          <View style={styles.placeholder} />
        </View>
        {renderEmptyCart()}
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
          Cart ({cartItems.length})
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Select All */}
      <View style={styles.selectAllContainer}>
        <Checkbox
          status={selectAll ? 'checked' : 'unchecked'}
          onPress={handleSelectAll}
        />
        <Text style={[styles.selectAllText, { color: theme.colors.onSurface }]}>
          Select All ({cartItems.filter(item => item.product.stock > 0).length} available)
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.cartItems}>
          {cartItems.map(renderCartItem)}
        </View>

        {/* Summary */}
        {renderSummary()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Checkout Button */}
      {selectedItems.length > 0 && (
        <View style={[styles.checkoutContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.checkoutInfo}>
            <Text style={[styles.checkoutTotal, { color: theme.colors.primary }]}>
              ₹{(getSubtotal() + (getSubtotal() > 500 ? 0 : 50)).toLocaleString()}
            </Text>
            <Text style={[styles.checkoutItems, { color: theme.colors.onSurfaceVariant }]}>
              {selectedItems.length} items selected
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleCheckout}
            style={styles.checkoutButton}
            contentStyle={styles.checkoutButtonContent}
          >
            Checkout
          </Button>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  cartItems: {
    paddingHorizontal: 16,
  },
  cartItem: {
    marginBottom: 12,
  },
  outOfStockItem: {
    opacity: 0.6,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  outOfStockImage: {
    opacity: 0.5,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  outOfStockText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  removeButton: {
    margin: 0,
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  stockWarningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  checkoutContainer: {
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
  checkoutInfo: {
    flex: 1,
    marginRight: 16,
  },
  checkoutTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutItems: {
    fontSize: 12,
  },
  checkoutButton: {
    minWidth: 120,
  },
  checkoutButtonContent: {
    height: 48,
  },
  emptyContainer: {
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
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 24,
  },
});