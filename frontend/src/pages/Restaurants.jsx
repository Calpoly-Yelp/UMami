import {
   useState,
   useEffect,
   useMemo,
   useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard.jsx";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal.jsx";
import { uploadProfilePhoto } from "../lib/uploadPhoto";
import "./Restaurants.css";

function Restaurants({ restaurants: initialRestaurants }) {
   // Search query entered by the user
   const [query, setQuery] = useState("");

   // Filter option: "all", "bookmarked", or "open_now"
   const [filter, setFilter] = useState("all");

   // Sort option: "default", "lowest_rating", or "highest_rating"
   const [sort, setSort] = useState("default");

   // Full list of restaurants fetched from the backend
   const [restaurants, setRestaurants] = useState(
      initialRestaurants || [],
   );

   // Set of restaurant IDs that the current user has bookmarked
   const [bookmarkedIds, setBookmarkedIds] = useState(
      new Set(),
   );

   // The current logged-in user's ID (from Supabase auth)
   const [userId, setUserId] = useState(null);

   // Loading state while fetching data
   const [loading, setLoading] = useState(
      !initialRestaurants,
   );

   // Error message to display if something goes wrong
   const [error, setError] = useState("");

   // Controls whether the "Add Profile Photo" modal is visible
   const [showPhotoPrompt, setShowPhotoPrompt] =
      useState(false);

   // Tracks whether a profile photo upload is in progress
   const [uploadingPhoto, setUploadingPhoto] =
      useState(false);

   // Ref to the hidden file input for profile photo selection
   const fileInputRef = useRef(null);

   const navigate = useNavigate();

   // Fetch restaurants, user session, and bookmarks on mount
   useEffect(() => {
      const loadData = async () => {
         try {
            setLoading(true);
            setError("");

            // Get the currently logged-in user from Supabase
            const {
               data: { user },
               error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
               throw userError;
            }

            setUserId(user?.id || null);

            // If the user is logged in, check if they have a real
            // profile photo. ui-avatars.com is the auto-generated
            // placeholder assigned at sign up — treat it as no photo.
            if (user?.id) {
               try {
                  const userRes = await fetch(
                     `https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net/api/users/${user.id}`,
                  );
                  const userData = await userRes.json();

                  const isDefaultAvatar =
                     !userData.avatar_url ||
                     userData.avatar_url.trim() === "" ||
                     userData.avatar_url.includes(
                        "ui-avatars.com",
                     );

                  if (isDefaultAvatar) {
                     setShowPhotoPrompt(true);
                  }
               } catch {
                  // If the backend fetch fails, fall back to localStorage
                  const stored =
                     localStorage.getItem("user");
                  const storedUser = stored
                     ? JSON.parse(stored)
                     : null;

                  const isDefaultAvatar =
                     !storedUser?.avatar_url ||
                     storedUser.avatar_url.trim() === "" ||
                     storedUser.avatar_url.includes(
                        "ui-avatars.com",
                     );

                  if (isDefaultAvatar) {
                     setShowPhotoPrompt(true);
                  }
               }
            }

            let mappedRestaurants =
               initialRestaurants || [];

            // Only fetch from backend if no restaurants were passed in as props
            if (!initialRestaurants) {
               const restaurantsResponse = await fetch(
                  "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net/api/restaurants",
               );

               if (!restaurantsResponse.ok) {
                  let message =
                     "Failed to fetch restaurants";
                  try {
                     const err =
                        await restaurantsResponse.json();
                     message = err.error || message;
                  } catch {
                     // ignore JSON parse errors
                  }
                  throw new Error(message);
               }

               const restaurantsData =
                  await restaurantsResponse.json();

               // Map backend data to the shape the UI expects
               mappedRestaurants = restaurantsData.map(
                  (r) => ({
                     id: r.id,
                     name: r.name || "Unnamed Restaurant",
                     image:
                        r.image_urls?.[0] ||
                        "https://placehold.co/300x200/003831/FFFFFF?text=Restaurant",
                     avg_rating: r.avg_rating ?? 0,
                     location: Array.isArray(r.location)
                        ? r.location.join(", ")
                        : r.location || "",
                     tags: r.tags || [],
                     hours: r.hours || [],
                     rating_count: r.rating_count ?? 0,
                     rating_sum: r.rating_sum ?? 0,
                     is_open_now: r.is_open_now ?? false,
                  }),
               );

               setRestaurants(mappedRestaurants);
            }

            // If a user is logged in, fetch their bookmarked restaurants
            if (user) {
               const {
                  data: bookmarkRows,
                  error: bookmarkError,
               } = await supabase
                  .from("bookmarks")
                  .select("restaurant_id")
                  .eq("user_id", user.id);

               if (bookmarkError) {
                  throw bookmarkError;
               }

               const ids = new Set(
                  (bookmarkRows || []).map(
                     (row) => row.restaurant_id,
                  ),
               );

               setBookmarkedIds(ids);
            } else {
               // No user logged in — clear bookmarks
               setBookmarkedIds(new Set());
            }
         } catch (err) {
            console.error("Error loading data:", err);
            setError(
               err.message || "Failed to load restaurants.",
            );
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [initialRestaurants]);

   // Handles uploading a profile photo from the modal prompt
   const handleProfilePhotoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      setUploadingPhoto(true);
      try {
         // Upload file to Supabase storage and get the public URL
         const url = await uploadProfilePhoto(file);

         // Save the new avatar URL to the user's record in the database
         await fetch(
            `https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net/api/users/${userId}`,
            {
               method: "PATCH",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ avatar_url: url }),
            },
         );

         // Also update localStorage so the avatar persists across pages
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

         // Close the modal on success
         setShowPhotoPrompt(false);

         // Notify the Header to update the avatar instantly without a page refresh
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
         // Reset the file input so the same file can be re-selected if needed
         if (fileInputRef.current)
            fileInputRef.current.value = "";
      }
   };

   // Toggles a restaurant bookmark on or off for the current user
   const handleBookmarkToggle = async (restaurantId) => {
      if (!userId) {
         setError("You must be signed in to bookmark.");
         return;
      }

      const wasBookmarked = bookmarkedIds.has(restaurantId);

      // Optimistically update the UI before the API call completes
      setBookmarkedIds((prev) => {
         const next = new Set(prev);
         if (next.has(restaurantId)) {
            next.delete(restaurantId);
         } else {
            next.add(restaurantId);
         }
         return next;
      });

      try {
         if (wasBookmarked) {
            // Remove the bookmark from Supabase
            const { error } = await supabase
               .from("bookmarks")
               .delete()
               .eq("user_id", userId)
               .eq("restaurant_id", restaurantId);

            if (error) throw error;
         } else {
            // Add a new bookmark to Supabase
            const { error } = await supabase
               .from("bookmarks")
               .insert({
                  user_id: userId,
                  restaurant_id: restaurantId,
               });

            if (error) throw error;
         }
      } catch (err) {
         console.error("Error updating bookmark:", err);

         // Revert the optimistic update if the API call failed
         setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (wasBookmarked) {
               next.add(restaurantId);
            } else {
               next.delete(restaurantId);
            }
            return next;
         });

         setError(
            err.message || "Failed to update bookmark.",
         );
      }
   };

   // Navigates to the individual restaurant page when a card is clicked
   const handleCardClick = (restaurant) => {
      navigate(`/restaurants/${restaurant.id}`);
   };

   // Filters and sorts the restaurant list based on search query,
   // active filter, and sort selection — recomputed only when dependencies change
   const visibleRestaurants = useMemo(() => {
      const lowerQuery = query.toLowerCase();

      let filtered = restaurants.filter((restaurant) => {
         const nameMatch = restaurant.name
            ?.toLowerCase()
            .includes(lowerQuery);

         const locationText = Array.isArray(
            restaurant.location,
         )
            ? restaurant.location.join(", ")
            : restaurant.location || "";

         const locationMatch = locationText
            .toLowerCase()
            .includes(lowerQuery);

         const tagsMatch = (restaurant.tags || []).some(
            (tag) =>
               tag?.toLowerCase().includes(lowerQuery),
         );

         return nameMatch || locationMatch || tagsMatch;
      });

      // Filter to only bookmarked restaurants
      if (filter === "bookmarked") {
         filtered = filtered.filter((restaurant) =>
            bookmarkedIds.has(restaurant.id),
         );
      }

      // Filter to only currently open restaurants
      if (filter === "open_now") {
         filtered = filtered.filter(
            (restaurant) => restaurant.is_open_now,
         );
      }

      // Sort by lowest rating first
      if (sort === "lowest_rating") {
         filtered = [...filtered].sort(
            (a, b) =>
               (a.avg_rating ?? 0) - (b.avg_rating ?? 0),
         );
      }

      // Sort by highest rating first
      if (sort === "highest_rating") {
         filtered = [...filtered].sort(
            (a, b) =>
               (b.avg_rating ?? 0) - (a.avg_rating ?? 0),
         );
      }

      return filtered;
   }, [restaurants, bookmarkedIds, query, filter, sort]);

   return (
      <div className="restaurants-page">
         {/* Profile photo prompt modal — shown on login if user has no real avatar */}
         <Modal
            open={showPhotoPrompt}
            onClose={() => setShowPhotoPrompt(false)}
            title="Add a Profile Photo"
         >
            <div
               style={{
                  textAlign: "center",
                  padding: "16px 0",
               }}
            >
               <p
                  style={{
                     marginBottom: "20px",
                     color: "#555",
                  }}
               >
                  Welcome! Add a profile photo so others can
                  recognize you.
               </p>
               {/* Hidden file input triggered by the button below */}
               <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleProfilePhotoUpload}
               />
               {/* Opens the file picker */}
               <button
                  onClick={() =>
                     fileInputRef.current?.click()
                  }
                  disabled={uploadingPhoto}
                  style={{
                     backgroundColor: "#154734",
                     color: "#fff",
                     border: "none",
                     borderRadius: "30px",
                     padding: "12px 28px",
                     fontSize: "16px",
                     cursor: uploadingPhoto
                        ? "wait"
                        : "pointer",
                  }}
               >
                  {uploadingPhoto
                     ? "Uploading..."
                     : "Choose Photo"}
               </button>
               {/* Allows the user to dismiss the modal without uploading */}
               <button
                  onClick={() => setShowPhotoPrompt(false)}
                  style={{
                     backgroundColor: "transparent",
                     border: "none",
                     color: "#888",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "block",
                     margin: "12px auto 0",
                  }}
               >
                  Skip for now
               </button>
            </div>
         </Modal>

         <div className="restaurants-content">
            <h1 className="restaurants-title">
               All Restaurants
            </h1>

            {/* Search bar and filter/sort controls */}
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
                  {/* Filter dropdown */}
                  <div className="pill">
                     <span className="pill-label">
                        filter
                     </span>
                     <select
                        className="pill-select"
                        value={filter}
                        onChange={(e) =>
                           setFilter(e.target.value)
                        }
                     >
                        <option value="all">all</option>
                        <option value="bookmarked">
                           bookmarked
                        </option>
                        <option value="open_now">
                           open now
                        </option>
                     </select>
                  </div>

                  {/* Sort dropdown */}
                  <div className="pill">
                     <span className="pill-label">
                        sort
                     </span>
                     <select
                        className="pill-select"
                        value={sort}
                        onChange={(e) =>
                           setSort(e.target.value)
                        }
                     >
                        <option value="default">
                           default
                        </option>
                        <option value="lowest_rating">
                           lowest to highest rating
                        </option>
                        <option value="highest_rating">
                           highest to lowest rating
                        </option>
                     </select>
                  </div>
               </div>
            </div>

            {/* Status messages */}
            {loading && <p>Loading restaurants...</p>}
            {!loading && error && <p>{error}</p>}
            {!loading &&
               !error &&
               visibleRestaurants.length === 0 && (
                  <p>No restaurants found.</p>
               )}

            {/* Restaurant card grid */}
            <div className="restaurants-grid">
               {visibleRestaurants.map(
                  (restaurant, index) => (
                     <div
                        key={
                           restaurant.id ??
                           `${restaurant.name ?? "restaurant"}-${index}`
                        }
                        onClick={() =>
                           handleCardClick(restaurant)
                        }
                        style={{ cursor: "pointer" }}
                     >
                        <RestaurantCard
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
                     </div>
                  ),
               )}
            </div>
         </div>
      </div>
   );
}

export default Restaurants;
