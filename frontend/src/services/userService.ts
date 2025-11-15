import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  ideaCount: number;
  feedbackCount: number;
}

export interface UserStats {
  user: User;
  ideaCount: number;
  feedbackCount: number;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
}

export const userService = {
  async getUserById(userId: string): Promise<UserStats> {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    // Transform flat response to nested structure expected by component
    const profile = response.data;
    return {
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        createdAt: profile.createdAt,
      },
      ideaCount: profile.ideaCount,
      feedbackCount: profile.feedbackCount,
    };
  },

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, data);
    return response.data;
  },
};
