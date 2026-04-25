import React, { useState } from "react";
import "./WriteReview.css";
import PhotoUpload from "./PhotoUpload.jsx";
import uploadIcon from "../assets/upload-icon.svg";

function WriteReview({ onClose }) {
   const [rating, setRating] = useState(0);
   const [text, setText] = useState("");
   const [openPhotoModal, setOpenPhotoModal] =
      useState(false);
   const [photos, setPhotos] = useState([]);
   const [hoverRating, setHoverRating] = useState(0);

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
               <div className="wr-left"></div>

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
                        {photos.length < 10 && (
                           <button
                              type="button"
                              className="wr-uploadBtn"
                              onClick={() =>
                                 setOpenPhotoModal(true)
                              }
                           >
                              + Upload Photo
                           </button>
                        )}
                     </div>

                     <div
                        className={`wr-photoBox ${photos.length === 0 ? "is-empty" : ""}`}
                     >
                        {photos.length === 0 ? (
                           <div className="wr-photoEmpty">
                              <img
                                 src={uploadIcon}
                                 alt="Upload"
                                 className="wr-photoEmptyIcon"
                              />
                              <p>
                                 Got pictures? We'd love to
                                 see them!
                              </p>
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
                                    onClick={() =>
                                       setPhotos(
                                          photos.filter(
                                             (_, i) =>
                                                i !== idx,
                                          ),
                                       )
                                    }
                                    title="Remove photo"
                                 >
                                    ×
                                 </button>
                                 <div className="wr-photoDetailsH">
                                    <span className="wr-photoCaptionH">
                                       {photo.type ===
                                       "Menu Item"
                                          ? photo.item
                                          : photo.type}
                                    </span>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

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
                        onClick={onClose}
                        disabled={rating === 0}
                     >
                        Submit review
                     </button>
                  </div>
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
                     onPhotoSelected={(photoObj) => {
                        setPhotos([...photos, photoObj]);
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
