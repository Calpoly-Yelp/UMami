import { useState } from "react";
import { Bookmark } from "@phosphor-icons/react";

import "./restaurantCard.css";

function RestaurantCard({
   restaurant,
   isBookmarked: propIsBookmarked,
   onToggle,
}) {
   // changes whether the restaurant is bookmarked or no
   const [localIsBookmarked, setLocalIsBookmarked] =
      useState(restaurant.isBookmarked || false);

   // Determine if controlled or uncontrolled
   const isControlled = propIsBookmarked !== undefined;
   const isBookmarked = isControlled
      ? propIsBookmarked
      : localIsBookmarked;

   // logic to change bookmarked status when clicked
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
      <div className="restaurant-card">
         {/* Restaurant Image at top of card */}
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
               {/* Bookmark Button */}
               <button
                  className={`bookmark-button ${isBookmarked ? "bookmarked" : ""}`}
                  onClick={handleBookmarkToggle}
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
               {/* Stars are precise up to half a star */}
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
            {/* Display the restaurant location */}
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
