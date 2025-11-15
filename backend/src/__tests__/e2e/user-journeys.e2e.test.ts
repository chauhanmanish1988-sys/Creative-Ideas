import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, execute } from '../../database/connection';
import { register, login } from '../../services/authService';
import { createIdea, getIdeas, getIdeaById, getUserIdeas } from '../../services/ideaService';
import { createFeedback, getFeedbackByIdea } from '../../services/feedbackService';
import { createRating, updateRating, getAverageRating } from '../../services/ratingService';
import { getUserProfile, updateUser } from '../../services/userService';

describe('End-to-End User Journeys', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // Clean up all test data
    execute('DELETE FROM ratings WHERE 1=1', []);
    execute('DELETE FROM feedback WHERE 1=1', []);
    execute('DELETE FROM ideas WHERE 1=1', []);
    execute('DELETE FROM users WHERE email LIKE ?', ['%@e2etest.com']);
  });

  describe('User Registration and Login Journey', () => {
    it('should allow new user to register, login, and access their profile', async () => {
      // Step 1: User visits the platform and registers
      const registrationData = {
        username: 'johndoe',
        email: 'john@e2etest.com',
        password: 'SecurePass123'
      };

      const registrationResult = await register(registrationData);

      expect(registrationResult).toBeDefined();
      expect(registrationResult.user).toBeDefined();
      expect(registrationResult.user.username).toBe('johndoe');
      expect(registrationResult.user.email).toBe('john@e2etest.com');
      expect(registrationResult.token).toBeDefined();
      expect((registrationResult.user as any).passwordHash).toBeUndefined();

      const userId = registrationResult.user.id;
      const token = registrationResult.token;

      // Step 2: User logs out and logs back in
      const loginResult = await login({
        email: 'john@e2etest.com',
        password: 'SecurePass123'
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.id).toBe(userId);
      expect(loginResult.token).toBeDefined();

      // Step 3: User views their profile
      const userProfile = getUserProfile(userId);

      expect(userProfile).toBeDefined();
      expect(userProfile?.username).toBe('johndoe');
      expect(userProfile?.email).toBe('john@e2etest.com');
      expect(userProfile?.ideaCount).toBe(0);
      expect(userProfile?.feedbackCount).toBe(0);

      // Step 4: User updates their profile
      const updatedUser = updateUser(userId, {
        username: 'johndoe_updated'
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser.username).toBe('johndoe_updated');
      expect(updatedUser.email).toBe('john@e2etest.com');
    });

    it('should prevent registration with duplicate email', async () => {
      // First registration
      await register({
        username: 'user1',
        email: 'duplicate@e2etest.com',
        password: 'password123'
      });

      // Attempt duplicate registration
      await expect(
        register({
          username: 'user2',
          email: 'duplicate@e2etest.com',
          password: 'password456'
        })
      ).rejects.toThrow();
    });

    it('should reject login with incorrect password', async () => {
      // Register user
      await register({
        username: 'testuser',
        email: 'test@e2etest.com',
        password: 'correctpassword'
      });

      // Attempt login with wrong password
      await expect(
        login({
          email: 'test@e2etest.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow();
    });
  });

  describe('Idea Submission and Viewing Journey', () => {
    it('should allow user to submit idea and view it in the list', async () => {
      // Step 1: User registers and logs in
      const user = await register({
        username: 'creator',
        email: 'creator@e2etest.com',
        password: 'password123'
      });

      const userId = user.user.id;

      // Step 2: User navigates to idea submission form
      // Step 3: User fills out and submits the form
      const ideaData = {
        title: 'Revolutionary Mobile App Concept',
        description: 'An innovative mobile application that connects local artists with potential buyers through an intuitive marketplace interface.'
      };

      const createdIdea = createIdea(userId, ideaData);

      expect(createdIdea).toBeDefined();
      expect(createdIdea.id).toBeDefined();
      expect(createdIdea.title).toBe(ideaData.title);
      expect(createdIdea.description).toBe(ideaData.description);
      expect(createdIdea.userId).toBe(userId);
      expect(createdIdea.createdAt).toBeDefined();

      // Step 4: User views the ideas list and sees their idea
      const ideasList = getIdeas(1, 10, 'date');

      expect(ideasList).toBeDefined();
      expect(ideasList.ideas).toBeInstanceOf(Array);
      expect(ideasList.ideas.length).toBeGreaterThan(0);
      
      const userIdea = ideasList.ideas.find((idea: any) => idea.id === createdIdea.id);
      expect(userIdea).toBeDefined();
      expect(userIdea?.title).toBe(ideaData.title);
      expect(userIdea?.author.username).toBe('creator');
      expect(userIdea?.averageRating).toBeDefined();
      expect(userIdea?.ratingCount).toBe(0);
      expect(userIdea?.feedbackCount).toBe(0);

      // Step 5: User clicks on their idea to view details
      const ideaDetails = getIdeaById(createdIdea.id);

      expect(ideaDetails).toBeDefined();
      expect(ideaDetails?.title).toBe(ideaData.title);
      expect(ideaDetails?.description).toBe(ideaData.description);
      expect(ideaDetails?.author.username).toBe('creator');
      expect(ideaDetails?.feedbackCount).toBe(0);
      expect(ideaDetails?.ratingCount).toBe(0);

      // Step 6: User views their profile and sees their idea
      const userProfile = getUserProfile(userId);
      expect(userProfile?.ideaCount).toBe(1);

      const userIdeas = getUserIdeas(userId);
      expect(userIdeas).toBeInstanceOf(Array);
      expect(userIdeas.length).toBe(1);
      expect(userIdeas[0].id).toBe(createdIdea.id);
    });

    it('should validate idea submission with invalid data', async () => {
      const user = await register({
        username: 'validator',
        email: 'validator@e2etest.com',
        password: 'password123'
      });

      // Test title too short
      expect(() => {
        createIdea(user.user.id, {
          title: 'Hi',
          description: 'This is a valid description with enough characters.'
        });
      }).toThrow();

      // Test description too short
      expect(() => {
        createIdea(user.user.id, {
          title: 'Valid Title Here',
          description: 'Short'
        });
      }).toThrow();
    });

    it('should allow browsing and sorting ideas', async () => {
      // Create multiple users and ideas
      const user1 = await register({
        username: 'user1',
        email: 'user1@e2etest.com',
        password: 'password123'
      });

      const user2 = await register({
        username: 'user2',
        email: 'user2@e2etest.com',
        password: 'password123'
      });

      // Create ideas at different times
      const idea1 = createIdea(user1.user.id, {
        title: 'First Idea Posted',
        description: 'This was the first idea submitted to the platform.'
      });

      const idea2 = createIdea(user2.user.id, {
        title: 'Second Idea Posted',
        description: 'This was the second idea submitted to the platform.'
      });

      const idea3 = createIdea(user1.user.id, {
        title: 'Third Idea Posted',
        description: 'This was the third idea submitted to the platform.'
      });

      // Browse ideas sorted by date (newest first)
      const ideasByDate = getIdeas(1, 10, 'date');
      expect(ideasByDate.ideas.length).toBe(3);
      expect(ideasByDate.ideas[0].id).toBe(idea3.id); // Most recent first

      // Test pagination
      const firstPage = getIdeas(1, 2, 'date');
      expect(firstPage.ideas.length).toBe(2);
      expect(firstPage.totalPages).toBe(2);

      const secondPage = getIdeas(2, 2, 'date');
      expect(secondPage.ideas.length).toBe(1);
    });
  });

  describe('Feedback and Rating Journey', () => {
    it('should allow user to provide feedback and rate another users idea', async () => {
      // Step 1: User A creates an idea
      const userA = await register({
        username: 'ideacreator',
        email: 'creator@e2etest.com',
        password: 'password123'
      });

      const idea = createIdea(userA.user.id, {
        title: 'Sustainable Energy Solution',
        description: 'A comprehensive plan for implementing renewable energy in urban areas.'
      });

      // Step 2: User B registers and views the idea
      const userB = await register({
        username: 'reviewer',
        email: 'reviewer@e2etest.com',
        password: 'password123'
      });

      const ideaDetails = getIdeaById(idea.id);
      expect(ideaDetails).toBeDefined();

      // Step 3: User B provides feedback
      const feedbackData = {
        content: 'This is an excellent idea! I particularly like the focus on urban implementation. Have you considered the infrastructure costs?'
      };

      const feedback = createFeedback(userB.user.id, idea.id, feedbackData);

      expect(feedback).toBeDefined();
      expect(feedback.content).toBe(feedbackData.content);
      expect(feedback.userId).toBe(userB.user.id);
      expect(feedback.ideaId).toBe(idea.id);

      // Step 4: User B rates the idea
      const rating = createRating(userB.user.id, idea.id, { score: 5 });

      expect(rating).toBeDefined();
      expect(rating.score).toBe(5);
      expect(rating.userId).toBe(userB.user.id);
      expect(rating.ideaId).toBe(idea.id);

      // Step 5: User A views their idea and sees the feedback and rating
      const updatedIdea = getIdeaById(idea.id);

      expect(updatedIdea?.feedbackCount).toBe(1);
      expect(updatedIdea?.ratingCount).toBe(1);
      expect(updatedIdea?.averageRating).toBe(5.0);

      const feedbackList = getFeedbackByIdea(idea.id);
      expect(feedbackList.length).toBe(1);
      expect(feedbackList[0].content).toBe(feedbackData.content);
      expect(feedbackList[0].author.username).toBe('reviewer');

      // Step 6: User B updates their rating
      const updatedRating = updateRating(userB.user.id, idea.id, { score: 4 });

      expect(updatedRating.score).toBe(4);

      const finalIdea = getIdeaById(idea.id);
      expect(finalIdea?.averageRating).toBe(4.0);
      expect(finalIdea?.ratingCount).toBe(1); // Still only one rating

      // Step 7: Verify User B's profile shows feedback count
      const userBProfile = getUserProfile(userB.user.id);
      expect(userBProfile?.feedbackCount).toBe(1);
    });

    it('should prevent user from providing feedback on their own idea', async () => {
      const user = await register({
        username: 'selfreviewer',
        email: 'selfreviewer@e2etest.com',
        password: 'password123'
      });

      const idea = createIdea(user.user.id, {
        title: 'My Own Idea',
        description: 'This is my idea that I cannot review myself.'
      });

      // Attempt to provide feedback on own idea
      expect(() => {
        createFeedback(user.user.id, idea.id, {
          content: 'Trying to review my own idea, which should fail.'
        });
      }).toThrow();
    });

    it('should prevent user from rating their own idea', async () => {
      const user = await register({
        username: 'selfrater',
        email: 'selfrater@e2etest.com',
        password: 'password123'
      });

      const idea = createIdea(user.user.id, {
        title: 'My Own Idea to Rate',
        description: 'This is my idea that I cannot rate myself.'
      });

      // Attempt to rate own idea
      expect(() => {
        createRating(user.user.id, idea.id, { score: 5 });
      }).toThrow();
    });

    it('should calculate correct average rating with multiple users', async () => {
      // Create idea owner
      const owner = await register({
        username: 'owner',
        email: 'owner@e2etest.com',
        password: 'password123'
      });

      const idea = createIdea(owner.user.id, {
        title: 'Idea for Multiple Ratings',
        description: 'This idea will receive ratings from multiple users.'
      });

      // Create multiple reviewers
      const reviewer1 = await register({
        username: 'reviewer1',
        email: 'reviewer1@e2etest.com',
        password: 'password123'
      });

      const reviewer2 = await register({
        username: 'reviewer2',
        email: 'reviewer2@e2etest.com',
        password: 'password123'
      });

      const reviewer3 = await register({
        username: 'reviewer3',
        email: 'reviewer3@e2etest.com',
        password: 'password123'
      });

      // Each reviewer rates the idea
      createRating(reviewer1.user.id, idea.id, { score: 5 });
      createRating(reviewer2.user.id, idea.id, { score: 4 });
      createRating(reviewer3.user.id, idea.id, { score: 3 });

      // Check average rating
      const averageRating = getAverageRating(idea.id);
      expect(averageRating).toBe(4.0); // (5 + 4 + 3) / 3 = 4.0

      const ideaWithMetrics = getIdeaById(idea.id);
      expect(ideaWithMetrics?.ratingCount).toBe(3);
      expect(ideaWithMetrics?.averageRating).toBe(4.0);
    });
  });

  describe('Profile Viewing and Editing Journey', () => {
    it('should allow user to view and edit their profile', async () => {
      // Step 1: User registers
      const user = await register({
        username: 'profileuser',
        email: 'profile@e2etest.com',
        password: 'password123'
      });

      const userId = user.user.id;

      // Step 2: User views their profile
      const initialProfile = getUserProfile(userId);

      expect(initialProfile).toBeDefined();
      expect(initialProfile?.username).toBe('profileuser');
      expect(initialProfile?.email).toBe('profile@e2etest.com');
      expect(initialProfile?.ideaCount).toBe(0);
      expect(initialProfile?.feedbackCount).toBe(0);

      // Step 3: User creates some ideas
      createIdea(userId, {
        title: 'First Profile Idea',
        description: 'This is my first idea on the platform.'
      });

      createIdea(userId, {
        title: 'Second Profile Idea',
        description: 'This is my second idea on the platform.'
      });

      // Step 4: User views profile again and sees updated stats
      const updatedProfile = getUserProfile(userId);
      expect(updatedProfile?.ideaCount).toBe(2);

      // Step 5: User edits their profile
      const editedProfile = updateUser(userId, {
        username: 'profileuser_updated',
        email: 'profile_new@e2etest.com'
      });

      expect(editedProfile).toBeDefined();
      expect(editedProfile.username).toBe('profileuser_updated');
      expect(editedProfile.email).toBe('profile_new@e2etest.com');

      // Step 6: User views their ideas on profile
      const userIdeas = getUserIdeas(userId);
      expect(userIdeas.length).toBe(2);
      expect(userIdeas[0].author.username).toBe('profileuser_updated');
    });

    it('should show feedback count on user profile', async () => {
      // Create two users
      const creator = await register({
        username: 'creator',
        email: 'creator2@e2etest.com',
        password: 'password123'
      });

      const reviewer = await register({
        username: 'reviewer',
        email: 'reviewer2@e2etest.com',
        password: 'password123'
      });

      // Creator creates ideas
      const idea1 = createIdea(creator.user.id, {
        title: 'Idea One',
        description: 'First idea for feedback counting.'
      });

      const idea2 = createIdea(creator.user.id, {
        title: 'Idea Two',
        description: 'Second idea for feedback counting.'
      });

      // Reviewer provides feedback on both ideas
      createFeedback(reviewer.user.id, idea1.id, {
        content: 'Great first idea! Very innovative approach.'
      });

      createFeedback(reviewer.user.id, idea2.id, {
        content: 'Second idea is also excellent! Keep it up.'
      });

      // Check reviewer's profile
      const reviewerProfile = getUserProfile(reviewer.user.id);
      expect(reviewerProfile?.feedbackCount).toBe(2);
      expect(reviewerProfile?.ideaCount).toBe(0);

      // Check creator's profile
      const creatorProfile = getUserProfile(creator.user.id);
      expect(creatorProfile?.ideaCount).toBe(2);
      expect(creatorProfile?.feedbackCount).toBe(0);
    });

    it('should allow viewing other users profiles', async () => {
      // Create two users
      const user1 = await register({
        username: 'publicuser',
        email: 'public@e2etest.com',
        password: 'password123'
      });

      const user2 = await register({
        username: 'viewer',
        email: 'viewer@e2etest.com',
        password: 'password123'
      });

      // User1 creates ideas
      createIdea(user1.user.id, {
        title: 'Public Idea',
        description: 'This idea is visible to everyone.'
      });

      // User2 views User1's profile
      const user1Profile = getUserProfile(user1.user.id);

      expect(user1Profile).toBeDefined();
      expect(user1Profile?.username).toBe('publicuser');
      expect(user1Profile?.ideaCount).toBe(1);

      // User2 views User1's ideas
      const user1Ideas = getUserIdeas(user1.user.id);
      expect(user1Ideas.length).toBe(1);
      expect(user1Ideas[0].title).toBe('Public Idea');
    });
  });

  describe('Complete Platform Journey', () => {
    it('should simulate complete multi-user platform interaction', async () => {
      // Scenario: Three users interact on the platform
      
      // Step 1: Three users register
      const alice = await register({
        username: 'alice',
        email: 'alice@e2etest.com',
        password: 'password123'
      });

      const bob = await register({
        username: 'bob',
        email: 'bob@e2etest.com',
        password: 'password123'
      });

      const charlie = await register({
        username: 'charlie',
        email: 'charlie@e2etest.com',
        password: 'password123'
      });

      // Step 2: Alice creates two ideas
      const aliceIdea1 = createIdea(alice.user.id, {
        title: 'AI-Powered Learning Platform',
        description: 'An adaptive learning platform that uses AI to personalize education for each student.'
      });

      const aliceIdea2 = createIdea(alice.user.id, {
        title: 'Community Garden Network',
        description: 'A platform connecting urban gardeners to share resources and knowledge.'
      });

      // Step 3: Bob creates one idea
      const bobIdea = createIdea(bob.user.id, {
        title: 'Sustainable Fashion Marketplace',
        description: 'An online marketplace exclusively for sustainable and ethical fashion brands.'
      });

      // Step 4: Bob and Charlie provide feedback on Alice's first idea
      createFeedback(bob.user.id, aliceIdea1.id, {
        content: 'Love this concept! Have you considered gamification elements to increase engagement?'
      });

      createFeedback(charlie.user.id, aliceIdea1.id, {
        content: 'Great idea! I would definitely use this. What age groups are you targeting?'
      });

      // Step 5: Alice provides feedback on Bob's idea
      createFeedback(alice.user.id, bobIdea.id, {
        content: 'This is needed! How will you verify the sustainability claims of brands?'
      });

      // Step 6: Bob and Charlie rate Alice's first idea
      createRating(bob.user.id, aliceIdea1.id, { score: 5 });
      createRating(charlie.user.id, aliceIdea1.id, { score: 4 });

      // Step 7: Alice and Charlie rate Bob's idea
      createRating(alice.user.id, bobIdea.id, { score: 5 });
      createRating(charlie.user.id, bobIdea.id, { score: 5 });

      // Step 8: Charlie rates Alice's second idea
      createRating(charlie.user.id, aliceIdea2.id, { score: 3 });

      // Step 9: Verify all metrics are correct
      
      // Alice's first idea metrics
      const aliceIdea1Details = getIdeaById(aliceIdea1.id);
      expect(aliceIdea1Details?.feedbackCount).toBe(2);
      expect(aliceIdea1Details?.ratingCount).toBe(2);
      expect(aliceIdea1Details?.averageRating).toBe(4.5); // (5 + 4) / 2

      // Alice's second idea metrics
      const aliceIdea2Details = getIdeaById(aliceIdea2.id);
      expect(aliceIdea2Details?.feedbackCount).toBe(0);
      expect(aliceIdea2Details?.ratingCount).toBe(1);
      expect(aliceIdea2Details?.averageRating).toBe(3.0);

      // Bob's idea metrics
      const bobIdeaDetails = getIdeaById(bobIdea.id);
      expect(bobIdeaDetails?.feedbackCount).toBe(1);
      expect(bobIdeaDetails?.ratingCount).toBe(2);
      expect(bobIdeaDetails?.averageRating).toBe(5.0); // (5 + 5) / 2

      // Step 10: Verify user profiles
      const aliceProfile = getUserProfile(alice.user.id);
      expect(aliceProfile?.ideaCount).toBe(2);
      expect(aliceProfile?.feedbackCount).toBe(1); // Feedback on Bob's idea

      const bobProfile = getUserProfile(bob.user.id);
      expect(bobProfile?.ideaCount).toBe(1);
      expect(bobProfile?.feedbackCount).toBe(1); // Feedback on Alice's idea

      const charlieProfile = getUserProfile(charlie.user.id);
      expect(charlieProfile?.ideaCount).toBe(0);
      expect(charlieProfile?.feedbackCount).toBe(1); // Feedback on Alice's idea

      // Step 11: Browse all ideas and verify sorting
      const allIdeas = getIdeas(1, 10, 'date');
      expect(allIdeas.ideas.length).toBe(3);
      expect(allIdeas.totalCount).toBe(3);

      // Step 12: Bob updates his rating on Alice's first idea
      updateRating(bob.user.id, aliceIdea1.id, { score: 3 });

      const updatedAliceIdea1 = getIdeaById(aliceIdea1.id);
      expect(updatedAliceIdea1?.averageRating).toBe(3.5); // (3 + 4) / 2

      // Step 13: Verify feedback lists
      const aliceIdea1Feedback = getFeedbackByIdea(aliceIdea1.id);
      expect(aliceIdea1Feedback.length).toBe(2);
      expect(aliceIdea1Feedback.some(f => f.author.username === 'bob')).toBe(true);
      expect(aliceIdea1Feedback.some(f => f.author.username === 'charlie')).toBe(true);
    });
  });
});
