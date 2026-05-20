import React, { useEffect, useState } from 'react';

function LandingPage({ onGetStarted }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Trigger scroll fade entrance on mount
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <div className="landing-page">
      <div style={{ zIndex: 1 }}>
        <h1 className={`landing-header scroll-reveal ${revealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '100ms' }}>
          Organize Your Day, Effortlessly.
        </h1>
        <p className={`landing-subtitle scroll-reveal ${revealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '250ms' }}>
          A minimalist, lightning-fast MERN stack task manager. Keep track of your lists, set deadlines, and experience automatic serial shifting with absolute peace of mind.
        </p>

        <div className={`landing-card-grid scroll-reveal ${revealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '400ms' }}>
          <div className="landing-feature-card" onMouseMove={handleMouseMove}>
            <h3 className="landing-feature-title">Dynamic Numbering</h3>
            <p className="landing-feature-desc">
              Tasks auto-update and shift serial numbers upon removal to keep your workspace perfectly sequential.
            </p>
          </div>

          <div className="landing-feature-card" onMouseMove={handleMouseMove}>
            <h3 className="landing-feature-title">Multiple Lists</h3>
            <p className="landing-feature-desc">
              Organize different areas of life into distinct lists. Quickly switch and manage up to 100 lists.
            </p>
          </div>

          <div className="landing-feature-card" onMouseMove={handleMouseMove}>
            <h3 className="landing-feature-title">Smart Greetings</h3>
            <p className="landing-feature-desc">
              Receive contextual greetings matching your local timezone (morning, afternoon, evening, night).
            </p>
          </div>
        </div>

        <button 
          className={`btn-primary scroll-reveal ${revealed ? 'reveal-visible' : ''}`} 
          style={{ transitionDelay: '550ms' }}
          onClick={onGetStarted}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
