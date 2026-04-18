import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import ChatbotWidget from './components/chat/ChatbotWidget';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import MapView from './pages/MapView';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import EventDetail from './pages/EventDetail';
import About from './pages/About';
import AdminDashboard from './pages/admin/Dashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';

const UniversityPortal = lazy(() => import('./pages/UniversityPortal'));
const Jobs = lazy(() => import('./pages/Jobs'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const CompanyPortal = lazy(() => import('./pages/CompanyPortal'));
const TrainingHub = lazy(() => import('./pages/TrainingHub'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0]">
    <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
  </div>
);

// Protected route wrapper
const Protected = ({ children }) => {
  const { isAuth, loading } = useAuth();
  if (loading) return null;
  return isAuth ? children : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuth, loading, isSuperAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/admin" element={<Protected><AdminDashboard /></Protected>} />
          <Route path="/university" element={<Protected><UniversityDashboard /></Protected>} />
          <Route path="/university-portal" element={<UniversityPortal />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/training" element={<Protected><TrainingHub /></Protected>} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="/company-portal" element={<CompanyPortal />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
      <ChatbotWidget />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: 'Cairo', direction: 'rtl', borderRadius: '12px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
