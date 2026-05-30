import {
   useMemo,
   useState,
   useEffect,
   useCallback,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../components/Map";
import ReviewCard from "../components/ReviewCard";
import Modal from "../components/Modal";
import WriteReview from "../components/WriteReview";
import "./RestaurantInfo.css";
import { supabase } from "../lib/supabase";
import {
   Camera,
   PencilSimple,
   Bookmark,
   Eye,
   Clock,
   CaretLeft,
   CaretRight,
} from "@phosphor-icons/react";
import { useBookmarks } from "../hooks/useBookmarks";
import { API_BASE_URL } from "../lib/api";

// Helper to get Menu Item Photos
const getMenuItemPhotos = (reviews) =>
   reviews.flatMap((review) =>
      (review.photos || []).filter(
         (photo) =>
            photo?.url &&
            photo?.type?.toLowerCase() === "menu item",
      ),
   );

export default function Review() {
   const navigate = useNavigate();
   // Get the restaurant id from the URL e.g. /restaurants/5
   const { id } = useParams();
   const [activeTab, setActiveTab] = useState("menu");
   const [restaurantInfo, setRestaurantInfo] =
      useState(null);
   const [ratingFilter, setRatingFilter] = useState(null);
   const [isWriteReviewOpen, setIsWriteReviewOpen] =
      useState(false);
   const [sortOption, setSortOption] =
      useState("date-desc");
   const [filterHasPhotos, setFilterHasPhotos] =
      useState(false);
   const [isFilterMenuOpen, setIsFilterMenuOpen] =
      useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [canScrollMenu, setCanScrollMenu] = useState({
      left: false,
      right: false,
   });
   const {
      bookmarkedIds,
      setBookmarkedIds,
      toggleBookmark,
   } = useBookmarks();
   const isBookmarked = bookmarkedIds.has(parseInt(id, 10));

   // Retrieve the actual logged-in user from localStorage
   const [currentUser] = useState(() => {
      try {
         const userStr = localStorage.getItem("user");
         return userStr ? JSON.parse(userStr) : null;
      } catch (err) {
         console.error(
            "Failed to parse user from local storage:",
            err,
         );
         return null;
      }
   });
   const CURRENT_USER_ID = currentUser?.id;

   // Build a clean restaurant object from the raw API data
   const restaurant = useMemo(() => {
      // Converts "13:00" → "1pm", "13:30" → "1:30pm"
      const formatTime = (timeStr) => {
         if (!timeStr) return "";
         const [hourStr, minuteStr] = timeStr.split(":");
         const hour = parseInt(hourStr, 10);
         const ampm = hour >= 12 ? "pm" : "am";
         const formattedHour = hour % 12 || 12;
         const formattedMinute =
            minuteStr === "00" ? "" : `:${minuteStr}`;
         return `${formattedHour}${formattedMinute}${ampm}`;
      };

      const daysOfWeek = [
         "Monday",
         "Tuesday",
         "Wednesday",
         "Thursday",
         "Friday",
         "Saturday",
         "Sunday",
      ];
      const currentDayIdx = (new Date().getDay() + 6) % 7; // JS getDay() returns 0 for Sunday, map it to 6

      const formattedHours = daysOfWeek.map((day, idx) => {
         let intervals = [];

         if (restaurantInfo?.location_mapping?.schedule) {
            const daySchedule =
               restaurantInfo.location_mapping.schedule[
                  idx
               ] || [];
            intervals = daySchedule.map((s) => ({
               open: s.start,
               close: s.end,
               subName: s.subName,
            }));
         } else if (restaurantInfo?.hours?.length === 42) {
            for (let i = 0; i < 3; i++) {
               const openTime =
                  restaurantInfo.hours[idx * 6 + i * 2];
               const closeTime =
                  restaurantInfo.hours[idx * 6 + i * 2 + 1];
               if (openTime && closeTime) {
                  intervals.push({
                     open: openTime,
                     close: closeTime,
                  });
               }
            }
         } else if (restaurantInfo?.hours?.length === 14) {
            const openTime = restaurantInfo.hours[idx * 2];
            const closeTime =
               restaurantInfo.hours[idx * 2 + 1];
            if (openTime && closeTime) {
               intervals.push({
                  open: openTime,
                  close: closeTime,
               });
            }
         } else if (restaurantInfo?.hours?.length === 2) {
            // Fallback for outdated db rows
            const openTime = restaurantInfo.hours[0];
            const closeTime = restaurantInfo.hours[1];
            if (openTime && closeTime) {
               intervals.push({
                  open: openTime,
                  close: closeTime,
               });
            }
         }

         // Defensively merge any overlapping intervals (e.g. from BBQ joining Market)
         intervals.sort((a, b) =>
            a.open.localeCompare(b.open),
         );
         const mergedIntervals = [];
         for (const interval of intervals) {
            if (mergedIntervals.length === 0) {
               mergedIntervals.push({
                  ...interval,
                  subNames: new Set([
                     interval.subName || "Default",
                  ]),
               });
            } else {
               const last =
                  mergedIntervals[
                     mergedIntervals.length - 1
                  ];
               const lastCrossesMidnight =
                  last.close < last.open;
               const intCrossesMidnight =
                  interval.close < interval.open;

               if (
                  lastCrossesMidnight ||
                  interval.open <= last.close
               ) {
                  if (
                     intCrossesMidnight &&
                     !lastCrossesMidnight
                  ) {
                     last.close = interval.close;
                  } else if (
                     !lastCrossesMidnight &&
                     !intCrossesMidnight &&
                     interval.close > last.close
                  ) {
                     last.close = interval.close;
                  } else if (
                     lastCrossesMidnight &&
                     intCrossesMidnight &&
                     interval.close > last.close
                  ) {
                     last.close = interval.close;
                  }
                  if (interval.subName) {
                     last.subNames.add(interval.subName);
                  }
               } else {
                  mergedIntervals.push({
                     ...interval,
                     subNames: new Set([
                        interval.subName || "Default",
                     ]),
                  });
               }
            }
         }
         intervals = mergedIntervals;

         let formattedIntervals = [];

         if (
            restaurantInfo &&
            (!restaurantInfo.hours ||
               restaurantInfo.hours.length === 0)
         ) {
            formattedIntervals = [
               {
                  time: "Hours unavailable",
                  isOpen: false,
                  isClosed: false,
                  isCurrentDay: false,
               },
            ];
         } else if (intervals.length > 0) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}:00`;

            let anyOpen = false;
            let nextUpIdx = -1;

            if (idx === currentDayIdx) {
               intervals.forEach((i, j) => {
                  let isOpen = false;
                  if (i.close < i.open) {
                     if (
                        currentTimeStr >= i.open ||
                        currentTimeStr <= i.close
                     )
                        isOpen = true;
                  } else {
                     if (
                        currentTimeStr >= i.open &&
                        currentTimeStr <= i.close
                     )
                        isOpen = true;
                  }
                  i.isOpenNow = isOpen;
                  if (isOpen) anyOpen = true;

                  if (
                     !isOpen &&
                     nextUpIdx === -1 &&
                     currentTimeStr < i.open
                  ) {
                     nextUpIdx = j;
                  }
               });

               if (
                  !anyOpen &&
                  nextUpIdx === -1 &&
                  intervals.length > 0
               ) {
                  nextUpIdx = intervals.length - 1; // Fallback to the last interval if all have passed
               }
            }

            formattedIntervals = intervals.map((i, j) => {
               const subNamesList = Array.from(
                  i.subNames || [],
               ).filter((name) => name !== "Default");
               return {
                  time: `${formatTime(i.open)} - ${formatTime(i.close)}`,
                  subName:
                     subNamesList.length > 0
                        ? subNamesList.join(", ")
                        : null,
                  isOpen: i.isOpenNow || false,
                  isClosed:
                     idx === currentDayIdx &&
                     !anyOpen &&
                     j === nextUpIdx,
                  isCurrentDay: idx === currentDayIdx,
               };
            });
         } else if (restaurantInfo?.hours) {
            formattedIntervals = [
               {
                  time: "Closed",
                  subName: null,
                  isOpen: false,
                  isClosed: idx === currentDayIdx,
                  isCurrentDay: idx === currentDayIdx,
               },
            ];
         } else {
            formattedIntervals = [
               {
                  time: "Loading...",
                  subName: null,
                  isOpen: false,
                  isClosed: false,
                  isCurrentDay: false,
               },
            ];
         }

         return {
            day,
            intervals: formattedIntervals,
         };
      });

      let displayLat = restaurantInfo?.lat || 35.2828;
      let displayLng = restaurantInfo?.lng || -120.6596;
      let displayLocationLabel =
         restaurantInfo?.location || "Loading...";
      let mapMarkers = [];

      // Determine dynamic location if multiple sets of coordinates exist based on time (e.g., Lunch vs Dinner)
      if (
         restaurantInfo?.location_mapping?.locations &&
         restaurantInfo?.location_mapping?.schedule
      ) {
         const currentDayIdx =
            (new Date().getDay() + 6) % 7;
         const now = new Date();
         const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

         const todaySchedule =
            restaurantInfo.location_mapping.schedule[
               currentDayIdx
            ] || [];
         let activeSubNames = new Set();

         // 1. Check if currently active in any interval
         for (const interval of todaySchedule) {
            let isActive = false;
            if (interval.end < interval.start) {
               if (
                  currentTimeStr >= interval.start ||
                  currentTimeStr <= interval.end
               )
                  isActive = true;
            } else {
               if (
                  currentTimeStr >= interval.start &&
                  currentTimeStr <= interval.end
               )
                  isActive = true;
            }
            if (isActive)
               activeSubNames.add(interval.subName);
         }

         // 2. If not active, find the next upcoming interval today
         if (activeSubNames.size === 0) {
            const upcoming = todaySchedule.filter(
               (i) => i.start > currentTimeStr,
            );
            if (upcoming.length > 0) {
               const nextStart = upcoming[0].start;
               upcoming
                  .filter((i) => i.start === nextStart)
                  .forEach((i) =>
                     activeSubNames.add(i.subName),
                  );
            }
         }

         // 3. Fallback to the first interval of the day
         if (
            activeSubNames.size === 0 &&
            todaySchedule.length > 0
         ) {
            const firstStart = todaySchedule[0].start;
            todaySchedule
               .filter((i) => i.start === firstStart)
               .forEach((i) =>
                  activeSubNames.add(i.subName),
               );
         }

         // Collect all active locations
         for (const subName of activeSubNames) {
            const locData =
               restaurantInfo.location_mapping.locations[
                  subName
               ];
            if (locData && locData.lat && locData.lng) {
               mapMarkers.push({
                  lat: locData.lat,
                  lng: locData.lng,
                  name:
                     locData.label || restaurantInfo.name,
               });
            }
         }

         // Swap out the primary coordinates for the first active interval (to center the map)
         if (mapMarkers.length > 0) {
            displayLat = mapMarkers[0].lat;
            displayLng = mapMarkers[0].lng;
            displayLocationLabel = mapMarkers
               .map((m) => m.name)
               .join(" / ");
         }
      }

      return {
         name: restaurantInfo?.name || "Loading...",
         banner: restaurantInfo?.image_urls?.[0] || null,
         tags: restaurantInfo?.tags || [],
         rating: restaurantInfo?.avg_rating ?? 0,
         ratingCount: restaurantInfo?.rating_count ?? 0,
         hours: formattedHours,
         locationLabel: displayLocationLabel,
         lat: displayLat,
         lng: displayLng,
         mapMarkers: mapMarkers,
         menuImages: [
            "/gallery/ss_food_1.jpg",
            "/gallery/ss_food_2.jpg",
            "/gallery/ss_food_3.jpg",
            "/gallery/ss_food_4.jpg",
            "/gallery/ss_food_5.jpg",
            "/gallery/ss_ambience_1.jpg",
            "/gallery/ss_ambience_2.jpg",
            "/gallery/ss_ambience_3.jpg",
            "/gallery/ss_ambience_4.jpg",
            "/gallery/ss_ambience_5.jpg",
         ],
      };
   }, [restaurantInfo]);

   const [reviews, setReviews] = useState([]);

   const menuItemPhotos = useMemo(
      () => getMenuItemPhotos(reviews),
      [reviews],
   );

   // Fetches all the individual reviews associated with this restaurant
   const fetchReviews = useCallback(async () => {
      try {
         let url = `${API_BASE_URL}/api/reviews?restaurant_id=${id}`;
         if (CURRENT_USER_ID) {
            url += `&current_user_id=${CURRENT_USER_ID}`;
         }
         const response = await fetch(url);
         if (response.ok) {
            const data = await response.json();

            // Map the backend ReviewModel to the frontend ReviewCard props
            const formattedReviews = data.map((rev) => ({
               id: rev.id,
               user_id: rev.user_id,
               userName:
                  rev.users?.name || "Anonymous User",
               avatar_url: rev.users?.avatar_url || null,
               is_verified: rev.users?.is_verified || false,
               rating: rev.rating || 0,
               date: rev.created_at,
               comments: rev.comment,
               tags: rev.tags || [],
               photos: rev.photo_urls || [],
               helpfulCount: rev.helpful_count || 0,
               hasVotedHelpful:
                  rev.has_voted_helpful || false,
            }));

            setReviews(formattedReviews);
         }
      } catch (error) {
         console.error("Failed to fetch reviews:", error);
      }
   }, [id, CURRENT_USER_ID]);

   // Fetches the restaurant's data
   const fetchRestaurant = useCallback(async () => {
      try {
         const response = await fetch(
            `${API_BASE_URL}/api/restaurants/${id}`,
         );
         if (response.ok) {
            const data = await response.json();
            setRestaurantInfo(data);
         }
      } catch (error) {
         console.error(
            "Failed to fetch restaurant:",
            error,
         );
      }
   }, [id]);

   const fetchBookmarkStatus = useCallback(async () => {
      if (!CURRENT_USER_ID) return;
      try {
         const { data, error } = await supabase
            .from("bookmarks")
            .select("restaurant_id")
            .eq("user_id", CURRENT_USER_ID)
            .eq("restaurant_id", id);

         if (!error && data && data.length > 0) {
            setBookmarkedIds((prev) =>
               new Set(prev).add(parseInt(id, 10)),
            );
         } else {
            setBookmarkedIds((prev) => {
               const next = new Set(prev);
               next.delete(parseInt(id, 10));
               return next;
            });
         }
      } catch (err) {
         console.error(
            "Failed to fetch bookmark status:",
            err,
         );
      }
   }, [id, CURRENT_USER_ID, setBookmarkedIds]);

   const handleBookmarkToggle = async (e) => {
      if (e) e.stopPropagation();
      if (!CURRENT_USER_ID) {
         alert("Please log in to bookmark a restaurant!");
         return;
      }
      const { error } = await toggleBookmark(
         CURRENT_USER_ID,
         id,
      );
      if (error) {
         console.error(error);
      }
   };

   useEffect(() => {
      const loadData = async () => {
         await Promise.all([
            fetchRestaurant(),
            fetchReviews(),
            fetchBookmarkStatus(),
         ]);
      };
      loadData();
   }, [fetchRestaurant, fetchReviews, fetchBookmarkStatus]);

   // Deletes a review from the backend and updates local state
   const handleDeleteReview = async (reviewId) => {
      try {
         const response = await fetch(
            `${API_BASE_URL}/api/reviews/${reviewId}`,
            {
               method: "DELETE",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  user_id: CURRENT_USER_ID,
               }),
            },
         );
         if (response.ok) {
            // Instantly remove it from the UI
            setReviews((prev) =>
               prev.filter((r) => r.id !== reviewId),
            );
            // Refetch the restaurant info to update the aggregate rating counts
            fetchRestaurant();
         } else {
            console.error("Failed to delete review");
         }
      } catch (error) {
         console.error("Error deleting review:", error);
      }
   };

   // Calculates the total count of each star rating (1-5) from the fetched reviews array.
   // This is used to populate the filled percentages on the "Overall Rating" bar chart.
   const computedRatings = useMemo(() => {
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      reviews.forEach((r) => {
         if (typeof r.rating === "number" && r.rating > 0) {
            const roundedRating = Math.max(
               1,
               Math.min(5, Math.round(r.rating)),
            );
            counts[roundedRating] += 1;
         }
      });

      return { counts };
   }, [reviews]);

   // Filter reviews by selected star rating
   // If no filter is selected (null), show all reviews
   const filteredReviews = useMemo(() => {
      let result = reviews;

      if (ratingFilter) {
         result = result.filter((r) => {
            if (
               typeof r.rating !== "number" ||
               r.rating <= 0
            )
               return false;
            const roundedRating = Math.max(
               1,
               Math.min(5, Math.round(r.rating)),
            );
            return roundedRating === ratingFilter;
         });
      }

      if (filterHasPhotos) {
         result = result.filter(
            (r) => r.photos && r.photos.length > 0,
         );
      }

      result = [...result].sort((a, b) => {
         if (sortOption === "date-desc") {
            return (
               (b.date ? new Date(b.date).getTime() : 0) -
               (a.date ? new Date(a.date).getTime() : 0)
            );
         } else if (sortOption === "date-asc") {
            return (
               (a.date ? new Date(a.date).getTime() : 0) -
               (b.date ? new Date(b.date).getTime() : 0)
            );
         } else if (sortOption === "helpful-desc") {
            return (
               (b.helpfulCount || 0) - (a.helpfulCount || 0)
            );
         } else if (sortOption === "helpful-asc") {
            return (
               (a.helpfulCount || 0) - (b.helpfulCount || 0)
            );
         }
         return 0;
      });

      return result;
   }, [reviews, ratingFilter, filterHasPhotos, sortOption]);

   const REVIEWS_PER_PAGE = 10;
   const totalPages = Math.ceil(
      filteredReviews.length / REVIEWS_PER_PAGE,
   );
   const paginatedReviews = useMemo(() => {
      const start = (currentPage - 1) * REVIEWS_PER_PAGE;
      return filteredReviews.slice(
         start,
         start + REVIEWS_PER_PAGE,
      );
   }, [filteredReviews, currentPage]);

   // Generate an array of page numbers with ellipses for truncated pagination
   const paginationRange = useMemo(() => {
      if (totalPages <= 1) return [];
      const delta = 1;
      const range = [];
      for (
         let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++
      ) {
         range.push(i);
      }

      if (currentPage - delta > 3) {
         range.unshift("...");
      } else if (currentPage - delta === 3) {
         range.unshift(2);
      }

      if (currentPage + delta < totalPages - 2) {
         range.push("...");
      } else if (currentPage + delta === totalPages - 2) {
         range.push(totalPages - 1);
      }

      range.unshift(1);
      range.push(totalPages);
      return range;
   }, [totalPages, currentPage]);

   // Smooth scroll to a section and update the active tab
   const scrollTo = (key) => {
      setActiveTab(key);
      const el = document.getElementById(`section-${key}`);
      if (el)
         el.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
   };

   // Scroll through photos

   const checkMenuScroll = useCallback(() => {
      const el = document.getElementById(
         "menu-carousel-list",
      );
      if (!el) return;

      setCanScrollMenu((prev) => {
         const next = {
            left: el.scrollLeft > 0,
            right:
               Math.ceil(el.scrollLeft + el.clientWidth) <
               el.scrollWidth,
         };

         if (
            prev.left === next.left &&
            prev.right === next.right
         ) {
            return prev;
         }

         return next;
      });
   }, []);

   useEffect(() => {
      const frame = requestAnimationFrame(() => {
         checkMenuScroll();
      });

      const handleResize = () => {
         checkMenuScroll();
      };

      window.addEventListener("resize", handleResize);

      return () => {
         cancelAnimationFrame(frame);
         window.removeEventListener("resize", handleResize);
      };
   }, [checkMenuScroll, restaurantInfo]);

   const scrollMenuCarousel = (direction) => {
      const container = document.getElementById(
         "menu-carousel-list",
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

   return (
      <div className="review">
         {/* ── Hero Banner ── */}

         <section
            className="review__hero"
            style={{
               backgroundImage: restaurant.banner
                  ? `url(${restaurant.banner})`
                  : "none",
            }}
            aria-label={`${restaurant.name} hero`}
         >
            <div className="review__heroOverlay" />

            <div className="review__heroContent">
               <button
                  type="button"
                  className="review__backBtn"
                  onClick={() => navigate("/restaurants")}
               >
                  Back to Restaurants
               </button>

               <div className="review__titleRow">
                  <h1 className="review__title">
                     {restaurant.name}
                  </h1>
                  <button
                     className={`review__bookmarkBtn ${isBookmarked ? "is-bookmarked" : ""}`}
                     onClick={handleBookmarkToggle}
                     aria-label={
                        isBookmarked
                           ? `Remove bookmark for ${restaurant.name}`
                           : `Bookmark ${restaurant.name}`
                     }
                     type="button"
                  >
                     <Bookmark
                        weight={
                           isBookmarked ? "fill" : "regular"
                        }
                        size={40}
                     />
                  </button>
               </div>

               <StarRow
                  value={restaurant.rating}
                  className="review__starsLarge"
               />

               <div className="review__chips">
                  {restaurant.tags.slice(0, 3).map((t) => (
                     <span
                        key={t}
                        className="chip chip--light"
                     >
                        {t}
                     </span>
                  ))}
               </div>

               <button
                  className="review__photosBtn"
                  type="button"
                  onClick={() =>
                     navigate(`/restaurants/${id}/gallery`)
                  }
               >
                  <Camera size={16} weight="bold" />
                  <span>view photos</span>
               </button>
            </div>
         </section>

         {/* ── Section Tab Navigation ── */}
         <nav
            className="review__tabs"
            aria-label="Sections"
         >
            <div className="review__tabsInner">
               <button
                  className={`review__tab ${activeTab === "menu" ? "is-active" : ""}`}
                  onClick={() => scrollTo("menu")}
               >
                  Menu
               </button>
               <button
                  className={`review__tab ${activeTab === "info" ? "is-active" : ""}`}
                  onClick={() => scrollTo("info")}
               >
                  Info
               </button>
               <button
                  className={`review__tab ${activeTab === "reviews" ? "is-active" : ""}`}
                  onClick={() => scrollTo("reviews")}
               >
                  Reviews
               </button>
            </div>
         </nav>

         <main className="review__main">
            {/* ── Menu Section ── */}
            <section>
               <div className="review__sectionHeaderRow">
                  <div className="review__actions">
                     {/* Pass restaurant id as query param so WriteReview
                         knows which restaurant this review is for */}
                     <button
                        className="pillBtn"
                        onClick={() => {
                           if (!CURRENT_USER_ID) {
                              alert(
                                 "Please log in to write a review!",
                              );
                              return;
                           }
                           setIsWriteReviewOpen(true);
                        }}
                     >
                        <PencilSimple
                           size={16}
                           weight="bold"
                        />
                        <span>write review</span>
                     </button>
                  </div>
               </div>

               <h2 className="review__h2">Menu</h2>

               <div className="review__carouselContainer">
                  {canScrollMenu.left && (
                     <button
                        className="carousel-arrow left"
                        onClick={() =>
                           scrollMenuCarousel("left")
                        }
                        aria-label="Scroll menu images left"
                     >
                        <CaretLeft
                           size={20}
                           weight="bold"
                        />
                     </button>
                  )}

                  <div
                     className="review__menuRow"
                     id="menu-carousel-list"
                     onScroll={checkMenuScroll}
                  >
                     {menuItemPhotos.map((photo, idx) => (
                        <div
                           key={`${photo.url}-${idx}`}
                           className="review__menuImgWrap"
                        >
                           <img
                              className="review__menuImg"
                              src={photo.url}
                              alt={
                                 photo.item ||
                                 `menu item ${idx + 1}`
                              }
                              loading="lazy"
                           />

                           <div className="review__photoCaption">
                              {photo.item || "Menu Item"}
                           </div>
                        </div>
                     ))}
                  </div>

                  {canScrollMenu.right && (
                     <button
                        className="carousel-arrow right"
                        onClick={() =>
                           scrollMenuCarousel("right")
                        }
                        aria-label="Scroll menu images right"
                     >
                        <CaretRight
                           size={20}
                           weight="bold"
                        />
                     </button>
                  )}
               </div>

               <button
                  className="pillBtn pillBtn--ghost"
                  onClick={() =>
                     navigate(`/restaurants/${id}/menu`)
                  }
               >
                  <Eye size={16} weight="bold" />
                  <span>view menu and nutrition</span>
               </button>
            </section>

            {/* ── Info Section ── */}
            <section id="section-info">
               <h2 className="review__h2">Info</h2>

               <div className="review__infoGrid">
                  {/* Hours */}
                  <div className="review__hours">
                     <div className="review__subHeader">
                        <span className="review__subIcon">
                           <Clock size={18} weight="fill" />
                        </span>
                        <span className="review__subTitle">
                           Hours
                        </span>
                     </div>

                     <div className="review__hoursList">
                        {restaurant.hours.flatMap(
                           (h, dayIndex) =>
                              h.intervals.map(
                                 (interval, i) => (
                                    <div
                                       key={`${h.day}-${i}`}
                                       className="review__hoursRow"
                                       style={{
                                          marginTop:
                                             i === 0 &&
                                             dayIndex > 0
                                                ? "14px"
                                                : undefined,
                                          alignItems:
                                             "baseline",
                                       }}
                                    >
                                       <span
                                          className="review__day"
                                          style={{
                                             visibility:
                                                i > 0
                                                   ? "hidden"
                                                   : "visible",
                                          }}
                                       >
                                          {h.day}
                                       </span>
                                       <span
                                          className="review__open"
                                          style={{
                                             visibility:
                                                interval.isCurrentDay &&
                                                (interval.isOpen ||
                                                   interval.isClosed)
                                                   ? "visible"
                                                   : "hidden",
                                             color: interval.isOpen
                                                ? "var(--umami-green)"
                                                : "var(--orange)",
                                          }}
                                       >
                                          {interval.isOpen
                                             ? "open"
                                             : "closed"}
                                       </span>
                                       <div
                                          className="review__time"
                                          style={{
                                             display:
                                                "flex",
                                             flexDirection:
                                                "column",
                                             alignItems:
                                                "flex-end",
                                          }}
                                       >
                                          <span
                                             style={{
                                                whiteSpace:
                                                   "nowrap",
                                             }}
                                          >
                                             {interval.time}
                                          </span>
                                          {interval.subName && (
                                             <span
                                                style={{
                                                   fontSize:
                                                      "11px",
                                                   fontWeight: 700,
                                                   color: "var(--muted)",
                                                   backgroundColor:
                                                      "rgba(0, 0, 0, 0.05)",
                                                   padding:
                                                      "2px 8px",
                                                   borderRadius:
                                                      "999px",
                                                   marginTop:
                                                      "4px",
                                                }}
                                             >
                                                {
                                                   interval.subName
                                                }
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 ),
                              ),
                        )}
                     </div>
                  </div>

                  {/* Map */}
                  <div
                     className="review__mapBlock"
                     style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        minHeight: "250px",
                     }}
                  >
                     <div
                        style={{
                           flex: 1,
                           position: "relative",
                        }}
                     >
                        <Map
                           lat={restaurant.lat}
                           lng={restaurant.lng}
                           name={restaurant.name}
                        />
                     </div>

                     <div className="review__locationChipRow">
                        <span className="chip chip--outline">
                           {restaurant.locationLabel}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Peak Hours Chart
               <div className="review__peak">
                  <div className="review__subHeader">
                     <span className="review__subIcon">
                        ⌛
                     </span>
                     <span className="review__subTitle">
                        Peak Hours
                     </span>
                  </div>

                  <div className="review__days">
                     {[
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                     ].map((d) => (
                        <button
                           key={d}
                           type="button"
                           className={`dayPill ${d === "Tue" ? "is-active" : ""}`}
                        >
                           {d}
                        </button>
                     ))}
                  </div>

                  <div className="review__chart">
                     {Array.from({ length: 12 }).map(
                        (_, i) => (
                           <div
                              key={i}
                              className={`review__bar ${i === 6 ? "is-peak" : ""}`}
                              style={{
                                 height: `${22 + (i % 5) * 8}px`,
                              }}
                           />
                        ),
                     )}
                     <div className="review__chartAxis">
                        <span>9am</span>
                        <span>12pm</span>
                        <span>3pm</span>
                        <span>6pm</span>
                        <span>9pm</span>
                     </div>
                  </div>
               </div> */}
            </section>

            {/* ── Reviews Section ── */}

            <section
               className="review__reviewsGrid"
               id="section-reviews"
            >
               <div className="card card--section">
                  <div className="review__reviewsHeader">
                     <h2 className="review__h2">Reviews</h2>

                     <div className="review__reviewsControls">
                        {/* Second write review button — also passes restaurant id */}
                        <button
                           className="pillBtn"
                           onClick={() => {
                              if (!CURRENT_USER_ID) {
                                 alert(
                                    "Please log in to write a review!",
                                 );
                                 return;
                              }
                              setIsWriteReviewOpen(true);
                           }}
                        >
                           <PencilSimple
                              size={16}
                              weight="bold"
                           />
                           <span>write review</span>
                        </button>
                        <div
                           style={{ position: "relative" }}
                        >
                           <button
                              className="pillBtn pillBtn--ghost"
                              onClick={() =>
                                 setIsFilterMenuOpen(
                                    (prev) => !prev,
                                 )
                              }
                           >
                              filter ▼
                           </button>
                           {isFilterMenuOpen && (
                              <div className="review__filterDropdown">
                                 <div className="review__filterGroup">
                                    <label>Sort By:</label>
                                    <select
                                       value={sortOption}
                                       onChange={(e) => {
                                          setSortOption(
                                             e.target.value,
                                          );
                                          setCurrentPage(1);
                                       }}
                                    >
                                       <option value="date-desc">
                                          Newest First
                                       </option>
                                       <option value="date-asc">
                                          Oldest First
                                       </option>
                                       <option value="helpful-desc">
                                          Most Helpful
                                       </option>
                                       <option value="helpful-asc">
                                          Least Helpful
                                       </option>
                                    </select>
                                 </div>
                                 <div className="review__filterGroup">
                                    <label
                                       style={{
                                          fontWeight: 600,
                                       }}
                                    >
                                       <input
                                          type="checkbox"
                                          checked={
                                             filterHasPhotos
                                          }
                                          onChange={(e) => {
                                             setFilterHasPhotos(
                                                e.target
                                                   .checked,
                                             );
                                             setCurrentPage(
                                                1,
                                             );
                                          }}
                                       />{" "}
                                       Has Pictures
                                    </label>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="review__reviewList">
                     {paginatedReviews.length > 0 ? (
                        paginatedReviews.map((r) => (
                           <ReviewCard
                              key={r.id}
                              review={r}
                              showHelpful={true}
                              currentUserId={
                                 CURRENT_USER_ID
                              }
                              onDelete={handleDeleteReview}
                           />
                        ))
                     ) : (
                        <div
                           style={{
                              textAlign: "center",
                              padding: "40px 0",
                              color: "var(--muted)",
                           }}
                        >
                           No reviews found for this rating.
                        </div>
                     )}
                  </div>

                  {totalPages > 1 && (
                     <div className="review__pagination">
                        <button
                           className="review__paginationBtn"
                           disabled={currentPage === 1}
                           onClick={() => {
                              setCurrentPage((p) =>
                                 Math.max(1, p - 1),
                              );
                              scrollTo("reviews");
                           }}
                        >
                           ‹
                        </button>
                        {paginationRange.map((page, idx) =>
                           page === "..." ? (
                              <span
                                 key={`dots-${idx}`}
                                 className="review__paginationDots"
                              >
                                 ...
                              </span>
                           ) : (
                              <button
                                 key={page}
                                 className={`review__paginationBtn ${currentPage === page ? "is-active" : ""}`}
                                 onClick={() => {
                                    setCurrentPage(page);
                                    scrollTo("reviews");
                                 }}
                              >
                                 {page}
                              </button>
                           ),
                        )}
                        <button
                           className="review__paginationBtn"
                           disabled={
                              currentPage === totalPages
                           }
                           onClick={() => {
                              setCurrentPage((p) =>
                                 Math.min(
                                    totalPages,
                                    p + 1,
                                 ),
                              );
                              scrollTo("reviews");
                           }}
                        >
                           ›
                        </button>
                     </div>
                  )}
               </div>

               {/* ── Overall Rating Sidebar ── */}
               <aside className="card card--section review__ratingCard">
                  <div className="review__ratingTop">
                     <div className="review__ratingValue">
                        {restaurant.rating.toFixed(1)}
                     </div>
                     <div className="review__ratingLabel">
                        Overall Rating{" "}
                        <span className="review__starSmall">
                           ★
                        </span>
                     </div>
                     <div className="review__ratingCount">
                        {restaurant.ratingCount} reviews
                     </div>
                  </div>

                  {/* Clicking a bar filters reviews to that star rating
                      Clicking it again clears the filter */}
                  <div className="review__bars">
                     {[5, 4, 3, 2, 1].map((s) => (
                        <RatingBar
                           key={s}
                           star={s}
                           count={computedRatings.counts[s]}
                           total={restaurant.ratingCount}
                           isActive={ratingFilter === s}
                           onClick={() => {
                              setRatingFilter((prev) =>
                                 prev === s ? null : s,
                              );
                              setCurrentPage(1);
                           }}
                        />
                     ))}
                  </div>
               </aside>
            </section>
         </main>

         <Modal
            open={isWriteReviewOpen}
            onClose={() => setIsWriteReviewOpen(false)}
            title={`${restaurant.name} Review`}
            disableOverlayClick={true}
            hideCloseButton={true}
         >
            <WriteReview
               onClose={() => setIsWriteReviewOpen(false)}
               restaurantId={parseInt(id, 10)}
               userId={CURRENT_USER_ID}
               onSuccess={(newReview) => {
                  // Optimistically update the restaurant rating & count
                  setRestaurantInfo((prev) => {
                     if (!prev) return prev;
                     const newCount =
                        (prev.rating_count || 0) + 1;
                     const oldAvg = prev.avg_rating || 0;
                     const newAvg =
                        (oldAvg * (prev.rating_count || 0) +
                           (newReview?.rating || 0)) /
                        newCount;
                     return {
                        ...prev,
                        rating_count: newCount,
                        avg_rating: newAvg,
                     };
                  });

                  // Optimistically prepend the new review to the list
                  if (newReview) {
                     const formattedReview = {
                        id: newReview.id || Date.now(),
                        userName:
                           currentUser?.name ||
                           currentUser?.user_metadata
                              ?.name ||
                           "You",
                        avatar_url:
                           currentUser?.avatar_url ||
                           currentUser?.user_metadata
                              ?.avatar_url ||
                           null,
                        is_verified:
                           currentUser?.is_verified ||
                           false,
                        rating: newReview.rating || 0,
                        date:
                           newReview.created_at ||
                           new Date().toISOString(),
                        comments: newReview.comment || "",
                        tags: newReview.tags || [],
                        photos: newReview.photo_urls || [],
                        helpfulCount: 0,
                        hasVotedHelpful: false,
                     };
                     setReviews((prev) => [
                        formattedReview,
                        ...prev,
                     ]);
                  }

                  // Background refetch to ensure data consistency
                  fetchReviews();
               }}
            />
         </Modal>
      </div>
   );
}

// Renders a row of 5 stars filled based on a numeric rating value
function StarRow({ value, className = "" }) {
   const full = Math.floor(value);
   const half = value - full >= 0.5;
   return (
      <div
         className={`stars ${className}`}
         aria-label={`Rating ${value}`}
      >
         {Array.from({ length: 5 }).map((_, i) => {
            const isFull = i < full;
            const isHalf = i === full && half;
            return (
               <span
                  key={i}
                  className={`star ${isFull ? "is-full" : ""} ${isHalf ? "is-half" : ""}`}
               >
                  ★
               </span>
            );
         })}
      </div>
   );
}

// Renders a single bar in the star rating histogram
// Clicking it filters the review list to that star rating
function RatingBar({
   star,
   count,
   total,
   isActive,
   onClick,
}) {
   const totalPct =
      total > 0 ? Math.round((count / total) * 100) : 0;
   return (
      <div
         className={`ratingRow ${isActive ? "is-active" : ""}`}
         onClick={onClick}
         role="button"
         tabIndex={0}
         onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            onClick()
         }
      >
         <div className="ratingRow__star">{star}</div>
         <div className="ratingRow__track">
            <div
               className="ratingRow__fill"
               style={{ width: `${totalPct}%` }}
            />
         </div>
         <div className="ratingRow__percent">
            {totalPct}%
         </div>
      </div>
   );
}
