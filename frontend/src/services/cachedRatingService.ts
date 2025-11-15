/**
 * Cached Rating Service with IndexedDB support
 */

import api from './api';
import { STORES, putItem, getItemsByIndex } from './indexedDB';

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

/**
 * Create or update rating and update cache
 */
export const submitRating = async (
  ideaId: string, 
  data: CreateRatingData,
  isUpdate = false
): Promise<Rating> => {
  const method = isUpdate ? 'put' : 'post';
  const response = await api[method]<{ rating: Rating }>(
    `/ideas/${ideaId}/ratings`, 
    data
  );
  const rating = response.data.rating;
  
  // Cache the rating
  try {
    await putItem(STORES.RATINGS, rating);
  } catch (error) {
    console.error('Failed to cache rating:', error);
  }
  
  return rating;
};

/**
 * Get average rating for an idea with cache-first strategy
 */
export const getAverageRating = async (
  ideaId: string, 
  _useCache = true
): Promise<RatingStats> => {
  // For ratings, we always fetch from server to ensure accuracy
  // But we cache the individual ratings for offline viewing
  const response = await api.get<RatingStats>(
    `/ideas/${ideaId}/ratings/average`
  );
  
  return response.data;
};

/**
 * Get all ratings for an idea (for caching purposes)
 */
export const getRatingsByIdea = async (
  ideaId: string,
  _useCache = true
): Promise<Rating[]> => {
  // Try cache first
  try {
    const cachedRatings = await getItemsByIndex<Rating>(
      STORES.RATINGS,
      'ideaId',
      ideaId
    );
    if (cachedRatings.length > 0) {
      return cachedRatings;
    }
  } catch (error) {
    console.error('Failed to retrieve cached ratings:', error);
  }
  
  // Note: This endpoint may not exist in the backend
  // This is primarily for caching purposes
  // In practice, ratings are embedded in idea details
  return [];
};

export const cachedRatingService = {
  submitRating,
  getAverageRating,
  getRatingsByIdea,
};
