import { useState, useEffect, useRef } from "react";
import umamiLogo from "../assets/umamiLogo.png";
import {
   MdOutlineAccountCircle,
   MdNotificationsNone,
   MdClose,
   MdSearch,
   MdAdd,
   MdCheck,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
   const navigate = useNavigate();
   const [isDropdownOpen, setIsDropdownOpen] =
      useState(false);
   const [isNotificationsOpen, setIsNotificationsOpen] =
      useState(false);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [allUsers, setAllUsers] = useState([]);
   const [followedSet, setFollowedSet] = useState(
      new Set(),
   );
   const [notifications, setNotifications] = useState([]);
   const [visibleCount, setVisibleCount] = useState(4);
   const [user, setUser] = useState(null);
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
   const toggleSearch = () => {
      setIsSearchOpen(!isSearchOpen);
      setSearchQuery("");
      if (isDropdownOpen) setIsDropdownOpen(false);
      if (isNotificationsOpen)
         setIsNotificationsOpen(false);
   };

   // logic for page navigation for element clicks
   const handleMyAccount = () => {
      navigate("/user");
      setIsDropdownOpen(false);
   };
   const handleSignOut = () => {
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
      setIsDropdownOpen(false);
   };

   const handleNotificationClick = async (notification) => {
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
      const loadUserAndNotifications = async () => {
         // Try to get user from storage
         let storedUser = localStorage.getItem("user");

         // If not found, wait briefly for App.jsx to populate it (race condition fix)
         if (!storedUser) {
            await new Promise((resolve) =>
               setTimeout(resolve, 500),
            );
            storedUser = localStorage.getItem("user");
         }

         let userId =
            "b677be85-81db-4245-91ca-acb713bd5564";

         if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.id) userId = parsedUser.id;
         }

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

      loadUserAndNotifications();
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

   // logic for fetching all users for search
   useEffect(() => {
      const fetchUsers = async () => {
         try {
            const response = await fetch(
               "http://localhost:4000/api/users",
            );
            if (response.ok) {
               const data = await response.json();
               setAllUsers(data);
            }
         } catch (error) {
            console.error("Error fetching users:", error);
         }
      };
      fetchUsers();
   }, []);

   // logic for fetching users the current user follows
   useEffect(() => {
      if (user && user.id) {
         const fetchFollows = async () => {
            try {
               const response = await fetch(
                  `http://localhost:4000/api/users/${user.id}/follows`,
               );
               if (response.ok) {
                  const data = await response.json();
                  setFollowedSet(
                     new Set(
                        data.map(
                           (followedUser) =>
                              followedUser.id,
                        ),
                     ),
                  );
               }
            } catch (error) {
               console.error(
                  "Error fetching follows:",
                  error,
               );
            }
         };
         fetchFollows();
      }
   }, [user]);

   // logic for following a user
   const handleFollow = async (personId) => {
      if (!user || !user.id) {
         console.error("User not logged in");
         return;
      }

      // Optimistic UI update for instant feedback
      setFollowedSet((prev) => new Set(prev).add(personId));

      try {
         const response = await fetch(
            "http://localhost:4000/api/users/follows/sync",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  follower_id: user.id,
                  added: [personId],
                  removed: [],
               }),
            },
         );
         if (!response.ok) {
            // Revert if the request failed
            setFollowedSet((prev) => {
               const newSet = new Set(prev);
               newSet.delete(personId);
               return newSet;
            });
         }
      } catch (error) {
         console.error("Error following user:", error);
         // Revert on network error
         setFollowedSet((prev) => {
            const newSet = new Set(prev);
            newSet.delete(personId);
            return newSet;
         });
      }
   };

   // logic for unfollowing a user
   const handleUnfollow = async (personId) => {
      if (!user || !user.id) {
         console.error("User not logged in");
         return;
      }

      // Optimistic UI update for instant feedback
      setFollowedSet((prev) => {
         const newSet = new Set(prev);
         newSet.delete(personId);
         return newSet;
      });

      try {
         const response = await fetch(
            "http://localhost:4000/api/users/follows/sync",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  follower_id: user.id,
                  added: [],
                  removed: [personId],
               }),
            },
         );
         if (!response.ok) {
            // Revert if the request failed
            setFollowedSet((prev) =>
               new Set(prev).add(personId),
            );
         }
      } catch (error) {
         console.error("Error unfollowing user:", error);
         // Revert on network error
         setFollowedSet((prev) =>
            new Set(prev).add(personId),
         );
      }
   };

   const filteredPeople =
      searchQuery.trim() === ""
         ? []
         : allUsers.filter(
              (p) =>
                 p.id !== user?.id && // filter out the logged in user
                 p.name &&
                 p.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
           );

   return (
      <div className="app-header">
         <img
            src={umamiLogo}
            alt="Umami Logo"
            className="header-logo"
            onClick={() => navigate("/restaurants")}
         />
         <div className="header-right">
            <MdSearch
               size={40}
               color="#154734"
               className="search-icon"
               onClick={toggleSearch}
            />
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
               {user?.avatar_url ? (
                  <img
                     src={user.avatar_url}
                     alt="Profile"
                     className="profile-icon"
                     style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer",
                     }}
                     onClick={toggleDropdown}
                  />
               ) : (
                  <MdOutlineAccountCircle
                     size={60}
                     color="#154734"
                     className="profile-icon"
                     onClick={toggleDropdown}
                  />
               )}
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
         {isSearchOpen && (
            <div
               className="search-overlay"
               onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
               }}
            >
               <div
                  className="search-modal-container"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="search-modal">
                     <MdSearch size={30} color="#666" />
                     <input
                        type="text"
                        placeholder="Search Umami..."
                        className="search-modal-input"
                        value={searchQuery}
                        onChange={(e) =>
                           setSearchQuery(e.target.value)
                        }
                        autoFocus
                     />
                     <MdClose
                        size={30}
                        color="#666"
                        className="search-modal-close"
                        onClick={() => {
                           setIsSearchOpen(false);
                           setSearchQuery("");
                        }}
                     />
                  </div>
                  {searchQuery.trim() !== "" && (
                     <div className="search-results-wrapper">
                        <div className="search-results">
                           {filteredPeople.length > 0 ? (
                              <>
                                 <div className="search-result-spacer" />
                                 {filteredPeople.map(
                                    (person) => (
                                       <div
                                          key={person.id}
                                          className="search-result-item"
                                       >
                                          {person.avatar_url ? (
                                             <img
                                                src={
                                                   person.avatar_url
                                                }
                                                alt={
                                                   person.name ||
                                                   "User"
                                                }
                                                className="search-result-avatar"
                                             />
                                          ) : (
                                             <MdOutlineAccountCircle
                                                size={40}
                                                color="#154734"
                                                className="search-result-avatar"
                                             />
                                          )}
                                          <div className="search-result-info">
                                             <span className="search-result-name">
                                                {person.name ||
                                                   "Unknown User"}
                                             </span>
                                          </div>
                                          <div className="search-result-action">
                                             {followedSet.has(
                                                person.id,
                                             ) ? (
                                                <button
                                                   className="follow-btn"
                                                   onClick={(
                                                      e,
                                                   ) => {
                                                      e.stopPropagation();
                                                      handleUnfollow(
                                                         person.id,
                                                      );
                                                   }}
                                                   title="Unfollow User"
                                                >
                                                   <MdCheck
                                                      size={
                                                         30
                                                      }
                                                   />
                                                </button>
                                             ) : (
                                                <button
                                                   className="follow-btn"
                                                   onClick={(
                                                      e,
                                                   ) => {
                                                      e.stopPropagation();
                                                      handleFollow(
                                                         person.id,
                                                      );
                                                   }}
                                                   title="Follow User"
                                                >
                                                   <MdAdd
                                                      size={
                                                         30
                                                      }
                                                   />
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                    ),
                                 )}
                                 <div className="search-result-spacer" />
                              </>
                           ) : (
                              <div className="search-result-empty">
                                 No people found
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}

export default Header;
