import Logo from "../assets/logo.jsx";
import "./user.css";

function User() {
   return (
      <div className="user-page">
         <div className="user-header">
            <Logo />
            <h1>Hello, World!</h1>
         </div>
         <div className="user-content">
            <p>This is the user page.</p>
         </div>
      </div>
   );
}

export default User;
