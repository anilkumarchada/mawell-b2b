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
  FAB,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { Product } from '@/types';

type InventoryScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'Inventory'>;

interface Props {
  navigation: InventoryScreenNavigationProp;
}

interface InventoryItem extends Product {
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  lastRestocked: string;
  location: string;
  supplier: string;
  costPrice: number;
}

interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  timestamp: string;
  userId: string;
  userName: string;
}

type FilterType = 'all' | 'low_stock' | 'out_of_stock' | 'overstocked';
type SortType = 'name' | 'stock' | 'price' | 'updated';

// Mock inventory data
const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 1299,
    originalPrice: 1599,
    discount: 19,
    images: ['https://via.placeholder.com/300x300'],
    category: 'Electronics',
    brand: 'TechBrand',
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    stockCount: 3,
    specifications: {},
    features: [],
    currentStock: 3,
    minStockLevel: 10,
    maxStockLevel: 100,
    reorderPoint: 15,
    lastRestocked: '2024-01-20T10:00:00Z',
    location: 'A-1-001',
    supplier: 'TechSupplier Ltd',
    costPrice: 950,
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitor',
    price: 2499,
    originalPrice: 2999,
    discount: 17,
    images: ['https://via.placeholder.com/300x300'],
    category: 'Electronics',
    brand: 'FitTech',
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
    stockCount: 25,
    specifications: {},
    features: [],
    currentStock: 25,
    minStockLevel: 20,
    maxStockLevel: 80,
    reorderPoint: 30,
    lastRestocked: '2024-01-22T14:30:00Z',
    location: 'A-2-015',
    supplier: 'FitTech Distributors',
    costPrice: 1800,
  },
  {
    id: '3',
    name: 'Bluetooth Speaker',
    description: 'Portable wireless speaker with excellent sound quality',
    price: 899,
    originalPrice: 1199,
    discount: 25,
    images: ['https://via.placeholder.com/300x300'],
    category: 'Electronics',
    brand: 'SoundMax',
    rating: 4.2,
    reviewCount: 156,
    inStock: false,
    stockCount: 0,
    specifications: {},
    features: [],
    currentStock: 0,
    minStockLevel: 15,
    maxStockLevel: 60,
    reorderPoint: 20,
    lastRestocked: '2024-01-15T09:00:00Z',
    location: 'B-1-008',
    supplier: 'Audio Solutions',
    costPrice: 650,
  },
  {
    id: '4',
    name: 'USB-C Cable',
    description: 'High-speed USB-C charging and data cable',
    price: 299,
    originalPrice: 399,
    discount: 25,
    images: ['https://via.placeholder.com/300x300'],
    category: 'Accessories',
    brand: 'CableTech',
    rating: 4.0,
    reviewCount: 234,
    inStock: true,
    stockCount: 150,
    specifications: {},
    features: [],
    currentStock: 150,
    minStockLevel: 50,
    maxStockLevel: 200,
    reorderPoint: 75,
    lastRestocked: '2024-01-23T11:15:00Z',
    location: 'C-3-025',
    supplier: 'Cable Distributors',
    costPrice: 180,
  },
];

