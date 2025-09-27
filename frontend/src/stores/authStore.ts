import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, UserService } from '@/lib/services';
import type { User } from '@/lib/services';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (userData: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const response = await AuthService.login({ email, password });

          if (response.success && response.data) {
            const { user, token } = response.data;
            set({ user, token, isLoading: false });
            toast.success('Welcome back!');
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message || error.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await AuthService.register({
            email: userData.email,
            username: userData.username,
            password: userData.password,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            nativeLanguageId: 'en', // Default values - should be passed from form
            learningLanguageId: 'es',
          });

          if (response.success && response.data) {
            const { user, token } = response.data;
            set({ user, token, isLoading: false });
            toast.success('Account created successfully!');
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message ||
            error.message ||
            'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        AuthService.logout();
        toast.success('Logged out successfully');
      },

      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const response = await AuthService.verify();

          if (response.success && response.data?.valid && response.data?.user) {
            set({ user: response.data.user, isLoading: false });
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          set({ user: null, token: null, isLoading: false });
          AuthService.logout();
        }
      },

      updateProfile: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await UserService.updateProfile(userData);

          if (response.success && response.data) {
            set({ user: response.data, isLoading: false });
            toast.success('Profile updated successfully!');
          } else {
            throw new Error(response.message || 'Failed to update profile');
          }
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message ||
            error.message ||
            'Failed to update profile';
          toast.error(message);
          throw error;
        }
      },
    }),
    {
      name: 'l1xi-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
