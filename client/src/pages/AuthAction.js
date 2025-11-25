import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import ResetPassword from './ResetPassword';
import { Loader2 } from 'lucide-react';

const AuthAction = () => {
  const location = useLocation();
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const actionParams = params.get('mode');
    setMode(actionParams);
  }, [location.search]);

  if (!mode) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  switch (mode) {
    case 'verifyEmail':
      return <VerifyEmail />;
    case 'resetPassword':
      return <ResetPassword />;
    case 'recoverEmail':
      // Handle email recovery if needed, or just redirect to login
      return <Navigate to="/login" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default AuthAction;
