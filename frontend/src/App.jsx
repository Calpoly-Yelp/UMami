<<<<<<< HEAD
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
            <Route
               path="/restaurants"
               element={<Restaurants />}
            />
         </Routes>
      </BrowserRouter>
   );
=======
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import SignUpForm from "./pages/SignUpForm";
import PhotoGallery from "./pages/PhotoGallery";
import HomePage from "./pages/HomePage";
import Onboarding from "./pages/Onboarding";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup-form" element={<SignUpForm />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/gallery" element={<PhotoGallery />} />

      </Routes>
    </BrowserRouter>
  );
>>>>>>> prarthana
}
