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
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";
import "./Header.css";

// Header component that contains the logo, search, notifications, and profile dropdown
function Header() {
   const navigate = useNavigate();
   const [isDropdownOpen, setIsDropdownOpen] =
      useState(false);
   const [isNotificationsOpen, setIsNotificationsOpen] =
      useState(false);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [isSearching, setIsSearching] = useState(false);
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
      setAllUsers([]);
      setIsSearching(false);
      if (isDropdownOpen) setIsDropdownOpen(false);
      if (isNotificationsOpen)
         setIsNotificationsOpen(false);
   };

   // logic for page navigation for element clicks
   const handleMyAccount = () => {
      navigate("/user");
      setIsDropdownOpen(false);
   };
   const handleSignOut = async () => {
      try {
         await supabase.auth.signOut();
      } catch (error) {
         console.error("Error signing out:", error);
      } finally {
         localStorage.removeItem("user");
         setUser(null);
         setNotifications([]);
         setFollowedSet(new Set());
         navigate("/");
         setIsDropdownOpen(false);
      }
   };

   // logic for handling user clicking a notification to mark it as read
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
            `${API_BASE_URL}/api/notifications/${notification.id}/read`,
            { method: "PATCH" },
         );
      } catch (error) {
         console.error(
            "Error marking notification as read:",
            error,
         );
      }
   };

   // logic for handling user clicking delete notification button
   const handleMarkAllRead = async () => {
      // Optimistic UI Update
      setNotifications((prev) =>
         prev.map((n) => ({ ...n, is_read: true })),
      );

      // Background Sync
      const userId = "b677be85-81db-4245-91ca-acb713bd5564";
      try {
         await fetch(
            `${API_BASE_URL}/api/notifications/${userId}/read-all`,
            {
               method: "PATCH",
            },
         );
      } catch (error) {
         console.error("Error marking all as read:", error);
      }
   };

   // logic for handling user clicking delete notification button
   const handleDeleteAllNotifications = async () => {
      // Optimistic UI Update
      setNotifications([]);
      setVisibleCount(4);

      // Background Sync
      const userId = "b677be85-81db-4245-91ca-acb713bd5564";
      try {
         await fetch(
            `${API_BASE_URL}/api/notifications/${userId}/delete-all`,
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
            `${API_BASE_URL}/api/notifications/${notificationId}`,
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

         if (!storedUser) {
            setUser(null);
            setNotifications([]);
            return;
         }

         const parsedUser = JSON.parse(storedUser);
         setUser(parsedUser);
         const userId = parsedUser.id;

         if (!userId) {
            setNotifications([]);
            return;
         }

         try {
            const response = await fetch(
               `${API_BASE_URL}/api/notifications/${userId}`,
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

   // Listen for new notifications added by other components
   // so the bell updates instantly without a page refresh
   useEffect(() => {
      const handleNewNotification = (e) => {
         setNotifications((prev) => [e.detail, ...prev]);
      };
      window.addEventListener(
         "notification-added",
         handleNewNotification,
      );
      return () =>
         window.removeEventListener(
            "notification-added",
            handleNewNotification,
         );
   }, []);

   // Listen for avatar updates to instantly update the profile picture in the header
   useEffect(() => {
      const handleAvatarUpdate = (e) => {
         if (
            e.detail &&
            e.detail.avatar_url !== undefined
         ) {
            setUser((prev) =>
               prev
                  ? {
                       ...prev,
                       avatar_url: e.detail.avatar_url,
                    }
                  : prev,
            );
         }
      };
      window.addEventListener(
         "avatar-updated",
         handleAvatarUpdate,
      );
      return () =>
         window.removeEventListener(
            "avatar-updated",
            handleAvatarUpdate,
         );
   }, []);

   // calculate unread count for badge display
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
      if (!isSearchOpen || searchQuery.trim() === "") {
         return;
      }

      let isActive = true;

      // Debounce: Wait 300ms after the user stops typing before making the request
      const delayDebounceFn = setTimeout(async () => {
         try {
            const response = await fetch(
               `${API_BASE_URL}/api/users?search=${encodeURIComponent(searchQuery.trim())}`,
            );
            if (response.ok && isActive) {
               const data = await response.json();
               setAllUsers(data);
            }
         } catch (error) {
            console.error("Error fetching users:", error);
         } finally {
            if (isActive) {
               setIsSearching(false);
            }
         }
      }, 300);

      return () => {
         isActive = false;
         clearTimeout(delayDebounceFn);
      };
   }, [isSearchOpen, searchQuery]);

   // logic for fetching users the current user follows
   useEffect(() => {
      if (user && user.id) {
         const fetchFollows = async () => {
            try {
               const response = await fetch(
                  `${API_BASE_URL}/api/users/${user.id}/follows`,
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
            `${API_BASE_URL}/api/users/follows/sync`,
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

      // Sync with backend
      try {
         const response = await fetch(
            `${API_BASE_URL}/api/users/follows/sync`,
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

   // filter users based on search query, excluding the current user and ensuring they have a name
   const filteredPeople =
      searchQuery.trim() === ""
         ? []
         : allUsers.filter(
              (p) => p.id !== user?.id && p.name,
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
                  setAllUsers([]);
                  setIsSearching(false);
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
                        onChange={(e) => {
                           const val = e.target.value;
                           setSearchQuery(val);
                           setAllUsers([]);
                           setIsSearching(
                              val.trim() !== "",
                           );
                        }}
                        autoFocus
                     />
                     <MdClose
                        size={30}
                        color="#666"
                        className="search-modal-close"
                        onClick={() => {
                           setIsSearchOpen(false);
                           setSearchQuery("");
                           setAllUsers([]);
                           setIsSearching(false);
                        }}
                     />
                  </div>
                  {searchQuery.trim() !== "" && (
                     <div className="search-results-wrapper">
                        <div className="search-results">
                           {isSearching ? (
                              <div className="search-result-empty">
                                 Searching...
                              </div>
                           ) : filteredPeople.length > 0 ? (
                              <>
                                 <div className="search-result-spacer" />
                                 {filteredPeople.map(
                                    (person) => (
                                       <div
                                          key={person.id}
                                          className="search-result-item"
                                          onClick={() => {
                                             navigate(
                                                `/user/${person.id}`,
                                             );
                                             setIsSearchOpen(
                                                false,
                                             );
                                             setSearchQuery(
                                                "",
                                             );
                                             setAllUsers(
                                                [],
                                             );
                                             setIsSearching(
                                                false,
                                             );
                                          }}
                                          style={{
                                             cursor:
                                                "pointer",
                                          }}
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
