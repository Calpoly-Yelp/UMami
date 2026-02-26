import React from "react";
import "./PhotoGallery.css";
import { useNavigate } from "react-router-dom";

const PhotoGallery = () => {
  const navigate = useNavigate();

  return (
    <div className="gallery-page">

      <header className="gallery-header">
        <div className="logo">umami</div>
        <div className="profile-icon"></div>
      </header>

      <div className="hero-section">
        <div className="hero-overlay">
          
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Menu Items</button>
        <button className="tab">Vibes of Restaurant</button>
      </div>

      <section className="section">
        <h2>Menu Items</h2>

        <div className="image-grid">
          <img src="gallery/ss_food_1.jpg" alt="" />
          <img src="gallery/ss_food_2.jpg" alt="" />
          <img src="gallery/ss_food_3.jpg" alt="" />
          <img src="gallery/ss_food_4.jpg" alt="" />
          <img src="gallery/ss_food_5.jpg" alt="" />
        </div>
      </section>

   
      <section className="section">
        <h2>Ambience</h2>

        <div className="image-grid">
          <img src="gallery/ss_ambience_1.jpg" alt="" />
          <img src="gallery/ss_ambience_2.jpg" alt="" />
          <img src="gallery/ss_ambience_3.jpg" alt="" />
          <img src="gallery/ss_ambience_4.jpg" alt="" />
          <img src="gallery/ss_ambience_5.jpg" alt="" />
        </div>
      </section>

    </div>
  );
};

export default PhotoGallery;
