import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ideaService } from '../services/ideaService';
import {
  validateIdeaTitle,
  validateIdeaDescription,
} from '../utils/validation';
import { sanitizeTextContent } from '../utils/sanitize';
import { InlineError } from './InlineError';
import { ErrorMessage } from './ErrorMessage';

export function IdeaSubmissionForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'title': {
        const result = validateIdeaTitle(value);
        return result.isValid ? undefined : result.error;
      }
      case 'description': {
        const result = validateIdeaDescription(value);
        return result.isValid ? undefined : result.error;
      }
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validateField('title', title);
    if (titleError) newErrors.title = titleError;

    const descriptionError = validateField('description', description);
    if (descriptionError) newErrors.description = descriptionError;

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
    setTouched({ title: true, description: true });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedTitle = sanitizeTextContent(title.trim());
      const sanitizedDescription = sanitizeTextContent(description.trim());

      const idea = await ideaService.createIdea({
        title: sanitizedTitle,
        description: sanitizedDescription,
      });
      navigate(`/ideas/${idea.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = (field: string, isTextarea = false) => ({
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
    fontFamily: 'inherit',
    resize: isTextarea ? ('vertical' as const) : undefined,
    minHeight: isTextarea ? '120px' : undefined,
    boxShadow:
      focusedField === field ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          padding: '48px',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '8px',
              margin: 0,
            }}
          >
            Share Your Idea
          </h2>
          <p style={{ fontSize: '16px', color: '#718096', margin: '8px 0 0 0' }}>
            Tell the community about your creative concept
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="title"
              style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}
            >
              Idea Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              onFocus={() => setFocusedField('title')}
              onBlur={() => handleBlur('title')}
              placeholder="Give your idea a catchy title..."
              disabled={isSubmitting}
              style={getInputStyle('title')}
              aria-invalid={touched.title && !!errors.title}
              aria-describedby={errors.title ? 'title-error' : 'title-hint'}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <small
                id="title-hint"
                style={{ fontSize: '12px', color: '#a0aec0' }}
              >
                {title.length}/100 characters
              </small>
              {touched.title && errors.title && (
                <InlineError message={errors.title} />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="description"
              style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              onFocus={() => setFocusedField('description')}
              onBlur={() => handleBlur('description')}
              placeholder="Describe your idea in detail. What problem does it solve? What makes it unique?"
              rows={8}
              disabled={isSubmitting}
              style={getInputStyle('description', true)}
              aria-invalid={touched.description && !!errors.description}
              aria-describedby={
                errors.description ? 'description-error' : 'description-hint'
              }
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <small
                id="description-hint"
                style={{ fontSize: '12px', color: '#a0aec0' }}
              >
                {description.length} characters (minimum 10)
              </small>
              {touched.description && errors.description && (
                <InlineError message={errors.description} />
              )}
            </div>
          </div>

          {serverError && (
            <ErrorMessage
              title="Submission Failed"
              message={serverError}
              type="error"
              onDismiss={() => setServerError('')}
            />
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#4a5568',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#cbd5e0';
                  e.currentTarget.style.background = '#f7fafc';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = 'white';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              style={{
                flex: 2,
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background:
                  isSubmitting || Object.keys(errors).length > 0
                    ? '#cbd5e0'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor:
                  isSubmitting || Object.keys(errors).length > 0
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && Object.keys(errors).length === 0) {
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
              {isSubmitting ? 'Submitting...' : 'Submit Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
