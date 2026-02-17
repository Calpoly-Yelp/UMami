import Logo from "../assets/logo.jsx";
import {
   MdOutlineAccountCircle,
   MdOutlineEdit,
   MdOutlineAddAPhoto,
} from "react-icons/md";
import cpLogo from "../assets/cplogo.png";
import ReviewCard from "../components/reviewCard.jsx";
import RestaurantCard from "../components/restaurantCard.jsx";
import FollowedUserCard from "../components/followedUserCard.jsx";
import { UserCheck } from "@phosphor-icons/react";
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

   // test data
   const testUser = {
      name: "Eli Schiffler",
      profilePicture:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      isVerified: true,
   };
   const testReview = {
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
   };
   const testRestaurants = [
      {
         name: "Shake Smart",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Spicy+Spoon",
         averageRating: 4.5,
         tags: ["Acai", "Smoothies", "Toast"],
         isBookmarked: true,
      },
      {
         name: "Jamba Juice",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Green+Fork",
         averageRating: 4.0,
         tags: ["Smoothies", "Juice", "Breakfast"],
         isBookmarked: false,
      },
      {
         name: "Health Shack",
         image: "https://placehold.co/300x200/003831/FFFFFF?text=Umami+Eats",
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
                  <div className="name">
                     <h3>{testUser.name}</h3>
                     {testUser.isVerified && (
                        <img
                           src={cpLogo}
                           alt="Company Logo"
                           className="verified-badge"
                        />
                     )}
                  </div>
                  <div className="edit-icons">
                     <MdOutlineAddAPhoto />
                     <MdOutlineEdit />
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
                        handleNavClick(e, "other-accounts")
                     }
                  >
                     Other Accounts
                  </a>
               </div>
            </div>
            <div className="user-activity">
               {/* Review Section */}
               <div className="reviews" id="reviews">
                  <div className="activity-header">
                     <h2>My Reviews</h2>
                  </div>
                  <ReviewCard review={testReview} />
               </div>
               {/* Restaurant Section */}
               <div
                  className="restaurants"
                  id="restaurants"
               >
                  <div className="activity-header">
                     <h2>My Saved Restaurants</h2>
                  </div>
                  <div className="restaurant-list">
                     {/* map all the users favorited restaurants */}
                     {testRestaurants.map((restaurant) => (
                        <RestaurantCard
                           restaurant={restaurant}
                        />
                     ))}
                  </div>
               </div>
               {/* Other Accounts Section */}
               <div
                  className="other-accounts"
                  id="other-accounts"
               >
                  <div className="activity-header">
                     <h2>Other Accounts</h2>
                  </div>
                  <div className="user-list">
                     <div className="following-header">
                        <UserCheck size={16} />
                        <h5>Following</h5>
                     </div>
                     <div className="user-list-items">
                        {/* map all the users followed accounts */}
                        {testFollowedUsers.map((user) => (
                           <FollowedUserCard user={user} />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default User;
