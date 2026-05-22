import { UserCheck } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import UserName from "./UserName.jsx";
import "./FollowedUserCard.css";

function FollowedUserCard({
   followedUser,
   isFollowing,
   onToggleFollow,
}) {
   const navigate = useNavigate();

   const handleCardClick = () => {
      navigate(`/user/${followedUser.id}`);
   };

   return (
      <div
         className="followed-user-card"
         onClick={handleCardClick}
         style={{ cursor: "pointer" }}
      >
         <img
            className="followed-user-pfp"
            src={followedUser.avatar_url}
            alt={followedUser.name}
         />

         <div className="followed-user-name-section">
            <UserName
               name={followedUser.name}
               is_verified={followedUser.is_verified}
               size={"1rem"}
            />
         </div>

         <div className="followed-user-bottom-section">
            <span className="review-count">
               {followedUser.numReviews ?? 0} Reviews
            </span>

            {onToggleFollow && (
               <button
                  className={`follow-button ${isFollowing ? "following" : ""}`}
                  onClick={(e) => {
                     e.stopPropagation();
                     onToggleFollow();
                  }}
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
            )}
         </div>
      </div>
   );
}

export default FollowedUserCard;