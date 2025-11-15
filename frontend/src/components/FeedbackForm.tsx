import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateFeedbackContent } from '../utils/validation';
import { sanitizeTextContent } from '../utils/sanitize';
import { InlineError } from './InlineError';
import { ErrorMessage } from './ErrorMessage';

interface FeedbackFormProps {
  ideaId: string;
  onFeedbackSubmitted: () => void;
}

export function FeedbackForm({ ideaId, onFeedbackSubmitted }: FeedbackFormProps) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateContent = (value: string): boolean => {
    const result = validateFeedbackContent(value);
    if (!result.isValid) {
      setValidationError(result.error || '');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!validateContent(content)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      
      // Sanitize content before sending to API
      const sanitizedContent = sanitizeTextContent(content.trim());
      
      const response = await fetch(`/api/ideas/${ideaId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: sanitizedContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle self-feedback error gracefully
        if (errorData.error?.code === 'FORBIDDEN_SELF_FEEDBACK') {
          setError('You cannot provide feedback on your own idea');
        } else {
          setError(errorData.error?.message || 'Failed to submit feedback');
        }
        return;
      }

      // Success - clear form and notify parent
      setContent('');
      setValidationError('');
      setTouched(false);
      onFeedbackSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p>Please log in to provide feedback</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="feedback-content" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Add Your Feedback
        </label>
        <textarea
          id="feedback-content"
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            setContent(e.target.value);
            if (touched) {
              validateContent(e.target.value);
            }
          }}
          onBlur={() => {
            setTouched(true);
            validateContent(content);
          }}
          placeholder="Share your thoughts, suggestions, or constructive feedback (minimum 10 characters)..."
          rows={4}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: touched && validationError ? '2px solid #dc3545' : '1px solid #ccc',
            resize: 'vertical',
          }}
          disabled={isSubmitting}
          aria-invalid={touched && !!validationError}
          aria-describedby={validationError ? 'feedback-error' : undefined}
        />
        {touched && validationError && (
          <InlineError message={validationError} />
        )}
      </div>

      {error && (
        <ErrorMessage 
          title="Feedback Submission Failed"
          message={error}
          type="error"
          onDismiss={() => setError('')}
        />
      )}

      <button
        type="submit"
        disabled={isSubmitting || content.trim().length < 10}
        style={{
          padding: '0.5rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: isSubmitting || content.trim().length < 10 ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSubmitting || content.trim().length < 10 ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
