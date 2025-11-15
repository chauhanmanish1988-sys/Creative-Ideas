import { Link } from 'react-router-dom';
import { Idea } from '../services/ideaService';
import { RatingDisplay } from './RatingDisplay';

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link
      to={`/ideas/${idea.id}`}
      style={{
        display: 'block',
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s ease',
        border: '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = '#667eea';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1a202c',
            margin: '0 0 12px 0',
            lineHeight: '1.4',
          }}
        >
          {idea.title}
        </h3>
        <p
          style={{
            fontSize: '15px',
            color: '#4a5568',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          {idea.description.substring(0, 200)}
          {idea.description.length > 200 ? '...' : ''}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            {(idea.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>
              {idea.username || 'Unknown'}
            </div>
            <div style={{ fontSize: '12px', color: '#a0aec0' }}>
              {formatDate(idea.createdAt)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RatingDisplay
              averageRating={idea.averageRating}
              ratingCount={idea.ratingCount}
              size="small"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#f7fafc',
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
              {idea.feedbackCount || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
