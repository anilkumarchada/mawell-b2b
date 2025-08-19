import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  useTheme,
  ActivityIndicator,
  Chip,
  Divider,
  Card,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { Product, Review } from '@/types';
import { productService } from '@/services/products';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.8;

type ProductDetailsScreenNavigationProp = StackNavigationProp<
  BuyerStackParamList,
  'ProductDetails'
>;

type ProductDetailsScreenRouteProp = RouteProp<
  BuyerStackParamList,
  'ProductDetails'
>;

interface Props {
  navigation: ProductDetailsScreenNavigationProp;
  route: ProductDetailsScreenRouteProp;
}

interface ProductSpec {
  label: string;
  value: string;
}

export function ProductDetailsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProduct(productId);
      setProduct(productData);
      
      // Load reviews
      const reviewsData = await productService.getProductReviews(productId);
      setReviews(reviewsData.data);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      // Add to cart logic here
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigation.navigate('Checkout', { 
      items: [{ product, quantity }],
      total: product.price * quantity 
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Add to favorites logic here
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product?.stock || 1, quantity + delta));
    setQuantity(newQuantity);
  };

  const renderImageGallery = () => {
    if (!product?.images?.length) return null;

    return (
      <View style={styles.imageGallery}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
        >
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {/* Image Indicators */}
        {product.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === selectedImageIndex
                        ? theme.colors.primary
                        : theme.colors.outline,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
    );
  };

  const renderProductInfo = () => {
    if (!product) return null;

    return (
      <View style={styles.productInfo}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.productName, { color: theme.colors.onSurface }]}>
              {product.name}
            </Text>
            <Text style={[styles.productBrand, { color: theme.colors.onSurfaceVariant }]}>
              by {product.brand}
            </Text>
          </View>
          <IconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? theme.colors.error : theme.colors.onSurfaceVariant}
            onPress={handleToggleFavorite}
          />
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={[styles.rating, { color: theme.colors.onSurface }]}>
              {product.rating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.reviewCount, { color: theme.colors.onSurfaceVariant }]}>
              ({product.reviewCount || 0} reviews)
            </Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>
            ₹{product.price.toLocaleString()}
          </Text>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={[styles.originalPrice, { color: theme.colors.onSurfaceVariant }]}>
              ₹{product.originalPrice.toLocaleString()}
            </Text>
          )}
          {product.discount && product.discount > 0 && (
            <Text style={[styles.savings, { color: theme.colors.error }]}>
              You save ₹{((product.originalPrice || 0) - product.price).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          <View
            style={[
              styles.stockIndicator,
              {
                backgroundColor:
                  product.stock > 10
                    ? '#4CAF50'
                    : product.stock > 0
                    ? '#FF9800'
                    : '#F44336',
              },
            ]}
          />
          <Text style={[styles.stockText, { color: theme.colors.onSurfaceVariant }]}>
            {product.stock > 10
              ? 'In Stock'
              : product.stock > 0
              ? `Only ${product.stock} left`
              : 'Out of Stock'}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuantitySelector = () => {
    if (!product || product.stock === 0) return null;

    return (
      <View style={styles.quantityContainer}>
        <Text style={[styles.quantityLabel, { color: theme.colors.onSurface }]}>
          Quantity
        </Text>
        <View style={styles.quantitySelector}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          />
          <Text style={[styles.quantityText, { color: theme.colors.onSurface }]}>
            {quantity}
          </Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => handleQuantityChange(1)}
            disabled={quantity >= (product?.stock || 0)}
          />
        </View>
      </View>
    );
  };

  const renderDescription = () => {
    if (!product?.description) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Description
        </Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {product.description}
        </Text>
      </View>
    );
  };

  const renderSpecifications = () => {
    if (!product?.specifications) return null;

    const specs: ProductSpec[] = Object.entries(product.specifications).map(
      ([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value),
      })
    );

    const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Specifications
        </Text>
        {visibleSpecs.map((spec, index) => (
          <View key={index} style={styles.specRow}>
            <Text style={[styles.specLabel, { color: theme.colors.onSurfaceVariant }]}>
              {spec.label}
            </Text>
            <Text style={[styles.specValue, { color: theme.colors.onSurface }]}>
              {spec.value}
            </Text>
          </View>
        ))}
        {specs.length > 5 && (
          <Button
            mode="text"
            onPress={() => setShowAllSpecs(!showAllSpecs)}
            style={styles.showMoreButton}
          >
            {showAllSpecs ? 'Show Less' : `Show ${specs.length - 5} More`}
          </Button>
        )}
      </View>
    );
  };

  const renderReviews = () => {
    if (!reviews.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Reviews ({reviews.length})
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('ProductReviews', { productId })}
          >
            View All
          </Button>
        </View>
        {reviews.slice(0, 3).map((review, index) => (
          <Card key={index} style={styles.reviewCard}>
            <Card.Content>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewerName, { color: theme.colors.onSurface }]}>
                  {review.userName}
                </Text>
                <View style={styles.reviewRating}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < review.rating ? 'star' : 'star-outline'}
                      size={12}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.reviewText, { color: theme.colors.onSurfaceVariant }]}>
                {review.comment}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Product not found
        </Text>
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
        <IconButton
          icon="share-variant"
          onPress={() => {/* Share logic */}}
          iconColor={theme.colors.onBackground}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderImageGallery()}
        {renderProductInfo()}
        
        <Divider style={styles.divider} />
        
        {renderQuantitySelector()}
        {renderDescription()}
        {renderSpecifications()}
        {renderReviews()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      {product.stock > 0 && (
        <View style={[styles.bottomActions, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="outlined"
            onPress={handleAddToCart}
            loading={addingToCart}
            disabled={addingToCart}
            style={styles.addToCartButton}
            contentStyle={styles.buttonContent}
          >
            Add to Cart
          </Button>
          <Button
            mode="contained"
            onPress={handleBuyNow}
            style={styles.buyNowButton}
            contentStyle={styles.buttonContent}
          >
            Buy Now
          </Button>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    position: 'relative',
    marginTop: 56,
  },
  productImage: {
    width,
    height: IMAGE_HEIGHT,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  priceContainer: {
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specLabel: {
    fontSize: 14,
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  showMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addToCartButton: {
    flex: 1,
  },
  buyNowButton: {
    flex: 1,
  },
  buttonContent: {
    height: 48,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});