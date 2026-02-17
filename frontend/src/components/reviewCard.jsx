import cpLogo from "../assets/cplogo.png";
import "./reviewCard.css";

function ReviewCard({ review }) {
   if (!review) return null;

   const {
      userPfp,
      userName,
      rating,
      date,
      comments,
      tags = [],
      photos = [],
   } = review;

   // Round the users rating to a flat number
   const safeRating = Number.isFinite(Number(rating))
      ? Math.max(0, Math.min(5, Math.round(Number(rating))))
      : 0;

   // Format our date into "Feb. 16 2026" format
   const formattedDate = date
      ? (() => {
           const d = new Date(date);
           const month = d.toLocaleString("en-US", {
              month: "short",
           });
           const day = d.getDate();
           const year = d.getFullYear();
           return `${month}. ${day} ${year}`;
        })()
      : null;

   return (
      <article className="review-card">
         <header className="review-header">
            <div className="review-user-info">
               {/* Review avatar that contains pfp */}
               <img
                  className="review-avatar"
                  src={
                     userPfp ||
                     "https://via.placeholder.com/48"
                  }
                  alt={
                     userName
                        ? `${userName}'s profile picture`
                        : "User profile picture"
                  }
               />
               {/* Username with an optional verified badge */}
               <div className="review-user-name">
                  {userName || "Anonymous"}
                  {review.isVerified && (
                     <img
                        src={cpLogo}
                        alt="Company Logo"
                        className="verified-badge"
                     />
                  )}
               </div>
            </div>
            {/* Display the rating in stars */}
            <div className="review-rating">
               <div className="stars" role="img">
                  {Array.from({ length: 5 }).map((_, i) => (
                     <span
                        key={i}
                        className={`star ${i < safeRating ? "filled" : ""}`}
                     >
                        ★
                     </span>
                  ))}
               </div>
               {/* Display the date of the review */}
               <div className="review-user-meta">
                  {date ? (
                     <time
                        className="review-date"
                        dateTime={new Date(
                           date,
                        ).toISOString()}
                     >
                        {formattedDate}
                     </time>
                  ) : null}
               </div>
            </div>
         </header>
         {/* Display the users review comment */}
         {comments ? (
            <p className="review-comments">{comments}</p>
         ) : null}

         {/* Display the users review tags */}
         {tags.length > 0 ? (
            <ul className="review-tags">
               {tags.map((tag, index) => (
                  <li key={index} className="review-tag">
                     {tag}
                  </li>
               ))}
            </ul>
         ) : null}

         {/* Display any uploaded photos */}
         {photos.length > 0 ? (
            <div className="review-photos">
               {photos.map((photo, index) => {
                  const src =
                     typeof photo === "string"
                        ? photo
                        : photo?.url;
                  const alt =
                     typeof photo === "string"
                        ? `Review photo ${index + 1}`
                        : photo?.alt ||
                          `Review photo ${index + 1}`;

                  return (
                     <img
                        key={src || index}
                        className="review-photo"
                        src={src}
                        alt={alt}
                     />
                  );
               })}
            </div>
         ) : null}
      </article>
   );
}

export default ReviewCard;
