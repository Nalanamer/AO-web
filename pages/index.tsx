// pages/index.tsx - AdventureOne Landing Page
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If user is already authenticated, redirect to feed
  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading, router]);

  const redirectToLogin = () => {
    router.push('/auth/login');
  };

  const createParticles = () => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    particlesContainer.innerHTML = ''; // Clear existing particles

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      const size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      
      particlesContainer.appendChild(particle);
    }
  };

  useEffect(() => {
    createParticles();
  }, []);

  // Show loading if auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>AdventureOne - Find Your Adventure Crew</title>
        <meta name="description" content="Connect with outdoor enthusiasts, discover hidden gems, and find your next adventure buddy. Join AdventureOne today!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="hero">
          <div className="particles" id="particles"></div>
          <div className="hero-content">
            <h1 className="floating">Hey, Let's Go on an Adventure!</h1>
            <p>Tired of scrolling through your phone wondering what to do this weekend? AdventureOne is where you'll find your next hiking buddy, discover that hidden surf spot, or finally try rock climbing with people who actually know what they're doing. No more boring weekends!</p>
            <button className="cta-button" onClick={redirectToLogin}>Let's Do This!</button>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <h2 className="section-title">Why You'll Love AdventureOne</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Find Your Adventure Crew</h3>
                <p>Stop going solo! Connect with locals who share your passion for outdoor fun. Whether you're into hiking, surfing, or trying something totally new.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📍</div>
                <h3>Discover Hidden Gems</h3>
                <p>Find those secret spots the locals know about. From epic hiking trails to perfect picnic spots - all right in your backyard.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Super Easy to Use</h3>
                <p>None of that complicated stuff. Just open the app, find something cool to do, and go! It's honestly that simple.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Apps Section */}
        <section className="mobile-apps">
          <div className="container">
            <h2>Take the Adventure With You</h2>
            <p>Honestly, who has time to sit at a computer when there's a whole world to explore? Our mobile apps are coming soon so you can find adventures on the go!</p>
            <div className="app-badges">
              <div className="app-badge">
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px'
                }}>
                  🍎
                </div>
                <div className="app-badge-text">
                  <div className="small">Coming Soon to</div>
                  <div className="large">App Store</div>
                </div>
              </div>
              <div className="app-badge">
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px'
                }}>
                  🤖
                </div>
                <div className="app-badge-text">
                  <div className="small">Coming Soon to</div>
                  <div className="large">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          .hero {
            min-height: 100vh;
            background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }

          .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="g"><stop offset="20%" stop-opacity=".1"/><stop offset="50%" stop-opacity=".05"/><stop offset="100%" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>');
            opacity: 0.3;
          }

          .hero-content {
            text-align: center;
            color: white;
            z-index: 2;
            max-width: 800px;
            padding: 0 20px;
            animation: fadeInUp 1s ease-out;
          }

          .hero h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 700;
            margin-bottom: 1.5rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero p {
            font-size: clamp(1.1rem, 2vw, 1.3rem);
            margin-bottom: 2.5rem;
            opacity: 0.9;
            line-height: 1.8;
          }

          .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #f59e0b, #d97706);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
            border: none;
            cursor: pointer;
          }

          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(245, 158, 11, 0.4);
            background: linear-gradient(45deg, #d97706, #f59e0b);
          }

          .features {
            padding: 100px 20px;
            background: #f0fdf4;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 60px;
            color: #065f46;
            font-weight: 700;
          }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            margin-bottom: 80px;
          }

          .feature-card {
            background: white;
            padding: 40px 30px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border: 1px solid #e2e8f0;
          }

          .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          }

          .feature-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }

          .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #065f46;
            font-weight: 600;
          }

          .feature-card p {
            color: #718096;
            line-height: 1.7;
          }

          .mobile-apps {
            padding: 100px 20px;
            background: linear-gradient(135deg, #065f46 0%, #047857 100%);
            color: white;
            text-align: center;
          }

          .mobile-apps h2 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            font-weight: 700;
          }

          .mobile-apps p {
            font-size: 1.2rem;
            margin-bottom: 50px;
            opacity: 0.9;
          }

          .app-badges {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
          }

          .app-badge {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 30px;
            border-radius: 15px;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .app-badge:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-3px);
          }

          .app-badge-text {
            text-align: left;
          }

          .app-badge-text .small {
            font-size: 0.8rem;
            opacity: 0.8;
          }

          .app-badge-text .large {
            font-size: 1.1rem;
            font-weight: 600;
          }

          .floating {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: particle-float 20s infinite linear;
          }

          @keyframes particle-float {
            0% {
              transform: translateY(100vh) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) translateX(100px);
              opacity: 0;
            }
          }

          @media (max-width: 768px) {
            .hero h1 {
              font-size: 2.5rem;
            }
            
            .hero p {
              font-size: 1.1rem;
            }
            
            .features-grid {
              grid-template-columns: 1fr;
              gap: 30px;
            }
            
            .app-badges {
              flex-direction: column;
              align-items: center;
            }
          }
        `}</style>
      </div>
    </>
  );
}