import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleCanvas from './ParticleCanvas';

interface LayoutProps {
  children: ReactNode;
  showParticles?: boolean;
}

export default function Layout({ children, showParticles = true }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative min-h-[100dvh]" style={{ background: 'var(--bg-abyss)' }}>
      {showParticles && <ParticleCanvas />}
      <Navbar />
      <main className="relative z-10">
        {children}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
