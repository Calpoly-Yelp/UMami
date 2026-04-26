import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

export default function Modal({
   open,
   onClose,
   title,
   children,
   disableOverlayClick = false,
   hideCloseButton = false,
   className = "",
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

   return createPortal(
      <div
         className="modal-overlay"
         onMouseDown={
            disableOverlayClick ? undefined : onClose
         }
      >
         <div
            className={`modal-panel ${className}`.trim()}
            onMouseDown={(e) => e.stopPropagation()}
         >
            <div className="modal-header">
               <div className="modal-title">{title}</div>
               {!hideCloseButton && (
                  <button
                     className="modal-close"
                     onClick={onClose}
                     aria-label="Close"
                  >
                     ×
                  </button>
               )}
            </div>
            <div className="modal-body">{children}</div>
         </div>
      </div>,
      document.body,
   );
}
