import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PhotoGallery.css";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

// Extract photo URLs from a review row
const getPhotoUrls = (review) =>
   Array.isArray(review.photo_urls)
      ? review.photo_urls
      : [];

export default function PhotoGallery() {
   const navigate = useNavigate();
   const { id } = useParams();

   const [restaurantName, setRestaurantName] =
      useState("Loading...");
   const [restaurantBanner, setRestaurantBanner] =
      useState(null);
   const [activeTab, setActiveTab] = useState("menuItems");

   const [reviews, setReviews] = useState([]);
   const [isLoadingPhotos, setIsLoadingPhotos] =
      useState(true);
   const [photoError, setPhotoError] = useState("");

   const menuItemPhotos = reviews.flatMap(getPhotoUrls);

   const galleryTabs = [
      {
         label: "Menu Items",
         key: "menuItems",
         photos: menuItemPhotos,
      },
      {
         label: "Ambiance",
         key: "ambiance",
         photos: [],
      },
      {
         label: "Other",
         key: "other",
         photos: [],
      },
   ];

   // Ambiance and Other are empty for now.
   // TODO: Add photo categorization to the database.

   const selectedGallery =
      galleryTabs.find((tab) => tab.key === activeTab) ||
      galleryTabs[0];

   // Fetch restaurant name and banner image for hero
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

   // Fetch reviews that contain photos from Supabase
   useEffect(() => {
      const fetchPhotos = async () => {
         try {
            setIsLoadingPhotos(true);
            setPhotoError("");

            const { data, error } = await supabase
               .from("reviews")
               .select("id, restaurant_id, photo_urls")
               .eq("restaurant_id", Number(id))
               .not("photo_urls", "is", null);

            if (error) {
               throw error;
            }

            console.log("Supabase review photos:", data);

            setReviews(Array.isArray(data) ? data : []);
         } catch (error) {
            console.error(
               "Failed to fetch review photos:",
               error,
            );
            setPhotoError("Photos unavailable.");
            setReviews([]);
         } finally {
            setIsLoadingPhotos(false);
         }
      };

      if (id) {
         fetchPhotos();
      }
   }, [id]);

   return (
      <div className="photo-page">
         <section
            className="photo-hero"
            style={{
               backgroundImage: restaurantBanner
                  ? `url(${restaurantBanner})`
                  : "none",
            }}
            aria-label={`${restaurantName} photo gallery`}
         >
            <div className="photo-hero-overlay" />

            <div className="photo-hero-content">
               <button
                  type="button"
                  className="photo-backBtn"
                  onClick={() =>
                     navigate(`/restaurants/${id}`)
                  }
               >
                  Back to {restaurantName}
               </button>

               <h1 className="photo-hero-title">
                  {restaurantName}
               </h1>
               <h2 className="photo-hero-subtitle">
                  Photo Gallery
               </h2>
            </div>
         </section>

         <nav
            className="photo-tabs"
            aria-label="Photo categories"
         >
            <div className="photo-tabsInner">
               {galleryTabs.map((tab) => (
                  <button
                     key={tab.key}
                     type="button"
                     className={`photo-tab ${
                        activeTab === tab.key
                           ? "is-active"
                           : ""
                     }`}
                     onClick={() => setActiveTab(tab.key)}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
         </nav>

         <main className="photo-content">
            <h3 className="photo-section-title">
               {selectedGallery.label}
            </h3>

            <p className="photo-count">
               View {selectedGallery.photos.length} photos
            </p>

            {isLoadingPhotos && (
               <p className="photo-empty">
                  Loading photos...
               </p>
            )}

            {!isLoadingPhotos && photoError && (
               <p className="photo-empty">{photoError}</p>
            )}

            {!isLoadingPhotos &&
               !photoError &&
               selectedGallery.photos.length === 0 && (
                  <p className="photo-empty">
                     No photos available.
                  </p>
               )}

            {!isLoadingPhotos &&
               !photoError &&
               selectedGallery.photos.length > 0 && (
                  <div className="photo-grid">
                     {selectedGallery.photos.map(
                        (url, index) => (
                           <button
                              type="button"
                              className="photo-card"
                              key={`${url}-${index}`}
                           >
                              <img
                                 src={url}
                                 alt={`${restaurantName} review ${index + 1}`}
                                 onError={() =>
                                    console.error(
                                       "Image failed:",
                                       url,
                                    )
                                 }
                              />
                           </button>
                        ),
                     )}
                  </div>
               )}
         </main>
      </div>
   );
}
