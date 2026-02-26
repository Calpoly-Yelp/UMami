import { UserCheck } from "@phosphor-icons/react";
import UserName from "./userName.jsx";
import "./followedUserCard.css";

function FollowedUserCard({
   followedUser,
   isFollowing,
   onToggleFollow,
}) {
   return (
      <div className="followed-user-card">
         {/* Display users pfp on top */}
         <img
            className="followed-user-pfp"
            src={followedUser.avatar_url}
            alt={followedUser.name}
         />
         <div className="followed-user-name-section">
            {/* Display users name and optionally a verified badge */}
            <UserName
               name={followedUser.name}
               is_verified={followedUser.is_verified}
               size={"1rem"}
            />
         </div>
         <div className="followed-user-bottom-section">
            {/* TODO: implement number of reviews 
            <span className="review-count">
               {followedUser.numReviews} Reviews
            </span>
            */}
            {/* Follow button */}
            <button
               className={`follow-button ${isFollowing ? "following" : ""}`}
               onClick={onToggleFollow}
            >
               {isFollowing ? (
                  <>
                     Following
                     <UserCheck size={16} />
                  </>
               ) : (
                  "Follow"
               )}
            </button>
         </div>
      </div>
   );
}

export default FollowedUserCard;
