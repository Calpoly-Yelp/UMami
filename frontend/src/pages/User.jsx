import Logo from "../assets/logo.jsx";
import {
   MdOutlineAccountCircle,
   MdOutlineEdit,
   MdOutlineAddAPhoto,
} from "react-icons/md";
import cpLogo from "../../public/cplogo.png";
import ReviewCard from "../components/reviewCard.jsx";
import "./user.css";

function User() {
   const testUser = {
      name: "Eli Schiffler",
      profilePicture:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      isVerified: true,
   };

   const testReview = {
      userPfp: testUser.profilePicture,
      userName: testUser.name,
      isVerified: testUser.isVerified,
      rating: 4,
      date: "2026-02-14",
      comments: "Loved it!",
      tags: ["Cozy", "Spicy"],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   };

   return (
      <div className="user-page">
         <div className="user-header">
            <Logo />
            <MdOutlineAccountCircle
               size={60}
               color="#154734"
            />
         </div>
         <div className="user-content">
            <div className="user-info">
               <div className="card">
                  {testUser.profilePicture ? (
                     <img
                        className="user-profile-picture"
                        src={testUser.profilePicture}
                        alt={`${testUser.name}'s profile picture`}
                     />
                  ) : (
                     <MdOutlineAccountCircle
                        size={120}
                        color="#8E9089"
                     />
                  )}
                  <div className="name">
                     <h3>{testUser.name}</h3>
                     {testUser.isVerified && (
                        <img
                           src={cpLogo}
                           alt="Company Logo"
                           className="verified-badge"
                        />
                     )}
                  </div>
                  <div className="edit-icons">
                     <MdOutlineAddAPhoto />
                     <MdOutlineEdit />
                  </div>
               </div>
               <div className="navigation-links">
                  <a href="#reviews">My Reviews</a>
                  <a href="#restaurants">
                     My Saved Restaurants
                  </a>
                  <a href="#other-accounts">
                     Other Accounts
                  </a>
               </div>
            </div>
            <div className="user-activity">
               <div className="reviews">
                  <div className="activity-header">
                     <h2>My Reviews</h2>
                  </div>
                  <ReviewCard review={testReview} />
               </div>
               <div className="restaurants">
                  <div className="activity-header">
                     <h2>My Saved Restaurants</h2>
                  </div>
               </div>
               <div className="other-accounts">
                  <div className="activity-header">
                     <h2>Other Accounts</h2>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default User;
