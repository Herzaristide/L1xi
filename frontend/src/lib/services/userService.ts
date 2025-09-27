import { AxiosResponse } from 'axios';
import { api } from '../api';
import { ApiResponse, User, UserStats } from './types';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  nativeLanguageId?: string;
  learningLanguageId?: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionType: string;
  paymentToken?: string;
}

export class UserService {
  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(
      '/users/me'
    );
    return response.data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userData: UpdateProfileRequest
  ): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(
      '/users/me',
      userData
    );
    return response.data;
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<ApiResponse<UserStats>> {
    const response: AxiosResponse<ApiResponse<UserStats>> = await api.get(
      '/users/stats'
    );
    return response.data;
  }

  /**
   * Update user subscription
   */
  static async updateSubscription(
    subscriptionData: UpdateSubscriptionRequest
  ): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(
      '/users/subscription',
      subscriptionData
    );
    return response.data;
  }
}
