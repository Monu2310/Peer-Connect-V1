import { lazy } from 'react';
import { createLazyRoute } from '../lib/lazyLoading';

// Lazy load pages for better code splitting
export const Home = createLazyRoute(() => import('../pages/Home'));
export const Dashboard = createLazyRoute(() => import('../pages/Dashboard'));
export const Login = createLazyRoute(() => import('../pages/Login'));
export const Register = createLazyRoute(() => import('../pages/Register'));
export const Profile = createLazyRoute(() => import('../pages/Profile'));
export const Messages = createLazyRoute(() => import('../pages/Messages'));
export const Activities = createLazyRoute(() => import('../pages/Activities'));
export const ActivityDetail = createLazyRoute(() => import('../pages/ActivityDetail'));
export const Friends = createLazyRoute(() => import('../pages/Friends'));
export const Conversation = createLazyRoute(() => import('../pages/Conversation'));
export const CreateActivity = createLazyRoute(() => import('../pages/CreateActivity'));
export const NotFound = createLazyRoute(() => import('../pages/NotFound'));

// Lazy load features
export const AuthFeatures = {
  LoginForm: createLazyRoute(() => import('../features/auth/LoginForm')),
  RegisterForm: createLazyRoute(() => import('../features/auth/RegisterForm')),
  AuthProvider: createLazyRoute(() => import('../features/auth/AuthProvider'))
};

export const DashboardFeatures = {
  DashboardStats: createLazyRoute(() => import('../features/dashboard/DashboardStats')),
  RecentActivities: createLazyRoute(() => import('../features/dashboard/RecentActivities')),
  QuickActions: createLazyRoute(() => import('../features/dashboard/QuickActions'))
};

export const ActivityFeatures = {
  ActivityCard: createLazyRoute(() => import('../features/activities/ActivityCard')),
  ActivityForm: createLazyRoute(() => import('../features/activities/ActivityForm')),
  ActivityList: createLazyRoute(() => import('../features/activities/ActivityList')),
  ActivityDetails: createLazyRoute(() => import('../features/activities/ActivityDetails'))
};

export const MessageFeatures = {
  MessageList: createLazyRoute(() => import('../features/messages/MessageList')),
  MessageForm: createLazyRoute(() => import('../features/messages/MessageForm')),
  ChatWindow: createLazyRoute(() => import('../features/messages/ChatWindow'))
};

export const FriendFeatures = {
  FriendList: createLazyRoute(() => import('../features/friends/FriendList')),
  FriendCard: createLazyRoute(() => import('../features/friends/FriendCard')),
  FriendRequests: createLazyRoute(() => import('../features/friends/FriendRequests'))
};

export const ProfileFeatures = {
  ProfileCard: createLazyRoute(() => import('../features/profile/ProfileCard')),
  ProfileEdit: createLazyRoute(() => import('../features/profile/ProfileEdit')),
  ProfileSettings: createLazyRoute(() => import('../features/profile/ProfileSettings'))
};

// Preload critical routes
export const preloadCriticalRoutes = () => {
  // Preload home and dashboard as they're likely to be visited first
  import('../pages/Home');
  import('../pages/Dashboard');
  
  // Preload auth pages as they're common entry points
  setTimeout(() => {
    import('../pages/Login');
    import('../pages/Register');
  }, 2000);
};

// Route-based code splitting configuration
export const routeConfig = {
  '/': Home,
  '/dashboard': Dashboard,
  '/login': Login,
  '/register': Register,
  '/profile': Profile,
  '/messages': Messages,
  '/activities': Activities,
  '/activities/:id': ActivityDetail,
  '/friends': Friends,
  '/conversation/:id': Conversation,
  '/create-activity': CreateActivity,
  '*': NotFound
};