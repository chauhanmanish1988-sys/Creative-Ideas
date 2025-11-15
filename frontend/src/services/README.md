# Services Documentation

## IndexedDB Client-Side Storage

This directory contains services for client-side storage, caching, and offline support using IndexedDB.

### Architecture

The implementation follows a layered architecture:

1. **Base Layer**: `indexedDB.ts` - Low-level IndexedDB utilities
2. **Caching Layer**: `cached*Service.ts` - Cache-first strategies
3. **Offline Layer**: `offline*Service.ts` - Offline queue and sync

### Files

#### Core IndexedDB (`indexedDB.ts`)
- Database initialization with object stores
- CRUD operations for all stores
- Error handling for IndexedDB operations
- Stores: ideas, feedback, ratings, users, syncQueue

#### Cached Services
- `cachedIdeaService.ts` - Idea caching with cache-first retrieval
- `cachedFeedbackService.ts` - Feedback caching
- `cachedRatingService.ts` - Rating caching

#### Offline Services
- `offlineIdeaService.ts` - Offline-capable idea operations
- `offlineFeedbackService.ts` - Offline-capable feedback operations
- `offlineRatingService.ts` - Offline-capable rating operations
- `offlineSync.ts` - Sync queue management and background sync

### Usage

#### Initialize Offline Sync
```typescript
import { offlineSyncService } from './services/offlineSync';

// In your app initialization
offlineSyncService.initOfflineSync();
```

#### Use Offline-Capable Services
```typescript
import { offlineIdeaService } from './services/offlineIdeaService';

// Works both online and offline
const idea = await offlineIdeaService.createIdea({
  title: 'My Idea',
  description: 'Description here'
});

// Automatically uses cache when available
const ideas = await offlineIdeaService.getIdeas();
```

### Features

#### Cache-First Strategy
- Fetches from cache first for faster load times
- Falls back to server if cache is empty
- Updates cache with fresh data from server

#### Offline Support
- Queues operations when offline
- Automatically syncs when connection is restored
- Generates temporary IDs for offline-created items
- Retry logic with max 3 attempts

#### Conflict Resolution
- Temporary IDs are replaced with server IDs on sync
- Failed sync items are retried up to 3 times
- Items exceeding retry limit are removed from queue

### Event Listeners

The offline sync service listens for:
- `online` event - Triggers automatic sync
- `offline` event - Logs offline status

### Storage Schema

#### Ideas Store
- keyPath: `id`
- indexes: `userId`, `createdAt`

#### Feedback Store
- keyPath: `id`
- indexes: `ideaId`

#### Ratings Store
- keyPath: `id`
- indexes: `ideaId`

#### Users Store
- keyPath: `id`

#### Sync Queue Store
- keyPath: `id` (auto-increment)
- indexes: `timestamp`

### Error Handling

All IndexedDB operations include try-catch blocks and log errors to console. Operations gracefully degrade when IndexedDB is unavailable.
