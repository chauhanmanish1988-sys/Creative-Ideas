import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidIdeaTitle,
  isValidIdeaDescription,
  isValidFeedbackContent,
  isValidRatingScore,
  isValidUUID,
  sanitizeString,
  sanitizeEmail
} from './validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate passwords with letters and numbers', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('Test1234')).toBe(true);
    });

    it('should reject passwords without letters or numbers', () => {
      expect(isValidPassword('12345678')).toBe(false);
      expect(isValidPassword('password')).toBe(false);
      expect(isValidPassword('short1')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate usernames with correct length and characters', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('test_user')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false);
      expect(isValidUsername('a'.repeat(31))).toBe(false);
      expect(isValidUsername('user@name')).toBe(false);
    });
  });

  describe('isValidIdeaTitle', () => {
    it('should validate titles with correct length', () => {
      expect(isValidIdeaTitle('Valid Title')).toBe(true);
    });

    it('should reject titles with incorrect length', () => {
      expect(isValidIdeaTitle('Too')).toBe(false);
      expect(isValidIdeaTitle('a'.repeat(101))).toBe(false);
    });
  });

  describe('isValidRatingScore', () => {
    it('should validate scores between 1 and 5', () => {
      expect(isValidRatingScore(1)).toBe(true);
      expect(isValidRatingScore(3)).toBe(true);
      expect(isValidRatingScore(5)).toBe(true);
    });

    it('should reject invalid scores', () => {
      expect(isValidRatingScore(0)).toBe(false);
      expect(isValidRatingScore(6)).toBe(false);
      expect(isValidRatingScore(3.5)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim and remove dangerous characters', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('test\x00string')).toBe('teststring');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim emails', () => {
      expect(sanitizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
    });
  });
});
