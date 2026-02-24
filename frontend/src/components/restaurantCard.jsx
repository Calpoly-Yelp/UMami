import { useState } from "react";
import { Bookmark } from "@phosphor-icons/react";

import "./restaurantCard.css";

function RestaurantCard({ restaurant }) {
   // changes whether the restaurant is bookmarked or no
   const [isBookmarked, setIsBookmarked] = useState(
      restaurant.isBookmarked || false,
   );

   // logic to change bookmarked status when clicked
   const handleBookmarkToggle = (e) => {
      e.stopPropagation();
      setIsBookmarked((prev) => !prev);
   };

   // Logic to determine which tags to display based on character length
   const MAX_TAG_CHARS = 22;
   let currentChars = 0;
   let visibleTags = [];
   let remainingTagsCount = 0;

   if (restaurant.tags) {
      for (let i = 0; i < restaurant.tags.length; i++) {
         const tag = restaurant.tags[i];
         // Always show at least one tag, otherwise check if adding the next tag exceeds the limit
         if (
            i === 0 ||
            currentChars + tag.length <= MAX_TAG_CHARS
         ) {
            visibleTags.push(tag);
            currentChars += tag.length;
         } else {
            remainingTagsCount = restaurant.tags.length - i;
            break;
         }
      }
   }

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
            {/* Display all the restaurants tags up to max 3 */}
            {visibleTags.length > 0 && (
               <div className="restaurant-tags">
                  {visibleTags.map((tag, index) => (
                     <span key={index} className="tag">
                        {tag}
                     </span>
                  ))}
                  {remainingTagsCount > 0 && (
                     <span className="tag">
                        +{remainingTagsCount}
                     </span>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}

export default RestaurantCard;