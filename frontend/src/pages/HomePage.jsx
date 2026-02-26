import React from "react";
import "./Homepage.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
   const navigate = useNavigate();

   return (
      <div className="homepage">
         <header className="home-header">
            <h1 className="logo">umami</h1>

            <div className="nav-buttons">
               <button onClick={() => navigate("/gallery")}>
                  Photo Gallery
               </button>

               <button onClick={() => navigate("/")}>
                  Sign Out
               </button>
            </div>
         </header>

         <section className="home-hero">
            <h2>Welcome to Umami</h2>
            <p>
               Discover restaurants, explore menus, and find
               the perfect place to eat.
            </p>

            <button
               className="explore-btn"
               onClick={() => navigate("/gallery")}
            >
               Explore Restaurants
            </button>
         </section>
      </div>
   );
};

export default HomePage;
