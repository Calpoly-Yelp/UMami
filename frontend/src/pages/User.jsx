import Logo from "../assets/logo.jsx";
import {
   MdOutlineAccountCircle,
   MdOutlineEdit,
   MdOutlineAddAPhoto,
} from "react-icons/md";
import cpLogo from "../../public/cplogo.png";
import "./user.css";

function User() {
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
                  <MdOutlineAccountCircle
                     size={120}
                     color="#8E9089"
                  />
                  <div className="name">
                     <h3>John Doe</h3>
                     <img
                        src={cpLogo}
                        alt="Company Logo"
                        className="cp-logo"
                     />
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
                  <div className="review-card">
                     <h3>Restaurant Name</h3>
                     <p>
                        This is a sample review. The food was
                        amazing and the service was excellent!
                     </p>
                  </div>
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
