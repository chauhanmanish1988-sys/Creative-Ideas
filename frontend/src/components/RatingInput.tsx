import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from './ErrorMessage';

interface RatingInputProps {
  ideaId: string;
  currentUserRating?: number;
  onRatingSubmitted: () => void;
}

export function RatingInput({ ideaId, currentUserRating, onRatingSubmitted }: RatingInputProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState<number>(currentUserRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUserRating) {
      setRating(currentUserRating);
    }
  }, [currentUserRating]);

  const handleRatingClick = async (score: number) => {
    if (!isAuthenticated || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const method = currentUserRating ? 'PUT' : 'POST';
      
      const response = await fetch(`/api/ideas/${ideaId}/ratings`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle self-rating error gracefully
        if (errorData.error?.code === 'FORBIDDEN_SELF_RATING') {
          setError('You cannot rate your own idea');
        } else {
          setError(errorData.error?.message || 'Failed to submit rating');
        }
        return;
      }

      // Success
      setRating(score);
      setSuccessMessage(currentUserRating ? 'Rating updated!' : 'Rating submitted!');
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
      
      onRatingSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (position: number) => {
    const isFilled = (hoveredRating || rating) >= position;
    const isHovered = hoveredRating >= position;
    
    return (
      <button
        key={position}
        type="button"
        onClick={() => handleRatingClick(position)}
        onMouseEnter={() => setHoveredRating(position)}
        onMouseLeave={() => setHoveredRating(0)}
        disabled={!isAuthenticated || isSubmitting}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '2rem',
          cursor: isAuthenticated && !isSubmitting ? 'pointer' : 'not-allowed',
          padding: '0.25rem',
          color: isFilled ? (isHovered ? '#ffc107' : '#ffb300') : '#ddd',
          transition: 'color 0.2s ease',
          opacity: isSubmitting ? 0.5 : 1,
        }}
        aria-label={`Rate ${position} out of 5 stars`}
      >
        ★
      </button>
    );
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Please log in to rate this idea</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>Rate this idea:</strong>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 4, 5].map(renderStar)}
        </div>
        
        {rating > 0 && (
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            {currentUserRating ? 'Your rating' : 'Click to rate'}: {hoveredRating || rating}/5
          </span>
        )}
      </div>

      {error && (
        <ErrorMessage 
          title="Rating Failed"
          message={error}
          type="error"
          onDismiss={() => setError('')}
        />
      )}

      {successMessage && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#d4edda', 
          color: '#155724',
          borderRadius: '4px',
          marginTop: '0.5rem',
          border: '1px solid #c3e6cb',
          fontSize: '0.9rem'
        }}>
          {successMessage}
        </div>
      )}
    </div>
  );
}
