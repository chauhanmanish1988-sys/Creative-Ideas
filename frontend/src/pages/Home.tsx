import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h2>Welcome to the Creative Ideas Platform</h2>
        <p className="hero-subtitle">
          Share your creative ideas, receive feedback from the community, and collaborate to make great ideas even better.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/ideas/new" className="btn btn-primary">Submit Your Idea</Link>
              <Link to="/ideas" className="btn btn-secondary">Browse Ideas</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/login" className="btn btn-secondary">Login</Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <h3>How It Works</h3>
        <div className="features-grid">
          <Link to={isAuthenticated ? "/ideas/new" : "/register"} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-icon">💡</div>
            <h4>Share Ideas</h4>
            <p>Submit your creative concepts and innovations to the community.</p>
            <div style={{ marginTop: '12px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
              {isAuthenticated ? 'Submit Now →' : 'Get Started →'}
            </div>
          </Link>
          <Link to="/ideas" className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-icon">💬</div>
            <h4>Get Feedback</h4>
            <p>Receive constructive feedback from other community members.</p>
            <div style={{ marginTop: '12px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
              Browse Ideas →
            </div>
          </Link>
          <Link to="/ideas" className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-icon">⭐</div>
            <h4>Rate & Discover</h4>
            <p>Rate ideas and discover the most popular concepts in the community.</p>
            <div style={{ marginTop: '12px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
              Explore Now →
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
