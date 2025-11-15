/**
 * Cached Idea Service with IndexedDB support
 * Implements cache-first strategy for idea retrieval
 */

import { ideaService, Idea, IdeaWithDetails, CreateIdeaData, IdeasResponse } from './ideaService';
import { STORES, putItem, getItem, getAllItems, getItemsByIndex } from './indexedDB';

/**
 * Create a new idea and update cache
 */
export const createIdea = async (data: CreateIdeaData): Promise<Idea> => {
  const idea = await ideaService.createIdea(data);
  
  // Cache the newly created idea
  try {
    await putItem(STORES.IDEAS, idea);
  } catch (error) {
    console.error('Failed to cache new idea:', error);
  }
  
  return idea;
};

/**
 * Get ideas with cache-first strategy
 */
export const getIdeas = async (
  page = 1, 
  limit = 10, 
  sortBy = 'createdAt',
  useCache = true
): Promise<IdeasResponse> => {
  // Try cache first if enabled
  if (useCache && page === 1) {
    try {
      const cachedIdeas = await getAllItems<Idea>(STORES.IDEAS);
      if (cachedIdeas.length > 0) {
        // Sort cached ideas
        const sorted = [...cachedIdeas].sort((a, b) => {
          if (sortBy === 'createdAt') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
        });
        
        // Return cached data with pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedIdeas = sorted.slice(start, end);
        
        return {
          ideas: paginatedIdeas,
          totalCount: sorted.length,
          page,
          totalPages: Math.ceil(sorted.length / limit),
        };
      }
    } catch (error) {
      console.error('Failed to retrieve cached ideas:', error);
    }
  }
  
  // Fetch from server
  const response = await ideaService.getIdeas(page, limit, sortBy);
  
  // Update cache with fetched ideas
  try {
    for (const idea of response.ideas) {
      await putItem(STORES.IDEAS, idea);
    }
  } catch (error) {
    console.error('Failed to cache fetched ideas:', error);
  }
  
  return response;
};

/**
 * Get idea by ID with cache-first strategy
 */
export const getIdeaById = async (id: string, useCache = true): Promise<IdeaWithDetails> => {
  // Try cache first if enabled
  if (useCache) {
    try {
      const cachedIdea = await getItem<IdeaWithDetails>(STORES.IDEAS, id);
      if (cachedIdea) {
        return cachedIdea;
      }
    } catch (error) {
      console.error('Failed to retrieve cached idea:', error);
    }
  }
  
  // Fetch from server
  const idea = await ideaService.getIdeaById(id);
  
  // Update cache
  try {
    await putItem(STORES.IDEAS, idea);
  } catch (error) {
    console.error('Failed to cache fetched idea:', error);
  }
  
  return idea;
};

/**
 * Get user ideas with cache-first strategy
 */
export const getUserIdeas = async (userId: string, useCache = true): Promise<Idea[]> => {
  // Try cache first if enabled
  if (useCache) {
    try {
      const cachedIdeas = await getItemsByIndex<Idea>(STORES.IDEAS, 'userId', userId);
      if (cachedIdeas.length > 0) {
        return cachedIdeas;
      }
    } catch (error) {
      console.error('Failed to retrieve cached user ideas:', error);
    }
  }
  
  // Fetch from server
  const ideas = await ideaService.getUserIdeas(userId);
  
  // Update cache
  try {
    for (const idea of ideas) {
      await putItem(STORES.IDEAS, idea);
    }
  } catch (error) {
    console.error('Failed to cache user ideas:', error);
  }
  
  return ideas;
};

export const cachedIdeaService = {
  createIdea,
  getIdeas,
  getIdeaById,
  getUserIdeas,
};
