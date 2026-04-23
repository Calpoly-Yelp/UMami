import { useState } from "react";
import { Bookmark } from "@phosphor-icons/react";

import "./restaurantCard.css";

function RestaurantCard({
   restaurant,
   isBookmarked: propIsBookmarked,
   onToggle,
   className = "",
}) {
   const [localIsBookmarked, setLocalIsBookmarked] =
      useState(restaurant.isBookmarked || false);

   const isControlled = propIsBookmarked !== undefined;
   const isBookmarked = isControlled
      ? propIsBookmarked
      : localIsBookmarked;

   const handleBookmarkToggle = (e) => {
      e.stopPropagation();

      if (onToggle) {
         onToggle();
      }

      if (!isControlled) {
         setLocalIsBookmarked((prev) => !prev);
      }
   };

   return (
      <div className={`restaurant-card ${className}`}>
         <div className="restaurant-image-wrapper">
            <img
               className="restaurant-image"
               src={restaurant.image}
               alt={restaurant.name}
            />
         </div>

         <div className="restaurant-content">
            <div className="restaurant-name-row">
               <h3 className="restaurant-name">
                  {restaurant.name}
               </h3>

               <button
                  className={`bookmark-button ${isBookmarked ? "bookmarked" : ""}`}
                  onClick={handleBookmarkToggle}
                  aria-label={
                     isBookmarked
                        ? `Remove bookmark for ${restaurant.name}`
                        : `Bookmark ${restaurant.name}`
                  }
               >
                  <Bookmark
                     weight={
                        isBookmarked ? "fill" : "regular"
                     }
                     size={22}
                  />
               </button>
            </div>

            <span className="restaurant-rating">
               {[1, 2, 3, 4, 5].map((star) => {
                  const rating = restaurant.avg_rating || 0;

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

            {restaurant.location && (
               <div className="restaurant-tags">
                  <span className="tag">
                     {restaurant.location}
                  </span>
               </div>
            )}
         </div>
      </div>
   );
}

export default RestaurantCard;
