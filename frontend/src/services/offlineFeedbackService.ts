/**
 * Offline-capable Feedback Service
 */

import { cachedFeedbackService, CreateFeedbackData } from './cachedFeedbackService';
import { offlineSyncService, queueOperation } from './offlineSync';
import { Feedback } from './ideaService';
import { putItem, STORES } from './indexedDB';

// Simple temporary ID generator
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create feedback with offline support
 */
export const createFeedback = async (
  ideaId: string,
  data: CreateFeedbackData
): Promise<Feedback> => {
  if (!offlineSyncService.isOnline()) {
    // Create temporary feedback for offline mode
    const tempFeedback: Feedback = {
      id: generateTempId(),
      ideaId,
      userId: 'current-user', // Will be replaced on sync
      username: 'You',
      content: data.content,
      createdAt: new Date().toISOString(),
    };
    
    // Cache the temporary feedback
    await putItem(STORES.FEEDBACK, tempFeedback);
    
    // Queue for sync
    await queueOperation('feedback', 'create', { ideaId, ...data });
    
    return tempFeedback;
  }
  
  // Online: create normally with caching
  return cachedFeedbackService.createFeedback(ideaId, data);
};

/**
 * Get feedback with offline support
 */
export const getFeedbackByIdea = async (ideaId: string): Promise<Feedback[]> => {
  if (!offlineSyncService.isOnline()) {
    // Offline: use cache only
    return cachedFeedbackService.getFeedbackByIdea(ideaId, true);
  }
  
  // Online: fetch with caching
  return cachedFeedbackService.getFeedbackByIdea(ideaId, true);
};

export const offlineFeedbackService = {
  createFeedback,
  getFeedbackByIdea,
};
