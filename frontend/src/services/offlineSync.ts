/**
 * Offline Sync Service
 * Handles queuing operations when offline and syncing when connection is restored
 */

import { 
  STORES, 
  SyncQueueItem, 
  addItem, 
  getAllItems, 
  deleteItem,
  putItem 
} from './indexedDB';
import { ideaService, CreateIdeaData } from './ideaService';
import api from './api';

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Add an operation to the sync queue
 */
export const queueOperation = async (
  type: 'idea' | 'feedback' | 'rating',
  operation: 'create' | 'update',
  data: any
): Promise<void> => {
  const queueItem: SyncQueueItem = {
    type,
    operation,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  try {
    await addItem(STORES.SYNC_QUEUE, queueItem);
    console.log('Operation queued for sync:', queueItem);
  } catch (error) {
    console.error('Failed to queue operation:', error);
    throw error;
  }
};

/**
 * Process a single sync queue item
 */
const processSyncItem = async (item: SyncQueueItem): Promise<boolean> => {
  try {
    switch (item.type) {
      case 'idea':
        if (item.operation === 'create') {
          const idea = await ideaService.createIdea(item.data as CreateIdeaData);
          // Update cache with server-generated ID
          await putItem(STORES.IDEAS, idea);
        }
        break;
        
      case 'feedback':
        if (item.operation === 'create') {
          await api.post(`/ideas/${item.data.ideaId}/feedback`, {
            content: item.data.content,
          });
        }
        break;
        
      case 'rating':
        if (item.operation === 'create') {
          await api.post(`/ideas/${item.data.ideaId}/ratings`, {
            score: item.data.score,
          });
        } else if (item.operation === 'update') {
          await api.put(`/ideas/${item.data.ideaId}/ratings`, {
            score: item.data.score,
          });
        }
        break;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to process sync item:', error);
    return false;
  }
};

/**
 * Sync all queued operations
 */
export const syncQueuedOperations = async (): Promise<{
  success: number;
  failed: number;
}> => {
  if (!isOnline()) {
    console.log('Cannot sync: offline');
    return { success: 0, failed: 0 };
  }
  
  const queueItems = await getAllItems<SyncQueueItem>(STORES.SYNC_QUEUE);
  
  if (queueItems.length === 0) {
    console.log('No items to sync');
    return { success: 0, failed: 0 };
  }
  
  console.log(`Syncing ${queueItems.length} queued operations...`);
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const item of queueItems) {
    const success = await processSyncItem(item);
    
    if (success) {
      // Remove from queue on success
      if (item.id) {
        await deleteItem(STORES.SYNC_QUEUE, item.id);
      }
      successCount++;
    } else {
      // Increment retry count
      item.retryCount++;
      
      // Remove if max retries reached (3 attempts)
      if (item.retryCount >= 3) {
        console.error('Max retries reached for item:', item);
        if (item.id) {
          await deleteItem(STORES.SYNC_QUEUE, item.id);
        }
      } else {
        // Update retry count
        if (item.id) {
          await putItem(STORES.SYNC_QUEUE, item);
        }
      }
      
      failedCount++;
    }
  }
  
  console.log(`Sync complete: ${successCount} success, ${failedCount} failed`);
  
  return { success: successCount, failed: failedCount };
};

/**
 * Get count of pending sync operations
 */
export const getPendingSyncCount = async (): Promise<number> => {
  const queueItems = await getAllItems<SyncQueueItem>(STORES.SYNC_QUEUE);
  return queueItems.length;
};

/**
 * Initialize offline sync listeners
 */
export const initOfflineSync = (): void => {
  // Listen for online event
  window.addEventListener('online', async () => {
    console.log('Connection restored, syncing queued operations...');
    await syncQueuedOperations();
  });
  
  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('Connection lost, operations will be queued');
  });
  
  // Attempt sync on page load if online
  if (isOnline()) {
    syncQueuedOperations().catch(error => {
      console.error('Initial sync failed:', error);
    });
  }
};

export const offlineSyncService = {
  isOnline,
  queueOperation,
  syncQueuedOperations,
  getPendingSyncCount,
  initOfflineSync,
};
