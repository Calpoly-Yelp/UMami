import React, { useState } from "react";
import {
   useNavigate,
   useSearchParams,
} from "react-router-dom"; // ← added useSearchParams
import "./WriteReview.css";
import Modal from "./Modal";
import PhotoUpload from "./PhotoUpload.jsx";
import uploadIcon from "../assets/upload-icon.svg";
import { supabase } from "../lib/supabase";

function WriteReview() {
   const navigate = useNavigate();

   // --- Read restaurant_id from the URL query string ---
   // e.g. /review?restaurant_id=5 → restaurantId = "5"
   // This is set by RestaurantInfo.jsx when the user clicks "write review"
   const [searchParams] = useSearchParams();
   const restaurantId = searchParams.get("restaurant_id");

   // --- Form state ---
   const [rating, setRating] = useState(0);
   const [category, setCategory] = useState("Service");
   // Fix: was useState(false), should be useState("") for a text field
   const [text, setText] = useState("");

   // --- Photo modal state ---
   const [openPhotoModal, setOpenPhotoModal] =
      useState(false);

   // --- Stores the real Supabase Storage public URL after upload ---
   // This is set by PhotoUpload once the file has been uploaded
   // and is included in photo_urls when the review is submitted
   const [experiencePhotoUrl, setExperiencePhotoUrl] =
      useState(null);

   // --- Submission loading and error state ---
   const [submitting, setSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState(null);

   // --- Handle review submission ---
   const handleSubmit = async () => {
      setSubmitting(true);
      setSubmitError(null);

      try {
         // Get the current logged-in user from Supabase auth
         const {
            data: { session },
         } = await supabase.auth.getSession();
         const userId = session?.user?.id;

         // POST the new review to the backend
         // restaurant_id comes from the URL query param set by RestaurantInfo
         // photo_urls is an array — includes the Supabase Storage URL if
         // the user uploaded a photo, otherwise sends an empty array
         const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               user_id: userId,
               // Convert restaurantId string to number since the DB expects an integer
               // Falls back to null if no restaurant_id was in the URL
               restaurant_id: restaurantId
                  ? Number(restaurantId)
                  : null,
               rating,
               comment: text,
               tags: [category],
               photo_urls: experiencePhotoUrl
                  ? [experiencePhotoUrl]
                  : [],
            }),
         });

         if (!res.ok) {
            const err = await res.json();
            throw new Error(
               err.error || "Submission failed",
            );
         }

         // On success, navigate back to the restaurant page this
         // review came from, or fall back to the restaurants list
         navigate(
            restaurantId
               ? `/restaurants/${restaurantId}`
               : "/restaurants",
         );
      } catch (err) {
         console.error("Submit failed:", err);
         setSubmitError(err.message);
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <div className="wr-page">
         <div className="wr-container">
            <h1 className="wr-title">Shake Smart Review</h1>

            {/* --- Star Rating Section --- */}
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
                        // Highlight stars up to and including the selected rating
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

            {/* --- Written Review Text Area --- */}
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
               {/* --- Category Dropdown --- */}
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
                  {/* --- Photo Upload Button --- */}
                  {/* Clicking this opens the Modal containing PhotoUpload */}
                  {/* PhotoUpload uploads the file to Supabase Storage and */}
                  {/* calls onPhotoSelected with the real public URL */}
                  {/* That URL is stored in experiencePhotoUrl and shown */}
                  {/* as a preview here, and included in the review on submit */}
                  <div className="wr-label">
                     Show your experience:
                  </div>

                  <button
                     type="button"
                     className="wr-photoCard"
                     onClick={() => setOpenPhotoModal(true)}
                  >
                     {experiencePhotoUrl ? (
                        // Show the uploaded photo as a preview
                        <img
                           className="wr-photoPreview"
                           src={experiencePhotoUrl}
                           alt="Selected Experience"
                        />
                     ) : (
                        // Show placeholder icon and hint before upload
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

                  {/* --- Submit Button --- */}
                  {/* Disabled while submitting to prevent double submissions */}
                  <div className="wr-actions">
                     <button
                        type="button"
                        className="wr-submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                     >
                        {submitting
                           ? "Submitting..."
                           : "Submit review"}
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

            {/* --- Photo Upload Modal --- */}
            {/* PhotoUpload handles selecting the file, uploading it to  */}
            {/* the Supabase review-photos bucket via /api/uploads/review-photo */}
            {/* and calling onPhotoSelected with the resulting public URL */}
            {/* The modal closes automatically after a successful upload */}
            <Modal
               open={openPhotoModal}
               onClose={() => setOpenPhotoModal(false)}
            >
               <PhotoUpload
                  onPhotoSelected={(url) => {
                     // Store the Supabase Storage public URL
                     // This gets included in photo_urls on submit
                     setExperiencePhotoUrl(url);
                  }}
                  onClose={() => setOpenPhotoModal(false)}
               />
            </Modal>
         </div>
      </div>
   );
}

export default WriteReview;
