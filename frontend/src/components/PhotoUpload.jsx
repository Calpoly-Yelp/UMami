import "./PhotoUpload.css";
import React, { useRef, useState } from "react";
import uploadIcon from "../assets/upload-icon.svg";

function PhotoUpload({
   onPhotoSelected,
   onClose,
   menuItems = [],
}) {
   const inputRef = useRef(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [selectedFile, setSelectedFile] = useState(null);
   const [photoType, setPhotoType] = useState("Other");
   const [menuItemSearch, setMenuItemSearch] = useState("");
   const [showMenuDropdown, setShowMenuDropdown] =
      useState(false);
   const [menuItem, setMenuItem] = useState("");
   const [error, setError] = useState(null);

   const filteredMenuItems = menuItems.filter((item) =>
      item.name
         .toLowerCase()
         .includes(menuItemSearch.toLowerCase()),
   );

   const handlePick = () => {
      inputRef.current?.click();
   };

   const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setError(null);
      setSelectedFile(file);
   };

   const handleSubmit = () => {
      if (selectedFile) {
         onPhotoSelected?.({
            file: selectedFile,
            url: previewUrl,
            type: photoType,
            item: photoType === "Menu Item" ? menuItem : "",
         });
         onClose?.();
      }
   };

   return (
      <div className="photo-container">
         <h1 className="photo-title">
            Shake Smart Photo Upload
         </h1>

         <div className="photo-layout">
            <div className="photo-left">
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
                  <p className="upload-text">
                     Drag and drop / Select photo here
                  </p>
               </div>
               {error && (
                  <p
                     style={{
                        color: "red",
                        marginTop: "10px",
                        textAlign: "center",
                     }}
                  >
                     {error}
                  </p>
               )}
            </div>

            <div className="photo-right">
               <div className="form-fields">
                  <div className="form-group">
                     <label>What is this a photo of?</label>
                     <div className="select-wrap">
                        <select
                           value={photoType}
                           onChange={(e) => {
                              const value = e.target.value;
                              setPhotoType(value);

                              // Clear menu item if switching away
                              if (value !== "Menu Item") {
                                 setMenuItem("");
                              }
                           }}
                        >
                           <option value="Menu Item">
                              Menu Item
                           </option>
                           <option value="Vibe">
                              Vibe of the Restaurant
                           </option>
                           <option value="Other">
                              Other
                           </option>
                        </select>
                     </div>
                  </div>

                  {photoType === "Menu Item" && (
                     <div
                        className="form-group"
                        style={{ position: "relative" }}
                     >
                        <label>
                           What menu item is this?
                        </label>
                        <input
                           type="text"
                           className="menu-item-search-input"
                           placeholder="Search menu items..."
                           value={menuItemSearch}
                           onChange={(e) => {
                              setMenuItemSearch(
                                 e.target.value,
                              );
                              setMenuItem(e.target.value);
                              setShowMenuDropdown(true);
                           }}
                           onFocus={() =>
                              setShowMenuDropdown(true)
                           }
                           onBlur={() =>
                              setTimeout(
                                 () =>
                                    setShowMenuDropdown(
                                       false,
                                    ),
                                 200,
                              )
                           }
                        />
                        {showMenuDropdown && (
                           <div className="menu-item-dropdown">
                              {filteredMenuItems.length >
                              0 ? (
                                 filteredMenuItems.map(
                                    (item) => (
                                       <div
                                          key={item.id}
                                          className="menu-item-option"
                                          onMouseDown={(
                                             e,
                                          ) => {
                                             e.preventDefault();
                                             setMenuItem(
                                                item.name,
                                             );
                                             setMenuItemSearch(
                                                item.name,
                                             );
                                             setShowMenuDropdown(
                                                false,
                                             );
                                          }}
                                       >
                                          {item.name}
                                       </div>
                                    ),
                                 )
                              ) : (
                                 <div className="menu-item-option is-empty">
                                    No items found
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Submit Button */}
               <div className="actions">
                  <button
                     className="cancel-btn"
                     onClick={onClose}
                  >
                     Cancel
                  </button>
                  <button
                     className="submit-btn"
                     onClick={handleSubmit}
                     disabled={!selectedFile}
                  >
                     Add Photo
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

export default PhotoUpload;
