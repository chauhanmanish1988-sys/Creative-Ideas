import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ideaService, IdeaWithDetails } from '../services/ideaService';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackList } from './FeedbackList';
import { RatingInput } from './RatingInput';
import { RatingDisplay } from './RatingDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<IdeaWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadIdea(id);
    }
  }, [id]);

  const loadIdea = async (ideaId: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await ideaService.getIdeaById(ideaId);
      setIdea(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load idea');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading idea details..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to Load Idea"
        message={error}
        onRetry={() => id && loadIdea(id)}
      />
    );
  }

  if (!idea) {
    return <div>Idea not found</div>;
  }

  return (
    <div>
      <article style={{ marginBottom: '2rem' }}>
        <h1>{idea.title}</h1>
        
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          <span>By {idea.username || 'Unknown'}</span>
          <span> • </span>
          <span>{formatDate(idea.createdAt)}</span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <RatingDisplay 
            averageRating={idea.averageRating} 
            ratingCount={idea.ratingCount}
            size="large"
          />
        </div>

        <div style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.6',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          {idea.description}
        </div>
      </article>

      <section style={{ marginBottom: '2rem' }}>
        <RatingInput 
          ideaId={idea.id}
          onRatingSubmitted={() => loadIdea(idea.id)}
        />
      </section>

      <section>
        <h2>Feedback ({idea.feedback?.length || 0})</h2>
        
        <FeedbackForm 
          ideaId={idea.id} 
          onFeedbackSubmitted={() => loadIdea(idea.id)} 
        />
        
        <FeedbackList feedback={idea.feedback || []} />
      </section>
    </div>
  );
}
