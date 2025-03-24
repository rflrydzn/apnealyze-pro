// src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import teamPhoto from '../assets/pic.jpg'; // Make sure your photo is here

const HomePage = () => (
  <div className="homepage">
    <section className="hero-section">
      <h1>Apnea-lyze Pro</h1>
      <p>Your reliable partner for sleep apnea prediction and monitoring.</p>
      <img src={teamPhoto} alt="Team 1" className="hero-photo" />
      <Link to="/ml-predict" className="cta-button">Get Your Prediction Now</Link>
    </section>

    <section className="features-section">
      <h2>Our Features</h2>
      <div className="features-container">
        <div className="feature-card">
          <h3>Machine Learning Prediction</h3>
          <p>Quickly predict sleep apnea severity using machine learning.</p>
          <Link to="/ml-predict">Try It Now</Link>
        </div>
        <div className="feature-card">
          <h3>Recording Control</h3>
          <p>Control your recording sessions and monitor in real-time.</p>
          <Link to="/recording">Start Recording</Link>
        </div>
        <div className="feature-card">
          <h3>Recording Sessions</h3>
          <p>View your past sleep session data and detailed reports.</p>
          <Link to="/sessions">View Sessions</Link>
        </div>
      </div>
    </section>

    <section className="about-section">
      <h2>About the Project</h2>
      <p>
        This project aims to help detect and analyze sleep apnea severity using machine learning.
        The system allows users to predict sleep apnea severity, record sleep sessions, and view detailed analyses through intuitive reports and graphs.
      </p>
    </section>

    <section className="acknowledgements-section">
      <h2>Acknowledgements</h2>
      <p><strong>Thesis Adviser:</strong> Francis Ignacio for ML expertise.</p>
      <p><strong>Thesis Professor:</strong> Gina Gie for continuous guidance.</p>
      <p><strong>Doctor:</strong> Romeo Enriquez for validation of report page and hardware.</p>
      <p><strong>Alumni Thesis Foundation:</strong> Gaddi Rolando Jr., Hwang Soo Hwan, Manganti Lance Angelo G for hardware foundation.</p>
      <p><strong>Panel Members:</strong> Angel Gregory Lansangan, Jeunesse Christian Gatuz, Eugene Erwin Baltazar for valuable suggestions.</p>
      <br />
      <p><strong>Developed by:</strong> Team 1</p>
      <ul>
        <li>Dizon, Rafael Roy</li>
        <li>Velasquez, Enrico Miguel</li>
        <li>Samson, Russel Ian</li>
      </ul>
    </section>

    <footer className="footer-section">
      <p>&copy; 2025 Sleep Apnea Detection System</p>
    </footer>
  </div>
);

export default HomePage;
