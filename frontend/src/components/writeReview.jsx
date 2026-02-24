import React, { useState } from "react";
import "./writeReview.css";
import Modal from "../components/modal";
import PhotoUpload from "../components/photoUpload";
import uploadIcon from "../assets/upload-icon.svg";

function WriteReview() {
   const [rating, setRating] = useState(0);
   const [category, setCategory] = useState("Service");
   const [text, setText] = useState("");
   const [openPhotoModal, setOpenPhotoModal] =
      useState(false);
   const [experiencePhotoUrl, setExperiencePhotoUrl] =
      useState(null);

   return (
      <div className="wr-page">
         <div className="wr-container">
            <h1 className="wr-title">Shake Smart Review</h1>

            <div className="wr-section">
               <div className="wr-label">
                  Rate your experience:
               </div>

               <div
                  className="wr-stars"
                  role="radiogroup"
                  aria-label="Rating"
               >
                  {[1, 2, 3, 4, 5].map((n) => (
                     <button
                        key={n}
                        type="button"
                        className={`wr-star ${n <= rating ? "is-filled" : ""}`}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        aria-checked={n === rating}
                        role="radio"
                     >
                        ★
                     </button>
                  ))}
               </div>
            </div>

            <div className="wr-section">
               <textarea
                  id="wr-text"
                  className="wr-textarea"
                  placeholder="Talk about your experience..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
               />
            </div>

            <div className="wr-grid">
               <div className="wr-col">
                  <label
                     className="wr-label"
                     htmlFor="wr-category"
                  >
                     What is your experience about?
                  </label>

                  <div className="wr-selectWrap">
                     <select
                        id="wr-category"
                        className="wr-select"
                        value={category}
                        onChange={(e) =>
                           setCategory(e.target.value)
                        }
                     >
                        <option value="Service">
                           Service
                        </option>
                        <option value="Quality">
                           Quality
                        </option>
                        <option value="Other">Other</option>
                     </select>
                  </div>
               </div>

               <div className="wr-col wr-right">
                  <div className="wr-label">
                     Show your experience:
                  </div>

                  <button
                     type="button"
                     className="wr-photoCard"
                     onClick={() => setOpenPhotoModal(true)}
                  >
                     {experiencePhotoUrl ? (
                        <img
                           className="wr-photoPreview"
                           src={experiencePhotoUrl}
                           alt="Selected Experience"
                        />
                     ) : (
                        <>
                           <img
                              className="wr-photoIcon"
                              src={uploadIcon}
                              aria-hidden="true"
                           />
                           <div className="wr-photoHint">
                              Add a photo
                           </div>
                        </>
                     )}
                  </button>

                  <div className="wr-actions">
                     <button
                        type="button"
                        className="wr-submit"
                     >
                        Submit review
                     </button>
                  </div>
               </div>
            </div>

            <Modal
               open={openPhotoModal}
               onClose={() => setOpenPhotoModal(false)}
            >
               <PhotoUpload
                  onPhotoSelected={(url) =>
                     setExperiencePhotoUrl(url)
                  }
                  onClose={() => setOpenPhotoModal(false)}
               />
            </Modal>
         </div>
      </div>
   );
}

export default WriteReview;
