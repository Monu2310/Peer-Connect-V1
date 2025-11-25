import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../core/AuthContext';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import BeautifulBackground from '../components/effects/BeautifulBackground';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    try {
      await resetPassword(email);
      setStatus('success');
      setMessage('Password reset link sent! Check your email inbox.');
    } catch (err) {
      setStatus('error');
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setMessage('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setMessage('Please enter a valid email address.');
      } else {
        setMessage('Failed to send reset email. Please try again later.');
      }
    }
  };

  return (
    <BeautifulBackground>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Premium Glass Card */}
          <div className="relative backdrop-blur-2xl bg-card/90 dark:bg-card/95 rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
            {/* Premium accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>

            {/* Main Content */}
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                    <Mail className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-base text-muted-foreground font-medium">
                  Enter your email to receive a password reset link
                </p>
              </div>

              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6 text-center py-2"
                >
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                      <CheckCircle className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Check Your Email!</h3>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                      We've sent a password reset link to<br />
                      <strong className="text-foreground">{email}</strong>
                    </p>
                  </div>
                  <Link 
                    to="/login"
                    className="inline-flex items-center justify-center w-full px-5 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-2 group"
                  >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                    <span>Return to Login</span>
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="bg-destructive/10 backdrop-blur-sm border-2 border-destructive/30 text-destructive p-4 rounded-xl text-sm font-semibold flex items-start gap-3 shadow-lg"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>{message}</span>
                    </motion.div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2 ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" strokeWidth={2.5} />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <Link 
                      to="/login" 
                      className="inline-flex items-center text-base text-muted-foreground hover:text-primary transition-colors font-semibold gap-2 group"
                    >
                      <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                      <span>Back to Login</span>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </BeautifulBackground>
  );
};

export default ForgotPassword;
