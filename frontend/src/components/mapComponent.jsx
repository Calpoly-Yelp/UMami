import {
   MapContainer,
   TileLayer,
   Marker,
   Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import "./mapComponent.css";

// default marker
let DefaultIcon = L.icon({
   iconUrl: icon,
   shadowUrl: iconShadow,
   iconSize: [25, 41],
   iconAnchor: [12, 41],
   popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapComponent({
   lat = 35.2828, // default to San Luis Obispo
   lng = -120.6596,
   name = "Restaurant Location",
   address = "",
}) {
   // construct our  Google Maps directions URL
   // prefer address for directions, but fallback to coordinates if needed
   const destination = address
      ? encodeURIComponent(address)
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
            scrollWheelZoom={false}
            className="leaflet-container"
         >
            <TileLayer
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
               position={[lat, lng]}
               eventHandlers={{
                  click: handleRedirect,
               }}
            >
               <Popup>
                  <div
                     className="map-popup-content"
                     onClick={handleRedirect}
                  >
                     <strong>{name}</strong>
                     <br />
                     <span>Click for directions</span>
                  </div>
               </Popup>
            </Marker>
         </MapContainer>
      </div>
   );
}

export default MapComponent;
