import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@mawell/shared';
import { MapsService, LocationCoordinates } from './maps.service';

class GeocodeDto {
  address: string;
}

class ReverseGeocodeDto {
  latitude: number;
  longitude: number;
}

class RouteDto {
  origin: LocationCoordinates | string;
  destination: LocationCoordinates | string;
  waypoints?: Array<LocationCoordinates | string>;
}

class DistanceMatrixDto {
  origins: Array<LocationCoordinates | string>;
  destinations: Array<LocationCoordinates | string>;
}



@ApiTags('Maps')
@Controller('maps')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MapsController {
  private readonly logger = new Logger(MapsController.name);

  constructor(private readonly mapsService: MapsService) {}

  @Post('geocode')
  @Roles(UserRole.BUYER, UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Geocode an address to get coordinates' })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address or service not configured' })
  async geocodeAddress(
    @Body() geocodeDto: GeocodeDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Geocoding address for user ${userId}`);
    
    const result = await this.mapsService.geocodeAddress(geocodeDto.address);
    
    return {
      success: true,
      message: 'Address geocoded successfully',
      data: result,
    };
  }

  @Post('reverse-geocode')
  @Roles(UserRole.BUYER, UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reverse geocode coordinates to get address' })
  @ApiResponse({ status: 200, description: 'Coordinates reverse geocoded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates or service not configured' })
  async reverseGeocode(
    @Body() reverseGeocodeDto: ReverseGeocodeDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Reverse geocoding coordinates for user ${userId}`);
    
    const result = await this.mapsService.reverseGeocode({
      latitude: reverseGeocodeDto.latitude,
      longitude: reverseGeocodeDto.longitude,
    });
    
    return {
      success: true,
      message: 'Coordinates reverse geocoded successfully',
      data: result,
    };
  }

  @Post('route')
  @Roles(UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate route between two points' })
  @ApiResponse({ status: 200, description: 'Route calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid locations or service not configured' })
  async calculateRoute(
    @Body() routeDto: RouteDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Calculating route for user ${userId}`);
    
    const result = await this.mapsService.calculateRoute(
      routeDto.origin,
      routeDto.destination,
      routeDto.waypoints,
    );
    
    return {
      success: true,
      message: 'Route calculated successfully',
      data: result,
    };
  }

  @Post('distance-matrix')
  @Roles(UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate distance matrix between multiple points' })
  @ApiResponse({ status: 200, description: 'Distance matrix calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid locations or service not configured' })
  async calculateDistanceMatrix(
    @Body() distanceMatrixDto: DistanceMatrixDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Calculating distance matrix for user ${userId}`);
    
    const result = await this.mapsService.calculateDistance(
      distanceMatrixDto.origins,
      distanceMatrixDto.destinations,
    );
    
    return {
      success: true,
      message: 'Distance matrix calculated successfully',
      data: result,
    };
  }

  @Get('nearby-places')
  @Roles(UserRole.BUYER, UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Find nearby places' })
  @ApiResponse({ status: 200, description: 'Nearby places found successfully' })
  @ApiResponse({ status: 400, description: 'Invalid location or service not configured' })
  async findNearbyPlaces(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @GetUser('id') userId: string,
    @Query('radius') radius?: number,
    @Query('type') type?: string,
  ) {
    this.logger.log(`Finding nearby places for user ${userId}`);
    
    const result = await this.mapsService.findNearbyPlaces(
      { latitude: Number(latitude), longitude: Number(longitude) },
      radius ? Number(radius) : undefined,
      type,
    );
    
    return {
      success: true,
      message: 'Nearby places found successfully',
      data: result,
    };
  }

  @Get('driver-location')
  @Roles(UserRole.DRIVER, UserRole.OPS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current driver location (for tracking)' })
  @ApiResponse({ status: 200, description: 'Driver location retrieved successfully' })
  async getDriverLocation(
    @Query('driverId') driverId: string,
    @GetUser('id') userId: string,
    @GetUser('role') _userRole: UserRole,
  ) {
    this.logger.log(`Getting driver location for user ${userId}`);
    
    // This would typically fetch from a real-time location tracking service
    // For now, return mock data
    const mockLocation = {
      driverId,
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
      address: 'Bangalore, Karnataka, India',
      lastUpdated: new Date().toISOString(),
      speed: 45, // km/h
      heading: 180, // degrees
    };
    
    return {
      success: true,
      message: 'Driver location retrieved successfully',
      data: mockLocation,
    };
  }

  @Post('update-driver-location')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update driver location (called by driver app)' })
  @ApiResponse({ status: 200, description: 'Driver location updated successfully' })
  async updateDriverLocation(
    @Body() locationData: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    },
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Updating driver location for user ${userId}`);
    
    // In a real implementation, this would:
    // 1. Store location in Redis or real-time database
    // 2. Emit location updates via WebSocket to tracking clients
    // 3. Update delivery/consignment status if near destination
    
    return {
      success: true,
      message: 'Driver location updated successfully',
      data: {
        userId,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}