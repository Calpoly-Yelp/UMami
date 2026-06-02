import { MdOutlineAccountCircle } from "react-icons/md";
import ReviewCard from "../components/ReviewCard.jsx";
import RestaurantCard from "../components/RestaurantCard.jsx";
import FollowedUserCard from "../components/FollowUserCard.jsx";
import ProfilePhotoPreviewModal from "../components/ProfilePhotoPreviewModal.jsx";
import {
   CaretLeft,
   CaretRight,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserName from "../components/UserName.jsx";
import editIcon from "../assets/editProfileIcon.png";
import addPhotoIcon from "../assets/addPhotoIcon.png";
import { useBookmarks } from "../hooks/useBookmarks";
import {
   uploadProfilePhoto,
   removeProfilePhoto,
} from "../lib/uploadPhoto";
import "./User.css";
import { API_BASE_URL } from "../lib/api";

function User({
   session,
   user: initialUser,
   reviews: initialReviews,
   restaurants: initialRestaurants,
   followedUsers: initialFollowing,
}) {
   const navigate = useNavigate();
   const { userId } = useParams();

   const currentUserId = session?.user?.id;
   const profileUserId = userId || currentUserId;
   const isOwnProfile = !userId || userId === currentUserId;

   const [user, setUser] = useState(
      initialUser || {
         id: "",
         name: "Loading...",
         avatar_url: "",
         is_verified: false,
      },
   );

   const [privacy, setPrivacy] = useState(
      localStorage.getItem("profilePrivacy") || "public",
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
   const {
      bookmarkedIds,
      setBookmarkedIds,
      toggleBookmark,
   } = useBookmarks(
      initialRestaurants?.map((r) => r.id) || [],
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

   const fileInputRef = useRef(null);
   const profilePhotoPreviewUrlRef = useRef("");

   const [uploadingPhoto, setUploadingPhoto] =
      useState(false);
   const [selectedProfilePhoto, setSelectedProfilePhoto] =
      useState(null);
   const [
      profilePhotoPreviewUrl,
      setProfilePhotoPreviewUrl,
   ] = useState("");
   const [isPhotoModalOpen, setIsPhotoModalOpen] =
      useState(false);

   const [canScroll, setCanScroll] = useState({
      reviews: { left: false, right: false },
      restaurants: { left: false, right: false },
      following: { left: false, right: false },
   });

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

   useEffect(() => {
      const frame = requestAnimationFrame(() => {
         checkScroll("reviews");
         checkScroll("restaurants");
         checkScroll("following");
      });

      const handleResize = () => {
         checkScroll("reviews");
         checkScroll("restaurants");
         checkScroll("following");
      };

      window.addEventListener("resize", handleResize);

      return () => {
         cancelAnimationFrame(frame);
         window.removeEventListener("resize", handleResize);
      };
   }, [reviews, restaurants, following]);

   const scrollContainer = (containerId, direction) => {
      const container = document.getElementById(
         `${containerId}-list`,
      );

      if (container) {
         const scrollAmount = 300;
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
      const syncPrivacy = () => {
         setPrivacy(
            localStorage.getItem("profilePrivacy") ||
               "public",
         );
      };

      window.addEventListener(
         "profilePrivacyChanged",
         syncPrivacy,
      );
      window.addEventListener("storage", syncPrivacy);

      syncPrivacy();

      return () => {
         window.removeEventListener(
            "profilePrivacyChanged",
            syncPrivacy,
         );
         window.removeEventListener("storage", syncPrivacy);
      };
   }, []);

   useEffect(() => {
      bookmarkedIdsRef.current = bookmarkedIds;
   }, [bookmarkedIds]);

   useEffect(() => {
      followingIdsRef.current = followingIds;
   }, [followingIds]);

   useEffect(() => {
      if (
         initialUser ||
         initialReviews ||
         initialRestaurants ||
         initialFollowing
      )
         return;

      const fetchData = async () => {
         try {
            if (!profileUserId) {
               setUser({
                  id: "",
                  name: "Anonymous",
                  avatar_url: "",
                  is_verified: false,
               });
               setReviews([]);
               setRestaurants([]);
               setBookmarkedIds(new Set());
               setFollowing([]);
               setFollowingIds(new Set());
               return;
            }

            const storedUserRaw =
               localStorage.getItem("user");
            const storedUser = storedUserRaw
               ? JSON.parse(storedUserRaw)
               : null;

            let profileUser = {
               id: profileUserId,
               name: isOwnProfile
                  ? storedUser?.name ||
                    session?.user?.user_metadata?.name ||
                    "Anonymous"
                  : "Anonymous",
               avatar_url: isOwnProfile
                  ? storedUser?.avatar_url ||
                    session?.user?.user_metadata
                       ?.avatar_url ||
                    ""
                  : "",
               is_verified: isOwnProfile
                  ? storedUser?.is_verified || false
                  : false,
            };

            try {
               const userResponse = await fetch(
                  `${API_BASE_URL}/api/users/${profileUserId}`,
               );

               if (userResponse.ok) {
                  const userData =
                     await userResponse.json();

                  profileUser = {
                     id: userData.id || profileUserId,
                     name:
                        userData.name ||
                        userData.username ||
                        "Anonymous",
                     avatar_url: userData.avatar_url || "",
                     is_verified:
                        userData.is_verified || false,
                  };
               }
            } catch (error) {
               console.error(
                  "Failed to fetch profile user:",
                  error,
               );
            }

            setUser(profileUser);

            const [
               reviewsResponse,
               bookmarksResponse,
               followingResponse,
            ] = await Promise.all([
               fetch(
                  `${API_BASE_URL}/api/reviews?user_id=${profileUser.id}`,
               ),
               fetch(
                  `${API_BASE_URL}/api/restaurants/bookmarks/${profileUser.id}`,
               ),
               fetch(
                  `${API_BASE_URL}/api/users/${profileUser.id}/follows`,
               ),
            ]);

            if (reviewsResponse.ok) {
               const reviewsData =
                  await reviewsResponse.json();

               const userReviews = reviewsData
                  .map((review) => ({
                     id: review.id,
                     user_id: profileUserId,
                     avatar_url:
                        profileUser.avatar_url || "",
                     userName:
                        profileUser.name || "Anonymous",
                     is_verified:
                        profileUser.is_verified || false,
                     rating: review.rating,
                     date: review.created_at,
                     comments: review.comment || "",
                     tags: review.tags || [],
                     photos: review.photo_urls || [],
                     restaurant_id:
                        review.restaurant_id || "",
                     restaurant_name:
                        review.restaurant_name || "",
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
               setReviews([]);
            }

            if (bookmarksResponse.ok) {
               const restaurantsData =
                  await bookmarksResponse.json();

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

               setRestaurants(mappedRestaurants);

               const ids = new Set(
                  mappedRestaurants.map((r) => r.id),
               );

               setBookmarkedIds(ids);
               originalBookmarkedIdsRef.current = new Set(
                  ids,
               );
            } else {
               setRestaurants([]);
               setBookmarkedIds(new Set());
            }

            if (followingResponse.ok) {
               const followingData =
                  await followingResponse.json();

               setFollowing(followingData);

               const ids = new Set(
                  followingData.map((f) => f.id),
               );

               setFollowingIds(ids);
               originalFollowingIdsRef.current = new Set(
                  ids,
               );
            } else {
               setFollowing([]);
               setFollowingIds(new Set());
            }
         } catch (error) {
            console.error("Error loading data:", error);
         }
      };

      fetchData();
   }, [
      session,
      profileUserId,
      isOwnProfile,
      initialUser,
      initialReviews,
      initialRestaurants,
      initialFollowing,
      setBookmarkedIds,
   ]);

   useEffect(() => {
      const syncBookmarks = () => {
         if (!isOwnProfile) return;

         const original = originalBookmarkedIdsRef.current;
         const current = bookmarkedIdsRef.current;
         const userIdToSync = user.id;

         if (!userIdToSync) return;

         const added = [...current].filter(
            (id) => !original.has(id),
         );
         const removed = [...original].filter(
            (id) => !current.has(id),
         );

         if (added.length === 0 && removed.length === 0)
            return;

         fetch(
            `${API_BASE_URL}/api/restaurants/bookmarks/sync`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  user_id: userIdToSync,
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
   }, [user.id, isOwnProfile]);

   useEffect(() => {
      const syncFollowing = () => {
         if (!isOwnProfile) return;

         const original = originalFollowingIdsRef.current;
         const current = followingIdsRef.current;
         const userIdToSync = user.id;

         if (!userIdToSync) return;

         const added = [...current].filter(
            (id) => !original.has(id),
         );
         const removed = [...original].filter(
            (id) => !current.has(id),
         );

         if (added.length === 0 && removed.length === 0)
            return;

         fetch(`${API_BASE_URL}/api/users/follows/sync`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               follower_id: userIdToSync,
               added,
               removed,
            }),
            keepalive: true,
         });
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
   }, [user.id, isOwnProfile]);

   const handleBookmarkToggle = (restaurantId) => {
      toggleBookmark(user.id, restaurantId, true);
   };

   const handleFollowToggle = (followedUserId) => {
      if (!isOwnProfile) return;

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

   const handleDeleteReview = async (reviewId) => {
      if (!isOwnProfile) return;

      try {
         const response = await fetch(
            `${API_BASE_URL}/api/reviews/${reviewId}`,
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

   useEffect(() => {
      return () => {
         if (profilePhotoPreviewUrlRef.current) {
            URL.revokeObjectURL(
               profilePhotoPreviewUrlRef.current,
            );
         }
      };
   }, []);

   const resetSelectedProfilePhoto = () => {
      if (profilePhotoPreviewUrlRef.current) {
         URL.revokeObjectURL(
            profilePhotoPreviewUrlRef.current,
         );
         profilePhotoPreviewUrlRef.current = "";
      }

      setSelectedProfilePhoto(null);
      setProfilePhotoPreviewUrl("");
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
      setIsPhotoModalOpen(false);
   };

   const handleAddPhoto = (e) => {
      if (!isOwnProfile) return;

      const file = e.target.files?.[0];
      if (!file || !user.id) return;

      if (profilePhotoPreviewUrlRef.current) {
         URL.revokeObjectURL(
            profilePhotoPreviewUrlRef.current,
         );
      }

      const objectUrl = URL.createObjectURL(file);
      profilePhotoPreviewUrlRef.current = objectUrl;

      setSelectedProfilePhoto(file);
      setProfilePhotoPreviewUrl(objectUrl);
      setIsPhotoModalOpen(true);
   };

   const handleChooseDifferentPhoto = () => {
      resetSelectedProfilePhoto();
      fileInputRef.current?.click();
   };

   const handleSubmitProfilePhoto = async () => {
      if (
         !isOwnProfile ||
         !selectedProfilePhoto ||
         !user.id
      ) {
         return;
      }

      setUploadingPhoto(true);

      try {
         const url = await uploadProfilePhoto(
            selectedProfilePhoto,
            user.id,
         );

         await fetch(
            `${API_BASE_URL}/api/users/${user.id}`,
            {
               method: "PATCH",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ avatar_url: url }),
            },
         );

         setUser((prev) => ({ ...prev, avatar_url: url }));

         setReviews((prev) =>
            prev.map((r) => ({ ...r, avatar_url: url })),
         );

         const stored = localStorage.getItem("user");

         if (stored) {
            const parsed = JSON.parse(stored);

            localStorage.setItem(
               "user",
               JSON.stringify({
                  ...parsed,
                  avatar_url: url,
               }),
            );
         }

         window.dispatchEvent(
            new CustomEvent("avatar-updated", {
               detail: { avatar_url: url },
            }),
         );
      } catch (err) {
         console.error(
            "Failed to upload profile photo:",
            err,
         );
      } finally {
         setUploadingPhoto(false);
         resetSelectedProfilePhoto();
      }
   };

   const handleRemovePhoto = async () => {
      if (!isOwnProfile || !user.id) return;

      setUploadingPhoto(true);
      try {
         const defaultAvatar = await removeProfilePhoto(
            user.id,
         );

         await fetch(
            `${API_BASE_URL}/api/users/${user.id}`,
            {
               method: "PATCH",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  avatar_url: defaultAvatar,
               }),
            },
         );

         setUser((prev) => ({
            ...prev,
            avatar_url: defaultAvatar,
         }));

         setReviews((prev) =>
            prev.map((r) => ({
               ...r,
               avatar_url: defaultAvatar,
            })),
         );

         const stored = localStorage.getItem("user");

         if (stored) {
            const parsed = JSON.parse(stored);

            localStorage.setItem(
               "user",
               JSON.stringify({
                  ...parsed,
                  avatar_url: defaultAvatar,
               }),
            );
         }

         window.dispatchEvent(
            new CustomEvent("avatar-updated", {
               detail: { avatar_url: defaultAvatar },
            }),
         );
      } catch (err) {
         console.error(
            "Failed to remove profile photo:",
            err,
         );
      } finally {
         setUploadingPhoto(false);
         resetSelectedProfilePhoto();
      }
   };

   return (
      <div className="user-page">
         <ProfilePhotoPreviewModal
            open={
               isPhotoModalOpen ||
               Boolean(selectedProfilePhoto)
            }
            previewUrl={
               profilePhotoPreviewUrl ||
               (user.avatar_url &&
               !user.avatar_url.includes("ui-avatars.com")
                  ? user.avatar_url
                  : "")
            }
            fileName={
               selectedProfilePhoto?.name ||
               (user.avatar_url &&
               !user.avatar_url.includes("ui-avatars.com")
                  ? "Current Photo"
                  : "")
            }
            uploading={uploadingPhoto}
            onCancel={resetSelectedProfilePhoto}
            onChooseDifferent={handleChooseDifferentPhoto}
            onSubmit={() => {
               if (selectedProfilePhoto) {
                  handleSubmitProfilePhoto();
               } else {
                  setIsPhotoModalOpen(false);
               }
            }}
            onRemove={handleRemovePhoto}
            showRemove={Boolean(
               user.avatar_url &&
               !user.avatar_url.includes("ui-avatars.com"),
            )}
            hasNewSelection={Boolean(selectedProfilePhoto)}
         />

         <div className="user-content">
            <div className="user-info">
               <div className="user-card">
                  {user.avatar_url ? (
                     <img
                        className="user-profile-picture"
                        src={user.avatar_url}
                        alt={`${user.name}'s profile picture`}
                        onError={() =>
                           setUser((prev) => ({
                              ...prev,
                              avatar_url: "",
                           }))
                        }
                     />
                  ) : (
                     <MdOutlineAccountCircle
                        size={120}
                        color="#8E9089"
                     />
                  )}

                  <UserName
                     name={user.name}
                     is_verified={user.is_verified}
                  />

                  <p className="user-review-count">
                     {reviews.length}{" "}
                     {reviews.length === 1
                        ? "review"
                        : "reviews"}
                  </p>

                  {isOwnProfile && (
                     <p className="user-privacy">
                        {privacy === "private"
                           ? "Private"
                           : "Public"}
                     </p>
                  )}

                  {isOwnProfile && (
                     <div className="edit-icons">
                        <div
                           className="edit-icon-wrapper"
                           onClick={() => {
                              if (uploadingPhoto) return;
                              if (
                                 user.avatar_url &&
                                 !user.avatar_url.includes(
                                    "ui-avatars.com",
                                 )
                              ) {
                                 setIsPhotoModalOpen(true);
                              } else {
                                 fileInputRef.current?.click();
                              }
                           }}
                           style={{
                              cursor: uploadingPhoto
                                 ? "wait"
                                 : "pointer",
                           }}
                        >
                           <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={handleAddPhoto}
                           />

                           <img
                              src={addPhotoIcon}
                              alt={
                                 user.avatar_url &&
                                 !user.avatar_url.includes(
                                    "ui-avatars.com",
                                 )
                                    ? "Edit Photo"
                                    : "Add Photo"
                              }
                           />

                           <span>
                              {uploadingPhoto
                                 ? "Uploading..."
                                 : user.avatar_url &&
                                     !user.avatar_url.includes(
                                        "ui-avatars.com",
                                     )
                                   ? "Edit Photo"
                                   : "Add Photo"}
                           </span>
                        </div>

                        <div
                           className="edit-icon-wrapper"
                           onClick={() =>
                              navigate("/settings")
                           }
                           style={{ cursor: "pointer" }}
                        >
                           <img src={editIcon} alt="Edit" />
                           <span>Edit Profile</span>
                        </div>
                     </div>
                  )}
               </div>

               <div className="navigation-links">
                  <a
                     href="#reviews"
                     onClick={(e) =>
                        handleNavClick(e, "reviews")
                     }
                  >
                     {isOwnProfile
                        ? "My Reviews"
                        : "Reviews"}
                  </a>

                  <a
                     href="#restaurants"
                     onClick={(e) =>
                        handleNavClick(e, "restaurants")
                     }
                  >
                     {isOwnProfile
                        ? "My Saved Restaurants"
                        : "Saved Restaurants"}
                  </a>

                  <a
                     href="#following"
                     onClick={(e) =>
                        handleNavClick(e, "following")
                     }
                  >
                     Following
                  </a>
               </div>
            </div>

            <div className="user-activity">
               <div className="reviews" id="reviews">
                  <div className="activity-header">
                     <h2>
                        {isOwnProfile
                           ? "My Reviews"
                           : `${user.name}'s Reviews`}
                     </h2>
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
                        {reviews.length > 0 ? (
                           reviews.map((review, index) => (
                              <ReviewCard
                                 key={
                                    review.id ??
                                    `${review.date ?? "review"}-${index}`
                                 }
                                 review={review}
                                 currentUserId={
                                    isOwnProfile
                                       ? user.id
                                       : null
                                 }
                                 onDelete={
                                    isOwnProfile
                                       ? handleDeleteReview
                                       : undefined
                                 }
                                 disableProfileClick={true}
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

               <div
                  className="restaurants"
                  id="restaurants"
               >
                  <div className="activity-header">
                     <h2>
                        {isOwnProfile
                           ? "My Saved Restaurants"
                           : `${user.name}'s Saved Restaurants`}
                     </h2>
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
                                       onToggle={
                                          isOwnProfile
                                             ? () =>
                                                  handleBookmarkToggle(
                                                     restaurant.id,
                                                  )
                                             : undefined
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
                        {following.length === 0 ? (
                           <p className="no-content-message">
                              Not following anyone yet.
                           </p>
                        ) : (
                           following.map(
                              (followedUser, index) => (
                                 <div
                                    key={
                                       followedUser.id ??
                                       `${followedUser.name ?? "user"}-${index}`
                                    }
                                 >
                                    <FollowedUserCard
                                       followedUser={
                                          followedUser
                                       }
                                       isFollowing={followingIds.has(
                                          followedUser.id,
                                       )}
                                       onToggleFollow={
                                          isOwnProfile
                                             ? () =>
                                                  handleFollowToggle(
                                                     followedUser.id,
                                                  )
                                             : undefined
                                       }
                                    />
                                 </div>
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
