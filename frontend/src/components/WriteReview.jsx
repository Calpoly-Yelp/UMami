import React, { useState, useEffect } from "react";
import "./WriteReview.css";
import PhotoUpload from "./PhotoUpload.jsx";
import uploadIcon from "../assets/upload-icon.svg";
import PRESET_TAGS from "../assets/tags.json";
import { uploadReviewPhoto } from "../lib/uploadPhoto";
import { API_BASE_URL } from "../lib/api";

function WriteReview({
   onClose,
   restaurantId,
   userId,
   onSuccess,
}) {
   const [rating, setRating] = useState(0);
   const [text, setText] = useState("");

   // --- Photo modal state ---
   const [openPhotoModal, setOpenPhotoModal] =
      useState(false);
   const [photos, setPhotos] = useState([]);
   const [hoverRating, setHoverRating] = useState(0);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedTags, setSelectedTags] = useState([]);
   const [tagSearch, setTagSearch] = useState("");
   const [showTagDropdown, setShowTagDropdown] =
      useState(false);
   const [submitError, setSubmitError] = useState(null);
   const [menuItems, setMenuItems] = useState([]);

   useEffect(() => {
      if (!restaurantId) return;

      const fetchMenuItems = async () => {
         try {
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${restaurantId}/menu`,
            );
            if (response.ok) {
               const data = await response.json();
               const items = Array.isArray(data)
                  ? data.reduce(
                       (acc, section) => [
                          ...acc,
                          ...(section.items || []),
                       ],
                       [],
                    )
                  : [];
               setMenuItems(items);
            }
         } catch (error) {
            console.error(
               "Failed to fetch menu items:",
               error,
            );
         }
      };
      fetchMenuItems();
   }, [restaurantId]);

   const filteredTags = PRESET_TAGS.filter(
      (t) =>
         t
            .toLowerCase()
            .includes(tagSearch.toLowerCase()) &&
         !selectedTags.includes(t),
   );

   const handleSubmit = async () => {
      // Basic validation
      if (rating === 0) return;

      if (!restaurantId || !userId) {
         console.error(
            "Missing props! restaurantId or userId is undefined.",
            { restaurantId, userId },
         );
         return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
      try {
         // 1. Upload any pending photos to the bucket first
         const finalPhotoUrls = [];
         for (const photo of photos) {
            let publicUrl = photo.url;
            if (photo.file) {
               publicUrl = await uploadReviewPhoto(
                  photo.file,
               );
            }
            finalPhotoUrls.push({
               url: publicUrl,
               type: photo.type,
               item: photo.item || null,
            });
         }

         const response = await fetch(
            `${API_BASE_URL}/api/reviews`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  restaurant_id: restaurantId,
                  user_id: userId,
                  rating: rating,
                  comment: text,
                  photo_urls: finalPhotoUrls,
                  tags: selectedTags,
               }),
            },
         );

         if (response.ok) {
            const newReviewData = await response.json();
            if (onSuccess) onSuccess(newReviewData);
            onClose();
         } else {
            const errorData = await response.json();
            console.error(
               "Failed to post review:",
               errorData,
            );
            setSubmitError(
               errorData.error || "Failed to post review",
            );
         }
      } catch (error) {
         console.error("Error submitting review:", error);
         setSubmitError(error.message);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="wr-page">
         <div className="wr-container">
            <div className="wr-top-half">
               <div className="wr-section">
                  <div className="wr-labelRow">
                     <div
                        className="wr-label"
                        style={{ marginBottom: 0 }}
                     >
                        Rate your experience:
                     </div>
                  </div>

                  <div
                     className="wr-stars"
                     role="radiogroup"
                     aria-label="Rating"
                  >
                     {[1, 2, 3, 4, 5].map((n) => {
                        const isFilled = n <= rating;
                        const isFaint =
                           n > rating && n <= hoverRating;
                        return (
                           <button
                              key={n}
                              type="button"
                              className={`wr-star ${isFilled ? "is-filled" : ""} ${isFaint ? "is-faint" : ""}`}
                              onClick={() => setRating(n)}
                              onMouseEnter={() =>
                                 setHoverRating(n)
                              }
                              onMouseLeave={() =>
                                 setHoverRating(0)
                              }
                              aria-label={`${n} star${n === 1 ? "" : "s"}`}
                              aria-checked={n === rating}
                              role="radio"
                           >
                              ★
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div
                  className="wr-section"
                  style={{ flex: 1, width: "100%" }}
               >
                  <div className="wr-textarea-wrapper">
                     <textarea
                        id="wr-text"
                        className="wr-textarea"
                        placeholder="Talk about your experience..."
                        value={text}
                        maxLength={750}
                        onChange={(e) =>
                           setText(e.target.value)
                        }
                     />
                     <div
                        className={`wr-char-count ${text.length >= 750 ? "is-max" : ""}`}
                     >
                        {text.length}/750
                     </div>
                  </div>
               </div>
            </div>

            <div className="wr-layout">
               <div className="wr-left">
                  <div
                     className="wr-section"
                     style={{
                        width: "100%",
                        flex: 1,
                        minHeight: 0,
                     }}
                  >
                     <div className="wr-labelRow">
                        <div
                           className="wr-label"
                           style={{ marginBottom: 0 }}
                        >
                           Tags ({selectedTags.length}/15):
                        </div>
                     </div>

                     <div className="wr-tag-container">
                        <div className="wr-tag-search-wrapper">
                           <input
                              type="text"
                              className="wr-tag-input"
                              placeholder={
                                 selectedTags.length >= 15
                                    ? "Maximum 15 tags allowed"
                                    : "Search and add tags..."
                              }
                              value={tagSearch}
                              disabled={
                                 selectedTags.length >= 15
                              }
                              onChange={(e) => {
                                 setTagSearch(
                                    e.target.value,
                                 );
                                 setShowTagDropdown(true);
                              }}
                              onFocus={() =>
                                 setShowTagDropdown(true)
                              }
                              onBlur={() =>
                                 setTimeout(
                                    () =>
                                       setShowTagDropdown(
                                          false,
                                       ),
                                    200,
                                 )
                              }
                           />
                           {showTagDropdown &&
                              selectedTags.length < 15 && (
                                 <div className="wr-tag-dropdown">
                                    {filteredTags.length >
                                    0 ? (
                                       filteredTags.map(
                                          (tag) => (
                                             <div
                                                key={tag}
                                                className="wr-tag-option"
                                                onMouseDown={(
                                                   e,
                                                ) => {
                                                   // Prevent input blur so user can keep adding tags rapidly
                                                   e.preventDefault();
                                                   if (
                                                      selectedTags.length <
                                                      15
                                                   ) {
                                                      setSelectedTags(
                                                         [
                                                            ...selectedTags,
                                                            tag,
                                                         ],
                                                      );
                                                   }
                                                   setTagSearch(
                                                      "",
                                                   );
                                                }}
                                             >
                                                {tag}
                                             </div>
                                          ),
                                       )
                                    ) : (
                                       <div className="wr-tag-option is-empty">
                                          No tags found
                                       </div>
                                    )}
                                 </div>
                              )}
                        </div>

                        <div className="wr-selected-tags">
                           {selectedTags.map((tag) => (
                              <span
                                 key={tag}
                                 className="wr-tag-pill"
                                 onClick={() =>
                                    setSelectedTags(
                                       selectedTags.filter(
                                          (t) => t !== tag,
                                       ),
                                    )
                                 }
                              >
                                 {tag} <span>×</span>
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="wr-right">
                  <div
                     className="wr-section"
                     style={{ flex: 1, marginBottom: 0 }}
                  >
                     <div className="wr-labelRow">
                        <div
                           className="wr-label"
                           style={{ marginBottom: 0 }}
                        >
                           Show your experience (
                           {photos.length}/10):
                        </div>

                        {photos.length > 0 &&
                           photos.length < 10 && (
                              <button
                                 type="button"
                                 className="wr-uploadBtn"
                                 onClick={() =>
                                    setOpenPhotoModal(true)
                                 }
                              >
                                 + Upload Another Photo
                              </button>
                           )}
                     </div>

                     <div
                        className={`wr-photoBox ${photos.length === 0 ? "is-empty" : ""}`}
                        onClick={
                           photos.length === 0
                              ? () =>
                                   setOpenPhotoModal(true)
                              : undefined
                        }
                        onKeyDown={
                           photos.length === 0
                              ? (e) => {
                                   if (
                                      e.key === "Enter" ||
                                      e.key === " "
                                   ) {
                                      e.preventDefault();
                                      setOpenPhotoModal(
                                         true,
                                      );
                                   }
                                }
                              : undefined
                        }
                        role={
                           photos.length === 0
                              ? "button"
                              : undefined
                        }
                        tabIndex={
                           photos.length === 0
                              ? 0
                              : undefined
                        }
                     >
                        {photos.length === 0 ? (
                           <div className="wr-photoEmpty">
                              <img
                                 src={uploadIcon}
                                 alt="Upload"
                                 className="wr-photoEmptyIcon"
                              />
                              <span>
                                 Got pictures? We'd love to
                                 see them!
                              </span>
                           </div>
                        ) : (
                           photos.map((photo, idx) => (
                              <div
                                 key={idx}
                                 className="wr-photoCardH"
                              >
                                 <img
                                    src={photo.url}
                                    alt={`Experience ${idx + 1}`}
                                    className="wr-photoThumbH"
                                 />
                                 <button
                                    type="button"
                                    className="wr-photoRemoveBtnH"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       setPhotos(
                                          photos.filter(
                                             (_, i) =>
                                                i !== idx,
                                          ),
                                       );
                                    }}
                                    title="Remove photo"
                                 >
                                    ×
                                 </button>
                                 {photo.type && (
                                    <div className="wr-photoDetailsH">
                                       <span className="wr-photoCaptionH">
                                          {photo.type ===
                                             "Menu Item" &&
                                          photo.item
                                             ? photo.item
                                             : photo.type}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           ))
                        )}
                     </div>
                  </div>
                  {/* --- Submit Button --- */}
                  {/* Disabled while submitting to prevent double submissions */}
                  <div className="wr-actions">
                     <button
                        type="button"
                        className="wr-cancel"
                        onClick={onClose}
                     >
                        Cancel
                     </button>
                     <button
                        type="button"
                        className="wr-submit"
                        onClick={handleSubmit}
                        disabled={
                           rating === 0 || isSubmitting
                        }
                     >
                        {isSubmitting
                           ? "Submitting..."
                           : "Submit"}
                     </button>
                  </div>

                  {/* --- Inline error message if submission fails --- */}
                  {submitError && (
                     <p
                        style={{
                           color: "red",
                           marginTop: "8px",
                        }}
                     >
                        {submitError}
                     </p>
                  )}
               </div>
            </div>
         </div>

         {openPhotoModal && (
            <div
               className="wr-photo-overlay"
               onMouseDown={() => setOpenPhotoModal(false)}
            >
               <div
                  style={{ width: "100%", margin: "auto" }}
                  onMouseDown={(e) => e.stopPropagation()}
               >
                  <PhotoUpload
                     menuItems={menuItems}
                     onPhotoSelected={(photoData) => {
                        setPhotos([...photos, photoData]);
                        setOpenPhotoModal(false);
                     }}
                     onClose={() =>
                        setOpenPhotoModal(false)
                     }
                  />
               </div>
            </div>
         )}
      </div>
   );
}

export default WriteReview;
