import { AxiosResponse } from 'axios';
import { api } from '../api';
import { ApiResponse, User, UserStats } from './types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  nativeLanguageId: string;
  learningLanguageId: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface VerifyResponse {
  valid: boolean;
  user?: User;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<LoginResponse>> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post(
      '/auth/register',
      userData
    );
    return response.data;
  }

  /**
   * Login user
   */
  static async login(
    credentials: LoginRequest
  ): Promise<ApiResponse<LoginResponse>> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  /**
   * Verify authentication token
   */
  static async verify(): Promise<ApiResponse<VerifyResponse>> {
    const response: AxiosResponse<ApiResponse<VerifyResponse>> = await api.get(
      '/auth/verify'
    );
    return response.data;
  }

  /**
   * Logout user (client-side token removal)
   */
  static logout(): void {
    localStorage.removeItem('l1xi-auth-storage');
  }
}
