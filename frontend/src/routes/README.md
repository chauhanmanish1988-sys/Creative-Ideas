# Routing Structure

## Routes Configuration

The application uses React Router v6 for client-side routing. All routes are configured in `App.tsx`.

### Public Routes
- `/` - Home page with welcome message and feature overview
- `/login` - User login form
- `/register` - User registration form
- `/ideas` - Browse all ideas (paginated list)
- `/ideas/:id` - View individual idea details with feedback and ratings
- `/users/:userId` - View user profile and their submitted ideas

### Protected Routes (Require Authentication)
- `/ideas/new` - Submit a new idea
- `/users/:userId/edit` - Edit user profile (only accessible by the profile owner)

## Layout Component

The `Layout` component wraps all routes and provides:
- **Header**: Contains logo and navigation
- **Navigation**: Context-aware navigation based on authentication state
  - Unauthenticated users see: Home, Browse Ideas, Login, Register
  - Authenticated users see: Home, Browse Ideas, Submit Idea, Profile, Logout
- **Main Content Area**: Renders the current route's component
- **Footer**: Platform information

## Responsive Design

The layout is fully responsive with breakpoints at:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Navigation collapses to a vertical menu on mobile devices.

## Protected Route Implementation

The `ProtectedRoute` component:
1. Checks if user is authenticated via `useAuth` hook
2. Shows loading state while checking authentication
3. Redirects to `/login` if not authenticated
4. Renders the protected component if authenticated
