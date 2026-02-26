import React, { useEffect } from "react";
import "./modal.css";

export default function Modal({
   open,
   onClose,
   title,
   children,
}) {
   useEffect(() => {
      if (!open) return;
      const onKeyDown = (e) => {
         if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () =>
         window.removeEventListener("keydown", onKeyDown);
   }, [open, onClose]);

   if (!open) return null;

   return (
      <div className="modal-overlay" onMouseDown={onClose}>
         <div
            className="modal-panel"
            onMouseDown={(e) => e.stopPropagation()}
         >
            <div className="modal-header">
               <div className="modal-title">{title}</div>
               <button
                  className="modal-close"
                  onClick={onClose}
                  aria-label="Close"
               >
                  ×
               </button>
            </div>
            <div className="modal-body">{children}</div>
         </div>
      </div>
   );
}
