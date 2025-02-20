import { useState } from 'react';
import axios from 'axios';
import { toast, Zoom } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';  // Import useNavigate for programmatic navigation
import './ForgotPassword.css'; // Import the new CSS file
import Spinner from '../../Spinner/SpinnerScan';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();  // Initialize navigate

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors before validation

    if (!email.trim()) {
      setErrors({ email: "Email is required." });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "Invalid email format." });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/forgot_password`, { email });

      // Ensure that the backend returns the expected success status
      if (response.data && response.data.status === 'success') {
        toast.success('Reset link sent to your email!', {
          position: "top-center",
          autoClose: 2000,
          transition: Zoom,
        });

        // Redirect to login page after success
        setTimeout(() => {
          navigate('/');  // Redirect to the login page
        }, 2500);  // Wait for the toast message to display before redirecting
      } else {
        // Handle any non-success responses
        toast.error(response.data?.error || 'Something went wrong.');
      }
    } catch (error) {
      // Handle errors from axios, such as network issues or server errors
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>Forgot Password</h2>
        <p>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="inputGroup">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Displaying Spinner or Text based on loading state */}
          <button type="submit" className="fp-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {loading && <div className="spinner-container"><Spinner /></div>}
        
        <Link to="/" className="back-link">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
