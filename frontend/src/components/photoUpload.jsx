import "./photoUpload.css";
import React, { useRef, useState } from "react";
import uploadIcon from "../assets/upload-icon.svg";

function PhotoUpload({ onPhotoSelected, onClose }) {
   const inputRef = useRef(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [photoType, setPhotoType] = useState("Menu Item");
   const [menuItem, setMenuItem] = useState("Menu Item");

   const handlePick = () => {
      inputRef.current?.click();
   };

   const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);

      onPhotoSelected?.(imageUrl);
      onClose?.();
   };

   const handleSubmit = () => {
      console.log("Submitting:");
      console.log("Photo Type:", photoType);
      console.log("Menu Item:", menuItem);
      console.log("Image URL:", previewUrl);
   };

   return (
      <div className="photo-container">
         <h1 className="photo-title">
            Shake Smart Photo Upload
         </h1>

         {/* Upload Card */}
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

            <p>Drag and drop / Select photo here</p>
         </div>

         {/* Dropdown Row */}
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

         {/* Submit Button */}
         <div className="actions">
            <button
               className="submit-btn"
               onClick={handleSubmit}
               disabled={!previewUrl}
            >
               Submit Photo
            </button>
         </div>
      </div>
   );
}

export default PhotoUpload;
