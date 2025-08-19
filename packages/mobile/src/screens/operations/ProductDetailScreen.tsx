import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import { Product } from '@/types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    Dialog,
    FAB,
    Paragraph,
    Portal,
    Title
} from 'react-native-paper';

type ProductDetailScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<OperationsStackParamList, 'ProductDetail'>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Mock product data
      const mockProduct: Product = {
        id: productId,
        name: 'Premium Rice 25kg',
        description: 'High quality basmati rice, perfect for daily consumption',
        category: 'Grains',
        brand: 'Golden Harvest',
        sku: 'GH-RICE-25KG',
        price: 2500,
        mrp: 2800,
        unit: 'kg',
        weight: 25,
        dimensions: { length: 50, width: 30, height: 10, unit: 'cm' },
        images: ['https://via.placeholder.com/300x300'],
        stock: 150,
        minStock: 20,
        maxStock: 500,
        isActive: true,
        tags: ['premium', 'basmati', 'rice'],
        gstRate: 5,
        hsnCode: '1006',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
      };
      setProduct(mockProduct);
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustment || !adjustmentReason) {
      Alert.alert('Error', 'Please enter adjustment amount and reason');
      return;
    }

    Alert.alert(
      'Confirm Stock Adjustment',
      `Adjust stock by ${stockAdjustment} units?\nReason: ${adjustmentReason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Handle stock adjustment
            setStockModalVisible(false);
            setStockAdjustment('');
            setAdjustmentReason('');
            Alert.alert('Success', 'Stock adjusted successfully');
          },
        },
      ]
    );
  };

  const handleEditProduct = () => {
    setEditModalVisible(true);
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Product deleted successfully');
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const stockStatus = product?.stock && product?.minStock && product.stock <= product.minStock ? 'low' : 'normal';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Product Image */}
        <Image source={{ uri: product.images[0] }} style={styles.productImage} />

        {/* Product Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{product.name}</Title>
            <Paragraph style={styles.description}>{product.description}</Paragraph>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{product.price}</Text>
              <Text style={styles.mrp}>MRP: ₹{product.mrp}</Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>SKU:</Text>
                <Text style={styles.value}>{product.sku}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{product.category}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Brand:</Text>
                <Text style={styles.value}>{product.brand}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{product.weight} {product.unit}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>HSN Code:</Text>
                <Text style={styles.value}>{product.hsnCode}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>GST Rate:</Text>
                <Text style={styles.value}>{product.gstRate}%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stock Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Stock Information</Title>
            <View style={styles.stockContainer}>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Current Stock</Text>
                <Text style={[styles.stockValue, stockStatus === 'low' && styles.lowStock]}>
                  {product.stock} units
                </Text>
              </View>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Min Stock</Text>
                <Text style={styles.stockValue}>{product.minStock} units</Text>
              </View>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Max Stock</Text>
                <Text style={styles.stockValue}>{product.maxStock} units</Text>
              </View>
            </View>
            
            {stockStatus === 'low' && (
              <Chip icon="alert" mode="outlined" style={styles.lowStockChip}>
                Low Stock Alert
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Tags</Title>
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <Chip key={index} style={styles.tag}>
                  {tag}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => setStockModalVisible(true)}
            style={styles.actionButton}
            icon="package-variant"
          >
            Adjust Stock
          </Button>
          <Button
            mode="contained"
            onPress={handleEditProduct}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Product
          </Button>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="delete"
        onPress={handleDeleteProduct}
        color="white"
      />

      {/* Stock Adjustment Modal */}
      <Portal>
        <Dialog visible={stockModalVisible} onDismiss={() => setStockModalVisible(false)}>
          <Dialog.Title>Adjust Stock</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.input}
              placeholder="Adjustment amount (+/-)"
              value={stockAdjustment}
              onChangeText={setStockAdjustment}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Reason for adjustment"
              value={adjustmentReason}
              onChangeText={setAdjustmentReason}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStockModalVisible(false)}>Cancel</Button>
            <Button onPress={handleStockAdjustment}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginRight: 16,
  },
  mrp: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontWeight: '500',
    color: '#333',
  },
  value: {
    color: '#666',
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lowStock: {
    color: '#d32f2f',
  },
  lowStockChip: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#d32f2f',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
});