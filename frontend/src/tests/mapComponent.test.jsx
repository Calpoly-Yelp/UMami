import "../test-setup.js";
import {
   describe,
   test,
   expect,
   jest,
   beforeAll,
   afterAll,
   beforeEach,
} from "@jest/globals";
import {
   render,
   screen,
   fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import MapComponent from "../components/mapComponent.jsx";

// Mock Leaflet to handle the L.icon call and prototype modification in the component
jest.mock("leaflet", () => ({
   icon: jest.fn(),
   Marker: {
      prototype: {
         options: {},
      },
   },
}));

// Mock React Leaflet components since JSDOM doesn't support full map rendering
jest.mock("react-leaflet", () => ({
   MapContainer: ({ children }) => (
      <div data-testid="map-container">{children}</div>
   ),
   TileLayer: () => <div data-testid="tile-layer" />,
   Marker: ({ children, eventHandlers }) => (
      <div
         data-testid="marker"
         onClick={eventHandlers?.click}
      >
         {children}
      </div>
   ),
   Popup: ({ children }) => (
      <div data-testid="popup">{children}</div>
   ),
}));

describe("MapComponent", () => {
   // Mock window.open
   const originalOpen = window.open;
   const mockOpen = jest.fn();

   beforeAll(() => {
      window.open = mockOpen;
   });

   afterAll(() => {
      window.open = originalOpen;
   });

   beforeEach(() => {
      mockOpen.mockClear();
   });

   test("renders the map container and marker", () => {
      render(<MapComponent />);
      expect(
         screen.getByTestId("map-container"),
      ).toBeInTheDocument();
      expect(
         screen.getByTestId("marker"),
      ).toBeInTheDocument();
   });

   test("displays the location name in the popup", () => {
      const testName = "Test Restaurant";
      render(<MapComponent name={testName} />);
      expect(
         screen.getByText(testName),
      ).toBeInTheDocument();
   });

   test("opens Google Maps with address when marker is clicked", () => {
      const props = {
         name: "Burger Joint",
         address: "123 Main St, Cityville",
         lat: 10,
         lng: 10,
      };
      render(<MapComponent {...props} />);

      const marker = screen.getByTestId("marker");
      fireEvent.click(marker);

      // Expect URL encoded address
      const expectedUrl =
         "https://www.google.com/maps/dir/?api=1&destination=123%20Main%20St%2C%20Cityville";
      expect(mockOpen).toHaveBeenCalledWith(
         expectedUrl,
         "_blank",
         "noopener,noreferrer",
      );
   });

   test("opens Google Maps with coordinates when address is missing", () => {
      const props = {
         name: "Hidden Gem",
         address: "",
         lat: 35.5,
         lng: -120.5,
      };
      render(<MapComponent {...props} />);

      const marker = screen.getByTestId("marker");
      fireEvent.click(marker);

      const expectedUrl =
         "https://www.google.com/maps/dir/?api=1&destination=35.5,-120.5";
      expect(mockOpen).toHaveBeenCalledWith(
         expectedUrl,
         "_blank",
         "noopener,noreferrer",
      );
   });

   test("opens Google Maps when clicking the popup content", () => {
      const props = {
         name: "Popup Click Test",
         address: "456 Elm St",
      };
      render(<MapComponent {...props} />);

      // Find the clickable content inside the popup
      const popupContent = screen.getByText(
         "Click for directions",
      );
      fireEvent.click(popupContent);

      const expectedUrl =
         "https://www.google.com/maps/dir/?api=1&destination=456%20Elm%20St";
      expect(mockOpen).toHaveBeenCalledWith(
         expectedUrl,
         "_blank",
         "noopener,noreferrer",
      );
   });
});
