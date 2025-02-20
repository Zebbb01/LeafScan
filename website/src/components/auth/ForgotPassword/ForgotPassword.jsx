import { useState } from 'react';
import axios from 'axios';
import { toast, Zoom } from 'react-toastify';
import { Link } from 'react-router-dom';
import './ForgotPassword.css'; // Import the new CSS file
import Spinner from '../../Spinner/Spinner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

      if (response.data.status === 'success') {
        toast.success('Reset link sent to your email!', {
          position: "top-center",
          autoClose: 2000,
          transition: Zoom,
        });
      } else {
        toast.error(response.data.error || 'Something went wrong.');
      }
    } catch (error) {
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
