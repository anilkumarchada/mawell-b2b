interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  responseTime: number;
  lastChecked: string;
  description: string;
  version: string;
  baseUrl?: string;
}

interface ApiHealthCheck {
  endpoint: string;
  status: number;
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface ApiConfiguration {
  id: string;
  enabled: boolean;
  timeout: number;
  retries: number;
  healthCheckInterval: number;
  alertThreshold: number;
}

class ApiService {
  private baseUrl: string;
  private adminToken: string | null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.adminToken && { Authorization: `Bearer ${this.adminToken}` }),
    };
  }

  // Fetch all API endpoints
  async getApiEndpoints(): Promise<ApiEndpoint[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/endpoints`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API endpoints');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching API endpoints:', error);
      // Return mock data for development
      return this.getMockApiEndpoints();
    }
  }

  // Health check for a specific endpoint
  async checkApiHealth(endpoint: ApiEndpoint): Promise<ApiHealthCheck> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
        method: 'HEAD', // Use HEAD to avoid side effects
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: endpoint.path,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: endpoint.path,
        status: 0,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Bulk health check for all endpoints
  async checkAllApisHealth(): Promise<ApiHealthCheck[]> {
    const endpoints = await this.getApiEndpoints();
    const healthChecks = await Promise.all(
      endpoints.map(endpoint => this.checkApiHealth(endpoint))
    );
    
    return healthChecks;
  }

  // Update API status
  async updateApiStatus(apiId: string, status: ApiEndpoint['status']): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/endpoints/${apiId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating API status:', error);
      return false;
    }
  }

  // Get API configuration
  async getApiConfiguration(apiId: string): Promise<ApiConfiguration | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/endpoints/${apiId}/config`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API configuration');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching API configuration:', error);
      return null;
    }
  }

  // Update API configuration
  async updateApiConfiguration(apiId: string, config: Partial<ApiConfiguration>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/endpoints/${apiId}/config`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(config),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating API configuration:', error);
      return false;
    }
  }

  // Get API logs
  async getApiLogs(apiId: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/endpoints/${apiId}/logs?limit=${limit}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API logs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching API logs:', error);
      return [];
    }
  }

  // Test API endpoint
  async testApiEndpoint(endpoint: ApiEndpoint, testData?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: this.getHeaders(),
        ...(testData && { body: JSON.stringify(testData) }),
      });
      
      const responseData = await response.json();
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      throw new Error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Mock data for development
  private getMockApiEndpoints(): ApiEndpoint[] {
    return [
      {
        id: '1',
        name: 'User Authentication',
        method: 'POST',
        path: '/api/auth/login',
        status: 'active',
        responseTime: 120,
        lastChecked: new Date().toISOString(),
        description: 'User login endpoint',
        version: 'v1',
      },
      {
        id: '2',
        name: 'Get Products',
        method: 'GET',
        path: '/api/products',
        status: 'active',
        responseTime: 85,
        lastChecked: new Date().toISOString(),
        description: 'Retrieve all products',
        version: 'v1',
      },
      {
        id: '3',
        name: 'Create Order',
        method: 'POST',
        path: '/api/orders',
        status: 'active',
        responseTime: 200,
        lastChecked: new Date().toISOString(),
        description: 'Create new order',
        version: 'v1',
      },
      {
        id: '4',
        name: 'Update Logistics',
        method: 'PUT',
        path: '/api/logistics/:id',
        status: 'maintenance',
        responseTime: 0,
        lastChecked: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        description: 'Update logistics information',
        version: 'v1',
      },
      {
        id: '5',
        name: 'Delete User',
        method: 'DELETE',
        path: '/api/users/:id',
        status: 'error',
        responseTime: 0,
        lastChecked: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        description: 'Delete user account',
        version: 'v1',
      },
      {
        id: '6',
        name: 'Get User Profile',
        method: 'GET',
        path: '/api/users/profile',
        status: 'active',
        responseTime: 95,
        lastChecked: new Date().toISOString(),
        description: 'Get current user profile',
        version: 'v1',
      },
      {
        id: '7',
        name: 'Update Product',
        method: 'PUT',
        path: '/api/products/:id',
        status: 'active',
        responseTime: 150,
        lastChecked: new Date().toISOString(),
        description: 'Update product information',
        version: 'v1',
      },
      {
        id: '8',
        name: 'Get Order History',
        method: 'GET',
        path: '/api/orders/history',
        status: 'inactive',
        responseTime: 0,
        lastChecked: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        description: 'Get user order history',
        version: 'v1',
      },
    ];
  }
}

const apiService = new ApiService();
export default apiService;
export type { ApiEndpoint, ApiHealthCheck, ApiConfiguration };