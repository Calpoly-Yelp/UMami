import { useState } from "react";
import RestaurantCard from "../components/restaurantCard.jsx";
import { MagnifyingGlass } from "@phosphor-icons/react";
import "./restaurants.css";

const testRestaurants = [
   {
      id: 1,
      name: "Shake Smart",
      image: "/images/restaurants/Shakesmart-banner.jpg",
      avg_rating: 5,
      location: ["Recreation Center"],
      isBookmarked: true,
   },
   {
      id: 2,
      name: "Chick-fil-a",
      image: "/images/restaurants/chickfila.jpg",
      avg_rating: 5,
      location: ["1901 Marketplace"],
      isBookmarked: true,
   },
   {
      id: 3,
      name: "Taco Bell",
      image: "/images/restaurants/tacobell.webp",
      avg_rating: 5,
      location: ["Poly Canyon Village"],
      isBookmarked: true,
   },
   {
      id: 4,
      name: "Jamba Juice",
      image: "/images/restaurants/tacobell.webp",
      avg_rating: 4.5,
      location: ["Vista Grande Market"],
      isBookmarked: false,
   },
   {
      id: 5,
      name: "Subway",
      image: "/images/restaurants/subway1.jpg",
      avg_rating: 3.5,
      location: ["Dexter Lawn"],
      isBookmarked: false,
   },
   {
      id: 6,
      name: "Subway",
      image: "/images/restaurants/subway2.jpg",
      avg_rating: 3,
      location: ["Poly Canyon Village"],
      isBookmarked: false,
   },
   {
      id: 7,
      name: "Panda Express",
      image: "/images/restaurants/pandaexpress.jpeg",
      avg_rating: 3,
      location: ["1901 Marketplace"],
      isBookmarked: false,
   },
   {
      id: 8,
      name: "Einstein Bro's Bagels",
      image: "/images/restaurants/einsteinbros.jpeg",
      avg_rating: 3,
      location: ["Poly Canyon Village"],
      isBookmarked: false,
   },
];

export default function Restaurants() {
   const [query, setQuery] = useState("");

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
                  <RestaurantCard
                     key={r.id}
                     restaurant={r}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}
