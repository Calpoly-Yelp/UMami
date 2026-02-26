import { useState, useEffect, useRef } from "react";
import umamiLogo from "../assets/umamiLogo.png";
import { MdOutlineAccountCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./header.css";

function Header() {
   const navigate = useNavigate();
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const dropdownRef = useRef(null);

   const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
   };

   const handleMyAccount = () => {
      navigate("/user");
      setIsDropdownOpen(false);
   };

   const handleSignOut = () => {
      navigate("/");
      setIsDropdownOpen(false);
   };

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target)
         ) {
            setIsDropdownOpen(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener(
            "mousedown",
            handleClickOutside,
         );
      };
   }, []);

   return (
      <div className="app-header">
         <img
            src={umamiLogo}
            alt="Umami Logo"
            className="header-logo"
            onClick={() => navigate("/restaurants")}
         />
         <div className="profile-container" ref={dropdownRef}>
            <MdOutlineAccountCircle
               size={60}
               color="#154734"
               className="profile-icon"
               onClick={toggleDropdown}
            />
            {isDropdownOpen && (
               <div className="dropdown-menu">
                  <button
                     onClick={handleMyAccount}
                     className="dropdown-item"
                  >
                     My Account
                  </button>
                  <button
                     onClick={handleSignOut}
                     className="dropdown-item"
                  >
                     Sign Out
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}

export default Header;
