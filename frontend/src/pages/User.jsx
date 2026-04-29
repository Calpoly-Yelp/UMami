import { MdOutlineAccountCircle } from "react-icons/md";
import ReviewCard from "../components/ReviewCard.jsx";
import RestaurantCard from "../components/RestaurantCard.jsx";
import FollowedUserCard from "../components/FollowUserCard.jsx";
import {
   CaretLeft,
   CaretRight,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserName from "../components/UserName.jsx";
import editIcon from "../assets/editProfileIcon.png";
import addPhotoIcon from "../assets/addPhotoIcon.png";
import "./User.css";

// This is our user page layout
function User({
   session,
   user: initialUser,
   reviews: initialReviews,
   restaurants: initialRestaurants,
   followedUsers: initialFollowing,
}) {
   const navigate = useNavigate();

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
      initialReviews
         ? [...initialReviews].sort(
              (a, b) =>
                 (b.date ? new Date(b.date).getTime() : 0) -
                 (a.date ? new Date(a.date).getTime() : 0),
           )
         : [],
   );
   const [restaurants, setRestaurants] = useState(
      initialRestaurants || [],
   );
   const [bookmarkedIds, setBookmarkedIds] = useState(
      () =>
         new Set(
            initialRestaurants?.map((r) => r.id) || [],
         ),
   );
   const originalBookmarkedIdsRef = useRef(
      new Set(initialRestaurants?.map((r) => r.id) || []),
   );
   const bookmarkedIdsRef = useRef(new Set());
   const initialFollowingArray = initialFollowing ?? [];
   const initialFollowingIdsInit = new Set(
      initialFollowingArray.map((f) => f.id),
   );

   const [following, setFollowing] = useState(
      initialFollowingArray,
   );
   const [followingIds, setFollowingIds] = useState(
      () => new Set(initialFollowingIdsInit),
   );

   const originalFollowingIdsRef = useRef(
      new Set(initialFollowingIdsInit),
   );
   const followingIdsRef = useRef(new Set());

   // State to track whether a carousel can scroll left or right
   const [canScroll, setCanScroll] = useState({
      reviews: { left: false, right: false },
      restaurants: { left: false, right: false },
      following: { left: false, right: false },
   });

   // Checks the DOM properties of the carousel to see if there is scrollable space
   const checkScroll = (id) => {
      const el = document.getElementById(`${id}-list`);
      if (!el) return;
      setCanScroll((prev) => ({
         ...prev,
         [id]: {
            left: el.scrollLeft > 0,
            right:
               Math.ceil(el.scrollLeft + el.clientWidth) <
               el.scrollWidth,
         },
      }));
   };

   // Re-evaluate scroll capabilities whenever the data changes or window resizes
   useEffect(() => {
      checkScroll("reviews");
      checkScroll("restaurants");
      checkScroll("following");

      const handleResize = () => {
         checkScroll("reviews");
         checkScroll("restaurants");
         checkScroll("following");
      };

      window.addEventListener("resize", handleResize);
      return () =>
         window.removeEventListener("resize", handleResize);
   }, [reviews, restaurants, following]);

   // Logic to scroll the horizontal lists
   const scrollContainer = (containerId, direction) => {
      const container = document.getElementById(
         `${containerId}-list`,
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

   useEffect(() => {
      bookmarkedIdsRef.current = bookmarkedIds;
   }, [bookmarkedIds]);

   useEffect(() => {
      followingIdsRef.current = followingIds;
   }, [followingIds]);

   useEffect(() => {
      // check if we are in testing mode
      if (
         initialUser ||
         initialReviews ||
         initialRestaurants ||
         initialFollowing
      )
         return;

      //------------Fetch data function---------------
      // gets all data for webpage
      // - user data
      //     - following users data
      //     - review data
      //.    - bookmarked restaurant data
      const fetchData = async () => {
         try {
            const sessionUser = session?.user || null;
            const storedUserRaw =
               localStorage.getItem("user");
            const storedUser = storedUserRaw
               ? JSON.parse(storedUserRaw)
               : null;

            // assign user data to object
            const userData = {
               ...(storedUser || {}),
               ...(initialUser || {}),
               id:
                  sessionUser?.id ||
                  initialUser?.id ||
                  storedUser?.id ||
                  "",
               name:
                  initialUser?.name ||
                  storedUser?.name ||
                  sessionUser?.user_metadata?.name ||
                  "Anonymous",
               avatar_url:
                  initialUser?.avatar_url ||
                  storedUser?.avatar_url ||
                  sessionUser?.user_metadata?.avatar_url ||
                  "",
               is_verified:
                  initialUser?.is_verified ||
                  storedUser?.is_verified ||
                  false,
            };

            if (!userData.id) {
               setRestaurants([]);
               setBookmarkedIds(new Set());
               setFollowing([]);
               setFollowingIds(new Set());
               return;
            }

            if (userData.id) {
               setUser({
                  id: userData.id,
                  name: userData.name || "Anonymous",
                  avatar_url: userData.avatar_url || "",
                  is_verified:
                     userData.is_verified || false,
               });
            }

            // Execute all fetches in parallel
            const [
               reviewsResponse,
               bookmarksResponse,
               followingResponse,
            ] = await Promise.all([
               fetch(
                  `http://localhost:4000/api/reviews?user_id=${userData.id}`,
               ),
               fetch(
                  `http://localhost:4000/api/restaurants/bookmarks/${userData.id}`,
               ),
               fetch(
                  `http://localhost:4000/api/users/${userData.id}/follows`,
               ),
            ]);

            // handle response errors
            if (
               !reviewsResponse.ok &&
               reviewsResponse.status !== 404
            ) {
               throw new Error(
                  `Backend error when fetching reviews: ${reviewsResponse.statusText}`,
               );
            }

            // assign review data to object
            if (reviewsResponse.ok) {
               const reviewsData =
                  await reviewsResponse.json();
               console.log("Fetched reviews:", reviewsData);

               // filter reviews for this user
               const userReviews = reviewsData
                  .map((review) => ({
                     id: review.id,
                     user_id: userData.id,
                     avatar_url: userData.avatar_url || "",
                     userName: userData.name || "Anonymous",
                     is_verified:
                        userData.is_verified || false,
                     rating: review.rating,
                     date: review.created_at,
                     comments: review.comment || "",
                     tags: review.tags || [],
                     photos: review.photo_urls || [],
                  }))
                  .sort(
                     (a, b) =>
                        (b.date
                           ? new Date(b.date).getTime()
                           : 0) -
                        (a.date
                           ? new Date(a.date).getTime()
                           : 0),
                  );

               setReviews(userReviews);
            } else {
               console.error(
                  "Failed to fetch reviews:",
                  reviewsResponse.status,
               );
            }

            // fetch bookmarks and restaurants for this user
            console.log(
               `Fetching bookmarks for user: ${userData.id}`,
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
                     avg_rating: r.avg_rating,
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

            // fetch our followed users
            if (followingResponse.ok) {
               const followingData =
                  await followingResponse.json();
               console.log(
                  "Fetched following data:",
                  followingData,
               );
               setFollowing(followingData);

               const ids = new Set(
                  followingData.map((f) => f.id),
               );
               setFollowingIds(ids);
               originalFollowingIdsRef.current = new Set(
                  ids,
               );
            } else {
               console.error(
                  "Failed to fetch following:",
                  followingResponse.status,
               );
            }
         } catch (error) {
            console.error("Error loading data:", error);
         }
      };
      fetchData();
   }, [
      session,
      initialUser,
      initialReviews,
      initialRestaurants,
      initialFollowing,
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

   // Sync following on page refresh
   useEffect(() => {
      const syncFollowing = () => {
         const original = originalFollowingIdsRef.current;
         const current = followingIdsRef.current;
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

         fetch(
            "http://localhost:4000/api/users/follows/sync",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  follower_id: userId,
                  added,
                  removed,
               }),
               keepalive: true,
            },
         );
      };
      window.addEventListener(
         "beforeunload",
         syncFollowing,
      );
      return () => {
         window.removeEventListener(
            "beforeunload",
            syncFollowing,
         );
         syncFollowing();
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

   const handleFollowToggle = (followedUserId) => {
      setFollowingIds((prev) => {
         const next = new Set(prev);
         if (next.has(followedUserId)) {
            next.delete(followedUserId);
         } else {
            next.add(followedUserId);
         }
         return next;
      });
   };

   // Deletes a review from the backend and updates local state
   const handleDeleteReview = async (reviewId) => {
      try {
         const response = await fetch(
            `http://localhost:4000/api/reviews/${reviewId}`,
            {
               method: "DELETE",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ user_id: user.id }),
            },
         );
         if (response.ok) {
            setReviews((prev) =>
               prev.filter((r) => r.id !== reviewId),
            );
         } else {
            console.error("Failed to delete review");
         }
      } catch (error) {
         console.error("Error deleting review:", error);
      }
   };

   return (
      <div className="user-page">
         {/* Content Section */}
         <div className="user-content">
            <div className="user-info">
               {/* Card Section */}
               <div className="user-card">
                  {/* If user has a profile picture, display that, otherwise display default image */}
                  {user.avatar_url ? (
                     <img
                        className="user-profile-picture"
                        src={user.avatar_url}
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
                     is_verified={user.is_verified}
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
                  </div>
                  <div className="carousel-container">
                     {canScroll.reviews.left && (
                        <button
                           className="carousel-arrow left"
                           onClick={() =>
                              scrollContainer(
                                 "reviews",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                     <div
                        className="review-list"
                        id="reviews-list"
                        onScroll={() =>
                           checkScroll("reviews")
                        }
                     >
                        {/* map all the users reviews */}
                        {reviews.length > 0 ? (
                           reviews.map((review, index) => (
                              <ReviewCard
                                 key={
                                    review.id ??
                                    `${review.date ?? "review"}-${index}`
                                 }
                                 review={review}
                                 currentUserId={user.id}
                                 onDelete={
                                    handleDeleteReview
                                 }
                              />
                           ))
                        ) : (
                           <p className="no-content-message">
                              No reviews yet.
                           </p>
                        )}
                     </div>
                     {canScroll.reviews.right && (
                        <button
                           className="carousel-arrow right"
                           onClick={() =>
                              scrollContainer(
                                 "reviews",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                  </div>
               </div>
               {/* Restaurant Section */}
               <div
                  className="restaurants"
                  id="restaurants"
               >
                  <div className="activity-header">
                     <h2>My Saved Restaurants</h2>
                  </div>
                  <div className="carousel-container">
                     {canScroll.restaurants.left && (
                        <button
                           className="carousel-arrow left"
                           onClick={() =>
                              scrollContainer(
                                 "restaurants",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                     <div
                        className="restaurant-list"
                        id="restaurants-list"
                        onScroll={() =>
                           checkScroll("restaurants")
                        }
                     >
                        {/* map all the users favorited restaurants */}
                        {restaurants.length > 0 ? (
                           restaurants.map(
                              (restaurant, index) => (
                                 <div
                                    key={
                                       restaurant.id ??
                                       `${restaurant.name ?? "restaurant"}-${index}`
                                    }
                                    onClick={() =>
                                       navigate(
                                          `/restaurants/${restaurant.id}`,
                                       )
                                    }
                                    style={{
                                       cursor: "pointer",
                                    }}
                                 >
                                    <RestaurantCard
                                       restaurant={
                                          restaurant
                                       }
                                       isBookmarked={bookmarkedIds.has(
                                          restaurant.id,
                                       )}
                                       onToggle={() =>
                                          handleBookmarkToggle(
                                             restaurant.id,
                                          )
                                       }
                                       className="compact"
                                    />
                                 </div>
                              ),
                           )
                        ) : (
                           <p className="no-content-message">
                              No saved restaurants yet.
                           </p>
                        )}
                     </div>
                     {canScroll.restaurants.right && (
                        <button
                           className="carousel-arrow right"
                           onClick={() =>
                              scrollContainer(
                                 "restaurants",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                  </div>
               </div>
               {/* Other Accounts Section */}
               <div className="following" id="following">
                  <div className="activity-header">
                     <h2>Following</h2>
                  </div>
                  <div className="carousel-container">
                     {canScroll.following.left && (
                        <button
                           className="carousel-arrow left"
                           onClick={() =>
                              scrollContainer(
                                 "following",
                                 "left",
                              )
                           }
                        >
                           <CaretLeft
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                     <div
                        className="following-list"
                        id="following-list"
                        onScroll={() =>
                           checkScroll("following")
                        }
                     >
                        {/* map all the users followed accounts */}
                        {following.length === 0 ? (
                           <p className="no-content-message">
                              Not following anyone yet.
                           </p>
                        ) : (
                           following.map(
                              (followedUser, index) => (
                                 <FollowedUserCard
                                    key={
                                       followedUser.id ??
                                       `${followedUser.name ?? "user"}-${index}`
                                    }
                                    followedUser={
                                       followedUser
                                    }
                                    isFollowing={followingIds.has(
                                       followedUser.id,
                                    )}
                                    onToggleFollow={() =>
                                       handleFollowToggle(
                                          followedUser.id,
                                       )
                                    }
                                 />
                              ),
                           )
                        )}
                     </div>
                     {canScroll.following.right && (
                        <button
                           className="carousel-arrow right"
                           onClick={() =>
                              scrollContainer(
                                 "following",
                                 "right",
                              )
                           }
                        >
                           <CaretRight
                              size={24}
                              weight="bold"
                           />
                        </button>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default User;
