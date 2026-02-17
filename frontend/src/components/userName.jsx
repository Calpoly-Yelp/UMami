import cpLogo from "../assets/cplogo.png";
import "./userName.css";

function UserName({ name, isVerified, size = "1.5rem" }) {
   return (
      <div className="name" style={{ fontSize: size }}>
         <h3>{name}</h3>
         {/* Display verified badge logic */}
         {isVerified && (
            <span
               className="verified-wrapper"
               data-tooltip="Cal Poly Verified User"
            >
               <img
                  src={cpLogo}
                  alt="Cal Poly Verified User"
                  className="verified-badge"
               />
            </span>
         )}
      </div>
   );
}

export default UserName;
