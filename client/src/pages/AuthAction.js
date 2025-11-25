import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import ResetPassword from './ResetPassword';

const AuthAction = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');

  console.log('AuthAction loaded - mode:', mode, 'full URL:', location.search);

  if (!mode) {
    return <Navigate to="/login" replace />;
  }

  if (mode === 'verifyEmail') {
    return <VerifyEmail />;
  }

  if (mode === 'resetPassword') {
    return <ResetPassword />;
  }

  return <Navigate to="/login" replace />;
};

export default AuthAction;
