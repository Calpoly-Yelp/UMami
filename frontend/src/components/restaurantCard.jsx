import { useState } from "react";
import "./restaurantCard.css";

function RestaurantCard({ restaurant }) {
   const [isBookmarked, setIsBookmarked] = useState(
      restaurant.isBookmarked || false,
   );

   const handleBookmarkToggle = (e) => {
      e.stopPropagation();
      setIsBookmarked((prev) => !prev);
   };
   return (
      <div className="restaurant-card">
         <div className="restaurant-image-wrapper">
            <img
               className="restaurant-image"
               src={restaurant.image}
               alt={restaurant.name}
            />
         </div>

         <div className="restaurant-content">
            <div className="restaurant-header">
               <div className="restaurant-name-rating">
                  <h3 className="restaurant-name">
                     {restaurant.name}
                  </h3>
                  <span className="restaurant-rating">
                     {[1, 2, 3, 4, 5].map((star) => {
                        const rating =
                           restaurant.averageRating || 0;

                        let starType = "empty";
                        if (rating >= star) {
                           starType = "filled";
                        } else if (rating >= star - 0.5) {
                           starType = "half";
                        }

                        return (
                           <span
                              key={star}
                              className={`star ${starType}`}
                           >
                              ★
                           </span>
                        );
                     })}
                  </span>
               </div>
               <button
                  className={`bookmark-button ${
                     isBookmarked ? "bookmarked" : ""
                  }`}
                  onClick={handleBookmarkToggle}
               >
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24"
                     fill={
                        isBookmarked
                           ? "currentColor"
                           : "none"
                     }
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     width="20"
                     height="20"
                  >
                     <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1z" />
                  </svg>
               </button>
            </div>

            {restaurant.tags &&
               restaurant.tags.length > 0 && (
                  <div className="restaurant-tags">
                     {restaurant.tags
                        .slice(0, 3)
                        .map((tag, index) => (
                           <span
                              key={index}
                              className="tag"
                           >
                              {tag}
                           </span>
                        ))}
                  </div>
               )}
         </div>
      </div>
   );
}

export default RestaurantCard;
