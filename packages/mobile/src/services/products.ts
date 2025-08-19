import { apiService } from './api';
import { Product, ProductCategory, ApiResponse, PaginatedResponse } from '@/types';

export interface ProductFilters {
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  brand?: string;
  price: number;
  unit: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  images?: string[];
  isActive?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export interface ProductStock {
  warehouseId: string;
  quantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

class ProductService {
  // Get all products with filters and pagination
  async getProducts(
    filters?: ProductFilters,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiService.getPaginated<Product>('/products', {
      page,
      limit,
      ...filters,
    });
  }

  // Get product by ID
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiService.get<Product>(`/products/${id}`);
  }

  // Search products
  async searchProducts(
    query: string,
    filters?: Omit<ProductFilters, 'search'>,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiService.getPaginated<Product>('/products/search', {
      search: query,
      page,
      limit,
      ...filters,
    });
  }

  // Get featured products
  async getFeaturedProducts(
    limit = 10
  ): Promise<ApiResponse<Product[]>> {
    return apiService.get<Product[]>(`/products/featured?limit=${limit}`);
  }

  // Get products by category
  async getProductsByCategory(
    categoryId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiService.getPaginated<Product>(`/products/category/${categoryId}`, {
      page,
      limit,
    });
  }

  // Get product recommendations
  async getRecommendations(
    productId?: string,
    limit = 10
  ): Promise<ApiResponse<Product[]>> {
    const url = productId 
      ? `/products/${productId}/recommendations`
      : '/products/recommendations';
    return apiService.get<Product[]>(`${url}?limit=${limit}`);
  }

  // Create new product (Operations only)
  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return apiService.post<Product>('/products', data);
  }

  // Update product (Operations only)
  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<ApiResponse<Product>> {
    return apiService.patch<Product>(`/products/${id}`, data);
  }

  // Delete product (Operations only)
  async deleteProduct(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/products/${id}`);
  }

  // Upload product images
  async uploadProductImage(
    productId: string,
    file: {
      uri: string;
      type: string;
      name: string;
    }
  ): Promise<ApiResponse<{ url: string }>> {
    return apiService.uploadFile(`/products/${productId}/images`, file);
  }

  // Delete product image
  async deleteProductImage(
    productId: string,
    imageUrl: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/products/${productId}/images`, {
      data: { imageUrl },
    });
  }

  // Get product stock
  async getProductStock(productId: string): Promise<ApiResponse<ProductStock[]>> {
    return apiService.get<ProductStock[]>(`/products/${productId}/stock`);
  }

  // Update product stock (Operations only)
  async updateProductStock(
    productId: string,
    warehouseId: string,
    data: {
      quantity?: number;
      reorderLevel?: number;
      maxStockLevel?: number;
    }
  ): Promise<ApiResponse<ProductStock>> {
    return apiService.patch<ProductStock>(
      `/products/${productId}/stock/${warehouseId}`,
      data
    );
  }

  // Bulk update stock (Operations only)
  async bulkUpdateStock(
    updates: Array<{
      productId: string;
      warehouseId: string;
      quantity: number;
    }>
  ): Promise<ApiResponse<{ updated: number; failed: number }>> {
    return apiService.post<{ updated: number; failed: number }>(
      '/products/stock/bulk-update',
      { updates }
    );
  }

  // Get low stock products (Operations only)
  async getLowStockProducts(
    warehouseId?: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiService.getPaginated<Product>('/products/low-stock', {
      warehouseId,
      page,
      limit,
    });
  }

  // Get product categories
  async getCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return apiService.get<ProductCategory[]>('/products/categories');
  }

  // Get category by ID
  async getCategory(id: string): Promise<ApiResponse<ProductCategory>> {
    return apiService.get<ProductCategory>(`/products/categories/${id}`);
  }

  // Create category (Operations only)
  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string;
    image?: string;
  }): Promise<ApiResponse<ProductCategory>> {
    return apiService.post<ProductCategory>('/products/categories', data);
  }

  // Update category (Operations only)
  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      parentId?: string;
      image?: string;
    }
  ): Promise<ApiResponse<ProductCategory>> {
    return apiService.patch<ProductCategory>(`/products/categories/${id}`, data);
  }

  // Delete category (Operations only)
  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/products/categories/${id}`);
  }

  // Get product brands
  async getBrands(): Promise<ApiResponse<string[]>> {
    return apiService.get<string[]>('/products/brands');
  }

  // Get product analytics (Operations only)
  async getProductAnalytics(
    productId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    views: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    trends: Array<{
      date: string;
      views: number;
      orders: number;
      revenue: number;
    }>;
  }>> {
    return apiService.get(`/products/${productId}/analytics?period=${period}`);
  }

  // Scan product barcode
  async scanBarcode(barcode: string): Promise<ApiResponse<Product>> {
    return apiService.post<Product>('/products/scan', { barcode });
  }

  // Get similar products
  async getSimilarProducts(
    productId: string,
    limit = 10
  ): Promise<ApiResponse<Product[]>> {
    return apiService.get<Product[]>(
      `/products/${productId}/similar?limit=${limit}`
    );
  }

  // Add product review
  async addReview(
    productId: string,
    data: {
      rating: number;
      comment?: string;
      images?: string[];
    }
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(
      `/products/${productId}/reviews`,
      data
    );
  }

  // Get product reviews
  async getReviews(
    productId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    return apiService.getPaginated(`/products/${productId}/reviews`, {
      page,
      limit,
    });
  }
}

// Create and export singleton instance
export const productService = new ProductService();
export default productService;