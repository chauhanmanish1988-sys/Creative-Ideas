import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, execute } from '../database/connection';
import {
  createRating,
  updateRating,
  getAverageRating,
  getRatingCount,
  getRatingStats
} from './ratingService';
import { createIdea } from './ideaService';
import { register } from './authService';

describe('Rating Service', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testUser3Id: string;
  let testIdeaId: string;

  beforeAll(async () => {
    // Initialize test database
    initializeDatabase();

    // Create test users
    const user1 = await register({
      username: 'ratinguser1',
      email: 'rating1@example.com',
      password: 'password123'
    });
    testUser1Id = user1.user.id;

    const user2 = await register({
      username: 'ratinguser2',
      email: 'rating2@example.com',
      password: 'password123'
    });
    testUser2Id = user2.user.id;

    const user3 = await register({
      username: 'ratinguser3',
      email: 'rating3@example.com',
      password: 'password123'
    });
    testUser3Id = user3.user.id;
  });

  afterAll(() => {
    // Clean up
    closeDatabase();
  });

  beforeEach(() => {
    // Clean up ratings and ideas before each test
    execute('DELETE FROM ratings WHERE user_id IN (?, ?, ?)', [testUser1Id, testUser2Id, testUser3Id]);
    execute('DELETE FROM ideas WHERE user_id IN (?, ?, ?)', [testUser1Id, testUser2Id, testUser3Id]);

    // Create a test idea for user1
    const idea = createIdea(testUser1Id, {
      title: 'Test Idea for Ratings',
      description: 'This is a test idea to receive ratings.'
    });
    testIdeaId = idea.id;
  });

  describe('createRating', () => {
    it('should create rating with valid data', () => {
      const ratingData = {
        score: 5
      };

      const rating = createRating(testUser2Id, testIdeaId, ratingData);

      expect(rating).toBeDefined();
      expect(rating.id).toBeDefined();
      expect(rating.ideaId).toBe(testIdeaId);
      expect(rating.userId).toBe(testUser2Id);
      expect(rating.score).toBe(5);
      expect(rating.createdAt).toBeDefined();
      expect(rating.updatedAt).toBeDefined();
    });

    it('should create rating with minimum score', () => {
      const ratingData = {
        score: 1
      };

      const rating = createRating(testUser2Id, testIdeaId, ratingData);

      expect(rating).toBeDefined();
      expect(rating.score).toBe(1);
    });

    it('should throw error for score below minimum', () => {
      const ratingData = {
        score: 0
      };

      expect(() => createRating(testUser2Id, testIdeaId, ratingData))
        .toThrow('Rating score must be an integer between 1 and 5');
    });

    it('should throw error for score above maximum', () => {
      const ratingData = {
        score: 6
      };

      expect(() => createRating(testUser2Id, testIdeaId, ratingData))
        .toThrow('Rating score must be an integer between 1 and 5');
    });

    it('should throw error for non-integer score', () => {
      const ratingData = {
        score: 3.5
      };

      expect(() => createRating(testUser2Id, testIdeaId, ratingData))
        .toThrow('Rating score must be an integer between 1 and 5');
    });

    it('should prevent self-rating', () => {
      const ratingData = {
        score: 5
      };

      expect(() => createRating(testUser1Id, testIdeaId, ratingData))
        .toThrow('Cannot rate own idea');
    });

    it('should throw error for non-existent idea', () => {
      const ratingData = {
        score: 4
      };

      expect(() => createRating(testUser2Id, 'non-existent-id', ratingData))
        .toThrow('Idea not found');
    });

    it('should throw error when user tries to rate same idea twice', () => {
      const ratingData = {
        score: 4
      };

      // First rating should succeed
      createRating(testUser2Id, testIdeaId, ratingData);

      // Second rating should fail
      expect(() => createRating(testUser2Id, testIdeaId, ratingData))
        .toThrow('User has already rated this idea');
    });
  });

  describe('updateRating', () => {
    beforeEach(() => {
      // Create an initial rating for user2
      createRating(testUser2Id, testIdeaId, { score: 3 });
    });

    it('should update existing rating', () => {
      const updateData = {
        score: 5
      };

      const rating = updateRating(testUser2Id, testIdeaId, updateData);

      expect(rating).toBeDefined();
      expect(rating.score).toBe(5);
      expect(rating.userId).toBe(testUser2Id);
      expect(rating.ideaId).toBe(testIdeaId);
    });

    it('should throw error for invalid score', () => {
      const updateData = {
        score: 7
      };

      expect(() => updateRating(testUser2Id, testIdeaId, updateData))
        .toThrow('Rating score must be an integer between 1 and 5');
    });

    it('should throw error when rating does not exist', () => {
      const updateData = {
        score: 4
      };

      expect(() => updateRating(testUser3Id, testIdeaId, updateData))
        .toThrow('Rating not found');
    });

    it('should prevent self-rating on update', () => {
      const updateData = {
        score: 5
      };

      expect(() => updateRating(testUser1Id, testIdeaId, updateData))
        .toThrow('Cannot rate own idea');
    });
  });

  describe('getAverageRating', () => {
    it('should return null for idea with no ratings', () => {
      const average = getAverageRating(testIdeaId);

      expect(average).toBeNull();
    });

    it('should calculate average rating correctly', () => {
      // Create ratings: 5, 4, 3 -> average = 4.0
      createRating(testUser2Id, testIdeaId, { score: 5 });
      createRating(testUser3Id, testIdeaId, { score: 4 });

      // Create another user for third rating
      const user4 = register({
        username: 'ratinguser4',
        email: 'rating4@example.com',
        password: 'password123'
      });
      createRating(user4.user.id, testIdeaId, { score: 3 });

      const average = getAverageRating(testIdeaId);

      expect(average).toBe(4.0);
    });

    it('should round average to one decimal place', () => {
      // Create ratings: 5, 4 -> average = 4.5
      createRating(testUser2Id, testIdeaId, { score: 5 });
      createRating(testUser3Id, testIdeaId, { score: 4 });

      const average = getAverageRating(testIdeaId);

      expect(average).toBe(4.5);
    });

    it('should handle single rating', () => {
      createRating(testUser2Id, testIdeaId, { score: 3 });

      const average = getAverageRating(testIdeaId);

      expect(average).toBe(3.0);
    });
  });

  describe('getRatingCount', () => {
    it('should return 0 for idea with no ratings', () => {
      const count = getRatingCount(testIdeaId);

      expect(count).toBe(0);
    });

    it('should return correct count for idea with ratings', () => {
      createRating(testUser2Id, testIdeaId, { score: 5 });
      createRating(testUser3Id, testIdeaId, { score: 4 });

      const count = getRatingCount(testIdeaId);

      expect(count).toBe(2);
    });

    it('should return 1 for idea with single rating', () => {
      createRating(testUser2Id, testIdeaId, { score: 3 });

      const count = getRatingCount(testIdeaId);

      expect(count).toBe(1);
    });
  });

  describe('getRatingStats', () => {
    it('should return stats with null average for no ratings', () => {
      const stats = getRatingStats(testIdeaId);

      expect(stats).toBeDefined();
      expect(stats.averageRating).toBeNull();
      expect(stats.count).toBe(0);
    });

    it('should return correct stats for idea with ratings', () => {
      createRating(testUser2Id, testIdeaId, { score: 5 });
      createRating(testUser3Id, testIdeaId, { score: 3 });

      const stats = getRatingStats(testIdeaId);

      expect(stats).toBeDefined();
      expect(stats.averageRating).toBe(4.0);
      expect(stats.count).toBe(2);
    });
  });
});
