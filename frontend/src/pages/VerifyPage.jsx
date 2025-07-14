import React, { useState, useEffect } from 'react';
import '../index.css';

function VerifyPage({ email }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resending code
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSubmit = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Call the login-with-code API endpoint
      const response = await fetch('http://localhost:3000/auth/login-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      console.log('Login successful:', data);

      // Store token in localStorage for authentication
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to the TrelloInterface page instead of showing success message
        window.location.href = '/trello';
      } else {
        throw new Error('No authentication token received');
      }

    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      // Call the backend API to resend verification code
      const response = await fetch('http://localhost:3000/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }

      // Reset countdown
      setCountdown(60);
      setCanResend(false);

    } catch (err) {
      console.error('Error resending code:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
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
      {/* Main verification card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-content">
            {/* Logo */}
            <div className="logo">
              <span className="logo-text">S</span>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">Email Verification</h2>
              <p className="text-sm text-gray-600 mt-1">
                Please enter the code that was sent to {email}
              </p>
            </div>

            {/* Form */}
            <div className="form-container">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Enter code verification"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyPress={handleKeyPress}
                  className="email-input"
                  required
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !verificationCode}
                className="submit-button"
              >
                {loading && (
                  <span className="loading-spinner" style={{ marginRight: 8 }}></span>
                )}
                Submit
              </button>

              {/* Resend code option */}
              <div className="resend-container">
                {canResend ? (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="resend-button"
                  >
                    Resend Code
                  </button>
                ) : (
                  <p className="countdown-text">
                    Resend code in {countdown} seconds
                  </p>
                )}
              </div>
            </div>

            {/* Footer links */}
            <div className="footer-links">
              <a
                href="#"
                className="privacy-link"
              >
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
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
