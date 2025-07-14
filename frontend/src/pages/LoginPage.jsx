import React, { useState } from 'react';
import '../index.css';

function LoginPage({ onContinue }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      // Call the backend API to send verification code
      const response = await fetch('http://localhost:3000/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      console.log('Email submitted:', email);

      // Redirect to verify page
      if (onContinue) {
        onContinue(email);
      }
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
      <div className="login-container">
        {/* Main login card */}
        <div className="login-card-wrapper">
          <div className="login-card">
            <div className="login-content">
              {/* Logo */}
              <div className="logo">
                <span className="logo-text">S</span>
              </div>

              {/* Title */}
              <p className="login-title">Log in to continue</p>

              {/* Form */}
              <div className="form-container">
                <div className="input-wrapper">
                  <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="email-input"
                      required
                  />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !email}
                    className="submit-button"
                >
                  {loading && (
                      <span className="loading-spinner" style={{ marginRight: 8 }}></span>
                  )}
                  Continue
                </button>

                {/* Error message */}
                {error && <p className="error-message">{error}</p>}
              </div>

              {/* Footer links */}
              <div className="footer-links">
                <a href="#" className="privacy-link">
                  Privacy Policy
                </a>

                <p className="terms-text">
                  This site is protected by reCAPTCHA and the Google{' '}
                  <a href="#" className="terms-link">
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a href="#" className="terms-link">
                    Terms of Service
                  </a>
                  {' '}apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default LoginPage;