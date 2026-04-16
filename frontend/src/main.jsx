import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

<<<<<<< Updated upstream
createRoot(document.getElementById("root")).render(
   <StrictMode>
      <App />
   </StrictMode>,
=======
ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>,
>>>>>>> Stashed changes
);
