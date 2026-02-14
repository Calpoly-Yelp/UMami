import {
   BrowserRouter,
   Routes,
   Route,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import User from "./pages/User.jsx";
import "./App.css";

function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user" element={<User />} />
         </Routes>
      </BrowserRouter>
   );
}

export default App;
