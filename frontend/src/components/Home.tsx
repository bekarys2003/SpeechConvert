import React from "react";
import "../static/Home.css";


export const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <img
          src="/hero.jpg"
          alt="Hero Background"
          className="hero-background"
        />
        <h1 className="hero-title">Speak Freely.</h1>
        <video className="hero-video" src="/nature.mp4" autoPlay muted loop></video>

        <button className="hero-button">
          Try It Now
        </button>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2 className="about-title">Why This App Matters</h2>
        <div className="about-grid">
          <div>
            <h3 className="about-item-title">1. Accessibility for Everyone</h3>
            <p className="about-item-text">Brings speech to text for the hearing impaired and supports multi-language communication for global inclusivity.</p>
          </div>
          <div>
            <h3 className="about-item-title">2. Instant Emotional Insight</h3>
            <p className="about-item-text">Understand the emotional tone behind conversations with cutting-edge sentiment analysis.</p>
          </div>
          <div>
            <h3 className="about-item-title">3. Global Translation</h3>
            <p className="about-item-text">Translates speech in real-time into multiple languages to bridge communication gaps.</p>
          </div>
          <div>
            <h3 className="about-item-title">4. Perfect for Live Content</h3>
            <p className="about-item-text">Use it in podcasts, webinars, or live interviews for accurate and instant subtitle delivery.</p>
          </div>
          <div>
            <h3 className="about-item-title">5. AI-Powered Simplicity</h3>
            <p className="about-item-text">All features are powered by AI, wrapped in a simple and beautiful interface anyone can use.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2 className="cta-title">Start using it in seconds</h2>
        <p className="cta-subtitle">No setup required. Just hit record and experience the future of voice interaction.</p>
        <button className="cta-button">
          Get Started
        </button>
      </section>
    </div>
  );
}