export function InventoryScreen({ navigation }: Props) {
  const theme = useTheme();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    filterAndSortItems();
  }, [inventoryItems, searchQuery, filter, sortBy]);

  const filterAndSortItems = () => {
    let filtered = [...inventoryItems];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply stock filter
    switch (filter) {
      case 'low_stock':
        filtered = filtered.filter(item => 
          item.currentStock > 0 && item.currentStock <= item.reorderPoint
        );
        break;
      case 'out_of_stock':
        filtered = filtered.filter(item => item.currentStock === 0);
        break;
      case 'overstocked':
        filtered = filtered.filter(item => item.currentStock > item.maxStockLevel);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return a.currentStock - b.currentStock;
        case 'price':
          return a.price - b.price;
        case 'updated':
          return new Date(b.lastRestocked).getTime() - new Date(a.lastRestocked).getTime();
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'Out of Stock', color: '#EF4444' };
    if (item.currentStock <= item.reorderPoint) return { status: 'Low Stock', color: '#F59E0B' };
    if (item.currentStock > item.maxStockLevel) return { status: 'Overstocked', color: '#8B5CF6' };
    return { status: 'In Stock', color: '#10B981' };
  };

  const handleStockAdjustment = () => {
    if (!selectedItem || !stockAdjustment || !adjustmentReason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const adjustment = parseInt(stockAdjustment);
    if (isNaN(adjustment) || adjustment <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const newStock = adjustmentType === 'add' 
      ? selectedItem.currentStock + adjustment
      : Math.max(0, selectedItem.currentStock - adjustment);

    // Update inventory
    setInventoryItems(prev => prev.map(item => 
      item.id === selectedItem.id 
        ? { ...item, currentStock: newStock, inStock: newStock > 0, stockCount: newStock }
        : item
    ));

    // Reset modal
    setShowStockModal(false);
    setSelectedItem(null);
    setStockAdjustment('');
    setAdjustmentReason('');
    
    Alert.alert('Success', `Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
  };

  const openStockModal = (item: InventoryItem, type: 'add' | 'remove') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setShowStockModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <Card style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemBrand, { color: theme.colors.onSurfaceVariant }]}>
                {item.brand} • {item.category}
              </Text>
              <Text style={[styles.itemLocation, { color: theme.colors.onSurfaceVariant }]}>
                Location: {item.location}
              </Text>
              <View style={styles.itemPricing}>
                <Text style={[styles.itemPrice, { color: theme.colors.onSurface }]}>
                  {formatCurrency(item.price)}
                </Text>
                <Text style={[styles.itemCost, { color: theme.colors.onSurfaceVariant }]}>
                  Cost: {formatCurrency(item.costPrice)}
                </Text>
              </View>
            </View>
            <View style={styles.itemActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => Alert.alert('Edit Product', 'Product editing will be implemented')}
              />
            </View>
          </View>
          
          <View style={styles.stockInfo}>
            <View style={styles.stockDetails}>
              <View style={styles.stockItem}>
                <Text style={[styles.stockLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Current Stock
                </Text>
                <Text style={[styles.stockValue, { color: theme.colors.onSurface }]}>
                  {item.currentStock} units
                </Text>
              </View>
              
              <View style={styles.stockItem}>
                <Text style={[styles.stockLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Reorder Point
                </Text>
                <Text style={[styles.stockValue, { color: theme.colors.onSurface }]}>
                  {item.reorderPoint} units
                </Text>
              </View>
              
              <View style={styles.stockItem}>
                <Text style={[styles.stockLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Last Restocked
                </Text>
                <Text style={[styles.stockValue, { color: theme.colors.onSurface }]}>
                  {formatDate(item.lastRestocked)}
                </Text>
              </View>
            </View>
            
            <Chip
              style={[styles.statusChip, { backgroundColor: stockStatus.color }]}
              textStyle={styles.statusChipText}
              compact
            >
              {stockStatus.status}
            </Chip>
          </View>
          
          <View style={styles.itemFooter}>
            <Button
              mode="outlined"
              onPress={() => openStockModal(item, 'add')}
              style={styles.actionButton}
              icon="plus"
              compact
            >
              Add Stock
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => openStockModal(item, 'remove')}
              style={styles.actionButton}
              icon="minus"
              compact
              disabled={item.currentStock === 0}
            >
              Remove Stock
            </Button>
            
            {stockStatus.status === 'Low Stock' && (
              <Button
                mode="contained"
                onPress={() => Alert.alert('Reorder', `Reorder ${item.name}?`)}
                style={styles.actionButton}
                icon="refresh"
                compact
              >
                Reorder
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'overstocked', label: 'Overstocked' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search and Filters */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filters}>
          <SegmentedButtons
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
            buttons={filterButtons}
            style={styles.segmentedButtons}
          />
        </View>
        
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.colors.onSurfaceVariant }]}>
            Sort by:
          </Text>
          <Button
            mode="outlined"
            onPress={() => {
              Alert.alert(
                'Sort Options',
                'Choose sorting option',
                [
                  { text: 'Name', onPress: () => setSortBy('name') },
                  { text: 'Stock Level', onPress: () => setSortBy('stock') },
                  { text: 'Price', onPress: () => setSortBy('price') },
                  { text: 'Last Updated', onPress: () => setSortBy('updated') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            compact
          >
            {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </Button>
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredItems}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No products found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      {/* Add Product FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => Alert.alert('Add Product', 'Product creation will be implemented')}
        label="Add Product"
      />

      {/* Stock Adjustment Modal */}
      <Portal>
        <Modal
          visible={showStockModal}
          onDismiss={() => setShowStockModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Text>
          
          {selectedItem && (
            <View style={styles.modalContent}>
              <Text style={[styles.modalProductName, { color: theme.colors.onSurface }]}>
                {selectedItem.name}
              </Text>
              <Text style={[styles.modalCurrentStock, { color: theme.colors.onSurfaceVariant }]}>
                Current Stock: {selectedItem.currentStock} units
              </Text>
              
              <TextInput
                label="Quantity"
                value={stockAdjustment}
                onChangeText={setStockAdjustment}
                keyboardType="numeric"
                style={styles.modalInput}
              />
              
              <TextInput
                label="Reason"
                value={adjustmentReason}
                onChangeText={setAdjustmentReason}
                multiline
                numberOfLines={3}
                style={styles.modalInput}
              />
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowStockModal(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleStockAdjustment}
                  style={styles.modalButton}
                >
                  {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
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
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemPricing: {
    flexDirection: 'row',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemCost: {
    fontSize: 12,
  },
  itemActions: {
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  stockDetails: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {},
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemFooter: {
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
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    gap: 12,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCurrentStock: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalInput: {},
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});