'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';

// Particle type
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// Animated background particles
const BackgroundParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            y: [0, -30, 0],
          }}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.id % 3 === 0 ? 'var(--neon-pink)' : 'var(--neon-blue)',
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Animated grid background
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(var(--neon-blue) 1px, transparent 1px),
          linear-gradient(90deg, var(--neon-blue) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    {/* Radial glow */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
      }}
    />
  </div>
);

// Feature card component
const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="group relative p-6 rounded-2xl"
    style={{
      backgroundColor: 'rgba(21, 24, 32, 0.6)',
      border: '1px solid var(--border-dark)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <motion.div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 128, 0.1))',
      }}
    />
    <div className="relative z-10">
      <motion.div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 128, 0.2))',
          border: '1px solid rgba(0, 240, 255, 0.3)',
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {icon}
      </motion.div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
    </div>
  </motion.div>
);

// Floating 3D sphere visualization
const FloatingSphere = () => (
  <motion.div
    className="relative w-64 h-64 md:w-80 md:h-80"
    animate={{
      rotateY: 360,
    }}
    transition={{
      duration: 30,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    {/* Wireframe sphere lines */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(0, 240, 255, 0.2)',
          transform: `rotateX(${60 - i * 20}deg)`,
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: i * 0.3,
        }}
      />
    ))}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={`v-${i}`}
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(255, 0, 128, 0.15)',
          transform: `rotateY(${i * 30}deg)`,
        }}
        animate={{
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
    {/* Center glow */}
    <div
      className="absolute inset-8 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
      }}
    />
    {/* Hotspot markers */}
    {[
      { x: '20%', y: '30%' },
      { x: '70%', y: '45%' },
      { x: '45%', y: '70%' },
    ].map((pos, i) => (
      <motion.div
        key={`marker-${i}`}
        className="absolute w-3 h-3 rounded-full"
        style={{
          left: pos.x,
          top: pos.y,
          backgroundColor: i % 2 === 0 ? 'var(--neon-blue)' : 'var(--neon-pink)',
          boxShadow: `0 0 10px ${i % 2 === 0 ? 'var(--neon-blue)' : 'var(--neon-pink)'}`,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.5,
        }}
      />
    ))}
  </motion.div>
);

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [scrollY, setScrollY] = useState(0);

  // Redirect to editor if authenticated


  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full"
            style={{
              border: '3px solid var(--border-dark)',
              borderTopColor: 'var(--neon-blue)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <GridBackground />
      <BackgroundParticles />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          backgroundColor: scrollY > 50 ? 'rgba(10, 10, 14, 0.9)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid var(--border-dark)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <ellipse cx="12" cy="12" rx="9" ry="4" stroke="white" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              360 Scene Editor
            </span>
          </motion.div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {status === 'authenticated' ? (
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                  color: 'var(--bg-primary)',
                }}
                whileHover={{
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={() => openAuth('signin')}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-dark)',
                  }}
                  whileHover={{
                    borderColor: 'var(--neon-blue)',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => openAuth('signup')}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                    color: 'var(--bg-primary)',
                  }}
                  whileHover={{
                    boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
              }}
              animate={{
                boxShadow: [
                  '0 0 10px rgba(0, 240, 255, 0.2)',
                  '0 0 20px rgba(0, 240, 255, 0.3)',
                  '0 0 10px rgba(0, 240, 255, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
              <span className="text-xs font-medium" style={{ color: 'var(--neon-blue)' }}>
                AI-Powered Virtual Tours
              </span>
            </motion.div>

            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              Craft Immersive{' '}
              <span className="gradient-text">360° Experiences</span>
            </h1>

            <p
              className="text-lg mb-8 leading-relaxed max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Design, connect, and publish stunning virtual tours with our
              node-based editor. Create interactive panoramas with AI-generated
              scenes and seamless navigation.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                onClick={() => status === 'authenticated' ? router.push('/dashboard') : openAuth('signup')}
                className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                  color: 'var(--bg-primary)',
                }}
                whileHover={{
                  boxShadow: '0 0 40px rgba(0, 240, 255, 0.5)',
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'authenticated' ? 'Go to Dashboard' : 'Start Creating'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
              <motion.button
                className="px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(34, 38, 48, 0.8)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-dark)',
                }}
                whileHover={{
                  borderColor: 'var(--neon-blue)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Demo
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div
              className="flex gap-8 mt-12 pt-8"
              style={{ borderTop: '1px solid var(--border-dark)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { value: '10K+', label: 'Tours Created' },
                { value: '500+', label: 'Active Users' },
                { value: '99%', label: 'Uptime' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - 3D Visualization */}
          <motion.div
            className="relative flex justify-center items-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <FloatingSphere />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className="w-6 h-10 rounded-full flex justify-center pt-2"
            style={{ border: '2px solid var(--border-dark)' }}
          >
            <motion.div
              className="w-1.5 h-3 rounded-full"
              style={{ backgroundColor: 'var(--neon-blue)' }}
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything You Need to{' '}
              <span className="gradient-text">Build Virtual Worlds</span>
            </h2>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Powerful tools designed for creators, from beginners to professionals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              delay={0}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                </svg>
              }
              title="360° Panorama Editor"
              description="Upload, create, or generate stunning panoramic scenes with our intuitive visual editor."
            />
            <FeatureCard
              delay={0.1}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" />
                </svg>
              }
              title="Node-Based Workflow"
              description="Connect scenes visually with our React Flow-powered canvas. See your entire tour at a glance."
            />
            <FeatureCard
              delay={0.2}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              }
              title="AI Scene Generation"
              description="Describe your vision and let Gemini AI create breathtaking panoramas in seconds."
            />
            <FeatureCard
              delay={0.3}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              }
              title="Interactive Hotspots"
              description="Add navigation points, info markers, and interactive elements to guide your viewers."
            />
            <FeatureCard
              delay={0.4}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              }
              title="Cubemap Support"
              description="Import cubemaps or convert panoramas to cube faces for perfect skybox rendering."
            />
            <FeatureCard
              delay={0.5}
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="2">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9M8 17l4 4 4-4" />
                </svg>
              }
              title="Image Assembly"
              description="Stitch multiple photos into seamless panoramas with AI-powered alignment."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            backgroundColor: 'rgba(21, 24, 32, 0.8)',
            border: '1px solid var(--border-dark)',
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.2), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 240, 255, 0.3)',
                  '0 0 40px rgba(0, 240, 255, 0.5)',
                  '0 0 20px rgba(0, 240, 255, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </motion.div>

            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Ready to Create Your First Tour?
            </h2>
            <p
              className="text-lg mb-8 max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Join thousands of creators building immersive experiences.
              Start for free, no credit card required.
            </p>

            <motion.button
              onClick={() => openAuth('signup')}
              className="px-10 py-4 rounded-xl text-lg font-semibold"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                color: 'var(--bg-primary)',
              }}
              whileHover={{
                boxShadow: '0 0 50px rgba(0, 240, 255, 0.6)',
                scale: 1.05,
              }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started Free
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative py-12 px-6"
        style={{ borderTop: '1px solid var(--border-dark)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              360 Scene Editor
            </span>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            © 2024 360 Scene Editor. Built with ❤️ for creators.
          </p>

          <div className="flex items-center gap-6">
            {['Twitter', 'GitHub', 'Discord'].map((social) => (
              <motion.a
                key={social}
                href="#"
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
                whileHover={{ color: 'var(--neon-blue)' }}
              >
                {social}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            mode={authMode}
            onClose={() => setIsAuthOpen(false)}
            onSwitchMode={(mode) => setAuthMode(mode)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

