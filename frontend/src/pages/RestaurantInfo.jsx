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

export default function Review() {
   const navigate = useNavigate();
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

   const restaurant = useMemo(() => {
      // Helper to format database time
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

      const timeString =
         restaurantInfo?.hours?.length === 2
            ? `${formatTime(restaurantInfo.hours[0])} - ${formatTime(
                 restaurantInfo.hours[1],
              )}`
            : "Loading...";

      return {
         name: restaurantInfo?.name || "Loading...",
         banner: restaurantInfo?.image_urls?.[0] || null,
         tags: restaurantInfo?.tags || [],
         rating: restaurantInfo?.avg_rating ?? 0,
         ratingCount: restaurantInfo?.rating_count ?? 0,
         hours: [
            { day: "Monday", time: timeString },
            {
               day: "Tuesday",
               time: timeString,
               open: true,
            },
            { day: "Wednesday", time: timeString },
            { day: "Thursday", time: timeString },
            { day: "Friday", time: timeString },
            { day: "Saturday", time: timeString },
            { day: "Sunday", time: timeString },
         ],
         locationLabel:
            restaurantInfo?.location || "Loading...",
         street_address:
            restaurantInfo?.street_address || "",
         lat: restaurantInfo?.lat || 35.2828,
         lng: restaurantInfo?.lng || -120.6596,
         menuImages: [
            "/gallery/ss_food_1.jpg",
            "/gallery/ss_food_2.jpg",
            "/gallery/ss_food_3.jpg",
            "/gallery/ss_food_4.jpg",
         ],
      };
   }, [restaurantInfo]);

   const [reviews, setReviews] = useState([]);

   // Fetches all the individual reviews associated with this restaurant
   const fetchReviews = useCallback(async () => {
      try {
         let url = `http://localhost:4000/api/reviews?restaurant_id=${id}`;
         if (CURRENT_USER_ID) {
            url += `&current_user_id=${CURRENT_USER_ID}`;
         }
         const response = await fetch(url);
         if (response.ok) {
            const data = await response.json();

            // Map the backend ReviewModel to the frontend ReviewCard props
            const formattedReviews = data.map((rev) => ({
               id: rev.id,
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

   useEffect(() => {
      // Fetches the restaurant's data
      const fetchRestaurant = async () => {
         try {
            const response = await fetch(
               `http://localhost:4000/api/restaurants/${id}`,
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
      };

      fetchRestaurant();
      // eslint-disable-next-line
      fetchReviews();
   }, [id, fetchReviews]);

   // Calculates the total count of each star rating (1-5) from the fetched reviews array.
   // This is used to populate the filled percentages on the "Overall Rating" bar chart.
   const computedRatings = useMemo(() => {
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      reviews.forEach((r) => {
         // Only count valid number ratings between 1 and 5
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

   // Filters the reviews based on the selected star rating filter
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

   const scrollTo = (key) => {
      setActiveTab(key);
      const el = document.getElementById(`section-${key}`);
      if (el)
         el.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
   };

   return (
      <div className="review">
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
               <h1 className="review__title">
                  {restaurant.name}
               </h1>

               <div className="review__metaRow">
                  <StarRow value={restaurant.rating} />
               </div>

               <div className="review__chips">
                  {restaurant.tags.map((t) => (
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
                  onClick={() => navigate("/gallery")}
               >
                  <span className="review__photosDot" />{" "}
                  view photos
               </button>
            </div>
         </section>

         <nav
            className="review__tabs"
            aria-label="Sections"
         >
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
         </nav>

         <main className="review__main">
            <section
               className="card card--section"
               id="section-menu"
            >
               <div className="review__sectionHeaderRow">
                  <div className="review__actions">
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
                        ✎ <span>write review</span>
                     </button>
                     <button className="pillBtn">
                        📷 <span>add photos</span>
                     </button>
                     <button className="pillBtn">
                        🔖 <span>saved</span>
                     </button>
                  </div>
               </div>

               <h2 className="review__h2">Menu</h2>

               <div className="review__menuRow">
                  {restaurant.menuImages.map((src, idx) => (
                     <div
                        key={idx}
                        className="review__menuImgWrap"
                     >
                        <img
                           className="review__menuImg"
                           src={src}
                           alt={`menu ${idx + 1}`}
                           loading="lazy"
                        />
                     </div>
                  ))}
                  <button
                     className="review__carouselNext"
                     aria-label="Next"
                  >
                     ›
                  </button>
               </div>

               <button
                  className="pillBtn pillBtn--ghost"
                  onClick={() =>
                     navigate(`/restaurants/${id}/menu`)
                  }
               >
                  👁 view menu and nutrition
               </button>
            </section>

            <section
               className="card card--section"
               id="section-info"
            >
               <h2 className="review__h2">Info</h2>

               <div className="review__infoGrid">
                  <div className="review__hours">
                     <div className="review__subHeader">
                        <span className="review__subIcon">
                           🕒
                        </span>
                        <span className="review__subTitle">
                           Hours
                        </span>
                     </div>

                     <div className="review__hoursList">
                        {restaurant.hours.map((h) => (
                           <div
                              key={h.day}
                              className="review__hoursRow"
                           >
                              <span className="review__day">
                                 {h.day}
                              </span>
                              <span
                                 className="review__open"
                                 style={{
                                    visibility: h.open
                                       ? "visible"
                                       : "hidden",
                                 }}
                              >
                                 open
                              </span>
                              <span className="review__time">
                                 {h.time}
                              </span>
                           </div>
                        ))}
                     </div>

                     <button className="pillBtn pillBtn--orange">
                        order in-person
                     </button>
                  </div>

                  <div className="review__mapBlock">
                     <Map
                        lat={restaurant.lat}
                        lng={restaurant.lng}
                        name={restaurant.name}
                        street_address={
                           restaurant.street_address
                        }
                     />

                     <div className="review__locationChipRow">
                        <span className="chip chip--outline">
                           {restaurant.locationLabel}
                        </span>
                     </div>
                  </div>
               </div>

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
               </div>
            </section>

            <section
               className="review__reviewsGrid"
               id="section-reviews"
            >
               <div className="card card--section">
                  <div className="review__reviewsHeader">
                     <h2 className="review__h2">Reviews</h2>

                     <div className="review__reviewsControls">
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
                           ✎ write review
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
            title={`${restaurant.name} review`}
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

// Renders a visual row of 5 stars based on a numeric value
function StarRow({ value }) {
   // Calculate number of completely filled stars
   const full = Math.floor(value);
   // Determine if a half-filled star is needed
   const half = value - full >= 0.5;
   return (
      <div className="stars" aria-label={`Rating ${value}`}>
         {/* Generate exactly 5 stars */}
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

// Renders a single horizontal bar in the rating histogram
function RatingBar({
   star,
   count,
   total,
   isActive,
   onClick,
}) {
   // Calculate what percentage of total reviews this star rating makes up
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
