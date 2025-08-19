import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  ParseBoolPipe,
  ParseIntPipe,
  ParseFloatPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  Min,
  IsUUID,
} from 'class-validator';
import {
  ProductsService,
  CreateProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
  UpdateInventoryDto,
  ProductFilters,
} from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole, ProductStatus } from '@mawell/shared';

// DTOs
class CreateProductRequestDto implements CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  hsn?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

class UpdateProductRequestDto implements UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  hsn?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

class CreateCategoryRequestDto implements CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

class UpdateCategoryRequestDto implements UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

class CreateBrandRequestDto implements CreateBrandDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateBrandRequestDto implements UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateInventoryRequestDto implements UpdateInventoryDto {
  @IsUUID()
  warehouseId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;
}

class UpdateProductStatusDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Product endpoints

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get products with filters' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'brandId', required: false, type: String, description: 'Filter by brand ID' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, description, SKU, HSN' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filter products in stock' })
  @ApiQuery({ name: 'warehouseId', required: false, type: String, description: 'Warehouse ID for stock check' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'updatedAt'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('status') status?: ProductStatus,
    @Query('isActive', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('search') search?: string,
    @Query('minPrice', new DefaultValuePipe(undefined), new ParseFloatPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new DefaultValuePipe(undefined), new ParseFloatPipe({ optional: true })) maxPrice?: number,
    @Query('tags') tags?: string | string[],
    @Query('inStock', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) inStock?: boolean,
    @Query('warehouseId') warehouseId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt',
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder?: 'asc' | 'desc',
  ) {
    const filters: ProductFilters = {
      categoryId,
      brandId,
      status,
      isActive,
      search,
      minPrice,
      maxPrice,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
      inStock,
      warehouseId,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    return this.productsService.findProducts(filters);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createProduct(
    @Body(ValidationPipe) productData: CreateProductRequestDto,
    @User() user: any,
  ) {
    return this.productsService.createProduct(productData, user.id, user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateData: UpdateProductRequestDto,
    @User() user: any,
  ) {
    return this.productsService.updateProduct(id, updateData, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
  ) {
    return this.productsService.deleteProduct(id, user.id, user.role);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProductStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) statusData: UpdateProductStatusDto,
    @User() user: any,
  ) {
    return this.productsService.updateProductStatus(id, statusData.status, user.id, user.role);
  }

  // Inventory endpoints

  @Get(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product inventory (Admin/OPS only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'warehouseId', required: false, type: String, description: 'Filter by warehouse ID' })
  @ApiResponse({ status: 200, description: 'Product inventory retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/OPS access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.productsService.getProductInventory(id, warehouseId);
  }

  @Put(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product inventory (Admin/OPS only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product inventory updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/OPS access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) inventoryData: UpdateInventoryRequestDto,
    @User() user: any,
  ) {
    return this.productsService.updateInventory(id, inventoryData, user.id, user.role);
  }

  // Category endpoints

  @Get('categories/list')
  @Public()
  @ApiOperation({ summary: 'Get categories list' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive?: boolean,
  ) {
    return this.productsService.getCategories(includeInactive);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createCategory(
    @Body(ValidationPipe) categoryData: CreateCategoryRequestDto,
    @User() user: any,
  ) {
    return this.productsService.createCategory(categoryData, user.id, user.role);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateData: UpdateCategoryRequestDto,
    @User() user: any,
  ) {
    return this.productsService.updateCategory(id, updateData, user.id, user.role);
  }

  // Brand endpoints

  @Get('brands/list')
  @Public()
  @ApiOperation({ summary: 'Get brands list' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive brands' })
  @ApiResponse({ status: 200, description: 'Brands retrieved successfully' })
  async getBrands(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive?: boolean,
  ) {
    return this.productsService.getBrands(includeInactive);
  }

  @Post('brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create brand (Admin only)' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createBrand(
    @Body(ValidationPipe) brandData: CreateBrandRequestDto,
    @User() user: any,
  ) {
    return this.productsService.createBrand(brandData, user.id, user.role);
  }

  @Put('brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update brand (Admin only)' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateData: UpdateBrandRequestDto,
    @User() user: any,
  ) {
    return this.productsService.updateBrand(id, updateData, user.id, user.role);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Products service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'products',
      timestamp: new Date().toISOString(),
    };
  }
}