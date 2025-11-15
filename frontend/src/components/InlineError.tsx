import './InlineError.css';

interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;
  
  return (
    <div className="inline-error">
      <span className="inline-error-icon">⚠</span>
      <span className="inline-error-text">{message}</span>
    </div>
  );
}
