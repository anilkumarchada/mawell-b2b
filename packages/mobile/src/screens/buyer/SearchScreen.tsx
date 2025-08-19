import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  Modal,
  Portal,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Product, ProductFilter } from '@/types';
import { productService } from '@/services/products';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

type SearchScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'Search'
>;

interface Props {
  navigation: SearchScreenNavigationProp;
}

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface SortOption {
  id: string;
  label: string;
  value: string;
}

const sortOptions: SortOption[] = [
  { id: 'relevance', label: 'Relevance', value: 'relevance' },
  { id: 'price_low', label: 'Price: Low to High', value: 'price_asc' },
  { id: 'price_high', label: 'Price: High to Low', value: 'price_desc' },
  { id: 'rating', label: 'Customer Rating', value: 'rating_desc' },
  { id: 'newest', label: 'Newest First', value: 'created_desc' },
  { id: 'name', label: 'Name A-Z', value: 'name_asc' },
];

const priceRanges: FilterOption[] = [
  { id: 'all', label: 'All Prices', value: null },
  { id: 'under_500', label: 'Under ₹500', value: { min: 0, max: 500 } },
  { id: '500_1000', label: '₹500 - ₹1,000', value: { min: 500, max: 1000 } },
  { id: '1000_5000', label: '₹1,000 - ₹5,000', value: { min: 1000, max: 5000 } },
  { id: '5000_10000', label: '₹5,000 - ₹10,000', value: { min: 5000, max: 10000 } },
  { id: 'above_10000', label: 'Above ₹10,000', value: { min: 10000, max: null } },
];

const ratingFilters: FilterOption[] = [
  { id: 'all', label: 'All Ratings', value: null },
  { id: '4_plus', label: '4★ & Above', value: 4 },
  { id: '3_plus', label: '3★ & Above', value: 3 },
  { id: '2_plus', label: '2★ & Above', value: 2 },
  { id: '1_plus', label: '1★ & Above', value: 1 },
];

const categories: FilterOption[] = [
  { id: 'all', label: 'All Categories', value: null },
  { id: 'electronics', label: 'Electronics', value: 'electronics' },
  { id: 'clothing', label: 'Clothing', value: 'clothing' },
  { id: 'home', label: 'Home & Garden', value: 'home' },
  { id: 'sports', label: 'Sports', value: 'sports' },
  { id: 'books', label: 'Books', value: 'books' },
];

