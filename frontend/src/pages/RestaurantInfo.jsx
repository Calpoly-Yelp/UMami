import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../components/Map";
import ReviewCard from "../components/ReviewCard";
import "./RestaurantInfo.css";

export default function Review() {
   const navigate = useNavigate();
   // Get the restaurant id from the URL e.g. /restaurants/5
   const { id } = useParams();
   const [activeTab, setActiveTab] = useState("menu");
   const [restaurantInfo, setRestaurantInfo] =
      useState(null);
   const [ratingFilter, setRatingFilter] = useState(null);

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

      // Format open/close hours from the array returned by the API
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
         address:
            "Shake Smart, Recreation Center, 1 Grand Ave, San Luis Obispo, CA 93407",
         lat: 35.3007,
         lng: -120.6603,
         menuImages: [
            "/gallery/ss_food_1.jpg",
            "/gallery/ss_food_2.jpg",
            "/gallery/ss_food_3.jpg",
            "/gallery/ss_food_4.jpg",
         ],
      };
   }, [restaurantInfo]);

   const [reviews, setReviews] = useState([]);

   useEffect(() => {
      // Fetch the restaurant info from the backend using the id from the URL
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

      // Fetch all reviews for this restaurant
      // Also passes current_user_id so we know which reviews
      // the logged-in user has already voted helpful
      const fetchReviews = async () => {
         try {
            // TODO: replace hardcoded ID with real session user id
            const CURRENT_USER_ID =
               "b677be85-81db-4245-91ca-acb713bd5564";

            const response = await fetch(
               `http://localhost:4000/api/reviews?restaurant_id=${id}&current_user_id=${CURRENT_USER_ID}`,
            );
            if (response.ok) {
               const data = await response.json();

               // Map backend ReviewModel fields to the
               // shape that ReviewCard expects as props
               const formattedReviews = data.map((rev) => ({
                  id: rev.id,
                  userName:
                     rev.users?.name || "Anonymous User",
                  avatar_url: rev.users?.avatar_url || null,
                  is_verified:
                     rev.users?.is_verified || false,
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
            console.error(
               "Failed to fetch reviews:",
               error,
            );
         }
      };

      fetchRestaurant();
      fetchReviews();
   }, [id]);

   // Count how many reviews exist for each star rating (1-5)
   // Used to fill the percentage bars in the rating histogram
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
      if (!ratingFilter) return reviews;
      return reviews.filter((r) => {
         if (typeof r.rating !== "number" || r.rating <= 0)
            return false;
         const roundedRating = Math.max(
            1,
            Math.min(5, Math.round(r.rating)),
         );
         return roundedRating === ratingFilter;
      });
   }, [reviews, ratingFilter]);

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

         {/* ── Section Tab Navigation ── */}
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
            {/* ── Menu Section ── */}
            <section
               className="card card--section"
               id="section-menu"
            >
               <div className="review__sectionHeaderRow">
                  <div className="review__actions">
                     {/* Pass restaurant id as query param so WriteReview
                         knows which restaurant this review is for */}
                     <button
                        className="pillBtn"
                        onClick={() =>
                           navigate(
                              `/review?restaurant_id=${id}`,
                           )
                        }
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

            {/* ── Info Section ── */}
            <section
               className="card card--section"
               id="section-info"
            >
               <h2 className="review__h2">Info</h2>

               <div className="review__infoGrid">
                  {/* Hours */}
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

                  {/* Map */}
                  <div className="review__mapBlock">
                     <Map
                        lat={restaurant.lat}
                        lng={restaurant.lng}
                        name={restaurant.name}
                        address={restaurant.address}
                     />

                     <div className="review__locationChipRow">
                        <span className="chip chip--outline">
                           {restaurant.locationLabel}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Peak Hours Chart */}
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
                           onClick={() =>
                              navigate(
                                 `/review?restaurant_id=${id}`,
                              )
                           }
                        >
                           ✎ write review
                        </button>
                        <button className="pillBtn pillBtn--ghost">
                           filter ▼
                        </button>
                     </div>
                  </div>

                  <div className="review__reviewList">
                     {filteredReviews.length > 0 ? (
                        filteredReviews.map((r) => (
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

                  <div className="review__pagination">
                     ‹ 1 2 3 ›
                  </div>
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
                           onClick={() =>
                              setRatingFilter((prev) =>
                                 prev === s ? null : s,
                              )
                           }
                        />
                     ))}
                  </div>
               </aside>
            </section>
         </main>
      </div>
   );
}

// Renders a row of 5 stars filled based on a numeric rating value
function StarRow({ value }) {
   const full = Math.floor(value);
   const half = value - full >= 0.5;
   return (
      <div className="stars" aria-label={`Rating ${value}`}>
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
