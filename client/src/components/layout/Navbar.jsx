import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import {
  Menu, X, Map, Calendar, User, LogOut,
  LayoutDashboard, Star, GraduationCap, Trophy, Home, Briefcase, Building2, Shield, Target
} from 'lucide-react';

const menuVariants = {
  closed: { opacity: 0, height: 0 },
  open: { opacity: 1, height: 'auto' },
};

const itemVariants = {
  closed: { opacity: 0, x: 20 },
  open: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07 } }),
};

export default function Navbar() {
  const { user, isAuth, isAdmin, isSuperAdmin, isUniversity, isEntity, entityType, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { label: 'الرئيسية', path: '/', icon: Home },
    { label: 'الفعاليات', path: '/events', icon: Calendar },
    { label: 'فرص العمل', path: '/jobs', icon: Briefcase },
    ...(isAuth ? [{ label: 'التدريب الميداني', path: '/training', icon: Target }] : []),
  ];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-white shadow-nav border-b border-slate-100/80'
      : 'bg-white/95 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 bg-hero-gradient rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300"
            >
              <span className="text-white text-lg">🗺️</span>
            </motion.div>
            <div className="hidden sm:block text-right">
              <p className="font-black text-brand-900 leading-none text-sm tracking-wide">Linka</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Linking Youth to Opportunities</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${isActive(path)
                  ? 'bg-brand-700 text-white shadow-sm shadow-brand-700/30'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuth ? (
              <>
                {isSuperAdmin && (
                  <Link to="/super-admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
                    <Shield size={16} />
                    إدارة النظام
                  </Link>
                )}
                {isAdmin && !isSuperAdmin && (
                  <Link to="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
                    <LayoutDashboard size={15} />
                    لوحة التحكم
                  </Link>
                )}
                {isUniversity && (
                  <Link to="/university-portal"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
                    <GraduationCap size={15} />
                    بوابة الجامعة
                  </Link>
                )}
                {isEntity && entityType === 'company' && (
                  <Link to="/company-portal"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
                    <Briefcase size={15} />
                    بوابة الشركة
                  </Link>
                )}

                <NotificationBell />

                {/* Profile Chip */}
                <Link to={isSuperAdmin ? '/super-admin' : isUniversity ? '/university-portal' : (isEntity && entityType === 'company') ? '/company-portal' : '/profile'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-brand-100 hover:border-brand-300 hover:bg-brand-50 transition-all duration-200 group">
                  <div className={`w-8 h-8 rounded-full overflow-hidden ${isSuperAdmin ? 'bg-slate-800' : isEntity ? 'bg-violet-600' : 'bg-hero-gradient'} flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:shadow-md transition-shadow`}>
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      isSuperAdmin ? '🛡️' : isUniversity ? '🏛' : user?.name?.charAt(0)
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 leading-none">{user.name?.split(' ')[0]}</p>
                    <p className={`text-[10px] font-bold leading-none mt-0.5 ${isSuperAdmin ? 'text-brand-600' : isEntity ? 'text-violet-500' : 'text-amber-500'}`}>
                      {isSuperAdmin ? 'أدمن النظام' : isEntity ? (entityType === 'company' ? '💼 شركة' : '🏛️ جهة') : `⭐ ${user.points || 0}`}
                    </p>
                  </div>
                </Link>

                <button onClick={handleLogout} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">دخول</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">انضم الآن</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-600">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-slate-100 p-4 space-y-2"
          >
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50">
                {link.label}
              </Link>
            ))}
            {isAuth ? (
              <div className="pt-2 border-t border-slate-100">
                {isSuperAdmin && <Link to="/super-admin" className="block px-4 py-3 rounded-xl font-bold text-brand-700 bg-brand-50 mb-1">إدارة النظام 🛡️</Link>}
                {isUniversity && <Link to="/university-portal" className="block px-4 py-3 rounded-xl font-bold text-violet-700 bg-violet-50 mb-1">بوابة الجامعة 🏛️</Link>}
                {isEntity && entityType === 'company' && <Link to="/company-portal" className="block px-4 py-3 rounded-xl font-bold text-violet-700 bg-violet-50 mb-1">بوابة الشركة 💼</Link>}
                <button onClick={handleLogout} className="w-full text-right px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50">تسجيل الخروج</button>
              </div>
            ) : (
              <Link to="/login" className="block text-center btn-primary py-3">تسجيل الدخول</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