export function SearchScreen({ navigation }: Props) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Filter states
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  
  const searchInputRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchQuery.trim()) {
      loadProducts(true);
    } else {
      setProducts([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedSort, selectedCategory, selectedPriceRange, selectedRating, inStockOnly]);

  useEffect(() => {
    // Load recent searches from storage
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    // Load from AsyncStorage
    const recent = ['smartphone', 'laptop', 'headphones', 'shoes'];
    setRecentSearches(recent);
  };

  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    // Save to AsyncStorage
  };

  const loadProducts = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const filters: ProductFilter = {
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy: selectedSort,
        page: reset ? 1 : page,
        limit: 20,
      };

      // Add price range filter
      const priceRange = priceRanges.find(p => p.id === selectedPriceRange)?.value;
      if (priceRange) {
        filters.minPrice = priceRange.min;
        filters.maxPrice = priceRange.max;
      }

      // Add rating filter
      const ratingFilter = ratingFilters.find(r => r.id === selectedRating)?.value;
      if (ratingFilter) {
        filters.minRating = ratingFilter;
      }

      // Add stock filter
      if (inStockOnly) {
        filters.inStock = true;
      }

      const response = await productService.getProducts(filters);
      
      if (reset) {
        setProducts(response.data);
        setPage(2);
      } else {
        setProducts(prev => [...prev, ...response.data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.data.length === 20);
      
      // Save search query
      if (reset) {
        saveRecentSearch(searchQuery);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'Failed to search products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSort, selectedCategory, selectedPriceRange, selectedRating, inStockOnly, page, loading]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Show suggestions for non-empty queries
    if (query.trim()) {
      setShowSuggestions(true);
      // Debounce suggestions loading
      debounceRef.current = setTimeout(() => {
        loadSuggestions(query);
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      // Mock suggestions - replace with actual API call
      const mockSuggestions = [
        `${query} case`,
        `${query} cover`,
        `${query} accessories`,
        `${query} wireless`,
        `${query} bluetooth`,
      ].filter(s => s !== query);
      setSuggestions(mockSuggestions.slice(0, 5));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
    setShowSuggestions(false);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && searchQuery.trim()) {
      loadProducts();
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    setPage(1);
    loadProducts(true);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setInStockOnly(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedPriceRange !== 'all') count++;
    if (selectedRating !== 'all') count++;
    if (inStockOnly) count++;
    return count;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { width: ITEM_WIDTH }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
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
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search" size={16} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Ionicons name="time" size={16} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.recentSearchText, { color: theme.colors.onSurface }]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderFiltersModal = () => (
    <Portal>
      <Modal
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Filters
          </Text>
          <IconButton
            icon="close"
            onPress={() => setShowFilters(false)}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.colors.onSurface }]}>
            Category
          </Text>
          <View style={styles.filterOptions}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={styles.filterChip}
              >
                {category.label}
              </Chip>
            ))}
          </View>
        </View>

        <Divider />

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.colors.onSurface }]}>
            Price Range
          </Text>
          <View style={styles.filterOptions}>
            {priceRanges.map((range) => (
              <Chip
                key={range.id}
                selected={selectedPriceRange === range.id}
                onPress={() => setSelectedPriceRange(range.id)}
                style={styles.filterChip}
              >
                {range.label}
              </Chip>
            ))}
          </View>
        </View>

        <Divider />

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.colors.onSurface }]}>
            Customer Rating
          </Text>
          <View style={styles.filterOptions}>
            {ratingFilters.map((rating) => (
              <Chip
                key={rating.id}
                selected={selectedRating === rating.id}
                onPress={() => setSelectedRating(rating.id)}
                style={styles.filterChip}
              >
                {rating.label}
              </Chip>
            ))}
          </View>
        </View>

        <Divider />

        <View style={styles.filterSection}>
          <Chip
            selected={inStockOnly}
            onPress={() => setInStockOnly(!inStockOnly)}
            style={styles.filterChip}
          >
            In Stock Only
          </Chip>
        </View>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={clearFilters}
            style={styles.clearButton}
          >
            Clear All
          </Button>
          <Button
            mode="contained"
            onPress={applyFilters}
            style={styles.applyButton}
          >
            Apply Filters
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderSortModal = () => (
    <Portal>
      <Modal
        visible={showSort}
        onDismiss={() => setShowSort(false)}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Sort By
          </Text>
          <IconButton
            icon="close"
            onPress={() => setShowSort(false)}
          />
        </View>

        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort(option.id);
              setShowSort(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                {
                  color: selectedSort === option.id
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                  fontWeight: selectedSort === option.id ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
            {selectedSort === option.id && (
              <Ionicons
                name="checkmark"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </Modal>
    </Portal>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Search Products
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
            Enter a product name, brand, or category to start searching
          </Text>
          
          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={[styles.recentTitle, { color: theme.colors.onSurface }]}>
                Recent Searches
              </Text>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item) => item}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="search-outline"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          No Results Found
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          Try adjusting your search terms or filters
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || !searchQuery.trim()) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const activeFiltersCount = getActiveFiltersCount();
  const currentSortLabel = sortOptions.find(s => s.id === selectedSort)?.label || 'Relevance';

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
        <View style={styles.searchContainer}>
          <Searchbar
            ref={searchInputRef}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            autoFocus
          />
        </View>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Filter and Sort Bar */}
      {searchQuery.trim() && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.filterButtonText, { color: theme.colors.onSurface }]}>
              Filters
            </Text>
            {activeFiltersCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSort(true)}
          >
            <Ionicons name="swap-vertical" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.sortButtonText, { color: theme.colors.onSurface }]}>
              {currentSortLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={products.length > 0 ? styles.row : undefined}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {renderFiltersModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    marginLeft: 8,
  },
  searchBar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  suggestionsContainer: {
    elevation: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    gap: 6,
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    gap: 6,
    flex: 1,
  },
  sortButtonText: {
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
    gap: 4,
  },
  rating: {
    fontSize: 12,
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
    marginBottom: 24,
  },
  recentSearches: {
    width: '100%',
    maxWidth: 300,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  recentSearchText: {
    fontSize: 16,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 0,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterSection: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sortOptionText: {
    fontSize: 16,
  },
});