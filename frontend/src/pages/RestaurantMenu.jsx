import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import "./RestaurantMenu.css";

const displayValue = (value) =>
   value === null || value === undefined || value === ""
      ? "N/A"
      : value;

export default function RestaurantMenu() {
   const navigate = useNavigate();
   const { id } = useParams();
   const [restaurantName, setRestaurantName] =
      useState("Loading...");
   const [restaurantBanner, setRestaurantBanner] =
      useState(null);
   const [menuData, setMenuData] = useState([]);
   const [activeCategory, setActiveCategory] = useState("");
   const [selectedItem, setSelectedItem] = useState(null);
   const [isMenuLoading, setIsMenuLoading] = useState(true);
   const [menuError, setMenuError] = useState("");

   useEffect(() => {
      const fetchRestaurant = async () => {
         try {
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${id}`,
            );
            if (response.ok) {
               const data = await response.json();
               setRestaurantName(data.name);
               setRestaurantBanner(
                  data.image_urls?.[0] || null,
               );
            } else {
               setRestaurantName("Unknown Restaurant");
            }
         } catch (error) {
            console.error(
               "Failed to fetch restaurant:",
               error,
            );
            setRestaurantName("Unknown Restaurant");
         }
      };

      fetchRestaurant();
   }, [id]);

   useEffect(() => {
      const fetchMenu = async () => {
         try {
            setIsMenuLoading(true);
            setMenuError("");
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${id}/menu`,
            );

            if (!response.ok) {
               throw new Error("Failed to fetch menu");
            }

            const data = await response.json();
            const sections = Array.isArray(data)
               ? data
               : [];

            setMenuData(sections);
            setActiveCategory(sections[0]?.category || "");
         } catch (error) {
            console.error("Failed to fetch menu:", error);
            setMenuError("Menu unavailable.");
            setMenuData([]);
            setActiveCategory("");
         } finally {
            setIsMenuLoading(false);
         }
      };

      fetchMenu();
   }, [id]);

   const scrollToCategory = (category) => {
      setActiveCategory(category);
      const el = document.getElementById(
         category.replace(/\s+/g, "-").toLowerCase(),
      );
      if (el) {
         el.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
      }
   };

   return (
      <div className="menu-page">
         <section
            className="menu-hero"
            style={{
               backgroundImage: restaurantBanner
                  ? `url(${restaurantBanner})`
                  : "none",
            }}
            aria-label={`${restaurantName} hero`}
         >
            <div className="hero-overlay" />

            <div className="hero-content">
               <button
                  type="button"
                  className="menu-backBtn"
                  onClick={() =>
                     navigate(`/restaurants/${id}`)
                  }
               >
                  Back to {restaurantName}
               </button>
               <h1 className="hero-title">
                  {restaurantName}
               </h1>
               <h2 className="hero-subtitle">
                  Menu & Nutrition
               </h2>
            </div>
         </section>

         <div className="menu-content">
            <aside className="menu-sidebar">
               <h3 className="menu-sidebar-title">
                  Categories
               </h3>
               <ul className="menu-categories">
                  {menuData.length > 0 ? (
                     menuData.map((section) => (
                        <li
                           key={section.category}
                           className={
                              activeCategory ===
                              section.category
                                 ? "is-active"
                                 : ""
                           }
                           onClick={() =>
                              scrollToCategory(
                                 section.category,
                              )
                           }
                        >
                           {section.category}
                        </li>
                     ))
                  ) : (
                     <li
                        className="is-disabled"
                        aria-disabled="true"
                     >
                        No categories
                     </li>
                  )}
               </ul>
            </aside>

            <main className="menu-items">
               {isMenuLoading && (
                  <p className="menu-empty">
                     Loading menu...
                  </p>
               )}

               {!isMenuLoading && menuError && (
                  <p className="menu-empty">{menuError}</p>
               )}

               {!isMenuLoading &&
                  !menuError &&
                  menuData.length === 0 && (
                     <p className="menu-empty">
                        Campus Dining has not posted a menu
                        for this restaurant yet.
                     </p>
                  )}

               {!isMenuLoading &&
                  !menuError &&
                  menuData.map((section) => (
                     <div
                        key={section.category}
                        className="menu-section"
                        id={section.category
                           .replace(/\s+/g, "-")
                           .toLowerCase()}
                     >
                        <h3 className="menu-section-title">
                           {section.category}
                        </h3>
                        <table className="menu-table">
                           <thead>
                              <tr>
                                 <th>Menu Item</th>
                                 <th>Portion</th>
                                 <th>Calories</th>
                              </tr>
                           </thead>
                           <tbody>
                              {(section.items || []).map(
                                 (item) => (
                                    <tr
                                       key={
                                          item.id ||
                                          item.name
                                       }
                                       onClick={() =>
                                          setSelectedItem(
                                             item,
                                          )
                                       }
                                    >
                                       <td>{item.name}</td>
                                       <td>
                                          {displayValue(
                                             item.portion,
                                          )}
                                       </td>
                                       <td>
                                          {displayValue(
                                             item.calories,
                                          )}
                                       </td>
                                    </tr>
                                 ),
                              )}
                           </tbody>
                        </table>
                     </div>
                  ))}
            </main>
         </div>

         {selectedItem && (
            <div
               className="modal-overlay"
               onClick={() => setSelectedItem(null)}
            >
               <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     className="modal-close"
                     onClick={() => setSelectedItem(null)}
                  >
                     &times;
                  </button>
                  <h3 className="modal-title">
                     {selectedItem.name}
                  </h3>
                  <div className="modal-portion">
                     Portion:{" "}
                     {displayValue(selectedItem.portion)}
                  </div>
                  <div className="modal-nutrients">
                     <div className="modal-nutrient-row">
                        <span>Calories</span>
                        <span>
                           {displayValue(
                              selectedItem.calories,
                           )}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Fat</span>
                        <span>
                           {displayValue(selectedItem.fat)}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Carbohydrates</span>
                        <span>
                           {displayValue(
                              selectedItem.carbs,
                           )}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Protein</span>
                        <span>
                           {displayValue(
                              selectedItem.protein,
                           )}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
