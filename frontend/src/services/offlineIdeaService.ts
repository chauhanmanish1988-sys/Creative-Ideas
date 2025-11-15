/**
 * Offline-capable Idea Service
 * Combines caching with offline queue support
 */

import { cachedIdeaService } from './cachedIdeaService';
import { offlineSyncService, queueOperation } from './offlineSync';
import { CreateIdeaData, Idea, IdeaWithDetails, IdeasResponse } from './ideaService';
import { putItem, STORES } from './indexedDB';

// Simple temporary ID generator
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create idea with offline support
 */
export const createIdea = async (data: CreateIdeaData): Promise<Idea> => {
  if (!offlineSyncService.isOnline()) {
    // Create temporary idea for offline mode
    const tempIdea: Idea = {
      id: generateTempId(),
      userId: 'current-user', // Will be replaced on sync
      title: data.title,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Cache the temporary idea
    await putItem(STORES.IDEAS, tempIdea);
    
    // Queue for sync
    await queueOperation('idea', 'create', data);
    
    return tempIdea;
  }
  
  // Online: create normally with caching
  return cachedIdeaService.createIdea(data);
};

/**
 * Get ideas with offline support
 */
export const getIdeas = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt'
): Promise<IdeasResponse> => {
  if (!offlineSyncService.isOnline()) {
    // Offline: use cache only
    return cachedIdeaService.getIdeas(page, limit, sortBy, true);
  }
  
  // Online: fetch with caching
  return cachedIdeaService.getIdeas(page, limit, sortBy, true);
};

/**
 * Get idea by ID with offline support
 */
export const getIdeaById = async (id: string): Promise<IdeaWithDetails> => {
  if (!offlineSyncService.isOnline()) {
    // Offline: use cache only
    return cachedIdeaService.getIdeaById(id, true);
  }
  
  // Online: fetch with caching
  return cachedIdeaService.getIdeaById(id, true);
};

/**
 * Get user ideas with offline support
 */
export const getUserIdeas = async (userId: string): Promise<Idea[]> => {
  if (!offlineSyncService.isOnline()) {
    // Offline: use cache only
    return cachedIdeaService.getUserIdeas(userId, true);
  }
  
  // Online: fetch with caching
  return cachedIdeaService.getUserIdeas(userId, true);
};

export const offlineIdeaService = {
  createIdea,
  getIdeas,
  getIdeaById,
  getUserIdeas,
};
