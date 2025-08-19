import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Searchbar,
  Card,
  Button,
  Chip,
  useTheme,
  ActivityIndicator,
  IconButton,
  Badge,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Product, ProductFilter } from '@/types';
import { productService } from '@/services/products';
import { theme as appTheme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

type CatalogScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Catalog'
>;

interface Props {
  navigation: CatalogScreenNavigationProp;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

const mockCategories: Category[] = [
  { id: 'all', name: 'All', count: 0 },
  { id: 'electronics', name: 'Electronics', count: 245 },
  { id: 'clothing', name: 'Clothing', count: 189 },
  { id: 'home', name: 'Home & Garden', count: 156 },
  { id: 'sports', name: 'Sports', count: 98 },
  { id: 'books', name: 'Books', count: 67 },
];

export function CatalogScreen({ navigation }: Props) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [cartCount, setCartCount] = useState(3); // Mock cart count

  const loadProducts = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    try {
      const filters: ProductFilter = {
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page: reset ? 1 : page,
        limit: 20,
      };

      const response = await productService.getProducts(filters);
      
      if (reset) {
        setProducts(response.data);
        setPage(2);
      } else {
        setProducts(prev => [...prev, ...response.data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.data.length === 20);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, page, loading]);

  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadProducts(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProducts();
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { width: ITEM_WIDTH }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images?.[0] || 'https://via.placeholder.com/200' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.discount && item.discount > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.discountText}>{item.discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <Card.Content style={styles.productContent}>
          <Text
            style={[styles.productName, { color: theme.colors.onSurface }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          
          <Text
            style={[styles.productBrand, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {item.brand}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>
              ₹{item.price.toLocaleString()}
            </Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={[styles.originalPrice, { color: theme.colors.onSurfaceVariant }]}>
                ₹{item.originalPrice.toLocaleString()}
              </Text>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.rating, { color: theme.colors.onSurfaceVariant }]}>
              {item.rating?.toFixed(1) || '0.0'} ({item.reviewCount || 0})
            </Text>
          </View>

          <View style={styles.stockContainer}>
            <View
              style={[
                styles.stockIndicator,
                {
                  backgroundColor:
                    item.stock > 10
                      ? '#4CAF50'
                      : item.stock > 0
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            />
            <Text style={[styles.stockText, { color: theme.colors.onSurfaceVariant }]}>
              {item.stock > 10
                ? 'In Stock'
                : item.stock > 0
                ? `Only ${item.stock} left`
                : 'Out of Stock'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <Chip
      selected={selectedCategory === item.id}
      onPress={() => setSelectedCategory(item.id)}
      style={[
        styles.categoryChip,
        selectedCategory === item.id && {
          backgroundColor: theme.colors.primaryContainer,
        },
      ]}
      textStyle={[
        styles.categoryText,
        {
          color:
            selectedCategory === item.id
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurfaceVariant,
        },
      ]}
    >
      {item.name}
    </Chip>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={handleSearchPress}
        activeOpacity={0.7}
      >
        <Searchbar
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesList}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !refreshing) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cube-outline"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          No Products Found
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          Try adjusting your search or category filter
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with Cart */}
      <View style={styles.topHeader}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Catalog
        </Text>
        <TouchableOpacity onPress={handleCartPress} style={styles.cartButton}>
          <IconButton
            icon="cart-outline"
            size={24}
            iconColor={theme.colors.onBackground}
          />
          {cartCount > 0 && (
            <Badge style={styles.cartBadge} size={18}>
              {cartCount}
            </Badge>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  header: {
    paddingBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoriesList: {
    flexGrow: 0,
  },
  categoryChip: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  rating: {
    fontSize: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});