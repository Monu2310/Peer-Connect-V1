import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import { CheckCircle, AlertCircle, Loader2, MailCheck } from 'lucide-react';

const VerifyEmail = () => {
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('Verifying your email, please wait...');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');

    console.log('VerifyEmail: Checking params', { mode, hasOobCode: !!oobCode, fullSearch: location.search });

    if (!oobCode) {
      setStatus('error');
      setMessage('Invalid or missing verification code.');
      console.error('VerifyEmail: Missing oobCode');
      return;
    }

    // Allow if mode is missing (coming from AuthAction) or if it's verifyEmail
    if (mode && mode !== 'verifyEmail') {
      setStatus('error');
      setMessage('Invalid verification mode.');
      console.error('VerifyEmail: Wrong mode:', mode);
      return;
    }

    const verify = async () => {
      const maxRetries = 3;
      let retryCount = 0;
      
      // Use Firebase REST API directly instead of SDK to bypass network issues
      const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAWV8utdk-d9ssH7MvoeJgcZeUyyWl506s';
      
      while (retryCount < maxRetries) {
        try {
          console.log(`VerifyEmail: Calling Firebase REST API (attempt ${retryCount + 1}/${maxRetries})...`);
          
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                oobCode: oobCode
              })
            }
          );

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error?.message || 'Verification failed');
          }
          
          console.log('VerifyEmail: Success! Email verified via REST API.');
          setStatus('success');
          setMessage('Your email has been verified. You can now log in.');
          return; // Success, exit
        } catch (err) {
          retryCount++;
          console.error(`Email verification attempt ${retryCount} failed:`, err.message);
          
          // Retry on network errors
          if ((err.message.includes('network') || err.message.includes('fetch')) && retryCount < maxRetries) {
            console.log(`🔄 Network error, retrying in 2 seconds... (${retryCount}/${maxRetries})`);
            setMessage(`Connection issue (attempt ${retryCount}/${maxRetries}). Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Final failure or non-network error
            console.error('Email verification final error:', err);
            setStatus('error');
            if (err.message.includes('INVALID_OOB_CODE')) {
              setMessage('This verification link is invalid or has already been used.');
            } else if (err.message.includes('EXPIRED_OOB_CODE')) {
              setMessage('This verification link has expired. Please request a new one by trying to log in again.');
            } else if (err.message.includes('network') || err.message.includes('fetch')) {
              setMessage('Network connection failed after multiple attempts. Please check your internet connection and try again.');
            } else {
              setMessage(`We could not verify your email: ${err.message || 'Unknown error'}`);
            }
            return;
          }
        }
      }
    };

    hasProcessedRef.current = true;
    verify();
  }, [location.search]);

  const renderIcon = () => {
    if (status === 'verifying') {
      return (
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
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
        <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            {renderIcon()}
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
            <MailCheck className="w-6 h-6 text-foreground" />
            Email Verification
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {message}
          </p>

          {status !== 'verifying' && (
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-primary text-white font-semibold shadow-lg hover:bg-primary/90 transition-all"
              >
                Go to Login
              </Link>
              <p className="text-xs text-muted-foreground">
                If this isn&apos;t your device, close this window.
              </p>
            </div>
          )}
        </div>
      </div>
    </BeautifulBackground>
  );
};

export default VerifyEmail;
