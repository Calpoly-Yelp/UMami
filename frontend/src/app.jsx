import {
   BrowserRouter,
   Routes,
   Route,
} from "react-router-dom";
import Home from "./pages/home.jsx";
import User from "./pages/user.jsx";

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
