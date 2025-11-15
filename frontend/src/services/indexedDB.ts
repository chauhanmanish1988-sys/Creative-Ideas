/**
 * IndexedDB service for client-side storage
 * Provides caching and offline support for the Creative Ideas Platform
 */

const DB_NAME = 'CreativeIdeasDB';
const DB_VERSION = 1;

// Object store names
export const STORES = {
  IDEAS: 'ideas',
  FEEDBACK: 'feedback',
  RATINGS: 'ratings',
  USERS: 'users',
  SYNC_QUEUE: 'syncQueue',
} as const;

export interface SyncQueueItem {
  id?: number;
  type: 'idea' | 'feedback' | 'rating';
  operation: 'create' | 'update';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Initialize IndexedDB with required object stores
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create ideas store
      if (!db.objectStoreNames.contains(STORES.IDEAS)) {
        const ideasStore = db.createObjectStore(STORES.IDEAS, { keyPath: 'id' });
        ideasStore.createIndex('userId', 'userId', { unique: false });
        ideasStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create feedback store
      if (!db.objectStoreNames.contains(STORES.FEEDBACK)) {
        const feedbackStore = db.createObjectStore(STORES.FEEDBACK, { keyPath: 'id' });
        feedbackStore.createIndex('ideaId', 'ideaId', { unique: false });
      }

      // Create ratings store
      if (!db.objectStoreNames.contains(STORES.RATINGS)) {
        const ratingsStore = db.createObjectStore(STORES.RATINGS, { keyPath: 'id' });
        ratingsStore.createIndex('ideaId', 'ideaId', { unique: false });
      }

      // Create users store
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Get a database connection
 */
const getDB = async (): Promise<IDBDatabase> => {
  return initDB();
};

/**
 * Add an item to a store
 */
export const addItem = async <T>(storeName: string, item: T): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to add item to ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB add error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Put (add or update) an item in a store
 */
export const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to put item in ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB put error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get an item by key from a store
 */
export const getItem = async <T>(storeName: string, key: string | number): Promise<T | undefined> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get item from ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB get error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all items from a store
 */
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get all items from ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB getAll error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get items by index
 */
export const getItemsByIndex = async <T>(
  storeName: string, 
  indexName: string, 
  value: string | number
): Promise<T[]> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get items by index from ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB getByIndex error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete an item from a store
 */
export const deleteItem = async (storeName: string, key: string | number): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete item from ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clear all items from a store
 */
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB clear error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Count items in a store
 */
export const countItems = async (storeName: string): Promise<number> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to count items in ${storeName}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    throw new Error(`IndexedDB count error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
