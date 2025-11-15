# Test Suite

This directory contains integration and end-to-end tests for the Creative Ideas Platform backend.

## Test Structure

### Integration Tests (`integration/`)
API integration tests that verify the complete flow of backend services working together:
- **Authentication Flow**: Registration, login, and credential validation
- **Idea Creation and Retrieval**: Creating ideas and retrieving them with engagement metrics
- **Feedback Submission**: Submitting and retrieving feedback with ownership validation
- **Rating Submission**: Rating ideas, updating ratings, and calculating averages
- **Authorization Checks**: Validating permissions and input constraints
- **Complete User Journey**: Full workflow from idea creation to feedback and ratings

### End-to-End Tests (`e2e/`)
User journey tests that simulate complete user interactions across the platform:
- **User Registration and Login Journey**: Complete authentication workflow
- **Idea Submission and Viewing Journey**: Creating and browsing ideas
- **Feedback and Rating Journey**: Providing feedback and ratings on ideas
- **Profile Viewing and Editing Journey**: Managing user profiles and viewing statistics
- **Complete Platform Journey**: Multi-user interaction scenarios

## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode during development:
```bash
npm run test:watch
```

To run specific test files:
```bash
npm test -- api.integration.test.ts
npm test -- user-journeys.e2e.test.ts
```

## Test Coverage

The test suite covers:
- All authentication requirements (registration, login, token validation)
- Idea CRUD operations with engagement metrics
- Feedback submission with self-feedback prevention
- Rating system with average calculation and updates
- User profile management with statistics
- Authorization and validation checks
- Complete multi-user interaction workflows

## Test Database

Tests use an in-memory SQLite database that is:
- Initialized before all tests
- Cleaned between test cases
- Closed after all tests complete

This ensures tests are isolated and don't affect production data.
