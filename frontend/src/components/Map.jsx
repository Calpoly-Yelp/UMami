import { useEffect } from "react";
import {
   MapContainer,
   TileLayer,
   Marker,
   Tooltip,
   useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Map.css";

// Custom Umami Green SVG Marker
const customIcon = L.divIcon({
   className: "custom-map-marker",
   html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2f8a3b" width="40px" height="40px" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>`,
   iconSize: [40, 40],
   iconAnchor: [20, 40],
   popupAnchor: [0, -40],
   tooltipAnchor: [0, -40],
});

L.Marker.prototype.options.icon = customIcon;

// Helper component to update the map view when props change
function MapUpdater({ lat, lng }) {
   const map = useMap();
   useEffect(() => {
      // Dynamically re-center the map when lat/lng change
      map.setView([lat, lng], 15);
   }, [lat, lng, map]);
   return null;
}

function Map({
   lat = 35.2828, // default to San Luis Obispo
   lng = -120.6596,
   name = "Restaurant Location",
   street_address = "",
}) {
   // construct our Google Maps directions URL
   // prefer street_address for directions, but fallback to coordinates if needed
   const destination = street_address
      ? encodeURIComponent(street_address)
      : `${lat},${lng}`;
   const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

   const handleRedirect = () => {
      window.open(
         googleMapsUrl,
         "_blank",
         "noopener,noreferrer",
      );
   };

   return (
      <div className="map-wrapper">
         <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={true}
            className="leaflet-container"
            attributionControl={false}
         >
            <TileLayer
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater lat={lat} lng={lng} />
            <Marker
               position={[lat, lng]}
               eventHandlers={{
                  click: handleRedirect,
               }}
            >
               <Tooltip direction="top">
                  <div
                     className="map-popup-content"
                     onClick={handleRedirect}
                  >
                     <strong>{name}</strong>
                     <span>Click for directions</span>
                  </div>
               </Tooltip>
            </Marker>
         </MapContainer>
      </div>
   );
}

export default Map;
