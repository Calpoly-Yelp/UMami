import Logo from "../assets/logo.jsx";
import {
   MdOutlineAccountCircle,
} from "react-icons/md";
import ReviewCard from "../components/reviewCard.jsx";
import RestaurantCard from "../components/restaurantCard.jsx";
import FollowedUserCard from "../components/followedUserCard.jsx";
import {
   UserCheck,
   CaretLeft,
   CaretRight,
} from "@phosphor-icons/react";
import UserName from "../components/userName.jsx";
import editIcon from "../assets/editProfileIcon.png";
import addPhotoIcon from "../assets/addPhotoIcon.png";
import "./user.css";

// This is our user page layout
function User() {
   // used to scroll in between pieces of the page
   const handleNavClick = (e, sectionId) => {
      e.preventDefault();
      const section = document.getElementById(sectionId);
      if (section) {
         section.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
      }
   };

   // Logic to scroll the horizontal lists
   const scrollContainer = (containerId, direction) => {
      const container = document.querySelector(
         `#${containerId} .review-list, #${containerId} .restaurant-list, #${containerId} .following-list`,
      );

      if (container) {
         const scrollAmount = 300; // Approximate width of a card + gap
         container.scrollBy({
            left:
               direction === "left"
                  ? -scrollAmount
                  : scrollAmount,
            behavior: "smooth",
         });
      }
   };

   // test data
   const testUser = {
      name: "Eli Schiffler",
      profilePicture:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      isVerified: true,
   };
   const testReviews = [
      {
         userPfp: testUser.profilePicture,
         userName: testUser.name,
         isVerified: testUser.isVerified,
         rating: 4,
         date: "2026-02-14",
         comments: "Loved it!",
         tags: ["Cozy", "Spicy"],
         photos: [
            "https://loremflickr.com/320/240/food",
            "https://picsum.photos/200/300",
         ],
      },
      {
         userPfp: testUser.profilePicture,
         userName: testUser.name,
         isVerified: testUser.isVerified,
         rating: 3,
         date: "2026-02-16",
         comments:
            "This food was so good! I will for sure be coming back again.",
         tags: [],
         photos: [
            "https://loremflickr.com/320/240/food",
            "https://picsum.photos/200/300",
         ],
      },
      {
         userPfp: testUser.profilePicture,
         userName: testUser.name,
         isVerified: testUser.isVerified,
         rating: 5,
         date: "2026-02-18",
         comments:
            "This was honestly one of the best dining experiences I've had in a long time. From the moment we walked in, the atmosphere felt warm and inviting, and the staff were incredibly attentive without being overbearing. The food itself was absolutely phenomenal — every bite was packed with flavor, and you could tell that high-quality ingredients were used throughout. I ordered the house special, and it exceeded all expectations. The portion sizes were generous, the presentation was beautiful, and the flavors were perfectly balanced. I also tried a few bites from my friends' plates, and everything we tasted was consistently excellent. On top of that, the ambiance made it such a comfortable place to sit and talk for hours. I would highly recommend this place to anyone looking for a memorable meal, and I’m already planning my next visit!",
         tags: ["Cozy", "Spicy", "Date Night", "Must Try"],
         photos: [
            "https://loremflickr.com/320/240/food",
            "https://picsum.photos/200/300",
         ],
      },
      {
         userPfp: testUser.profilePicture,
         userName: testUser.name,
         isVerified: testUser.isVerified,
         rating: 4,
         date: "2026-02-19",
         comments: "Great spot.",
         tags: [
            "Cozy",
            "Spicy",
            "Date Night",
            "Must Try",
            "Family Friendly",
            "Outdoor Seating",
            "Live Music",
            "Vegan Options",
            "Gluten Free",
            "Late Night",
            "Affordable",
            "Trendy",
            "Romantic",
            "Comfort Food",
            "Quick Service",
         ],
         photos: [
            "https://loremflickr.com/320/240/food",
            "https://picsum.photos/200/300",
         ],
      },
      {
         userPfp: testUser.profilePicture,
         userName: testUser.name,
         isVerified: testUser.isVerified,
         rating: 5,
         date: "2026-02-20",
         comments:
            "Absolutely incredible experience from start to finish. The ambiance was lively yet comfortable, making it perfect for both casual outings and special occasions. Every dish we ordered was thoughtfully prepared and beautifully presented. The flavors were bold and balanced, and you could truly taste the quality of the ingredients. The service was attentive, friendly, and knowledgeable, offering excellent recommendations that did not disappoint. We tried a wide range of menu items — appetizers, entrees, desserts, and even specialty drinks — and everything exceeded expectations. It’s rare to find a place that delivers consistently across every aspect of the dining experience, but this restaurant absolutely nailed it. I would highly recommend it to anyone looking for outstanding food, welcoming atmosphere, and memorable moments.",
         tags: [
            "Cozy",
            "Spicy",
            "Date Night",
            "Must Try",
            "Family Friendly",
            "Outdoor Seating",
            "Live Music",
            "Vegan Options",
            "Gluten Free",
            "Late Night",
            "Affordable",
            "Trendy",
            "Romantic",
            "Comfort Food",
            "Quick Service",
            "Hidden Gem",
            "Downtown",
            "Great Cocktails",
            "Brunch",
            "Reservations Recommended",
         ],
         photos: [
            "https://loremflickr.com/320/240/food",
            "https://picsum.photos/200/300",
         ],
      },
   ];
   const testRestaurants = [
      {
         name: "Shake Smart",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Shake+Smart",
         averageRating: 4.5,
         tags: ["Acai", "Smoothies", "Toast"],
         isBookmarked: true,
      },
      {
         name: "Jamba Juice",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Jamba+Juice",
         averageRating: 4.0,
         tags: ["Smoothies", "Juice", "Breakfast"],
         isBookmarked: false,
      },
      {
         name: "Health Shack",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Health+Shack",
         averageRating: 3.5,
         tags: ["Juice", "Toast", "Acai"],
         isBookmarked: true,
      },
   ];
   const testFollowedUsers = [
      {
         name: "Jane",
         isVerified: true,
         profilePicture:
            "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
         numReviews: 10,
      },
      {
         name: "Bob",
         isVerified: false,
         profilePicture:
            "https://placehold.co/100x100/003831/FFFFFF?text=Green+Fork",
         numReviews: 5,
      },
      {
         name: "Sarah Jenkins",
         isVerified: true,
         profilePicture:
            "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
         numReviews: 283,
      },
      {
         name: "This is my name",
         isVerified: false,
         profilePicture:
            "https://placehold.co/100x100/003831/FFFFFF?text=Green+Fork",
         numReviews: 5,
      },
      {
         name: "Another User",
         isVerified: true,
         profilePicture:
            "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
         numReviews: 1,
      },
   ];

   return (
      <div className="user-page">
         {/* Header Section */}
         <div className="user-header">
            <Logo />
            <MdOutlineAccountCircle
               size={60}
               color="#154734"
            />
         </div>
         {/* Content Section */}
         <div className="user-content">
            <div className="user-info">
               {/* Card Section */}
               <div className="card">
                  {/* If user has a profile picture, display that, otherwise display default image */}
                  {testUser.profilePicture ? (
                     <img
                        className="user-profile-picture"
                        src={testUser.profilePicture}
                        alt={`${testUser.name}'s profile picture`}
                     />
                  ) : (
                     <MdOutlineAccountCircle
                        size={120}
                        color="#8E9089"
                     />
                  )}
                  {/* Display users name and optionally a verified badge */}
                  <UserName
                     name={testUser.name}
                     isVerified={testUser.isVerified}
                  />
                  <div className="edit-icons">
                     <div className="edit-icon-wrapper">
                        <img src={addPhotoIcon} alt="Add Photo" />
                        <span>Add Photo</span>
                     </div>
                     <div className="edit-icon-wrapper">
                        <img src={editIcon} alt="Edit" />
                        <span>Edit Profile</span>
                     </div>
                  </div>
               </div>
               {/* Navigation Links for the user webpage */}
               <div className="navigation-links">
                  <a
                     href="#reviews"
                     onClick={(e) =>
                        handleNavClick(e, "reviews")
                     }
                  >
                     My Reviews
                  </a>
                  <a
                     href="#restaurants"
                     onClick={(e) =>
                        handleNavClick(e, "restaurants")
                     }
                  >
                     My Saved Restaurants
                  </a>
                  <a
                     href="#other-accounts"
                     onClick={(e) =>
                        handleNavClick(e, "following")
                     }
                  >
                     Following
                  </a>
               </div>
            </div>
            <div className="user-activity">
               {/* Review Section */}
               <div className="reviews" id="reviews">
                  <div className="activity-header">
                     <h2>My Reviews</h2>
                     <div className="scroll-buttons-container">
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "reviews",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={18}
                              weight="bold"
                           />
                        </button>
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "reviews",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={18}
                              weight="bold"
                           />
                        </button>
                     </div>
                  </div>
                  <div className="review-list">
                     {/* map all the users reviews */}
                     {testReviews.map((review, index) => (
                        <ReviewCard
                           key={
                              review.id ??
                              `${review.date ?? "review"}-${index}`
                           }
                           review={review}
                        />
                     ))}
                  </div>
               </div>
               {/* Restaurant Section */}
               <div
                  className="restaurants"
                  id="restaurants"
               >
                  <div className="activity-header">
                     <h2>My Saved Restaurants</h2>
                     <div className="scroll-buttons-container">
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "restaurants",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={18}
                              weight="bold"
                           />
                        </button>
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "restaurants",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={18}
                              weight="bold"
                           />
                        </button>
                     </div>
                  </div>
                  <div className="restaurant-list">
                     {/* map all the users favorited restaurants */}
                     {testRestaurants.map(
                        (restaurant, index) => (
                           <RestaurantCard
                              key={
                                 restaurant.id ??
                                 `${restaurant.name ?? "restaurant"}-${index}`
                              }
                              restaurant={restaurant}
                           />
                        ),
                     )}
                  </div>
               </div>
               {/* Other Accounts Section */}
               <div className="following" id="following">
                  <div className="activity-header">
                     <h2>Following</h2>
                     <UserCheck size={32} />
                     <div className="scroll-buttons-container">
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "following",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={18}
                              weight="bold"
                           />
                        </button>
                        <button
                           className="scroll-button"
                           onClick={() =>
                              scrollContainer(
                                 "following",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={18}
                              weight="bold"
                           />
                        </button>
                     </div>
                  </div>
                  <div className="following-list">
                     {/* map all the users followed accounts */}
                     {testFollowedUsers.map(
                        (user, index) => (
                           <FollowedUserCard
                              key={
                                 user.id ??
                                 `${user.name ?? "user"}-${index}`
                              }
                              user={user}
                           />
                        ),
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default User;
