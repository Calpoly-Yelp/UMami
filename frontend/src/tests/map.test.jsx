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
import Map from "../components/Map.jsx";

// Mock Leaflet to handle the L.icon call and prototype modification in the component
jest.mock("leaflet", () => ({
   icon: jest.fn(),
   divIcon: jest.fn(),
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
   Tooltip: ({ children }) => (
      <div data-testid="tooltip">{children}</div>
   ),
   useMap: () => ({
      setView: jest.fn(),
      getContainer: jest.fn(() => ({})),
      invalidateSize: jest.fn(),
   }),
}));

global.ResizeObserver = jest
   .fn()
   .mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
   }));

describe("Map", () => {
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
      render(<Map />);
      expect(
         screen.getByTestId("map-container"),
      ).toBeInTheDocument();
      expect(
         screen.getByTestId("marker"),
      ).toBeInTheDocument();
   });

   test("displays the location name in the popup", () => {
      const testName = "Test Restaurant";
      render(<Map name={testName} />);
      expect(
         screen.getByText(testName),
      ).toBeInTheDocument();
   });

   test("opens Google Maps with coordinates when marker is clicked", () => {
      const props = {
         name: "Burger Joint",
         lat: 10,
         lng: 10,
      };
      render(<Map {...props} />);

      const marker = screen.getByTestId("marker");
      fireEvent.click(marker);

      // Expect coordinates to be used instead of street address for exact pin drop
      const expectedUrl =
         "https://www.google.com/maps/dir/?api=1&destination=10,10";
      expect(mockOpen).toHaveBeenCalledWith(
         expectedUrl,
         "_blank",
         "noopener,noreferrer",
      );
   });

   test("opens Google Maps with coordinates when address is missing", () => {
      const props = {
         name: "Hidden Gem",
         lat: 35.5,
         lng: -120.5,
      };
      render(<Map {...props} />);

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
         lat: 35.3,
         lng: -120.6,
      };
      render(<Map {...props} />);

      // Find the clickable content inside the popup
      const popupContent = screen.getByText(
         "Click for directions",
      );
      fireEvent.click(popupContent);

      const expectedUrl =
         "https://www.google.com/maps/dir/?api=1&destination=35.3,-120.6";
      expect(mockOpen).toHaveBeenCalledWith(
         expectedUrl,
         "_blank",
         "noopener,noreferrer",
      );
   });
});
