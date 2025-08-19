import { apiService } from './api';
import { User, ApiResponse, LoginForm, OTPForm, ProfileForm } from '@/types';

export interface LoginResponse {
  message: string;
  sessionId: string;
}

export interface VerifyOTPResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  // Send OTP to phone number
  async sendOTP(data: LoginForm): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/auth/send-otp', data);
  }

  // Verify OTP and login
  async verifyOTP(
    sessionId: string,
    data: OTPForm
  ): Promise<ApiResponse<VerifyOTPResponse>> {
    return apiService.post<VerifyOTPResponse>('/auth/verify-otp', {
      sessionId,
      ...data,
    });
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return apiService.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
  }

  // Logout user
  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiService.post<{ message: string }>('/auth/logout');
    await apiService.removeTokens();
    return response;
  }

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/auth/me');
  }

  // Update user profile
  async updateProfile(data: Partial<ProfileForm>): Promise<ApiResponse<User>> {
    return apiService.patch<User>('/auth/profile', data);
  }

  // Select user role (for new users)
  async selectRole(role: 'BUYER' | 'DRIVER' | 'OPERATIONS'): Promise<ApiResponse<User>> {
    return apiService.post<User>('/auth/select-role', { role });
  }

  // Complete onboarding
  async completeOnboarding(data: {
    firstName: string;
    lastName: string;
    email?: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    driverInfo?: {
      licenseNumber: string;
      vehicleType: string;
      vehicleNumber: string;
      vehicleModel?: string;
    };
  }): Promise<ApiResponse<User>> {
    return apiService.post<User>('/auth/complete-onboarding', data);
  }

  // Upload profile picture
  async uploadProfilePicture(file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<ApiResponse<{ url: string }>> {
    return apiService.uploadFile('/auth/upload-avatar', file);
  }

  // Update device token for push notifications
  async updateDeviceToken(deviceToken: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/auth/device-token', {
      deviceToken,
    });
  }

  // Delete account
  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiService.delete<{ message: string }>('/auth/account');
    await apiService.removeTokens();
    return response;
  }

  // Change phone number
  async changePhoneNumber(newPhone: string): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/auth/change-phone', {
      phone: newPhone,
    });
  }

  // Verify new phone number
  async verifyNewPhoneNumber(
    sessionId: string,
    otp: string
  ): Promise<ApiResponse<User>> {
    return apiService.post<User>('/auth/verify-new-phone', {
      sessionId,
      otp,
    });
  }

  // Check if user exists
  async checkUserExists(phone: string): Promise<ApiResponse<{ exists: boolean }>> {
    return apiService.post<{ exists: boolean }>('/auth/check-user', {
      phone,
    });
  }

  // Resend OTP
  async resendOTP(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/auth/resend-otp', {
      sessionId,
    });
  }

  // Update user preferences
  async updatePreferences(preferences: {
    language?: string;
    currency?: string;
    notifications?: {
      orderUpdates?: boolean;
      promotions?: boolean;
      deliveryAlerts?: boolean;
      systemMessages?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
  }): Promise<ApiResponse<User>> {
    return apiService.patch<User>('/auth/preferences', preferences);
  }

  // Get user activity log
  async getActivityLog(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<any>> {
    return apiService.getPaginated('/auth/activity', params);
  }

  // Report issue
  async reportIssue(data: {
    type: 'BUG' | 'FEATURE_REQUEST' | 'COMPLAINT' | 'OTHER';
    title: string;
    description: string;
    attachments?: string[];
  }): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>('/auth/report-issue', data);
  }

  // Get app version info
  async getAppVersion(): Promise<ApiResponse<{
    currentVersion: string;
    latestVersion: string;
    updateRequired: boolean;
    updateUrl?: string;
  }>> {
    return apiService.get('/auth/app-version');
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;