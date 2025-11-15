import api from './api';

export interface Rating {
  id: string;
  ideaId: string;
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  count: number;
}

export interface CreateRatingData {
  score: number;
}

export const ratingService = {
  async createRating(ideaId: string, data: CreateRatingData): Promise<Rating> {
    const response = await api.post<{ rating: Rating }>(`/ideas/${ideaId}/ratings`, data);
    return response.data.rating;
  },

  async updateRating(ideaId: string, data: CreateRatingData): Promise<Rating> {
    const response = await api.put<{ rating: Rating }>(`/ideas/${ideaId}/ratings`, data);
    return response.data.rating;
  },

  async getAverageRating(ideaId: string): Promise<RatingStats> {
    const response = await api.get<RatingStats>(`/ideas/${ideaId}/ratings/average`);
    return response.data;
  },
};
