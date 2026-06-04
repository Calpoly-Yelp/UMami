import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PhotoGallery.css";
import "../components/PhotoOverlay.css";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

const getPhotosByType = (review, type) => {
   if (!Array.isArray(review.photo_urls)) {
      return [];
   }

   return review.photo_urls.filter(
      (photo) =>
         photo?.url &&
         photo?.type?.toLowerCase() === type.toLowerCase(),
   );
};

const getPhotoCaption = (photo) => {
   if (!photo || typeof photo !== "object") {
      return null;
   }

   if (photo.type === "Menu Item" && photo.item) {
      return photo.item;
   }

   return photo.type || null;
};

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

   const menuItemPhotos = reviews.flatMap((review) =>
      getPhotosByType(review, "Menu Item"),
   );

   const ambiancePhotos = reviews.flatMap((review) =>
      getPhotosByType(review, "Ambiance"),
   );

   const otherPhotos = reviews.flatMap((review) =>
      getPhotosByType(review, "Other"),
   );

   const galleryTabs = [
      {
         label: "Menu Items",
         key: "menuItems",
         photos: menuItemPhotos,
      },
      {
         label: "Ambiance",
         key: "ambiance",
         photos: ambiancePhotos,
      },
      {
         label: "Other",
         key: "other",
         photos: otherPhotos,
      },
   ];

   const selectedGallery =
      galleryTabs.find((tab) => tab.key === activeTab) ||
      galleryTabs[0];

   useEffect(() => {
      const fetchRestaurant = async () => {
         try {
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${id}`,
            );

            if (!response.ok) {
               setRestaurantName("Unknown Restaurant");
               setRestaurantBanner(null);
               return;
            }

            const data = await response.json();

            setRestaurantName(
               data.name || "Unknown Restaurant",
            );
            setRestaurantBanner(
               data.image_urls?.[0] || null,
            );
         } catch (error) {
            console.error(
               "Failed to fetch restaurant:",
               error,
            );
            setRestaurantName("Unknown Restaurant");
            setRestaurantBanner(null);
         }
      };

      if (id) {
         fetchRestaurant();
      }
   }, [id]);

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
                        (photo, index) => {
                           const caption =
                              getPhotoCaption(photo);

                           return (
                              <button
                                 type="button"
                                 className="photo-card"
                                 key={`${photo.url}-${index}`}
                              >
                                 <div className="photo-wrapper">
                                    <img
                                       src={photo.url}
                                       alt={
                                          caption ||
                                          `${restaurantName} photo ${index + 1}`
                                       }
                                       onError={() =>
                                          console.error(
                                             "Image failed:",
                                             photo.url,
                                          )
                                       }
                                    />

                                    {caption && (
                                       <div className="shared-photo-caption">
                                          {caption}
                                       </div>
                                    )}
                                 </div>
                              </button>
                           );
                        },
                     )}
                  </div>
               )}
         </main>
      </div>
   );
}
