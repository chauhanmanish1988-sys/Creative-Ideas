import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername, validateEmail } from '../utils/validation';
import { sanitizeInput } from '../utils/sanitize';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { InlineError } from './InlineError';

export function ProfileEditor() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
  }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      // Check if user is editing their own profile
      if (currentUser?.id !== userId) {
        setError('You can only edit your own profile');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userStats = await userService.getUserById(userId);
        setUsername(userStats.user.username);
        setEmail(userStats.user.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'username': {
        const result = validateUsername(value);
        return result.isValid ? undefined : result.error;
      }
      case 'email': {
        const result = validateEmail(value);
        return result.isValid ? undefined : result.error;
      }
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: { username?: string; email?: string } = {};

    const usernameError = validateField('username', username);
    if (usernameError) errors.username = usernameError;

    const emailError = validateField('email', email);
    if (emailError) errors.email = emailError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, eval(field));
    if (error) {
      setValidationErrors({ ...validationErrors, [field]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[field as keyof typeof newErrors];
      setValidationErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Sanitize inputs before sending to API
      const sanitizedUsername = sanitizeInput(username.trim());
      const sanitizedEmail = sanitizeInput(email.trim());

      await userService.updateUser(userId, {
        username: sanitizedUsername,
        email: sanitizedEmail,
      });

      // Navigate back to profile page
      navigate(`/users/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/users/${userId}`);
  };

  if (loading) {
    return <LoadingSpinner size="medium" message="Loading profile..." />;
  }

  if (error && currentUser?.id !== userId) {
    return (
      <ErrorMessage 
        title="Access Denied"
        message={error}
        type="error"
      />
    );
  }

  return (
    <div>
      <h2>Edit Profile</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            onBlur={() => handleBlur('username')}
            style={{
              width: '100%',
              padding: '8px',
              border: touched.username && validationErrors.username ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            aria-invalid={touched.username && !!validationErrors.username}
            aria-describedby={validationErrors.username ? 'username-error' : undefined}
          />
          {touched.username && validationErrors.username && (
            <InlineError message={validationErrors.username} />
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            style={{
              width: '100%',
              padding: '8px',
              border: touched.email && validationErrors.email ? '1px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            aria-invalid={touched.email && !!validationErrors.email}
            aria-describedby={validationErrors.email ? 'email-error' : undefined}
          />
          {touched.email && validationErrors.email && (
            <InlineError message={validationErrors.email} />
          )}
        </div>

        {error && (
          <ErrorMessage 
            title="Update Failed"
            message={error}
            type="error"
            onDismiss={() => setError(null)}
          />
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
