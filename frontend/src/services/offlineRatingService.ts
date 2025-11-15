/**
 * Offline-capable Rating Service
 */

import { 
  cachedRatingService, 
  CreateRatingData, 
  Rating, 
  RatingStats 
} from './cachedRatingService';
import { offlineSyncService, queueOperation } from './offlineSync';
import { putItem, STORES } from './indexedDB';

// Simple temporary ID generator
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Submit rating with offline support
 */
export const submitRating = async (
  ideaId: string,
  data: CreateRatingData,
  isUpdate = false
): Promise<Rating> => {
  if (!offlineSyncService.isOnline()) {
    // Create temporary rating for offline mode
    const tempRating: Rating = {
      id: generateTempId(),
      ideaId,
      userId: 'current-user', // Will be replaced on sync
      score: data.score,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Cache the temporary rating
    await putItem(STORES.RATINGS, tempRating);
    
    // Queue for sync
    await queueOperation('rating', isUpdate ? 'update' : 'create', { 
      ideaId, 
      ...data 
    });
    
    return tempRating;
  }
  
  // Online: submit normally with caching
  return cachedRatingService.submitRating(ideaId, data, isUpdate);
};

/**
 * Get average rating with offline support
 */
export const getAverageRating = async (ideaId: string): Promise<RatingStats> => {
  if (!offlineSyncService.isOnline()) {
    // Offline: return cached stats or default
    return { averageRating: 0, count: 0 };
  }
  
  // Online: fetch from server
  return cachedRatingService.getAverageRating(ideaId, true);
};

export const offlineRatingService = {
  submitRating,
  getAverageRating,
};
