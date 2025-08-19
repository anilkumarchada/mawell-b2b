import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ValidationService } from '../common/services/validation.service';
import { UserRole, ProductStatus } from '@mawell/shared';

export interface CreateProductDto {
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  sku: string;
  hsn?: string;
  basePrice: number;
  mrp?: number;
  unit: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  isActive?: boolean;
  tags?: string[];
  specifications?: Record<string, any>;
  images?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CreateBrandDto {
  name: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {}

export interface UpdateInventoryDto {
  warehouseId: string;
  quantity: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  isActive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStock?: boolean;
  warehouseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private validationService: ValidationService,
  ) {}

  /**
   * Create a new product
   */
  async createProduct(
    productData: CreateProductDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create products');
    }

    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: productData.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Validate brand if provided
    if (productData.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: productData.brandId },
      });
      if (!brand) {
        throw new BadRequestException('Brand not found');
      }
    }

    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: productData.sku },
    });
    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description || '',
        sku: productData.sku,
        categoryId: productData.categoryId,
        brandId: productData.brandId,
        hsnCode: productData.hsn || '',
        taxRate: 18, // Default GST rate, should be configurable
        price: productData.basePrice,
        mrp: productData.mrp || productData.basePrice,
        images: productData.images || [],
        specifications: productData.specifications,
        status: ProductStatus.DRAFT,
        isActive: productData.isActive ?? true,
        moq: productData.minOrderQuantity || 1,
        returnPolicy: null,
      },
      include: {
        category: true,
        brand: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'PRODUCT',
      product.id,
      productData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Product created: ${product.id}`);

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    updateData: UpdateProductDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update products');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate category if provided
    if (updateData.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Validate brand if provided
    if (updateData.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateData.brandId },
      });
      if (!brand) {
        throw new BadRequestException('Brand not found');
      }
    }

    // Check if SKU already exists (if updating SKU)
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateData.sku },
      });
      if (existingSku) {
        throw new BadRequestException('SKU already exists');
      }
    }

    const oldValues = { ...product };

    // Map DTO fields to Prisma model fields
    const mappedData: any = {};
    if (updateData.name !== undefined) mappedData.name = updateData.name;
    if (updateData.description !== undefined) mappedData.description = updateData.description;
    if (updateData.sku !== undefined) mappedData.sku = updateData.sku;
    if (updateData.categoryId !== undefined) mappedData.categoryId = updateData.categoryId;
    if (updateData.brandId !== undefined) mappedData.brandId = updateData.brandId;
    if (updateData.hsn !== undefined) mappedData.hsnCode = updateData.hsn;
    if (updateData.basePrice !== undefined) mappedData.price = updateData.basePrice;
    if (updateData.mrp !== undefined) mappedData.mrp = updateData.mrp;
    if (updateData.images !== undefined) mappedData.images = updateData.images;
    if (updateData.specifications !== undefined) mappedData.specifications = updateData.specifications;
    if (updateData.isActive !== undefined) mappedData.isActive = updateData.isActive;
    if (updateData.minOrderQuantity !== undefined) mappedData.moq = updateData.minOrderQuantity;

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: mappedData,
      include: {
        category: true,
        brand: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'PRODUCT',
      productId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Product updated: ${productId}`);

    return updatedProduct;
  }

  /**
   * Get product by ID
   */
  async findById(productId: string, includeInactive = false) {
    const where: any = { id: productId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const product = await this.prisma.product.findUnique({
      where,
      include: {
        category: true,
        brand: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get products with filters
   */
  async findProducts(filters: ProductFilters = {}) {
    const {
      categoryId,
      brandId,
      status,
      isActive,
      search,
      minPrice,
      maxPrice,
      tags,
      inStock,
      warehouseId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const { page: validPage, limit: validLimit } = this.validationService.validatePagination(page, limit);

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { hsn: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (inStock && warehouseId) {
      where.inventory = {
        some: {
          warehouseId,
          quantity: { gt: 0 },
        },
      };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          inventory: warehouseId
            ? {
                where: { warehouseId },
                include: { warehouse: true },
              }
            : {
                include: { warehouse: true },
              },
        },
        orderBy,
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(
    productId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete products');
    }

    const product = await this.findById(productId, true);
    const oldValues = { ...product };

    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    // Log audit trail
    await this.auditService.logDelete(
      'PRODUCT',
      productId,
      oldValues,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Product deleted: ${productId}`);

    return { message: 'Product deleted successfully' };
  }

  /**
   * Update product status
   */
  async updateProductStatus(
    productId: string,
    status: ProductStatus,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update product status');
    }

    const product = await this.findById(productId, true);
    const oldValues = { status: product.status };

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { status },
      include: {
        category: true,
        brand: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'PRODUCT',
      productId,
      oldValues,
      { status },
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Product status updated: ${productId} -> ${status}`);

    return updatedProduct;
  }

  /**
   * Update product inventory
   */
  async updateInventory(
    productId: string,
    inventoryData: UpdateInventoryDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (![UserRole.ADMIN, UserRole.OPS].includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins and ops users can update inventory');
    }

    // Verify product exists
    await this.findById(productId, true);

    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: inventoryData.warehouseId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }

    // Check if inventory record exists
    const existingInventory = await this.prisma.inventory.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: inventoryData.warehouseId,
          productId,
        },
      },
    });

    let inventory;
    if (existingInventory) {
      const oldValues = { ...existingInventory };
      inventory = await this.prisma.inventory.update({
        where: {
          warehouseId_productId: {
            warehouseId: inventoryData.warehouseId,
            productId,
          },
        },
        data: inventoryData,
        include: {
          product: true,
          warehouse: true,
        },
      });

      // Log audit trail
      await this.auditService.logUpdate(
        'INVENTORY',
        inventory.id,
        oldValues,
        inventoryData,
        requestingUserId,
        requestingUserRole,
      );
    } else {
      inventory = await this.prisma.inventory.create({
        data: {
          productId,
          ...inventoryData,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      // Log audit trail
      await this.auditService.logCreate(
        'INVENTORY',
        inventory.id,
        { productId, ...inventoryData },
        requestingUserId,
        requestingUserRole,
      );
    }

    this.logger.log(`Inventory updated for product ${productId} in warehouse ${inventoryData.warehouseId}`);

    return inventory;
  }

  /**
   * Get product inventory across warehouses
   */
  async getProductInventory(productId: string, warehouseId?: string) {
    await this.findById(productId, true);

    const where: any = { productId };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const inventory = await this.prisma.inventory.findMany({
      where,
      include: {
        warehouse: true,
      },
      orderBy: {
        warehouse: {
          name: 'asc',
        },
      },
    });

    return inventory;
  }

  // Category Management

  /**
   * Create category
   */
  async createCategory(
    categoryData: CreateCategoryDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create categories');
    }

    // Validate parent category if provided
    if (categoryData.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: categoryData.parentId },
      });
      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        ...categoryData,
        isActive: categoryData.isActive ?? true,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'CATEGORY',
      category.id,
      categoryData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Category created: ${category.id}`);

    return category;
  }

  /**
   * Get categories
   */
  async getCategories(includeInactive = false) {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories;
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updateData: UpdateCategoryDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update categories');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate parent category if provided
    if (updateData.parentId) {
      if (updateData.parentId === categoryId) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: updateData.parentId },
      });
      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const oldValues = { ...category };

    const updatedCategory = await this.prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'CATEGORY',
      categoryId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Category updated: ${categoryId}`);

    return updatedCategory;
  }

  // Brand Management

  /**
   * Create brand
   */
  async createBrand(
    brandData: CreateBrandDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create brands');
    }

    const brand = await this.prisma.brand.create({
      data: {
        ...brandData,
        isActive: brandData.isActive ?? true,
      },
    });

    // Log audit trail
    await this.auditService.logCreate(
      'BRAND',
      brand.id,
      brandData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Brand created: ${brand.id}`);

    return brand;
  }

  /**
   * Get brands
   */
  async getBrands(includeInactive = false) {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const brands = await this.prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return brands;
  }

  /**
   * Update brand
   */
  async updateBrand(
    brandId: string,
    updateData: UpdateBrandDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update brands');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const oldValues = { ...brand };

    const updatedBrand = await this.prisma.brand.update({
      where: { id: brandId },
      data: updateData,
    });

    // Log audit trail
    await this.auditService.logUpdate(
      'BRAND',
      brandId,
      oldValues,
      updateData,
      requestingUserId,
      requestingUserRole,
    );

    this.logger.log(`Brand updated: ${brandId}`);

    return updatedBrand;
  }
}