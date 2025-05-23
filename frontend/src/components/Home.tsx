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
        <div className="hero-content">
          <h1 className="hero-title">SpeechConvert</h1>
          <video className="hero-video" src="/nature.mp4" controls></video>
          <button className="hero-button">
            Try It Now
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
  <h2 className="about-title">About</h2>

  <div className="about-item reverse">
    <img src="/first.png" alt="Accessibility" className="about-img" />
    <div className="about-text">
      <h3 className="about-item-title">Inclusive Communication</h3>
      <p className="about-item-text">
      Converts speech to text in real-time, empowering those with hearing loss
      </p>
    </div>
  </div>

  <div className="about-item">
  <img src="/second.png" alt="Emotion Detection" className="about-img" />

    <div className="about-text">
      <h3 className="about-item-title">Upload Audio Files</h3>
      <p className="about-item-text">
      Effortlessly upload audio files and get instant transcription, translation, and emotion analysis — all in one place.
      </p>
    </div>
  </div>

  <div className="about-item reverse">
    <img src="/third.png" alt="Translation" className="about-img" />
    <div className="about-text">
      <h3 className="about-item-title">Immediate Translation</h3>
      <p className="about-item-text">
      Break language barriers with real-time speech translation, making conversations seamless across cultures.      </p>
    </div>
  </div>
</section>


      {/* Call to Action */}
      <section className="cta-section">
        <h2 className="cta-title">Start using it in seconds</h2>
        <button className="cta-button">
          Get Started
        </button>
      </section>
    </div>
  );
};
