import { Feedback } from '../services/ideaService';

interface FeedbackItemProps {
  feedback: Feedback;
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
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

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
        <strong>{feedback.username}</strong>
        <span> • </span>
        <span>{formatDate(feedback.createdAt)}</span>
      </div>
      <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
        {feedback.content}
      </p>
    </div>
  );
}
