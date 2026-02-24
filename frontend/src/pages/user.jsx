import Logo from "../assets/logo.jsx";
import { MdOutlineAccountCircle } from "react-icons/md";
import ReviewCard from "../components/reviewCard.jsx";
import RestaurantCard from "../components/restaurantCard.jsx";
import FollowedUserCard from "../components/followedUserCard.jsx";
import {
   UserCheck,
   CaretLeft,
   CaretRight,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef } from "react";
import UserName from "../components/userName.jsx";
import editIcon from "../assets/editProfileIcon.png";
import addPhotoIcon from "../assets/addPhotoIcon.png";
import "./user.css";

// This is our user page layout
function User({
   user: initialUser,
   reviews: initialReviews,
   restaurants: initialRestaurants,
   bookmarks: initialBookmarks,
}) {
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

   // Data Extraction from DB
   const [user, setUser] = useState(
      initialUser || {
         id: "",
         name: "Loading...",
         avatar_url: "",
         is_verified: false,
      },
   );
   const [reviews, setReviews] = useState(
      initialReviews || [],
   );
   const [restaurants, setRestaurants] = useState(
      initialRestaurants || [],
   );
   const [bookmarkedIds, setBookmarkedIds] = useState(
      new Set(),
   );
   const originalBookmarkedIdsRef = useRef(new Set());
   const bookmarkedIdsRef = useRef(new Set());

   useEffect(() => {
      bookmarkedIdsRef.current = bookmarkedIds;
   }, [bookmarkedIds]);

   useEffect(() => {
      // check if we are in testing mode
      if (
         initialUser ||
         initialReviews ||
         initialRestaurants ||
         initialBookmarks
      )
         return;

      const fetchData = async () => {
         try {
            // fetch user
            const userId =
               "b677be85-81db-4245-91ca-acb713bd5564";
            const userResponse = await fetch(
               `http://localhost:4000/api/users/${userId}`,
            );
            let userData = {};
            if (userResponse.ok) {
               userData = await userResponse.json();
               setUser({
                  id: userData.id,
                  name: userData.name || "Anonymous",
                  profilePicture: userData.avatar_url || "",
                  isVerified: userData.is_verified || false,
               });
            } else {
               console.error("Failed to fetch user");
            }
            // fetch reviews
            const reviewsResponse = await fetch(
               "http://localhost:4000/api/reviews",
            );

            if (reviewsResponse.ok) {
               const reviewsData =
                  await reviewsResponse.json();
               console.log("Fetched reviews:", reviewsData);

               // filter reviews for this user
               const userReviews = reviewsData
                  .filter(
                     (review) =>
                        !userData.id ||
                        review.user_id === userData.id,
                  )
                  .map((review) => ({
                     id: review.id,
                     userPfp: userData.avatar_url || "",
                     userName: userData.name || "Anonymous",
                     isVerified:
                        userData.is_verified || false,
                     rating: review.rating,
                     date: review.created_at,
                     comments: review.comment || "",
                     tags: review.tags || [],
                     photos: review.photo_urls || [],
                  }));

               setReviews(userReviews);
            } else {
               console.error(
                  "Failed to fetch reviews:",
                  reviewsResponse.status,
               );
            }

            // fetch bookmarks and restaurants for this user
            console.log(
               `Fetching bookmarks for user: ${userId}`,
            );
            const bookmarksResponse = await fetch(
               `http://localhost:4000/api/restaurants/bookmarks/${userId}`,
            );
            if (bookmarksResponse.ok) {
               const restaurantsData =
                  await bookmarksResponse.json();
               console.log(
                  "Fetched restaurants data:",
                  restaurantsData,
               );

               const mappedRestaurants =
                  restaurantsData.map((r) => ({
                     id: r.id,
                     name: r.name,
                     image:
                        r.image_urls?.[0] ||
                        "https://placehold.co/300x200/003831/FFFFFF?text=Restaurant",
                     averageRating: r.avg_rating,
                     location: r.location,
                  }));

               console.log(
                  "Mapped restaurants:",
                  mappedRestaurants,
               );
               setRestaurants(mappedRestaurants);

               const ids = new Set(
                  mappedRestaurants.map((r) => r.id),
               );
               setBookmarkedIds(ids);
               originalBookmarkedIdsRef.current = new Set(
                  ids,
               );
            } else {
               console.error(
                  "Failed to fetch bookmarks:",
                  bookmarksResponse.status,
               );
            }
         } catch (error) {
            console.error("Error loading data:", error);
         }
      };
      fetchData();
   }, [
      initialUser,
      initialReviews,
      initialRestaurants,
      initialBookmarks,
   ]);

   // Sync bookmarks on page refresh
   useEffect(() => {
      const syncBookmarks = () => {
         const original = originalBookmarkedIdsRef.current;
         const current = bookmarkedIdsRef.current;
         const userId = user.id;

         if (!userId) return;

         const added = [...current].filter(
            (id) => !original.has(id),
         );
         const removed = [...original].filter(
            (id) => !current.has(id),
         );

         if (added.length === 0 && removed.length === 0)
            return;

         // sync the bookmarked restaurants
         fetch(
            "http://localhost:4000/api/restaurants/bookmarks/sync",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  user_id: userId,
                  added,
                  removed,
               }),
               keepalive: true,
            },
         );
      };

      window.addEventListener(
         "beforeunload",
         syncBookmarks,
      );

      return () => {
         window.removeEventListener(
            "beforeunload",
            syncBookmarks,
         );
         syncBookmarks();
      };
   }, [user.id]);

   const handleBookmarkToggle = (restaurantId) => {
      setBookmarkedIds((prev) => {
         const next = new Set(prev);
         if (next.has(restaurantId)) {
            next.delete(restaurantId);
         } else {
            next.add(restaurantId);
         }
         return next;
      });
   };

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
                  {user.profilePicture ? (
                     <img
                        className="user-profile-picture"
                        src={user.profilePicture}
                        alt={`${user.name}'s profile picture`}
                     />
                  ) : (
                     <MdOutlineAccountCircle
                        size={120}
                        color="#8E9089"
                     />
                  )}
                  {/* Display users name and optionally a verified badge */}
                  <UserName
                     name={user.name}
                     isVerified={user.isVerified}
                  />
                  <div className="edit-icons">
                     <div className="edit-icon-wrapper">
                        <img
                           src={addPhotoIcon}
                           alt="Add Photo"
                        />
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
                     {reviews.map((review, index) => (
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
                     {restaurants.map(
                        (restaurant, index) => (
                           <RestaurantCard
                              key={
                                 restaurant.id ??
                                 `${restaurant.name ?? "restaurant"}-${index}`
                              }
                              restaurant={restaurant}
                              isBookmarked={bookmarkedIds.has(
                                 restaurant.id,
                              )}
                              onToggle={() =>
                                 handleBookmarkToggle(
                                    restaurant.id,
                                 )
                              }
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
