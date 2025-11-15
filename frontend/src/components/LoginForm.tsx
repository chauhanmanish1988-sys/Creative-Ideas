import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { validateEmail } from '../utils/validation';
import { sanitizeInput } from '../utils/sanitize';
import { InlineError } from './InlineError';
import { ErrorMessage } from './ErrorMessage';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'email': {
        const result = validateEmail(value);
        return result.isValid ? undefined : result.error;
      }
      case 'password': {
        if (!value) {
          return 'Password is required';
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailError = validateField('email', email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField('password', password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    setFocusedField(null);
    const error = validateField(field, eval(field));
    if (error) {
      setErrors({ ...errors, [field]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedEmail = sanitizeInput(email);
      await login(sanitizedEmail, password);
      navigate('/');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = (field: string) => ({
    padding: '12px 16px',
    fontSize: '16px',
    border: `2px solid ${
      touched[field] && errors[field]
        ? '#f56565'
        : focusedField === field
        ? '#667eea'
        : '#e2e8f0'
    }`,
    borderRadius: '8px',
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
    boxShadow:
      focusedField === field ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '8px',
              margin: 0,
            }}
          >
            Welcome Back
          </h2>
          <p style={{ fontSize: '16px', color: '#718096', margin: '8px 0 0 0' }}>
            Sign in to continue to Creative Ideas
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="email"
              style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              onFocus={() => setFocusedField('email')}
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
              placeholder="you@example.com"
              style={getInputStyle('email')}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {touched.email && errors.email && (
              <InlineError message={errors.email} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="password"
              style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              onFocus={() => setFocusedField('password')}
              onBlur={() => handleBlur('password')}
              disabled={isSubmitting}
              placeholder="Enter your password"
              style={getInputStyle('password')}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {touched.password && errors.password && (
              <InlineError message={errors.password} />
            )}
          </div>

          {serverError && (
            <ErrorMessage
              title="Login Failed"
              message={serverError}
              type="error"
              onDismiss={() => setServerError('')}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginTop: '8px',
              opacity: isSubmitting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 10px 20px rgba(102, 126, 234, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: '#718096',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
