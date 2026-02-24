import {
   BrowserRouter,
   Routes,
   Route,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Restaurants from "./pages/Restaurants.jsx";
import "./App.css";

function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurants" element={<Restaurants />} />
         </Routes>
      </BrowserRouter>
   );
}

export default App;
