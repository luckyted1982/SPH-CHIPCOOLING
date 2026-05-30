import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Atom, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: '首页' },
  { path: '/workspace', label: '仿真工作台' },
  { path: '/tasks', label: '任务管理' },
  { path: '/templates', label: '模板库' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 glass-navbar transition-all duration-300"
      style={{
        boxShadow: scrolled ? '0 4px 24px rgba(0, 0, 0, 0.4)' : 'none',
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-[var(--text-primary)] hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--bg-surface)' }}>
            <Atom className="h-5 w-5" style={{ color: 'var(--accent-flow)' }} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">SPHinXsys</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 rounded-md"
              style={{
                color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-body)',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.color = 'var(--text-body)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {item.label}
              {isActive(item.path) && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full"
                  style={{ background: 'var(--accent-flow)' }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right: Status + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Simulation status indicator */}
          <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'var(--bg-surface)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--text-muted)' }} />
            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>空闲</span>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-14 left-0 right-0 border-t py-3 px-4"
          style={{
            background: 'rgba(3, 8, 16, 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
              style={{
                color: isActive(item.path) ? 'var(--accent-flow)' : 'var(--text-body)',
                background: isActive(item.path) ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
