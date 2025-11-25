import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import ResetPassword from './ResetPassword';
import { Loader2 } from 'lucide-react';
import BeautifulBackground from '../components/effects/BeautifulBackground';

const AuthAction = () => {
  const location = useLocation();
  const [mode, setMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const actionMode = params.get('mode');
    console.log('AuthAction: URL params:', { mode: actionMode, fullSearch: location.search });
    setMode(actionMode);
    setIsLoading(false);
  }, [location.search]);

  if (isLoading) {
    return (
      <BeautifulBackground>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BeautifulBackground>
    );
  }

  if (!mode) {
    console.warn('AuthAction: No mode parameter found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('AuthAction: Rendering component for mode:', mode);

  switch (mode) {
    case 'verifyEmail':
      return <VerifyEmail />;
    case 'resetPassword':
      return <ResetPassword />;
    case 'recoverEmail':
      return <Navigate to="/login" replace />;
    default:
      console.warn('AuthAction: Unknown mode:', mode);
      return <Navigate to="/login" replace />;
  }
};

export default AuthAction;
