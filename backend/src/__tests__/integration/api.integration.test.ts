import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, execute } from '../../database/connection';
import { register, login } from '../../services/authService';
import { createIdea, getIdeas, getIdeaById, getUserIdeas } from '../../services/ideaService';
import { createFeedback, getFeedbackByIdea } from '../../services/feedbackService';
import { createRating, updateRating, getAverageRating, getRatingCount } from '../../services/ratingService';

describe('API Integration Tests', () => {
  let user1Id: string;
  let user1Token: string;
  let user2Id: string;
  let user2Token: string;

  beforeAll(async () => {
    // Initialize test database
    initializeDatabase();

    // Create test users
    const user1 = await register({
      username: 'testuser1',
      email: 'user1@test.com',
      password: 'password123'
    });
    user1Id = user1.user.id;
    user1Token = user1.token;

    const user2 = await register({
      username: 'testuser2',
      email: 'user2@test.com',
      password: 'password123'
    });
    user2Id = user2.user.id;
    user2Token = user2.token;
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // Clean up test data
    execute('DELETE FROM ratings WHERE 1=1', []);
    execute('DELETE FROM feedback WHERE 1=1', []);
    execute('DELETE FROM ideas WHERE 1=1', []);
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Registration
      const newUser = await register({
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123'
      });

      expect(newUser).toBeDefined();
      expect(newUser.user).toBeDefined();
      expect(newUser.user.username).toBe('newuser');
      expect(newUser.user.email).toBe('newuser@test.com');
      expect(newUser.token).toBeDefined();
      expect((newUser.user as any).passwordHash).toBeUndefined(); // Should not expose password hash

      // Clean up
      execute('DELETE FROM users WHERE email = ?', ['newuser@test.com']);
    });

    it('should reject duplicate email registration', async () => {
      await expect(
        register({
          username: 'duplicate',
          email: 'user1@test.com', // Already exists
          password: 'password123'
        })
      ).rejects.toThrow();
    });

    it('should reject invalid credentials on login', async () => {
      await expect(
        login({
          email: 'user1@test.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow();
    });
  });

  describe('Idea Creation and Retrieval Flow', () => {
    it('should create idea and retrieve it with engagement metrics', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Integration Test Idea',
        description: 'This is a test idea for integration testing.'
      });

      expect(idea).toBeDefined();
      expect(idea.id).toBeDefined();
      expect(idea.userId).toBe(user1Id);
      expect(idea.title).toBe('Integration Test Idea');

      // Retrieve idea by ID
      const retrievedIdea = getIdeaById(idea.id);

      expect(retrievedIdea).toBeDefined();
      expect(retrievedIdea?.id).toBe(idea.id);
      expect(retrievedIdea?.averageRating).toBeDefined();
      expect(retrievedIdea?.ratingCount).toBe(0);
      expect(retrievedIdea?.feedbackCount).toBe(0);
      expect(retrievedIdea?.author).toBeDefined();
      expect(retrievedIdea?.author.username).toBe('testuser1');
    });

    it('should retrieve paginated ideas list', () => {
      // Create multiple ideas
      createIdea(user1Id, {
        title: 'First Idea',
        description: 'First test idea description.'
      });
      createIdea(user2Id, {
        title: 'Second Idea',
        description: 'Second test idea description.'
      });
      createIdea(user1Id, {
        title: 'Third Idea',
        description: 'Third test idea description.'
      });

      // Retrieve ideas
      const result = getIdeas(1, 10, 'date');

      expect(result).toBeDefined();
      expect(result.ideas).toBeInstanceOf(Array);
      expect(result.ideas.length).toBe(3);
      expect(result.totalCount).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);

      // Verify each idea has engagement metrics
      result.ideas.forEach((idea: any) => {
        expect(idea).toHaveProperty('averageRating');
        expect(idea).toHaveProperty('ratingCount');
        expect(idea).toHaveProperty('feedbackCount');
        expect(idea).toHaveProperty('author');
      });
    });

    it('should retrieve user-specific ideas', () => {
      // Create ideas for both users
      createIdea(user1Id, {
        title: 'User1 Idea 1',
        description: 'First idea by user 1.'
      });
      createIdea(user1Id, {
        title: 'User1 Idea 2',
        description: 'Second idea by user 1.'
      });
      createIdea(user2Id, {
        title: 'User2 Idea',
        description: 'Idea by user 2.'
      });

      // Retrieve user1's ideas
      const user1Ideas = getUserIdeas(user1Id);

      expect(user1Ideas).toBeInstanceOf(Array);
      expect(user1Ideas.length).toBe(2);
      user1Ideas.forEach((idea: any) => {
        expect(idea.userId).toBe(user1Id);
      });
    });
  });

  describe('Feedback Submission Flow', () => {
    it('should submit feedback and retrieve it', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea for Feedback',
        description: 'This idea will receive feedback.'
      });

      // Submit feedback from user2
      const feedback = createFeedback(user2Id, idea.id, {
        content: 'This is great feedback on the idea!'
      });

      expect(feedback).toBeDefined();
      expect(feedback.id).toBeDefined();
      expect(feedback.ideaId).toBe(idea.id);
      expect(feedback.userId).toBe(user2Id);
      expect(feedback.content).toBe('This is great feedback on the idea!');

      // Retrieve feedback
      const feedbackList = getFeedbackByIdea(idea.id);

      expect(feedbackList).toBeInstanceOf(Array);
      expect(feedbackList.length).toBe(1);
      expect(feedbackList[0].id).toBe(feedback.id);
      expect(feedbackList[0].author).toBeDefined();
      expect(feedbackList[0].author.username).toBe('testuser2');
    });

    it('should prevent self-feedback', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'My Own Idea',
        description: 'I cannot provide feedback on this.'
      });

      // Attempt self-feedback
      expect(() => {
        createFeedback(user1Id, idea.id, {
          content: 'Trying to feedback my own idea.'
        });
      }).toThrow();
    });

    it('should update idea engagement metrics after feedback', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea with Feedback',
        description: 'This idea will have feedback metrics.'
      });

      // Add feedback
      createFeedback(user2Id, idea.id, {
        content: 'First feedback on this idea.'
      });
      createFeedback(user2Id, idea.id, {
        content: 'Second feedback on this idea.'
      });

      // Retrieve idea and check metrics
      const updatedIdea = getIdeaById(idea.id);

      expect(updatedIdea?.feedbackCount).toBe(2);
    });
  });

  describe('Rating Submission Flow', () => {
    it('should submit rating and calculate average', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea for Rating',
        description: 'This idea will be rated.'
      });

      // Submit rating from user2
      const rating = createRating(user2Id, idea.id, { score: 5 });

      expect(rating).toBeDefined();
      expect(rating.id).toBeDefined();
      expect(rating.ideaId).toBe(idea.id);
      expect(rating.userId).toBe(user2Id);
      expect(rating.score).toBe(5);

      // Check average rating
      const avgRating = getAverageRating(idea.id);

      expect(avgRating).toBe(5.0);
    });

    it('should update existing rating', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea for Rating Update',
        description: 'This idea rating will be updated.'
      });

      // Submit initial rating
      createRating(user2Id, idea.id, { score: 3 });

      // Update rating
      const updatedRating = updateRating(user2Id, idea.id, { score: 5 });

      expect(updatedRating.score).toBe(5);

      // Verify average is updated
      const avgRating = getAverageRating(idea.id);

      expect(avgRating).toBe(5.0);
    });

    it('should prevent self-rating', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'My Own Idea for Rating',
        description: 'I cannot rate this.'
      });

      // Attempt self-rating
      expect(() => {
        createRating(user1Id, idea.id, { score: 5 });
      }).toThrow();
    });

    it('should calculate correct average with multiple ratings', async () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea with Multiple Ratings',
        description: 'This will have multiple ratings.'
      });

      // Create another user for third rating
      const user3 = await register({
        username: 'testuser3',
        email: 'user3@test.com',
        password: 'password123'
      });

      // Submit multiple ratings
      createRating(user2Id, idea.id, { score: 4 });
      createRating(user3.user.id, idea.id, { score: 5 });

      // Check average
      const avgRating = getAverageRating(idea.id);
      const count = getRatingCount(idea.id);

      expect(count).toBe(2);
      expect(avgRating).toBe(4.5);

      // Clean up
      execute('DELETE FROM users WHERE email = ?', ['user3@test.com']);
    });

    it('should update idea engagement metrics after rating', () => {
      // Create idea
      const idea = createIdea(user1Id, {
        title: 'Idea with Rating Metrics',
        description: 'This idea will have rating metrics.'
      });

      // Add rating
      createRating(user2Id, idea.id, { score: 4 });

      // Retrieve idea and check metrics
      const updatedIdea = getIdeaById(idea.id);

      expect(updatedIdea?.ratingCount).toBe(1);
      expect(updatedIdea?.averageRating).toBe(4.0);
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent unauthorized idea creation', () => {
      // Attempt to create idea with invalid user ID
      expect(() => {
        createIdea('invalid-user-id', {
          title: 'Unauthorized Idea',
          description: 'This should not be created.'
        });
      }).toThrow();
    });

    it('should prevent feedback on non-existent idea', () => {
      expect(() => {
        createFeedback(user1Id, 'non-existent-idea-id', {
          content: 'Feedback on nothing.'
        });
      }).toThrow();
    });

    it('should prevent rating on non-existent idea', () => {
      expect(() => {
        createRating(user1Id, 'non-existent-idea-id', { score: 5 });
      }).toThrow();
    });

    it('should validate rating score range', () => {
      const idea = createIdea(user1Id, {
        title: 'Idea for Invalid Rating',
        description: 'Testing rating validation.'
      });

      // Test score too low
      expect(() => {
        createRating(user2Id, idea.id, { score: 0 });
      }).toThrow();

      // Test score too high
      expect(() => {
        createRating(user2Id, idea.id, { score: 6 });
      }).toThrow();
    });

    it('should validate feedback content length', () => {
      const idea = createIdea(user1Id, {
        title: 'Idea for Invalid Feedback',
        description: 'Testing feedback validation.'
      });

      // Test content too short
      expect(() => {
        createFeedback(user2Id, idea.id, { content: 'Short' });
      }).toThrow();
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full user interaction flow', () => {
      // User1 creates an idea
      const idea = createIdea(user1Id, {
        title: 'Complete Journey Idea',
        description: 'This idea will go through the complete flow.'
      });

      expect(idea).toBeDefined();

      // User2 provides feedback
      const feedback = createFeedback(user2Id, idea.id, {
        content: 'Great idea! I really like this concept.'
      });

      expect(feedback).toBeDefined();

      // User2 rates the idea
      const rating = createRating(user2Id, idea.id, { score: 5 });

      expect(rating).toBeDefined();

      // Retrieve idea with all engagement data
      const fullIdea = getIdeaById(idea.id);

      expect(fullIdea).toBeDefined();
      expect(fullIdea?.feedbackCount).toBe(1);
      expect(fullIdea?.ratingCount).toBe(1);
      expect(fullIdea?.averageRating).toBe(5.0);

      // Retrieve feedback list
      const feedbackList = getFeedbackByIdea(idea.id);

      expect(feedbackList.length).toBe(1);
      expect(feedbackList[0].author.username).toBe('testuser2');

      // User2 updates their rating
      const updatedRating = updateRating(user2Id, idea.id, { score: 4 });

      expect(updatedRating.score).toBe(4);

      // Verify updated metrics
      const updatedIdea = getIdeaById(idea.id);
      expect(updatedIdea?.averageRating).toBe(4.0);
    });
  });
});
