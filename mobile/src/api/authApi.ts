import apiClient from './client';
import type { HanaLoginResponse } from '../types/auth.types';

const APP_NAME = 'garageosapp.hanaplatform.com';

export const authApi = {
  async login(identifier: string, password: string): Promise<HanaLoginResponse> {
    const { data } = await apiClient.post<HanaLoginResponse>('/api/v1/auth/login', {
      appName: APP_NAME,
      identifier,
      password,
    });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/auth/change-password', {
      appName: APP_NAME,
      currentPassword,
      newPassword,
    });
  },
};
