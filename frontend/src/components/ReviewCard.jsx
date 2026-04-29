import { useEffect, useRef, useState } from "react";
import UserName from "./UserName.jsx";
import {
   Tag,
   ThumbsUp,
   Trash,
} from "@phosphor-icons/react";
import "./ReviewCard.css";

function ReviewCard({
   review = {},
   showHelpful = false,
   currentUserId,
   onDelete,
}) {
   // assign our review object to variables
   const {
      id,
      user_id,
      userName,
      avatar_url,
      is_verified,
      rating,
      date,
      comments,
      tags = [],
      photos = [],
      helpfulCount = 0,
      hasVotedHelpful: initialHasVotedHelpful = false,
   } = review;

   //------------------- Expansion, Visibility & Tag Logic -------------------
   // isExpanded: whether the comment text is currently expanded
   // isExpandable: whether the comment overflows when collapsed (needs "see more")
   // areTagsExpanded: whether extra tags are currently visible
   const [isExpanded, setIsExpanded] = useState(false);
   const [isExpandable, setIsExpandable] = useState(false);
   const [areTagsExpanded, setAreTagsExpanded] =
      useState(false);
   const [isDeletePrimed, setIsDeletePrimed] =
      useState(false);
   const deleteTimeoutRef = useRef(null);

   const isOwner =
      currentUserId && user_id && currentUserId === user_id;

   // commentRef: used to measure comment height/overflow
   // cardRef: used to detect when the card leaves the viewport
   const commentRef = useRef(null);
   const cardRef = useRef(null);

   // Show a fixed number of tags by default to keep card height stable.
   // The "+N more" pill toggles the rest without affecting comment expansion.
   const TAGS_PREVIEW_COUNT = 5;

   const hasExtraTags = tags.length > TAGS_PREVIEW_COUNT;
   const visibleTags = areTagsExpanded
      ? tags
      : tags.slice(0, TAGS_PREVIEW_COUNT);

   const extraTagCount = Math.max(
      0,
      tags.length - TAGS_PREVIEW_COUNT,
   );

   const toggleTags = (e) => {
      // Prevent triggering the card click (which expands comments)
      e.stopPropagation();
      setAreTagsExpanded((v) => !v);
   };

   // Temporarily force the "collapsed" class, measure height, and determine whether the "see more" indicator should appear
   useEffect(() => {
      if (!comments) {
         // No comment means nothing to expand
         const t = requestAnimationFrame(() =>
            setIsExpandable(false),
         );
         return () => cancelAnimationFrame(t);
      }

      const el = commentRef.current;
      if (!el) {
         // Safely reset state
         const t = requestAnimationFrame(() =>
            setIsExpandable(false),
         );
         return () => cancelAnimationFrame(t);
      }

      // Ensure we're measuring the collapsed state
      el.classList.add("collapsed");

      const id = requestAnimationFrame(() => {
         const hasOverflow =
            el.scrollHeight > el.clientHeight + 1;
         setIsExpandable(hasOverflow);

         // If already expanded, restore expanded layout
         if (isExpanded) el.classList.remove("collapsed");
      });

      return () => cancelAnimationFrame(id);
   }, [comments, isExpanded]);

   // If a user scrolls the card mostly out of view, automatically collapse expanded comments to keep the UI clean when scrolling back
   useEffect(() => {
      const el = cardRef.current;
      if (!el) return;

      const obs = new IntersectionObserver(
         (entries) => {
            for (const entry of entries) {
               if (!entry.isIntersecting) {
                  requestAnimationFrame(() =>
                     setIsExpanded(false),
                  );
               }
            }
         },
         { threshold: 0.15 },
      );

      obs.observe(el);
      return () => obs.disconnect();
   }, []);

   // Cleanup the delete confirmation timeout if the component unmounts
   useEffect(() => {
      return () => clearTimeout(deleteTimeoutRef.current);
   }, []);

   // Changes expanded state
   const handleCardClick = () => {
      if (!isExpandable) return;
      setIsExpanded((v) => !v);
   };

   //------------------- Star Logic -------------------
   const safeRating = Number.isFinite(Number(rating))
      ? Math.max(0, Math.min(5, Math.round(Number(rating))))
      : 0;

   //------------------- Logic Date Format -------------------
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

   //------------------- Helpful Button Logic -------------------
   const [helpfulVotes, setHelpfulVotes] =
      useState(helpfulCount);
   const [hasVotedHelpful, setHasVotedHelpful] = useState(
      initialHasVotedHelpful,
   );

   // Sync state if initial value changes (useful if data is refreshed)
   useEffect(() => {
      setHasVotedHelpful(initialHasVotedHelpful);
   }, [initialHasVotedHelpful]);

   const handleHelpfulClick = async (e) => {
      e.stopPropagation();
      const newCount = hasVotedHelpful
         ? helpfulVotes - 1
         : helpfulVotes + 1;

      // Optimistically update the UI before the API call finishes
      setHelpfulVotes(newCount);
      setHasVotedHelpful(!hasVotedHelpful);

      try {
         // You'll want to replace this dummy ID with your actual logged-in user ID later
         const CURRENT_USER_ID =
            "b677be85-81db-4245-91ca-acb713bd5564";
         const response = await fetch(
            `http://localhost:4000/api/reviews/${review.id}/helpful`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  user_id: CURRENT_USER_ID,
               }),
            },
         );
         if (!response.ok)
            throw new Error(
               "Failed to update helpful count",
            );
      } catch (error) {
         console.error(error);
         // Revert the vote count if the API request failed
         setHelpfulVotes(helpfulVotes);
         setHasVotedHelpful(hasVotedHelpful);
      }
   };

   //------------------- Webpage Display -------------------
   // Case for when no reviews exist
   if (Object.keys(review).length === 0) return null;
   return (
      <article
         ref={cardRef}
         className={`review-card ${photos.length > 0 ? "has-photos" : ""} ${isExpandable ? "expandable" : ""} ${
            isExpanded ? "expanded" : "collapsed"
         }`}
         onClick={handleCardClick}
      >
         <header className="review-header">
            <div className="review-header-top">
               <div className="review-user-info">
                  {/* Review avatar that contains pfp */}
                  <img
                     className="review-avatar"
                     src={
                        avatar_url ||
                        "https://via.placeholder.com/48"
                     }
                     alt={
                        userName
                           ? `${userName}'s profile picture`
                           : "User profile picture"
                     }
                  />
                  {/* Username with an optional verified badge */}
                  <UserName
                     name={userName}
                     is_verified={is_verified}
                  />
               </div>

               {/* Actions Wrapper */}
               <div className="review-actions">
                  {/* Helpful Button */}
                  {showHelpful && (
                     <button
                        type="button"
                        className={`review-helpful-btn ${hasVotedHelpful ? "active" : ""}`}
                        onClick={handleHelpfulClick}
                        aria-label="Mark review as helpful"
                     >
                        <span className="review-helpful-icon">
                           <ThumbsUp
                              weight={
                                 hasVotedHelpful
                                    ? "fill"
                                    : "bold"
                              }
                           />
                        </span>
                        <span className="review-helpful-count">
                           {helpfulVotes}
                        </span>
                     </button>
                  )}

                  {/* Delete Button (Only visible to review owner) */}
                  {isOwner && (
                     <button
                        type="button"
                        className={`review-delete-btn ${isDeletePrimed ? "is-primed" : ""}`}
                        onClick={(e) => {
                           e.stopPropagation();
                           if (isDeletePrimed) {
                              if (onDelete) onDelete(id);
                           } else {
                              setIsDeletePrimed(true);
                              deleteTimeoutRef.current =
                                 setTimeout(() => {
                                    setIsDeletePrimed(
                                       false,
                                    );
                                 }, 3000);
                           }
                        }}
                        aria-label={
                           isDeletePrimed
                              ? "Click again to confirm deletion"
                              : "Delete review"
                        }
                        title={
                           isDeletePrimed
                              ? "Click again to confirm deletion"
                              : "Delete review"
                        }
                     >
                        <Trash size={18} weight="bold" />
                        {isDeletePrimed && (
                           <span className="review-delete-confirm-text">
                              Confirm?
                           </span>
                        )}
                     </button>
                  )}
               </div>
            </div>
            {/* Display the rating in stars */}
            <div className="review-rating">
               <div className="stars" role="img">
                  {Array.from({ length: 5 }).map((_, i) => (
                     <span
                        key={i}
                        className={`star ${i < safeRating ? "filled" : "empty"}`}
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
         <div className="review-content">
            {/* Display the users review comment */}
            {comments ? (
               <div className="review-comments-wrap">
                  <p
                     ref={commentRef}
                     className={`review-comments ${isExpanded ? "" : "collapsed"}`}
                  >
                     {comments}
                  </p>

                  {!isExpanded && isExpandable ? (
                     <span className="review-see-more">
                        see more…
                     </span>
                  ) : null}
               </div>
            ) : null}

            {/* Display the users review tags */}
            {tags.length > 0 ? (
               <div className="review-tags">
                  {visibleTags.map((tag, index) => (
                     <div
                        key={`${tag}-${index}`}
                        className="review-tag"
                     >
                        <Tag size={12} weight="fill" />
                        {tag}
                     </div>
                  ))}

                  {hasExtraTags ? (
                     <button
                        type="button"
                        className="review-tag review-tag-more"
                        onClick={toggleTags}
                        aria-expanded={areTagsExpanded}
                     >
                        {areTagsExpanded
                           ? `Show Less`
                           : `+${extraTagCount} more`}
                     </button>
                  ) : null}
               </div>
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
         </div>
      </article>
   );
}

export default ReviewCard;
