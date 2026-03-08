import MapComponent from "../components/mapComponent.jsx";

function MapSandbox() {
   // Dummy data for testing
   const testLocations = [
      {
         id: 1,
         name: "Shake Smart",
         lat: 35.3005,
         lng: -120.6623,
         address: "1 Grand Ave, San Luis Obispo, CA 93407",
      },
      {
         id: 2,
         name: "Downtown SLO Plaza",
         lat: 35.279,
         lng: -120.664,
         address: "Mission Plaza, San Luis Obispo, CA",
      },
   ];

   return (
      <div
         style={{
            padding: "40px",
            maxWidth: "800px",
            margin: "0 auto",
         }}
      >
         <h1>Map Component Sandbox</h1>
         <p>
            Testing the OpenStreetMap integration and Google
            Maps redirection.
         </p>

         {testLocations.map((loc) => (
            <div
               key={loc.id}
               style={{ marginBottom: "40px" }}
            >
               <h2>{loc.name}</h2>
               <p>Address: {loc.address}</p>
               <MapComponent
                  lat={loc.lat}
                  lng={loc.lng}
                  name={loc.name}
                  address={loc.address}
               />
            </div>
         ))}
      </div>
   );
}

export default MapSandbox;
