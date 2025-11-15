import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ideaService, Idea, IdeaFilters } from '../services/ideaService';
import { IdeaCard } from './IdeaCard';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorMessage } from './ErrorMessage';

export function IdeaList() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'engagement'>('date');
  const [filters, setFilters] = useState<IdeaFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [minRatingInput, setMinRatingInput] = useState('');
  const [maxRatingInput, setMaxRatingInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  useEffect(() => {
    loadIdeas();
  }, [page, sortBy, filters]);

  const loadIdeas = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ideaService.getIdeas(page, limit, sortBy, filters);
      setIdeas(response.ideas);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSortChange = (newSortBy: 'date' | 'rating' | 'engagement') => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handleApplyFilters = () => {
    const newFilters: IdeaFilters = {};

    if (searchInput.trim()) {
      newFilters.search = searchInput.trim();
    }

    if (minRatingInput) {
      const minRating = parseFloat(minRatingInput);
      if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
        newFilters.minRating = minRating;
      }
    }

    if (maxRatingInput) {
      const maxRating = parseFloat(maxRatingInput);
      if (!isNaN(maxRating) && maxRating >= 1 && maxRating <= 5) {
        newFilters.maxRating = maxRating;
      }
    }

    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setMinRatingInput('');
    setMaxRatingInput('');
    setFilters({});
    setPage(1);
  };

  if (loading && page === 1) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px' }}>
          Community Ideas
        </h2>
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <ErrorMessage title="Failed to Load Ideas" message={error} onRetry={loadIdeas} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1a202c',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              Community Ideas
            </h2>
            <p style={{ fontSize: '16px', color: '#718096', margin: 0 }}>
              {totalCount} {totalCount === 1 ? 'idea' : 'ideas'} shared by our community
            </p>
          </div>
          <Link
            to="/ideas/new"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            + Share Your Idea
          </Link>
        </div>

        {/* Controls */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                htmlFor="sort"
                style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568' }}
              >
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) =>
                  handleSortChange(e.target.value as 'date' | 'rating' | 'engagement')
                }
                style={{
                  padding: '8px 32px 8px 12px',
                  fontSize: '14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="date">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="engagement">Most Engagement</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#667eea',
                background: 'white',
                border: '2px solid #667eea',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f7fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {showFilters ? '✕ Hide Filters' : '⚙ Show Filters'}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div
              style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label
                    htmlFor="search"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4a5568',
                      marginBottom: '8px',
                    }}
                  >
                    Search
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by title..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="minRating"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4a5568',
                      marginBottom: '8px',
                    }}
                  >
                    Min Rating
                  </label>
                  <input
                    id="minRating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={minRatingInput}
                    onChange={(e) => setMinRatingInput(e.target.value)}
                    placeholder="1-5"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxRating"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4a5568',
                      marginBottom: '8px',
                    }}
                  >
                    Max Rating
                  </label>
                  <input
                    id="maxRating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={maxRatingInput}
                    onChange={(e) => setMaxRatingInput(e.target.value)}
                    placeholder="1-5"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleApplyFilters}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4a5568',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ideas Grid */}
        {ideas.length === 0 ? (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p style={{ fontSize: '18px', color: '#718096', margin: 0 }}>
              No ideas found. Be the first to share one!
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '32px',
                }}
              >
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: page === 1 ? '#cbd5e0' : '#667eea',
                    background: 'white',
                    border: `2px solid ${page === 1 ? '#e2e8f0' : '#667eea'}`,
                    borderRadius: '6px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ← Previous
                </button>

                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: page === totalPages ? '#cbd5e0' : '#667eea',
                    background: 'white',
                    border: `2px solid ${page === totalPages ? '#e2e8f0' : '#667eea'}`,
                    borderRadius: '6px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
