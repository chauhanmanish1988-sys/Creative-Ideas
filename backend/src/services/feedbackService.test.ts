import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, execute } from '../database/connection';
import { createFeedback, getFeedbackByIdea } from './feedbackService';
import { createIdea } from './ideaService';
import { register } from './authService';

describe('Feedback Service', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testIdeaId: string;

  beforeAll(async () => {
    // Initialize test database
    initializeDatabase();

    // Create test users
    const user1 = await register({
      username: 'feedbackuser1',
      email: 'feedback1@example.com',
      password: 'password123'
    });
    testUser1Id = user1.user.id;

    const user2 = await register({
      username: 'feedbackuser2',
      email: 'feedback2@example.com',
      password: 'password123'
    });
    testUser2Id = user2.user.id;
  });

  afterAll(() => {
    // Clean up
    closeDatabase();
  });

  beforeEach(() => {
    // Clean up feedback and ideas before each test
    execute('DELETE FROM feedback WHERE user_id IN (?, ?)', [testUser1Id, testUser2Id]);
    execute('DELETE FROM ideas WHERE user_id IN (?, ?)', [testUser1Id, testUser2Id]);

    // Create a test idea for user1
    const idea = createIdea(testUser1Id, {
      title: 'Test Idea for Feedback',
      description: 'This is a test idea to receive feedback.'
    });
    testIdeaId = idea.id;
  });

  describe('createFeedback', () => {
    it('should create feedback with valid data', () => {
      const feedbackData = {
        content: 'This is a great idea! I really like the approach.'
      };

      const feedback = createFeedback(testUser2Id, testIdeaId, feedbackData);

      expect(feedback).toBeDefined();
      expect(feedback.id).toBeDefined();
      expect(feedback.ideaId).toBe(testIdeaId);
      expect(feedback.userId).toBe(testUser2Id);
      expect(feedback.content).toBe(feedbackData.content);
      expect(feedback.createdAt).toBeDefined();
    });

    it('should throw error for content too short', () => {
      const feedbackData = {
        content: 'Short'
      };

      expect(() => createFeedback(testUser2Id, testIdeaId, feedbackData))
        .toThrow('Feedback content must be at least 10 characters');
    });

    it('should prevent self-feedback', () => {
      const feedbackData = {
        content: 'This is my own idea and I am trying to provide feedback.'
      };

      expect(() => createFeedback(testUser1Id, testIdeaId, feedbackData))
        .toThrow('Cannot provide feedback on own idea');
    });

    it('should throw error for non-existent idea', () => {
      const feedbackData = {
        content: 'This is feedback for a non-existent idea.'
      };

      expect(() => createFeedback(testUser2Id, 'non-existent-id', feedbackData))
        .toThrow('Idea not found');
    });
  });

  describe('getFeedbackByIdea', () => {
    it('should return all feedback for an idea', () => {
      // Create multiple feedback entries
      createFeedback(testUser2Id, testIdeaId, {
        content: 'First feedback on this idea.'
      });
      createFeedback(testUser2Id, testIdeaId, {
        content: 'Second feedback on this idea.'
      });

      const feedback = getFeedbackByIdea(testIdeaId);

      expect(feedback).toBeDefined();
      expect(feedback).toBeInstanceOf(Array);
      expect(feedback.length).toBe(2);
      expect(feedback[0]).toHaveProperty('content');
      expect(feedback[0]).toHaveProperty('author');
      expect(feedback[0].author).toHaveProperty('username');
    });

    it('should return empty array for idea with no feedback', () => {
      const feedback = getFeedbackByIdea(testIdeaId);

      expect(feedback).toBeDefined();
      expect(feedback).toBeInstanceOf(Array);
      expect(feedback.length).toBe(0);
    });

    it('should order feedback by creation date descending', () => {
      // Create feedback entries
      const feedback1 = createFeedback(testUser2Id, testIdeaId, {
        content: 'First feedback created.'
      });
      const feedback2 = createFeedback(testUser2Id, testIdeaId, {
        content: 'Second feedback created.'
      });

      const feedback = getFeedbackByIdea(testIdeaId);

      expect(feedback.length).toBe(2);
      // Most recent should be first
      expect(feedback[0].id).toBe(feedback2.id);
      expect(feedback[1].id).toBe(feedback1.id);
    });
  });
});
