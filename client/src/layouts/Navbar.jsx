import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, User, Users } from 'lucide-react';
import Logo from '@components/common/Logo';
import Button from '@components/common/Button';
import { NAV_LINKS } from '@data/navigation';
import { useAuthStore } from '@store';
import { getDashboardPath, getProfilePath } from '@utils';

function getFirstName(fullName, fallback = 'User') {
  const firstName = String(fullName || '').trim().split(/\s+/)[0];
  return firstName || fallback;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setActiveSection('');
      return undefined;
    }

    const sectionIds = NAV_LINKS.map((link) => link.href.replace('#', ''));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isHomePage]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleAnchorClick = useCallback((event, href) => {
    event.preventDefault();

    if (!isHomePage) {
      navigate(`/${href}`);
      setMobileOpen(false);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  }, [isHomePage, navigate]);

  const handleLogoClick = useCallback((event) => {
    setMobileOpen(false);

    if (location.pathname === '/' && !location.hash) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash, location.pathname]);

  const dashboardPath = getDashboardPath(user?.role);
  const profilePath = getProfilePath(user?.role);
  const primaryAction = isAuthenticated
    ? {
        label: user?.role === 'worker' ? 'Find Work' : 'Hire a Worker',
        to: user?.role === 'worker' ? '/jobs' : '/workers',
      }
    : {
        label: 'Get Started',
        to: '/register?role=client',
      };
  const secondaryAction = isAuthenticated
    ? { label: 'Dashboard', to: dashboardPath }
    : { label: 'Log In', to: '/login' };
  const showPrimaryAction = !isAuthenticated;
  const profileName = getFirstName(user?.fullName, 'User');

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100'
          : 'bg-transparent'
        }
      `}
    >
      <div className="container-app flex items-center justify-between h-[72px]">
        <Link to="/" className="relative z-10" onClick={handleLogoClick}>
          <Logo variant={scrolled ? 'dark' : 'white'} />
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const sectionId = href.replace('#', '');
            const isActive = isHomePage && activeSection === sectionId;

            return (
              <li key={href}>
                <button
                  type="button"
                  onClick={(event) => handleAnchorClick(event, href)}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${scrolled
                      ? isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                      : isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/community">
            <Button variant={scrolled ? 'ghost' : 'ghost-white'} size="sm">
              <Users size={14} />
              Community
            </Button>
          </Link>
          <Link to={secondaryAction.to}>
            <Button variant={scrolled ? 'ghost' : 'ghost-white'} size="sm">
              {secondaryAction.label}
            </Button>
          </Link>
          {showPrimaryAction ? (
            <Link to={primaryAction.to}>
              <Button variant={scrolled ? 'primary' : 'gradient'} size="sm">
                {primaryAction.label}
                <ArrowRight size={14} />
              </Button>
            </Link>
          ) : null}
          {isAuthenticated && (
            <Link
              to={profilePath}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-colors ${
                scrolled
                  ? 'border-slate-200 bg-white hover:bg-slate-50'
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={profileName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    scrolled ? 'bg-primary-100 text-primary-700' : 'bg-white/20 text-white'
                  }`}
                >
                  <User size={14} />
                </span>
              )}
              <span
                className={`max-w-[100px] truncate text-sm font-semibold ${
                  scrolled ? 'text-slate-900' : 'text-white'
                }`}
              >
                {profileName}
              </span>
            </Link>
          )}
        </div>

        <button
          className={`
            lg:hidden relative z-10 p-2 rounded-lg transition-colors
            ${mobileOpen
              ? 'bg-slate-100 text-slate-700'
              : scrolled
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-white/10 text-white'
            }
          `}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`
          lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
        `}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white z-40
          shadow-2xl transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <Link to="/" onClick={handleLogoClick} className="inline-flex">
              <Logo variant="dark" size="sm" />
            </Link>
            <button
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isAuthenticated && (
              <Link
                to={profilePath}
                onClick={() => setMobileOpen(false)}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={profileName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <User size={18} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-slate-900">{profileName}</span>
                </span>
                <ArrowRight size={18} className="text-slate-400" />
              </Link>
            )}

            <div className="flex flex-col gap-1">
              <Link
                to="/community"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-left text-base font-medium rounded-xl transition-all duration-200 text-slate-700 hover:text-primary-600 hover:bg-slate-50"
              >
                Community
              </Link>
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = isHomePage && activeSection === href.replace('#', '');

                return (
                  <button
                    type="button"
                    key={href}
                    className={`
                      px-4 py-3 text-left text-base font-medium rounded-xl transition-all duration-200
                      ${isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-700 hover:text-primary-600 hover:bg-slate-50'
                      }
                    `}
                    onClick={(event) => handleAnchorClick(event, href)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <Link to={secondaryAction.to} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="lg" className="w-full justify-center">
                {secondaryAction.label}
              </Button>
            </Link>
            {showPrimaryAction ? (
              <Link to={primaryAction.to} onClick={() => setMobileOpen(false)}>
                <Button variant="gradient" size="lg" className="w-full justify-center">
                  {primaryAction.label}
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
