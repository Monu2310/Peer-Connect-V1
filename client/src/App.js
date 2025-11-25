import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Styles
import './App.css';

// Contexts - Import these BEFORE components to avoid initialization errors
import { AuthProvider } from './core/AuthContext';
import { ThemeProvider } from './core/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import AuthAction from './pages/AuthAction'; // Direct import instead of lazy

// Lazy load pages with prefetch hints for code splitting
const Home = lazy(() => import(/* webpackChunkName: "home" */ './pages/Home'));
const Login = lazy(() => import(/* webpackChunkName: "auth" */ './pages/Login'));
const Register = lazy(() => import(/* webpackChunkName: "auth" */ './pages/Register'));
const ForgotPassword = lazy(() => import(/* webpackChunkName: "auth" */ './pages/ForgotPassword'));
const VerifyEmail = lazy(() => import(/* webpackChunkName: "auth" */ './pages/VerifyEmail'));
const ResetPassword = lazy(() => import(/* webpackChunkName: "auth" */ './pages/ResetPassword'));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ './pages/Profile'));
const Activities = lazy(() => import(/* webpackChunkName: "activities" */ './pages/Activities'));
const ActivityDetail = lazy(() => import(/* webpackChunkName: "activities" */ './pages/ActivityDetail'));
const CreateActivity = lazy(() => import(/* webpackChunkName: "activities" */ './pages/CreateActivity'));
const EditActivity = lazy(() => import(/* webpackChunkName: "activities" */ './pages/EditActivity'));
const Messages = lazy(() => import(/* webpackChunkName: "messages" */ './pages/Messages'));
const Conversation = lazy(() => import(/* webpackChunkName: "messages" */ './pages/Conversation'));
const Friends = lazy(() => import(/* webpackChunkName: "friends" */ './pages/Friends'));
const NotFound = lazy(() => import(/* webpackChunkName: "notfound" */ './pages/NotFound'));

// Routes
import PrivateRoute from './components/routes/PrivateRoute';

// Minimal loading component for Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        <div className="main-container min-h-screen bg-background text-foreground transition-colors duration-200 pt-16">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/action" element={<AuthAction />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
              <Route path="/activities/:activityId" element={<PrivateRoute><ActivityDetail /></PrivateRoute>} />
              <Route path="/activities/new" element={<PrivateRoute><CreateActivity /></PrivateRoute>} />
              <Route path="/activities/edit/:activityId" element={<PrivateRoute><EditActivity /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
              <Route path="/messages/:userId" element={<PrivateRoute><Conversation /></PrivateRoute>} />
              <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
