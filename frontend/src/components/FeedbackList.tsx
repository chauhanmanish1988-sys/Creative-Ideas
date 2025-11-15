import { Feedback } from '../services/ideaService';
import { FeedbackItem } from './FeedbackItem';

interface FeedbackListProps {
  feedback: Feedback[];
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (!feedback || feedback.length === 0) {
    return (
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '4px',
        textAlign: 'center',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>No feedback yet. Be the first to provide feedback!</p>
      </div>
    );
  }

  return (
    <div>
      {feedback.map((item) => (
        <FeedbackItem key={item.id} feedback={item} />
      ))}
    </div>
  );
}
