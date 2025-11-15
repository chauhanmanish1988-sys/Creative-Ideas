import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, UserStats } from '../services/userService';
import { ideaService, Idea } from '../services/ideaService';
import { useAuth } from '../contexts/AuthContext';
import { IdeaCard } from './IdeaCard';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorMessage } from './ErrorMessage';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Generate Gravatar URL from email
  const getGravatarUrl = (email: string) => {
    const hash = email.toLowerCase().trim();
    // Simple hash for demo - in production use MD5
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userStats?.user.username || 'User'
    )}&size=200&background=random`;
  };

  const handleImageUpload = () => {
    if (imageUrl.trim()) {
      // Store in localStorage for demo purposes
      localStorage.setItem(`profile_image_${userId}`, imageUrl);
      setCustomImage(imageUrl);
      setShowImageModal(false);
      setImageUrl('');
    }
  };

  const handleUseGravatar = () => {
    if (userStats?.user.email) {
      const gravatarUrl = getGravatarUrl(userStats.user.email);
      localStorage.setItem(`profile_image_${userId}`, gravatarUrl);
      setCustomImage(gravatarUrl);
      setShowImageModal(false);
    }
  };

  // Load custom image from localStorage
  useEffect(() => {
    if (userId) {
      const savedImage = localStorage.getItem(`profile_image_${userId}`);
      if (savedImage) {
        setCustomImage(savedImage);
      }
    }
  }, [userId]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const stats = await userService.getUserById(userId);
        setUserStats(stats);

        const ideas = await ideaService.getUserIdeas(userId);
        setUserIdeas(ideas);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load user profile'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <SkeletonLoader type="profile" />
        <h3>Submitted Ideas</h3>
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <ErrorMessage
          title="Failed to Load Profile"
          message={error}
          onRetry={() => {
            if (userId) {
              setLoading(true);
              setError(null);
              const fetchUserData = async () => {
                try {
                  const stats = await userService.getUserById(userId);
                  setUserStats(stats);
                  const ideas = await ideaService.getUserIdeas(userId);
                  setUserIdeas(ideas);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Failed to load user profile'
                  );
                } finally {
                  setLoading(false);
                }
              };
              fetchUserData();
            }
          }}
        />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ fontSize: '18px', color: '#718096' }}>User not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  // Generate a consistent color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Cover Image */}
        <div
          style={{
            height: '200px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px 16px 0 0',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3,
            }}
          />
        </div>

        {/* Profile Header */}
        <div
          style={{
            background: 'white',
            borderRadius: '0 0 16px 16px',
            padding: '0 40px 40px 40px',
            marginBottom: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            marginTop: '-80px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar with border */}
            <div
              style={{
                position: 'relative',
                marginTop: '-60px',
              }}
            >
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: customImage
                    ? `url(${customImage})`
                    : getAvatarColor(userStats.user.username),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '64px',
                  fontWeight: '700',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  border: '6px solid white',
                }}
              >
                {!customImage && userStats.user.username[0].toUpperCase()}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setShowImageModal(true)}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f7fafc';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Change profile picture"
                >
                  📷
                </button>
              )}
            </div>

            {/* User Info */}
            <div style={{ flex: 1, minWidth: '300px', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h2
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1a202c',
                    margin: 0,
                  }}
                >
                  {userStats.user.username}
                </h2>
                <span
                  style={{
                    padding: '4px 12px',
                    background: '#e6fffa',
                    color: '#047857',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '12px',
                  }}
                >
                  ✓ Verified
                </span>
              </div>

              <p style={{ fontSize: '16px', color: '#718096', margin: '0 0 16px 0' }}>
                📧 {userStats.user.email}
              </p>

              <p
                style={{
                  fontSize: '15px',
                  color: '#4a5568',
                  lineHeight: '1.6',
                  margin: '0 0 16px 0',
                  fontStyle: 'italic',
                }}
              >
                "Passionate about innovation and creative problem-solving. Always excited to share and discover new ideas!"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  <span style={{ fontSize: '14px', color: '#718096' }}>
                    Joined{' '}
                    {new Date(userStats.user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🌍</span>
                  <span style={{ fontSize: '14px', color: '#718096' }}>
                    Location not set
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {isOwnProfile && (
                  <Link
                    to={`/users/${userId}/edit`}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    ✏️ Edit Profile
                  </Link>
                )}
                <button
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4a5568',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
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
                  📤 Share Profile
                </button>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                paddingTop: '20px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  padding: '20px 28px',
                  textAlign: 'center',
                  color: 'white',
                  minWidth: '130px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px' }}>
                  {userStats.ideaCount}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                  {userStats.ideaCount === 1 ? 'Idea' : 'Ideas'}
                </div>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '12px',
                  padding: '20px 28px',
                  textAlign: 'center',
                  color: 'white',
                  minWidth: '130px',
                  boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)',
                }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px' }}>
                  {userStats.feedbackCount}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                  Feedback
                </div>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '12px',
                  padding: '20px 28px',
                  textAlign: 'center',
                  color: 'white',
                  minWidth: '130px',
                  boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px' }}>
                  {userIdeas.reduce((sum, idea) => sum + (idea.ratingCount || 0), 0)}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                  Ratings
                </div>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: '12px',
                  padding: '20px 28px',
                  textAlign: 'center',
                  color: 'white',
                  minWidth: '130px',
                  boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
                }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px' }}>
                  {userIdeas.reduce((sum, idea) => sum + (idea.feedbackCount || 0), 0)}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
                  Received
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1a202c',
                marginBottom: '16px',
              }}
            >
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userIdeas.slice(0, 3).map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#edf2f7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f7fafc';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>💡</span>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/ideas/${idea.id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2d3748',
                        textDecoration: 'none',
                      }}
                    >
                      {idea.title}
                    </Link>
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
                      {new Date(idea.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#718096' }}>
                    <span>⭐ {idea.ratingCount || 0}</span>
                    <span>💬 {idea.feedbackCount || 0}</span>
                  </div>
                </div>
              ))}
              {userIdeas.length === 0 && (
                <p style={{ fontSize: '14px', color: '#a0aec0', textAlign: 'center', padding: '20px 0' }}>
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Ideas */}
        <div>
          <h3
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '20px',
            }}
          >
            Submitted Ideas ({userIdeas.length})
          </h3>

          {userIdeas.length === 0 ? (
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <p style={{ fontSize: '16px', color: '#718096', margin: 0 }}>
                {isOwnProfile
                  ? "You haven't submitted any ideas yet."
                  : 'No ideas submitted yet.'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/ideas/new"
                  style={{
                    display: 'inline-block',
                    marginTop: '16px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Share Your First Idea
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>

        {/* Profile Picture Modal */}
        {showImageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowImageModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '8px',
                  margin: 0,
                }}
              >
                Change Profile Picture
              </h3>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px' }}>
                Enter an image URL or use your Gravatar
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="imageUrl"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '8px',
                  }}
                >
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={handleImageUpload}
                  disabled={!imageUrl.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    background: imageUrl.trim()
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#cbd5e0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: imageUrl.trim() ? 'pointer' : 'not-allowed',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (imageUrl.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Set Image
                </button>
                <button
                  onClick={handleUseGravatar}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4a5568',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
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
                  Use Gravatar
                </button>
              </div>

              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#718096',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
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
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
