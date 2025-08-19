import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Chip,
  Menu,
  Divider,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OperationsStackParamList } from '@/navigation/OperationsNavigator';
import * as ImagePicker from 'expo-image-picker';

type AddProductScreenNavigationProp = StackNavigationProp<OperationsStackParamList, 'AddProduct'>;

interface Props {
  navigation: AddProductScreenNavigationProp;
}

interface ProductForm {
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: string;
  mrp: string;
  unit: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  minStock: string;
  maxStock: string;
  gstRate: string;
  hsnCode: string;
  tags: string[];
  isActive: boolean;
}

const categories = [
  'Grains & Cereals',
  'Pulses & Lentils',
  'Spices & Seasonings',
  'Oil & Ghee',
  'Dairy Products',
  'Beverages',
  'Snacks & Confectionery',
  'Personal Care',
  'Household Items',
  'Others',
];

const units = ['kg', 'g', 'L', 'ml', 'pieces', 'packets', 'boxes'];
const gstRates = ['0', '5', '12', '18', '28'];

export function AddProductScreen({ navigation }: Props) {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    brand: '',
    sku: '',
    price: '',
    mrp: '',
    unit: 'kg',
    weight: '',
    length: '',
    width: '',
    height: '',
    minStock: '',
    maxStock: '',
    gstRate: '5',
    hsnCode: '',
    tags: [],
    isActive: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [gstMenuVisible, setGstMenuVisible] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (field: keyof ProductForm, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      updateForm('tags', [...form.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateForm('tags', form.tags.filter(t => t !== tag));
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'name', 'category', 'brand', 'sku', 'price', 'mrp', 
      'weight', 'minStock', 'maxStock', 'hsnCode'
    ];

    for (const field of requiredFields) {
      if (!form[field as keyof ProductForm]) {
        Alert.alert('Validation Error', `${field} is required`);
        return false;
      }
    }

    if (parseFloat(form.price) >= parseFloat(form.mrp)) {
      Alert.alert('Validation Error', 'Price should be less than MRP');
      return false;
    }

    if (parseFloat(form.minStock) >= parseFloat(form.maxStock)) {
      Alert.alert('Validation Error', 'Min stock should be less than max stock');
      return false;
    }

    if (images.length === 0) {
      Alert.alert('Validation Error', 'At least one product image is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Product added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Basic Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Basic Information</Title>
          
          <TextInput
            label="Product Name *"
            value={form.name}
            onChangeText={(value) => updateForm('name', value)}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Description"
            value={form.description}
            onChangeText={(value) => updateForm('description', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
          
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
                <TextInput
                  label="Category *"
                  value={form.category}
                  style={styles.input}
                  mode="outlined"
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </TouchableOpacity>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category}
                onPress={() => {
                  updateForm('category', category);
                  setCategoryMenuVisible(false);
                }}
                title={category}
              />
            ))}
          </Menu>
          
          <TextInput
            label="Brand *"
            value={form.brand}
            onChangeText={(value) => updateForm('brand', value)}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="SKU *"
            value={form.sku}
            onChangeText={(value) => updateForm('sku', value)}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., GH-RICE-25KG"
          />
        </Card.Content>
      </Card>

      {/* Pricing */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Pricing</Title>
          
          <View style={styles.row}>
            <TextInput
              label="Price *"
              value={form.price}
              onChangeText={(value) => updateForm('price', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
            />
            
            <TextInput
              label="MRP *"
              value={form.mrp}
              onChangeText={(value) => updateForm('mrp', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
            />
          </View>
          
          <View style={styles.row}>
            <Menu
              visible={gstMenuVisible}
              onDismiss={() => setGstMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setGstMenuVisible(true)}>
                  <TextInput
                    label="GST Rate *"
                    value={form.gstRate + '%'}
                    style={[styles.input, styles.halfWidth]}
                    mode="outlined"
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </TouchableOpacity>
              }
            >
              {gstRates.map((rate) => (
                <Menu.Item
                  key={rate}
                  onPress={() => {
                    updateForm('gstRate', rate);
                    setGstMenuVisible(false);
                  }}
                  title={`${rate}%`}
                />
              ))}
            </Menu>
            
            <TextInput
              label="HSN Code *"
              value={form.hsnCode}
              onChangeText={(value) => updateForm('hsnCode', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              placeholder="e.g., 1006"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Physical Properties */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Physical Properties</Title>
          
          <View style={styles.row}>
            <TextInput
              label="Weight *"
              value={form.weight}
              onChangeText={(value) => updateForm('weight', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <Menu
              visible={unitMenuVisible}
              onDismiss={() => setUnitMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setUnitMenuVisible(true)}>
                  <TextInput
                    label="Unit"
                    value={form.unit}
                    style={[styles.input, styles.halfWidth]}
                    mode="outlined"
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </TouchableOpacity>
              }
            >
              {units.map((unit) => (
                <Menu.Item
                  key={unit}
                  onPress={() => {
                    updateForm('unit', unit);
                    setUnitMenuVisible(false);
                  }}
                  title={unit}
                />
              ))}
            </Menu>
          </View>
          
          <Text style={styles.sectionTitle}>Dimensions (cm)</Text>
          <View style={styles.row}>
            <TextInput
              label="Length"
              value={form.length}
              onChangeText={(value) => updateForm('length', value)}
              style={[styles.input, styles.thirdWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Width"
              value={form.width}
              onChangeText={(value) => updateForm('width', value)}
              style={[styles.input, styles.thirdWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Height"
              value={form.height}
              onChangeText={(value) => updateForm('height', value)}
              style={[styles.input, styles.thirdWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Stock Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Stock Management</Title>
          
          <View style={styles.row}>
            <TextInput
              label="Min Stock *"
              value={form.minStock}
              onChangeText={(value) => updateForm('minStock', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Max Stock *"
              value={form.maxStock}
              onChangeText={(value) => updateForm('maxStock', value)}
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Images */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Product Images</Title>
          
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color="#666" />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Tags */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Tags</Title>
          
          <View style={styles.row}>
            <TextInput
              label="Add Tag"
              value={newTag}
              onChangeText={setNewTag}
              style={[styles.input, styles.expandedInput]}
              mode="outlined"
              onSubmitEditing={addTag}
            />
            <Button mode="contained" onPress={addTag} style={styles.addButton}>
              Add
            </Button>
          </View>
          
          <View style={styles.tagsContainer}>
            {form.tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => removeTag(tag)}
                style={styles.tag}
              >
                {tag}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Settings</Title>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active Product</Text>
            <Switch
              value={form.isActive}
              onValueChange={(value) => updateForm('isActive', value)}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        Add Product
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  thirdWidth: {
    width: '31%',
  },
  expandedInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    margin: 16,
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});