import React from "react";
import "../static/Home.css";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/sub");
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <img
          src={`${process.env.PUBLIC_URL}/hero.jpg`}
          alt="Hero Background"
          className="hero-background"
        />
        <div className="hero-content">
          <h1 className="hero-title">SpeechConvert</h1>
          <img
            className="hero-video"
            src={`${process.env.PUBLIC_URL}/subs.png`}
            alt=""
          ></img>
          <button className="hero-button" onClick={handleClick}>
            Try It Now
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2 className="about-title">About</h2>

        <div className="about-item reverse">
          <img
            src={`${process.env.PUBLIC_URL}/first.png`}
            alt="Accessibility"
            className="about-img"
          />
          <div className="about-text">
            <h3 className="about-item-title">Inclusive Communication</h3>
            <p className="about-item-text">
              Converts speech to text in real-time, empowering those with
              hearing loss
            </p>
          </div>
        </div>

        <div className="about-item">
          <img
            src={`${process.env.PUBLIC_URL}/second.png`}
            alt="Upload Audio"
            className="about-img"
          />
          <div className="about-text">
            <h3 className="about-item-title">Upload Audio Files</h3>
            <p className="about-item-text">
              Effortlessly upload audio files and get instant transcription,
              translation, and emotion analysis — all in one place.
            </p>
          </div>
        </div>

        <div className="about-item reverse">
          <img
            src={`${process.env.PUBLIC_URL}/third.png`}
            alt="Translation"
            className="about-img"
          />
          <div className="about-text">
            <h3 className="about-item-title">Immediate Translation</h3>
            <p className="about-item-text">
              Break language barriers with real-time speech translation, making
              conversations seamless across cultures.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2 className="cta-title">Start using it in seconds</h2>
        <button className="cta-button" onClick={handleClick}>
          Get Started
        </button>
      </section>
    </div>
  );
};
