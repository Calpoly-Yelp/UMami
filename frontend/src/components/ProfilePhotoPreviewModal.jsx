import Modal from "./Modal.jsx";
import "./ProfilePhotoPreviewModal.css";

export default function ProfilePhotoPreviewModal({
   open,
   previewUrl,
   fileName,
   uploading,
   onCancel,
   onChooseDifferent,
   onSubmit,
}) {
   return (
      <Modal
         open={open}
         onClose={onCancel}
         title="Preview Profile Photo"
         className="profile-photo-preview-modal"
      >
         <div className="profile-photo-preview">
            {previewUrl && (
               <img
                  className="profile-photo-preview__image"
                  src={previewUrl}
                  alt="Selected profile preview"
               />
            )}

            {fileName && (
               <p className="profile-photo-preview__filename">
                  {fileName}
               </p>
            )}

            <div className="profile-photo-preview__actions">
               <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onChooseDifferent}
                  disabled={uploading}
               >
                  Choose Different
               </button>
               <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onSubmit}
                  disabled={uploading}
               >
                  {uploading ? "Uploading..." : "Use Photo"}
               </button>
            </div>
         </div>
      </Modal>
   );
}
