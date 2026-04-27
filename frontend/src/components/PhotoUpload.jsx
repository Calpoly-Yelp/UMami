import "./PhotoUpload.css";
import React, { useRef, useState } from "react";
import uploadIcon from "../assets/upload-icon.svg";
import { uploadReviewPhoto } from "../lib/uploadPhoto";

function PhotoUpload({ onPhotoSelected, onClose }) {
   const inputRef = useRef(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [photoType, setPhotoType] = useState("Menu Item");
   const [menuItem, setMenuItem] = useState("Menu Item");
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState(null);

   const handlePick = () => {
      inputRef.current?.click();
   };

   const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setError(null);
      setUploading(true);

      try {
         // Upload to Supabase bucket, get back real public URL
         const publicUrl = await uploadReviewPhoto(file);
         // Pass the real URL up to WriteReview
         onPhotoSelected?.(publicUrl);
         onClose?.();
      } catch (err) {
         setError("Upload failed: " + err.message);
      } finally {
         setUploading(false);
      }
   };

   return (
      <div className="photo-container">
         <h1 className="photo-title">
            Shake Smart Photo Upload
         </h1>

         <div
            className="upload-card"
            onClick={handlePick}
            role="button"
            tabIndex={0}
         >
            <input
               ref={inputRef}
               className="file-input"
               type="file"
               accept="image/*"
               onChange={handleFileChange}
            />
            {previewUrl ? (
               <img
                  src={previewUrl}
                  alt="Preview"
                  className="preview-img"
               />
            ) : (
               <img
                  className="upload-icon"
                  src={uploadIcon}
                  alt="Upload"
               />
            )}
            <p>
               {uploading
                  ? "Uploading..."
                  : "Drag and drop / Select photo here"}
            </p>
         </div>

         {error && <p style={{ color: "red" }}>{error}</p>}

         <div className="form-row">
            <div className="form-group">
               <label>What is this a photo of?</label>
               <div className="select-wrap">
                  <select
                     value={photoType}
                     onChange={(e) =>
                        setPhotoType(e.target.value)
                     }
                  >
                     <option>Menu Item</option>
                     <option>Vibe of the Restaurant</option>
                     <option>Other</option>
                  </select>
               </div>
            </div>
            <div className="form-group">
               <label>What menu item is this?</label>
               <div className="select-wrap">
                  <select
                     value={menuItem}
                     onChange={(e) =>
                        setMenuItem(e.target.value)
                     }
                  >
                     <option>Menu Item</option>
                  </select>
               </div>
            </div>
         </div>
      </div>
   );
}

export default PhotoUpload;
