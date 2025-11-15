import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, execute } from '../database/connection';
import { createIdea, getIdeas, getIdeaById } from './ideaService';
import { register } from './authService';

describe('Idea Service', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Initialize test database
    initializeDatabase();

    // Create a test user
    const result = await register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    testUserId = result.user.id;
  });

  afterAll(() => {
    // Clean up
    closeDatabase();
  });

  beforeEach(() => {
    // Clean up ideas before each test
    execute('DELETE FROM ideas WHERE user_id = ?', [testUserId]);
  });

  describe('createIdea', () => {
    it('should create an idea with valid data', () => {
      const ideaData = {
        title: 'Test Idea Title',
        description: 'This is a test idea description with enough characters.'
      };

      const idea = createIdea(testUserId, ideaData);

      expect(idea).toBeDefined();
      expect(idea.id).toBeDefined();
      expect(idea.userId).toBe(testUserId);
      expect(idea.title).toBe(ideaData.title);
      expect(idea.description).toBe(ideaData.description);
      expect(idea.createdAt).toBeDefined();
    });

    it('should throw error for title too short', () => {
      const ideaData = {
        title: 'Test',
        description: 'This is a test idea description.'
      };

      expect(() => createIdea(testUserId, ideaData)).toThrow('Title must be between 5 and 100 characters');
    });

    it('should throw error for description too short', () => {
      const ideaData = {
        title: 'Valid Title',
        description: 'Short'
      };

      expect(() => createIdea(testUserId, ideaData)).toThrow('Description must be at least 10 characters');
    });
  });

  describe('getIdeas', () => {
    beforeEach(() => {
      // Create test ideas
      createIdea(testUserId, {
        title: 'First Idea',
        description: 'First idea description for testing pagination.'
      });
      createIdea(testUserId, {
        title: 'Second Idea',
        description: 'Second idea description for testing pagination.'
      });
    });

    it('should return paginated ideas', () => {
      const result = getIdeas(1, 10, 'date');

      expect(result).toBeDefined();
      expect(result.ideas).toBeInstanceOf(Array);
      expect(result.ideas.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('should include engagement metrics', () => {
      const result = getIdeas(1, 10, 'date');

      expect(result.ideas[0]).toHaveProperty('averageRating');
      expect(result.ideas[0]).toHaveProperty('ratingCount');
      expect(result.ideas[0]).toHaveProperty('feedbackCount');
      expect(result.ideas[0]).toHaveProperty('author');
      expect(result.ideas[0].author).toHaveProperty('username');
    });

    it('should respect pagination limit', () => {
      const result = getIdeas(1, 1, 'date');

      expect(result.ideas.length).toBe(1);
    });

    it('should filter ideas by search term', () => {
      createIdea(testUserId, {
        title: 'Unique Search Term',
        description: 'This idea has a unique title for searching.'
      });

      const result = getIdeas(1, 10, 'date', undefined, undefined, 'Unique Search');

      expect(result.ideas.length).toBeGreaterThan(0);
      expect(result.ideas.some(idea => idea.title.includes('Unique Search'))).toBe(true);
    });

    it('should return empty array when search term does not match', () => {
      const result = getIdeas(1, 10, 'date', undefined, undefined, 'NonExistentSearchTerm12345');

      expect(result.ideas.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getIdeaById', () => {
    it('should return idea with engagement metrics', () => {
      const createdIdea = createIdea(testUserId, {
        title: 'Test Idea',
        description: 'Test idea description for retrieval.'
      });

      const idea = getIdeaById(createdIdea.id);

      expect(idea).toBeDefined();
      expect(idea?.id).toBe(createdIdea.id);
      expect(idea?.title).toBe(createdIdea.title);
      expect(idea).toHaveProperty('averageRating');
      expect(idea).toHaveProperty('ratingCount');
      expect(idea).toHaveProperty('feedbackCount');
      expect(idea).toHaveProperty('author');
    });

    it('should return null for non-existent idea', () => {
      const idea = getIdeaById('non-existent-id');

      expect(idea).toBeNull();
    });
  });
});
