import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard.jsx";
import { MagnifyingGlass } from "@phosphor-icons/react";
import "./Restaurants.css";

const testRestaurants = [
   {
      id: 108,
      name: "Shake Smart",
      image: "/images/restaurants/Shakesmart-banner.jpg",
      avg_rating: 5,
      location: ["Recreation Center"],
      isBookmarked: true,
   },
   {
      id: 107,
      name: "Chick-fil-a",
      image: "/images/restaurants/chickfila.jpg",
      avg_rating: 5,
      location: ["1901 Marketplace"],
      isBookmarked: true,
   },
   {
      id: 104,
      name: "Taco Bell",
      image: "/images/restaurants/tacobell.webp",
      avg_rating: 5,
      location: ["Poly Canyon Village"],
      isBookmarked: true,
   },
   {
      id: 106,
      name: "Subway",
      image: "/images/restaurants/subway1.jpg",
      avg_rating: 3.5,
      location: ["Dexter Lawn"],
      isBookmarked: false,
   },
   {
      id: 101,
      name: "Panda Express",
      image: "/images/restaurants/pandaexpress.jpeg",
      avg_rating: 3,
      location: ["1901 Marketplace"],
      isBookmarked: false,
   },
   {
      id: 105,
      name: "Einstein Bro's Bagels",
      image: "/images/restaurants/einsteinbros.jpeg",
      avg_rating: 3,
      location: ["Poly Canyon Village"],
      isBookmarked: false,
   },
];

export default function Restaurants() {
   const [query, setQuery] = useState("");
   const navigate = useNavigate();

   const handleCardClick = (restaurant) => {
      navigate(`/restaurants/${restaurant.id}`);
   };

   return (
      <div className="restaurants-page">
         <div className="restaurants-content">
            <h1 className="restaurants-title">
               All Restaurants
            </h1>

            <div className="restaurants-controls">
               <div className="search-wrap">
                  <MagnifyingGlass
                     size={18}
                     weight="regular"
                     className="search-icon"
                  />
                  <input
                     className="search-input"
                     placeholder="Search restaurants"
                     value={query}
                     onChange={(e) =>
                        setQuery(e.target.value)
                     }
                  />
               </div>

               <div className="controls-right">
                  <div className="pill">
                     <span className="pill-label">
                        filter
                     </span>
                     <select className="pill-select">
                        <option>all</option>
                        <option>saved</option>
                        <option>open now</option>
                     </select>
                  </div>

                  <div className="pill">
                     <span className="pill-label">
                        sort
                     </span>
                     <select className="pill-select">
                        <option>recommended</option>
                        <option>highest rating</option>
                        <option>nearest</option>
                        <option>price: low to high</option>
                        <option>price: high to low</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="restaurants-grid">
               {testRestaurants.map((r) => (
                  <div
                     key={r.id}
                     onClick={() => handleCardClick(r)}
                     style={{ cursor: "pointer" }}
                  >
                     <RestaurantCard restaurant={r} />
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
