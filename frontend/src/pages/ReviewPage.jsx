import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../components/mapComponent";
import "./reviewpage.css";
import logo from "../assets/logo.png";
import heroImg from "../assets/shakesmartheader.jpg";
import avatarMusty from "../assets/avatar-musty.jpeg";
import avatarCarol from "../assets/avatar-carol.jpeg";
import avatarArnold from "../assets/avatar-arnold.jpeg";

import rev1 from "../assets/rev1.jpeg";
import rev2 from "../assets/rev2.jpeg";
import rev3 from "../assets/rev3.jpeg";

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
         address: "Cal Poly Campus, San Luis Obispo, CA",
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

   const reviews = useMemo(
      () => [
         {
            id: 1,
            author: "Musty the Mustang",
            avatar: avatarMusty,
            verified: true,
            date: "Dec. 25, 2025",
            rating: 4,
            text: "Lovely customer service! Had my bowl ready quickly and was so good! Going to make it a habit to continue to go to shakesmart!",
            tags: ["smoothie", "service", "bowl"],
            images: [rev1, rev2],
         },
         {
            id: 2,
            author: "Carol Fisher",
            avatar: avatarCarol,
            verified: false,
            date: "Mar. 21, 2025",
            rating: 5,
            text: "Great people who work here, always happy to see everyone. Excellent food and shakes. Love their vegan options.",
            tags: ["vegan", "quality"],
            images: [rev3],
         },
         {
            id: 3,
            author: "Arnold Smith",
            avatar: avatarArnold,
            verified: true,
            date: "Jan. 18, 2025",
            rating: 3,
            text: "Pretty good smoothies. Service could be better.",
            tags: ["smoothie", "service"],
            images: [],
         },
      ],
      [],
   );

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
         <header className="review__topbar">
            <button
               className="review__logoBtn"
               onClick={() => navigate("/home")}
               aria-label="Go home"
            >
               <img
                  className="review__logoImg"
                  src={logo}
                  alt="umami logo"
               />
            </button>

            <button
               className="review__profile"
               aria-label="Profile"
            >
               <span className="review__profileIcon">
                  👤
               </span>
            </button>
         </header>

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
                     <button className="pillBtn">
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
                     <MapComponent
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
                        <button className="pillBtn">
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

function ReviewCard({ review }) {
   return (
      <article className="reviewCard">
         <div className="reviewCard__top">
            <div className="reviewCard__left">
               <img
                  className="reviewCard__avatar"
                  src={review.avatar}
                  alt={`${review.author} avatar`}
                  onError={(e) => {
                     e.currentTarget.src =
                        "/assets/avatar-fallback.png";
                  }}
               />
               <div>
                  <div className="reviewCard__nameRow">
                     <span className="reviewCard__name">
                        {review.author}
                     </span>
                     {review.verified && (
                        <span className="badge badge--verified">
                           Verified Cal Poly Account
                        </span>
                     )}
                  </div>
                  <div className="reviewCard__meta">
                     <StarRow value={review.rating} />
                     <span className="reviewCard__date">
                        {review.date}
                     </span>
                  </div>
               </div>
            </div>

            <button
               className="reviewCard__helpful"
               aria-label="Helpful"
            >
               👍 <span>helpful</span>
            </button>
         </div>

         <p className="reviewCard__text">{review.text}</p>

         <div className="reviewCard__tags">
            {review.tags.map((t) => (
               <span key={t} className="chip chip--tag">
                  {t}
               </span>
            ))}
         </div>

         {review.images.length > 0 && (
            <div className="reviewCard__imgs">
               {review.images.map((src, idx) => (
                  <img
                     key={idx}
                     src={src}
                     alt={`review photo ${idx + 1}`}
                  />
               ))}
            </div>
         )}
      </article>
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
