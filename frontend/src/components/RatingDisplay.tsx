interface RatingDisplayProps {
  averageRating?: number | null;
  ratingCount?: number;
  size?: 'small' | 'medium' | 'large';
}

export function RatingDisplay({ 
  averageRating, 
  ratingCount = 0,
  size = 'medium' 
}: RatingDisplayProps) {
  const fontSize = {
    small: '0.9rem',
    medium: '1.2rem',
    large: '1.5rem',
  }[size];

  const hasRatings = ratingCount > 0 && averageRating !== null && averageRating !== undefined;

  const renderStars = () => {
    if (!hasRatings) {
      return null;
    }

    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span style={{ color: '#ffb300', marginRight: '0.25rem' }}>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '⯨'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      fontSize 
    }}>
      {hasRatings ? (
        <>
          {renderStars()}
          <span style={{ fontWeight: 'bold' }}>
            {averageRating.toFixed(1)}
          </span>
          <span style={{ color: '#666', fontSize: '0.9em' }}>
            ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
          </span>
        </>
      ) : (
        <span style={{ color: '#999', fontStyle: 'italic' }}>
          Not yet rated
        </span>
      )}
    </div>
  );
}
