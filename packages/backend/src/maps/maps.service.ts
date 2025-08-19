import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressDetails {
  formattedAddress: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates: LocationCoordinates;
}

export interface RouteDetails {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  polyline: string;
  steps: Array<{
    instruction: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    startLocation: LocationCoordinates;
    endLocation: LocationCoordinates;
  }>;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private googleMapsClient: Client;
  private apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    
    if (this.apiKey) {
      this.googleMapsClient = new Client({});
    } else {
      this.logger.warn('Google Maps API key not configured');
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<AddressDetails> {
    if (!this.googleMapsClient || !this.apiKey) {
      throw new BadRequestException('Google Maps service not configured');
    }

    try {
      const response = await this.googleMapsClient.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new BadRequestException('Address not found');
      }

      const result = response.data.results[0];
      const location = result.geometry.location;
      
      // Parse address components
      const addressComponents = result.address_components;
      const addressDetails: AddressDetails = {
        formattedAddress: result.formatted_address,
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
        },
      };

      // Extract address components
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number' as any) || types.includes('route' as any)) {
          addressDetails.street = (addressDetails.street || '') + ' ' + component.long_name;
        } else if (types.includes('locality' as any) || types.includes('administrative_area_level_2' as any)) {
          addressDetails.city = component.long_name;
        } else if (types.includes('administrative_area_level_1' as any)) {
          addressDetails.state = component.long_name;
        } else if (types.includes('postal_code' as any)) {
          addressDetails.postalCode = component.long_name;
        } else if (types.includes('country' as any)) {
          addressDetails.country = component.long_name;
        }
      });

      return addressDetails;
    } catch (error) {
      this.logger.error('Geocoding failed:', error);
      throw new BadRequestException('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinates: LocationCoordinates): Promise<AddressDetails> {
    if (!this.googleMapsClient || !this.apiKey) {
      throw new BadRequestException('Google Maps service not configured');
    }

    try {
      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: `${coordinates.latitude},${coordinates.longitude}`,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new BadRequestException('Location not found');
      }

      const result = response.data.results[0];
      
      return {
        formattedAddress: result.formatted_address,
        coordinates,
      };
    } catch (error) {
      this.logger.error('Reverse geocoding failed:', error);
      throw new BadRequestException('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(
    origin: LocationCoordinates | string,
    destination: LocationCoordinates | string,
    waypoints?: Array<LocationCoordinates | string>,
  ): Promise<RouteDetails> {
    if (!this.googleMapsClient || !this.apiKey) {
      throw new BadRequestException('Google Maps service not configured');
    }

    try {
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.latitude},${origin.longitude}`;
      
      const destinationStr = typeof destination === 'string' 
        ? destination 
        : `${destination.latitude},${destination.longitude}`;



      const response = await this.googleMapsClient.directions({
        params: {
          origin: originStr,
          destination: destinationStr,
          waypoints: waypoints.map(wp => typeof wp === 'string' ? wp : `${wp.latitude},${wp.longitude}`),
          key: this.apiKey,
          mode: TravelMode.driving,
          alternatives: false,
        },
      });

      if (response.data.routes.length === 0) {
        throw new BadRequestException('No route found');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: {
          text: leg.distance.text,
          value: leg.distance.value,
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value,
        },
        polyline: route.overview_polyline.points,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: {
            text: step.distance.text,
            value: step.distance.value,
          },
          duration: {
            text: step.duration.text,
            value: step.duration.value,
          },
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
        })),
      };
    } catch (error) {
      this.logger.error('Route calculation failed:', error);
      throw new BadRequestException('Failed to calculate route');
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    origins: Array<LocationCoordinates | string>,
    destinations: Array<LocationCoordinates | string>,
  ): Promise<Array<Array<{ distance: { text: string; value: number }; duration: { text: string; value: number } }>>> {
    if (!this.googleMapsClient || !this.apiKey) {
      throw new BadRequestException('Google Maps service not configured');
    }

    try {
      const originsStr = origins.map(origin => 
        typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`
      );
      
      const destinationsStr = destinations.map(dest => 
        typeof dest === 'string' ? dest : `${dest.latitude},${dest.longitude}`
      );

      const response = await this.googleMapsClient.distancematrix({
          params: {
            origins: originsStr,
            destinations: destinationsStr,
            key: this.apiKey,
            mode: TravelMode.driving,
          },
        });

      return response.data.rows.map(row => 
        row.elements.map(element => ({
          distance: {
            text: element.distance?.text || 'N/A',
            value: element.distance?.value || 0,
          },
          duration: {
            text: element.duration?.text || 'N/A',
            value: element.duration?.value || 0,
          },
        }))
      );
    } catch (error) {
      this.logger.error('Distance calculation failed:', error);
      throw new BadRequestException('Failed to calculate distance');
    }
  }

  /**
   * Find nearby places
   */
  async findNearbyPlaces(
    location: LocationCoordinates,
    radius: number = 5000, // 5km default
    type?: string,
  ) {
    if (!this.googleMapsClient || !this.apiKey) {
      throw new BadRequestException('Google Maps service not configured');
    }

    try {
      const response = await this.googleMapsClient.placesNearby({
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius,
          type,
          key: this.apiKey,
        },
      });

      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        rating: place.rating,
        types: place.types,
        openNow: place.opening_hours?.open_now,
      }));
    } catch (error) {
      this.logger.error('Nearby places search failed:', error);
      throw new BadRequestException('Failed to find nearby places');
    }
  }
}