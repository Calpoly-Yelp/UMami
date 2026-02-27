import { useState, useEffect, useRef } from "react";
import umamiLogo from "../assets/umamiLogo.png";
import {
   MdOutlineAccountCircle,
   MdNotificationsNone,
   MdClose,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./header.css";

function Header() {
   const navigate = useNavigate();
   const [isDropdownOpen, setIsDropdownOpen] =
      useState(false);
   const [isNotificationsOpen, setIsNotificationsOpen] =
      useState(false);
   const [notifications, setNotifications] = useState([]);
   const [visibleCount, setVisibleCount] = useState(4);
   const dropdownRef = useRef(null);
   const notificationRef = useRef(null);

   // logic for toggle our dropdowns
   const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
      if (isNotificationsOpen)
         setIsNotificationsOpen(false);
   };
   const toggleNotifications = () => {
      setIsNotificationsOpen(!isNotificationsOpen);
      if (!isNotificationsOpen) setVisibleCount(4);
      if (isDropdownOpen) setIsDropdownOpen(false);
   };

   // logic for page navigation for element clicks
   const handleMyAccount = () => {
      navigate("/user");
      setIsDropdownOpen(false);
   };
   const handleSignOut = () => {
      navigate("/");
      setIsDropdownOpen(false);
   };

   const handleNotificationClick = async (notification) => {
      {
         /* implement logic to redirect users to the notification reference 
      switch (notification.type) {
         case "friend_request":
         case "friend_accept":
            navigate("/user#following");
            break;
         case "menu_update":
         case "restaurant_promo":
            navigate("/restaurants");
            break;
         case "review_like":
         case "review_comment":
            navigate("/user#reviews");
            break;
         default:
            break;
      }
      */
      }

      setIsNotificationsOpen(false);

      // If notification already read, stop here (don't sync)
      if (notification.is_read) return;

      // update UI first
      setNotifications((prev) =>
         prev.map((n) =>
            n.id === notification.id
               ? { ...n, is_read: true }
               : n,
         ),
      );

      // sync with database
      try {
         await fetch(
            `http://localhost:4000/api/notifications/${notification.id}/read`,
            { method: "PATCH" },
         );
      } catch (error) {
         console.error(
            "Error marking notification as read:",
            error,
         );
      }
   };

   const handleMarkAllRead = async () => {
      // Optimistic UI Update
      setNotifications((prev) =>
         prev.map((n) => ({ ...n, is_read: true })),
      );

      // Background Sync
      const userId = "b677be85-81db-4245-91ca-acb713bd5564";
      try {
         await fetch(
            `http://localhost:4000/api/notifications/${userId}/read-all`,
            {
               method: "PATCH",
            },
         );
      } catch (error) {
         console.error("Error marking all as read:", error);
      }
   };

   const handleDeleteAllNotifications = async () => {
      // Optimistic UI Update
      setNotifications([]);
      setVisibleCount(4);

      // Background Sync
      const userId = "b677be85-81db-4245-91ca-acb713bd5564";
      try {
         await fetch(
            `http://localhost:4000/api/notifications/${userId}/delete-all`,
            { method: "DELETE" },
         );
      } catch (error) {
         console.error(
            "Error deleting all notifications:",
            error,
         );
      }
   };

   // logic to handle user clicking delete notification button
   const handleDeleteNotification = async (
      e,
      notificationId,
   ) => {
      e.stopPropagation();

      // update our UI first
      setNotifications((prev) =>
         prev.filter((n) => n.id !== notificationId),
      );

      // sync request with data base
      try {
         await fetch(
            `http://localhost:4000/api/notifications/${notificationId}`,
            {
               method: "DELETE",
            },
         );
      } catch (error) {
         console.error(
            "Error deleting notification:",
            error,
         );
      }
   };

   // logic for fetching notifications from database
   useEffect(() => {
      // harcode our test users userID
      const userId = "b677be85-81db-4245-91ca-acb713bd5564";

      const fetchNotifications = async () => {
         try {
            const response = await fetch(
               `http://localhost:4000/api/notifications/${userId}`,
            );
            if (response.ok) {
               const data = await response.json();
               setNotifications(data);
            }
         } catch (error) {
            console.error(
               "Error fetching notifications:",
               error,
            );
         }
      };

      fetchNotifications();
   }, []);

   const unreadCount = notifications.filter(
      (n) => !n.is_read,
   ).length;

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target)
         ) {
            setIsDropdownOpen(false);
         }
         if (
            notificationRef.current &&
            !notificationRef.current.contains(event.target)
         ) {
            setIsNotificationsOpen(false);
         }
      };

      document.addEventListener(
         "mousedown",
         handleClickOutside,
      );
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
         <div className="header-right">
            <div
               className="notification-container"
               ref={notificationRef}
            >
               <MdNotificationsNone
                  size={40}
                  color="#154734"
                  className="notification-icon"
                  onClick={toggleNotifications}
               />
               {unreadCount > 0 && (
                  <span className="notification-badge">
                     {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                  </span>
               )}
               {isNotificationsOpen && (
                  <div className="notification-dropdown">
                     <div className="notification-header">
                        <span>Notifications</span>
                        {notifications.length > 0 && (
                           <div className="notification-actions">
                              <button
                                 className="notification-action-btn"
                                 onClick={handleMarkAllRead}
                              >
                                 Read all
                              </button>
                              <button
                                 className="notification-action-btn clear-all-btn"
                                 onClick={
                                    handleDeleteAllNotifications
                                 }
                              >
                                 Clear all
                              </button>
                           </div>
                        )}
                     </div>
                     <div className="notification-content">
                        {notifications.length > 0 ? (
                           <>
                              {notifications
                                 .slice(0, visibleCount)
                                 .map((n) => (
                                    <div
                                       key={n.id}
                                       className={`notification-item ${!n.is_read ? "unread" : ""}`}
                                       onClick={() =>
                                          handleNotificationClick(
                                             n,
                                          )
                                       }
                                    >
                                       <span className="notification-message">
                                          {n.message}
                                       </span>
                                       <button
                                          className="notification-delete"
                                          onClick={(e) =>
                                             handleDeleteNotification(
                                                e,
                                                n.id,
                                             )
                                          }
                                       >
                                          <MdClose
                                             size={16}
                                          />
                                       </button>
                                    </div>
                                 ))}
                              {notifications.length >
                                 visibleCount && (
                                 <button
                                    className="notification-load-more"
                                    onClick={() =>
                                       setVisibleCount(
                                          notifications.length,
                                       )
                                    }
                                 >
                                    +
                                    {notifications.length -
                                       visibleCount}{" "}
                                    more notifications
                                 </button>
                              )}
                           </>
                        ) : (
                           <p className="empty-notifications">
                              No new notifications
                           </p>
                        )}
                     </div>
                  </div>
               )}
            </div>
            <div
               className="profile-container"
               ref={dropdownRef}
            >
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
      </div>
   );
}

export default Header;
