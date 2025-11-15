/**
 * Cached Feedback Service with IndexedDB support
 */

import api from './api';
import { STORES, putItem, getItemsByIndex } from './indexedDB';
import { Feedback } from './ideaService';

export interface CreateFeedbackData {
  content: string;
}

/**
 * Create feedback and update cache
 */
export const createFeedback = async (
  ideaId: string, 
  data: CreateFeedbackData
): Promise<Feedback> => {
  const response = await api.post<{ feedback: Feedback }>(
    `/ideas/${ideaId}/feedback`, 
    data
  );
  const feedback = response.data.feedback;
  
  // Cache the new feedback
  try {
    await putItem(STORES.FEEDBACK, feedback);
  } catch (error) {
    console.error('Failed to cache new feedback:', error);
  }
  
  return feedback;
};

/**
 * Get feedback for an idea with cache-first strategy
 */
export const getFeedbackByIdea = async (
  ideaId: string, 
  useCache = true
): Promise<Feedback[]> => {
  // Try cache first if enabled
  if (useCache) {
    try {
      const cachedFeedback = await getItemsByIndex<Feedback>(
        STORES.FEEDBACK, 
        'ideaId', 
        ideaId
      );
      if (cachedFeedback.length > 0) {
        return cachedFeedback;
      }
    } catch (error) {
      console.error('Failed to retrieve cached feedback:', error);
    }
  }
  
  // Fetch from server
  const response = await api.get<{ feedback: Feedback[] }>(
    `/ideas/${ideaId}/feedback`
  );
  const feedback = response.data.feedback;
  
  // Update cache
  try {
    for (const item of feedback) {
      await putItem(STORES.FEEDBACK, item);
    }
  } catch (error) {
    console.error('Failed to cache fetched feedback:', error);
  }
  
  return feedback;
};

export const cachedFeedbackService = {
  createFeedback,
  getFeedbackByIdea,
};
