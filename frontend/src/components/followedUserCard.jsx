import { useState } from "react";
import { UserCheck } from "@phosphor-icons/react";
import cpLogo from "../assets/cplogo.png";
import "./followedUserCard.css";

function FollowedUserCard({ user }) {
   // logic to update state of following
   const [isFollowing, setIsFollowing] = useState(true);

   return (
      <div className="followed-user-card">
         {/* Display users pfp on top */}
         <img
            className="followed-user-pfp"
            src={user.profilePicture}
            alt={user.name}
         />
         <div className="followed-user-info">
            {/* Display users name and optionally a verified badge */}
            <div className="name-row">
               <span className="user-name">
                  {user.name}
               </span>
               {user.isVerified && (
                  <img
                     src={cpLogo}
                     alt="Verified"
                     className="verified-badge"
                  />
               )}
            </div>
            {/* Display total number of user reviews */}
            <span className="review-count">
               {user.numReviews} Reviews
            </span>
         </div>
         {/* Follow button */}
         <button
            className={`follow-button ${isFollowing ? "following" : ""}`}
            onClick={() => setIsFollowing(!isFollowing)}
         >
            {isFollowing ? (
               <>
                  <UserCheck
                     size={16}
                     style={{ marginRight: "6px" }}
                  />
                  Following
               </>
            ) : (
               "Follow"
            )}
         </button>
      </div>
   );
}

export default FollowedUserCard;
