import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorMessage({ 
  message, 
  title = 'Error', 
  onRetry, 
  onDismiss,
  type = 'error' 
}: ErrorMessageProps) {
  return (
    <div className={`error-message error-message-${type}`}>
      <div className="error-content">
        <div className="error-icon">
          {type === 'error' && '⚠️'}
          {type === 'warning' && '⚡'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="error-text">
          <h3 className="error-title">{title}</h3>
          <p className="error-description">{message}</p>
        </div>
      </div>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="error-button error-button-retry">
            Try Again
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="error-button error-button-dismiss">
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
