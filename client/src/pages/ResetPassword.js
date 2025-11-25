import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../core/firebase';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | ready | success | error
  const [message, setMessage] = useState('Checking your reset link...');
  const [oobCode, setOobCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('oobCode');
    const mode = params.get('mode');

    console.log('ResetPassword: Checking params', { mode, hasOobCode: !!code });

    if (!code || mode !== 'resetPassword') {
      setStatus('error');
      setMessage('Invalid or missing reset code.');
      console.error('ResetPassword: Missing or invalid params');
      return;
    }

    const checkCode = async () => {
      try {
        console.log('ResetPassword: Verifying reset code...');
        await verifyPasswordResetCode(auth, code);
        console.log('ResetPassword: Code verified successfully');
        setOobCode(code);
        setStatus('ready');
        setMessage('Enter a new password for your account.');
      } catch (err) {
        console.error('Password reset code verification error:', err);
        setStatus('error');
        if (err.code === 'auth/expired-action-code') {
          setMessage('This reset link has expired. Please request a new one from the Forgot Password page.');
        } else if (err.code === 'auth/invalid-action-code') {
          setMessage('This reset link is invalid or has already been used.');
        } else {
          setMessage(`We could not verify this reset link: ${err.message || 'Unknown error'}`);
        }
      }
    };

    checkCode();
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!oobCode) {
      setError('Reset code is missing or invalid. Please request a new link.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('ResetPassword: Confirming password reset...');
      await confirmPasswordReset(auth, oobCode, password);
      console.log('ResetPassword: Password reset successful');
      setStatus('success');
      setMessage('Your password has been reset successfully. You can now log in with your new password.');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setStatus('error');
      if (err.code === 'auth/expired-action-code') {
        setMessage('This reset link has expired. Please request a new one from the Forgot Password page.');
      } else if (err.code === 'auth/invalid-action-code') {
        setMessage('This reset link is invalid or has already been used.');
      } else {
        setMessage('We could not reset your password. Please request a new link and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = () => {
    if (status === 'verifying' || status === 'ready') {
      return (
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          {status === 'verifying' ? (
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          ) : (
            <Lock className="w-7 h-7 text-primary" />
          )}
        </div>
      );
    }
    if (status === 'success') {
      return (
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
      );
    }
    return (
      <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-600" />
      </div>
    );
  };

  return (
    <BeautifulBackground>
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-4">
            {renderIcon()}
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-foreground" />
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            {message}
          </p>

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground" htmlFor="password">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Re-enter new password"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>

              <div className="text-center text-xs text-muted-foreground mt-2">
                If you didn&apos;t request this, you can safely ignore this page.
              </div>
            </form>
          )}

          {status !== 'ready' && status !== 'verifying' && (
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center text-sm text-primary hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </div>
    </BeautifulBackground>
  );
};

export default ResetPassword;
