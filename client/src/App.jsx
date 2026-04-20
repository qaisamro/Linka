import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster, resolveValue, ToastIcon } from 'react-hot-toast';
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
const FAQ = lazy(() => import('./pages/FAQ'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
          <Route path="/faq" element={<FAQ />} />
          <Route path="/help" element={<HelpCenter />} />
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
      <Toaster position="bottom-center" reverseOrder={false} toastOptions={{ duration: 5000 }} containerStyle={{ bottom: 40 }}>
        {(t) => (
          <div
            className={`
              ${t.visible ? 'animate-enter opacity-100 scale-100' : 'animate-leave opacity-0 scale-95'}
              max-w-md w-full rounded-2xl pointer-events-auto flex items-center p-4 border-[3px] transition-all duration-300
              ${t.type === 'success' ? 'border-emerald-500 bg-emerald-50 shadow-[0_8px_30px_rgba(16,185,129,0.3)]'
                : t.type === 'error' ? 'border-red-500 bg-red-50 shadow-[0_8px_30px_rgba(239,68,68,0.3)]'
                  : 'border-[#F4991A] bg-white shadow-[0_8px_30px_rgba(244,153,26,0.3)]'}
            `}
            style={{ direction: 'rtl', fontFamily: 'Cairo' }}
          >
            <div className={`flex-shrink-0 flex items-center justify-center rounded-full w-10 h-10
              ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-[#F4991A]'}
            `}>
              <ToastIcon toast={t} />
            </div>
            <div className="mr-4 ml-4 flex-1">
              <p className="text-[14px] sm:text-[15px] font-black text-[#344F1F] leading-snug">
                {resolveValue(t.message, t)}
              </p>
            </div>
            {t.type !== 'loading' && (
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>
        )}
      </Toaster>
    </AuthProvider>
  );
}
