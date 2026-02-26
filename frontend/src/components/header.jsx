import Logo from "../assets/logo.jsx";
import { MdOutlineAccountCircle } from "react-icons/md";
import "./header.css";

function Header() {
   return (
      <div className="app-header">
         <Logo />
         <MdOutlineAccountCircle
            size={60}
            color="#154734"
         />
      </div>
   );
}

export default Header;
