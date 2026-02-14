import Logo from "../assets/logo.jsx";
import "./user.css";

function User() {
   return (
      <div className="user-page">
         <div className="user-header">
            <Logo />
         </div>
         <div className="user-content">
            <p>This is the user page.</p>
         </div>
      </div>
   );
}

export default User;
