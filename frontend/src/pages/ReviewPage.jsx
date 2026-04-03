import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map from "../components/Map";
import ReviewCard from "../components/ReviewCard";
import "./ReviewPage.css";
import heroImg from "../assets/shakesmartheader.jpg";

export default function Review() {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState("menu");

   const restaurant = useMemo(
      () => ({
         name: "Shake Smart",
         heroImage: heroImg,
         tags: ["acai", "smoothies"],
         rating: 4.5,
         ratingCount: 54,
         hours: [
            { day: "Monday", time: "7am - 10pm" },
            {
               day: "Tuesday",
               time: "7am - 10pm",
               open: true,
            },
            { day: "Wednesday", time: "7am - 10pm" },
            { day: "Thursday", time: "7am - 10pm" },
            { day: "Friday", time: "7am - 10pm" },
            { day: "Saturday", time: "9am - 9pm" },
            { day: "Sunday", time: "9am - 9pm" },
         ],
         locationLabel: "Recreation Center",
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
      }),
      [],
   );

   const [reviews, setReviews] = useState([]);

   useEffect(() => {
      const fetchReviews = async () => {
         try {
            // Hardcoding restaurant ID to 107
            const response = await fetch(
               "http://localhost:4000/api/reviews?restaurant_id=108",
            );
            if (response.ok) {
               const data = await response.json();

               // Map the backend ReviewModel to the frontend ReviewCard props
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

      fetchReviews();
   }, []);

   const ratingCounts = useMemo(
      () => ({ 5: 26, 4: 15, 3: 8, 2: 3, 1: 2 }),
      [],
   );

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
               backgroundImage: `url(${restaurant.heroImage})`,
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
                        onClick={() => navigate("/review")}
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

               <button className="pillBtn pillBtn--ghost">
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
                              <span className="review__time">
                                 {h.time}
                              </span>
                              {h.open && (
                                 <span className="review__open">
                                    open
                                 </span>
                              )}
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
                        address={restaurant.address}
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
                           onClick={() =>
                              navigate("/review")
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
                     {reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                     ))}
                  </div>

                  <div className="review__pagination">
                     ‹ 1 2 3 ›
                  </div>
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
                           count={ratingCounts[s]}
                           max={ratingCounts[5]}
                        />
                     ))}
                  </div>
               </aside>
            </section>
         </main>
      </div>
   );
}
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

function RatingBar({ star, count, max }) {
   const pct = Math.round((count / Math.max(max, 1)) * 100);
   return (
      <div className="ratingRow">
         <div className="ratingRow__star">{star}</div>
         <div className="ratingRow__track">
            <div
               className="ratingRow__fill"
               style={{ width: `${pct}%` }}
            />
         </div>
      </div>
   );
}
