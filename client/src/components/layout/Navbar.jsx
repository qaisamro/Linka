import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import {
  Menu, X, Map, Calendar, User, LogOut, Users,
  LayoutDashboard, Star, GraduationCap, Trophy, Home, Briefcase, Building2, Shield, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assets/2.jpg.png';

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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    setIsLogoutOpen(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    setIsLogoutOpen(false);
    navigate('/');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = isSuperAdmin ? [] : [
    { label: 'الرئيسية', path: '/', icon: Home },
    { label: 'الفعاليات', path: '/events', icon: Calendar },
    { label: 'فرص العمل', path: '/jobs', icon: Briefcase },
    { label: 'من نحن', path: '/about', icon: Users },
    ...(isAuth ? [{ label: 'التدريب الميداني', path: '/training', icon: Target }] : []),
  ];

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-[#F9F5F0] shadow-nav border-b border-[#F9F5F0]/80'
        : 'bg-[#F9F5F0]/95 backdrop-blur-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between min-h-[5rem] py-2 flex-row-reverse">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={logo} alt="Linka Logo" className="h-14 sm:h-16 md:h-20 w-auto rounded-lg  group-hover:shadow-md transition-shadow duration-300 object-contain" />
              </motion.div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${isActive(path)
                    ? 'bg-[#344F1F] text-[#F9F5F0] shadow-sm'
                    : 'text-[#344F1F] hover:bg-[#F2EAD3] hover:text-[#F4991A]'
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
                  {isAdmin && !isSuperAdmin && (
                    <Link to="/admin"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#344F1F] hover:bg-[#F9F5F0] transition-colors">
                      <LayoutDashboard size={15} />
                      لوحة التحكم
                    </Link>
                  )}
                  {isUniversity && (
                    <Link to="/university-portal"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#344F1F] hover:bg-[#F9F5F0] transition-colors">
                      <GraduationCap size={15} />
                      بوابة الجامعة
                    </Link>
                  )}
                  {isEntity && entityType === 'company' && (
                    <Link to="/company-portal"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#344F1F] hover:bg-[#F9F5F0] transition-colors">
                      <Briefcase size={15} />
                      بوابة الشركة
                    </Link>
                  )}

                  {!isSuperAdmin && <NotificationBell />}

                  {/* Profile Chip */}
                  <Link to={isSuperAdmin ? '/super-admin' : isUniversity ? '/university-portal' : (isEntity && entityType === 'company') ? '/company-portal' : '/profile'}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#F9F5F0] hover:border-[#F2EAD3] hover:bg-[#F9F5F0] transition-all duration-200 group">
                    <div className={`w-8 h-8 rounded-full overflow-hidden ${isSuperAdmin ? 'bg-[#344F1F]' : isEntity ? 'bg-[#344F1F]' : 'bg-hero-gradient'} flex items-center justify-center text-[#F9F5F0] text-xs font-black shadow-sm group-hover:shadow-md transition-shadow`}>
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        isSuperAdmin ? '🛡️' : isUniversity ? '🏛' : user?.name?.charAt(0)
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#344F1F] leading-none">{user.name?.split(' ')[0]}</p>
                      <p className={`text-[10px] font-bold leading-none mt-0.5 ${isSuperAdmin ? 'text-[#344F1F]' : isEntity ? 'text-[#F4991A]' : 'text-[#F4991A]'}`}>
                        {isSuperAdmin ? 'أدمن النظام' : isEntity ? (entityType === 'company' ? '💼 شركة' : '🏛️ جهة') : `⭐ ${user.points || 0}`}
                      </p>
                    </div>
                  </Link>

                  <button onClick={handleLogout} className="p-2 rounded-xl text-[#F4991A] hover:text-[#F4991A] hover:bg-[#F9F5F0] transition-all">
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
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-[#344F1F]">
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
              className="md:hidden bg-[#F9F5F0] border-t border-[#F9F5F0] p-4 space-y-2"
            >
              {isAuth && (
                <div className="flex items-center justify-between px-4 py-3 mb-2 bg-[#F2EAD3]/30 rounded-2xl border border-[#F2EAD3]">
                  <Link to={isSuperAdmin ? '/super-admin' : isUniversity ? '/university-portal' : (isEntity && entityType === 'company') ? '/company-portal' : '/profile'}
                    className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full overflow-hidden ${isSuperAdmin ? 'bg-[#344F1F]' : isEntity ? 'bg-[#344F1F]' : 'bg-hero-gradient'} flex items-center justify-center text-[#F9F5F0] text-sm font-black shadow-sm`}>
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        isSuperAdmin ? '🛡️' : isUniversity ? '🏛' : user?.name?.charAt(0)
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#344F1F] leading-none">{user.name}</p>
                      <p className={`text-[11px] font-bold leading-none mt-1 ${isSuperAdmin ? 'text-[#344F1F]' : 'text-[#F4991A]'}`}>
                        {isSuperAdmin ? 'أدمن النظام' : isEntity ? (entityType === 'company' ? '💼 شركة' : '🏛️ جهة') : `⭐ ${user.points || 0} نقطة`}
                      </p>
                    </div>
                  </Link>
                  <NotificationBell />
                </div>
              )}

              {isSuperAdmin ? (
                /* Super Admin Mobile: Only admin dashboard link */
                <div className="space-y-2">
                  <Link to="/super-admin" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${isActive('/super-admin') ? 'bg-[#344F1F] text-[#F9F5F0]' : 'text-[#344F1F] hover:bg-[#F2EAD3]'}`}>
                    <Shield size={18} />
                    لوحة إدارة النظام
                  </Link>
                  <div className="pt-2 border-t border-[#F2EAD3]/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[#F4991A] hover:bg-[#F2EAD3] transition-all">
                      <LogOut size={18} />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${isActive(link.path) ? 'bg-[#344F1F] text-[#F9F5F0]' : 'text-[#344F1F] hover:bg-[#F2EAD3]'}`}>
                      <link.icon size={18} />
                      {link.label}
                    </Link>
                  ))}

                  {isAuth ? (
                    <div className="pt-2 border-t border-[#F2EAD3]/50 space-y-1">
                      {isUniversity && <Link to="/university-portal" className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[#344F1F] hover:bg-[#F2EAD3]">
                        <GraduationCap size={18} /> بوابة الجامعة
                      </Link>}
                      {isEntity && entityType === 'company' && <Link to="/company-portal" className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[#344F1F] hover:bg-[#F2EAD3]">
                        <Briefcase size={18} /> بوابة الشركة
                      </Link>}

                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[#F4991A] hover:bg-[#F2EAD3] transition-all">
                        <LogOut size={18} />
                        تسجيل الخروج
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 space-y-3">
                      <Link to="/login" className="block text-center btn-secondary py-3.5 w-full">تسجيل الدخول</Link>
                      <Link to="/register" className="block text-center btn-primary py-3.5 w-full">انضم الآن مجاناً</Link>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* Premium Logout Modal */}
      <AnimatePresence>
        {isLogoutOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutOpen(false)}
              className="absolute inset-0 bg-[#344F1F]/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#F9F5F0] rounded-[2.5rem] p-8 shadow-2xl border border-[#F2EAD3] overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4991A]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#344F1F]/10 rounded-full -ml-16 -mb-16 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#F2EAD3] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <LogOut size={40} className="text-[#344F1F]" />
                </div>

                <h3 className="text-2xl font-black text-[#344F1F] mb-3">تسجيل الخروج</h3>
                <p className="text-[#F4991A] font-bold mb-8 leading-relaxed">
                  هل أنت متأكد من رغبتك في تسجيل الخروج من منصة Linka؟
                </p>

                <div className="flex flex-col w-full gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmLogout}
                    className="w-full py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 hover:bg-[#2a4019] transition-colors"
                  >
                    نعم، تسجيل الخروج
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsLogoutOpen(false)}
                    className="w-full py-4 bg-[#F2EAD3] text-[#344F1F] rounded-2xl font-bold hover:bg-[#eaddbc] transition-colors"
                  >
                    إلغاء
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
