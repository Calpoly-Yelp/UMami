import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import cpLogo from "../assets/cplogo.png";
import "./UserName.css";

function UserName({ name, is_verified, size = "1.5rem" }) {
   const [isHovered, setIsHovered] = useState(false);
   const [tooltipPos, setTooltipPos] = useState({
      top: 0,
      left: 0,
   });
   const badgeRef = useRef(null);

   const handleMouseEnter = () => {
      if (badgeRef.current) {
         const rect =
            badgeRef.current.getBoundingClientRect();
         setTooltipPos({
            top: rect.top + rect.height / 2,
            left: rect.right + 8, // Spacing to the right
         });
         setIsHovered(true);
      }
   };

   // Hide the tooltip on scroll to prevent it from detaching from the icon
   useEffect(() => {
      if (isHovered) {
         const handleScroll = () => setIsHovered(false);
         window.addEventListener(
            "scroll",
            handleScroll,
            true,
         );
         return () =>
            window.removeEventListener(
               "scroll",
               handleScroll,
               true,
            );
      }
   }, [isHovered]);

   return (
      <div className="name" style={{ fontSize: size }}>
         <h3>{name}</h3>
         {/* Display verified badge logic */}
         {is_verified && (
            <span
               className="verified-wrapper"
               ref={badgeRef}
               onMouseEnter={handleMouseEnter}
               onMouseLeave={() => setIsHovered(false)}
            >
               <img
                  src={cpLogo}
                  alt="Cal Poly Verified User"
                  className="verified-badge"
               />
               {isHovered &&
                  createPortal(
                     <div
                        className="verified-tooltip"
                        style={{
                           top: tooltipPos.top,
                           left: tooltipPos.left,
                        }}
                     >
                        Cal Poly Verified User
                     </div>,
                     document.body,
                  )}
            </span>
         )}
      </div>
   );
}

export default UserName;
