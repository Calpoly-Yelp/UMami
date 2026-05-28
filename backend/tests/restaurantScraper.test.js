import {
   describe,
   it,
   expect,
   jest,
   beforeEach,
   afterEach,
} from "@jest/globals";
import { scrapeRestaurants } from "../utils/restaurantScraper.js";
import { fetchDineOnCampusSource } from "../utils/scrapeCurrentMenus.js";

// Mock node-cron to prevent background tasks during testing
jest.mock("node-cron", () => ({
   schedule: jest.fn(),
}));

// Mock the scraping utility
jest.mock("../utils/scrapeCurrentMenus.js", () => ({
   fetchDineOnCampusSource: jest.fn(),
}));

// Mock Supabase
const mockUpsert = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
   createClient: jest.fn(() => ({
      from: jest.fn(() => ({
         upsert: mockUpsert,
      })),
   })),
}));

describe("restaurantScraper", () => {
   let consoleLogSpy;
   let consoleWarnSpy;
   let consoleErrorSpy;

   // Helper to reduce repetitive mocking of stringified API responses
   const mockScraperResponses = (
      locationData,
      scheduleData = { locations: [] },
   ) => {
      fetchDineOnCampusSource
         .mockResolvedValueOnce(
            JSON.stringify(locationData),
         )
         .mockResolvedValueOnce(
            JSON.stringify(scheduleData),
         );
   };

   // Helper to extract the upserted data payload from the mock call
   const getUpsertedData = () =>
      mockUpsert.mock.calls[0][0];

   beforeEach(() => {
      jest.clearAllMocks();
      // Suppress console output during tests to keep the terminal clean
      consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      consoleWarnSpy = jest
         .spyOn(console, "warn")
         .mockImplementation(() => {});
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});

      mockUpsert.mockResolvedValue({ error: null });
   });

   afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
   });

   it("should successfully scrape and upsert standard array format locations", async () => {
      const mockLocations = [
         {
            id: "loc1",
            name: "Hearth - Lunch",
            latitude: "35.3",
            longitude: "-120.66",
            description: "pizza and pasta",
            categories: "Italian,Pizza",
         },
         {
            id: "loc2",
            name: "Wednesday BBQ",
            concept_types: [{ name: "BBQ" }],
         },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Hearth - Lunch",
               week: [
                  {
                     day: 1, // Monday
                     status: "open",
                     hours: [
                        {
                           start_hour: 10,
                           start_minutes: 30,
                           end_hour: 14,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
               image: "https://apiv4.dineoncampus.com/uploads/images/hearth.png",
            },
            {
               name: "Wednesday BBQ",
               week: [
                  {
                     day: 3, // Wednesday
                     status: "open",
                     hours: [
                        {
                           start_hour: 11,
                           start_minutes: 0,
                           end_hour: 13,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(fetchDineOnCampusSource).toHaveBeenCalledTimes(
         2,
      );
      expect(mockUpsert).toHaveBeenCalled();

      const upsertedData = getUpsertedData();
      expect(upsertedData.length).toBeGreaterThan(0);

      // Check Wednesday BBQ base name fix
      const bbq = upsertedData.find(
         (r) => r.name === "Grill at Campus Market",
      );
      expect(bbq).toBeDefined();

      // Check Hearth tags inference (Pizza/Italian mapping)
      const hearth = upsertedData.find(
         (r) => r.name === "Hearth",
      );
      expect(hearth.tags).toContain("Pizza");
   });

   it("should cover edge cases for categories, loc_id, and skipped log reasons", async () => {
      const mockLocations = [
         {
            id: "v1", // Standard ID
            name: "Valid Place",
            categories: 123, // Number -> not array, not string. Covers [apiCategories] fallback
            address: { lon: "10" }, // Object missing lat to hit the implicit else of if (addrLat)
         },
         {
            _id: "v2", // Fallback ID 1
            name: "Valid Place 2",
            tags: "StringTag1, StringTag2", // string split
            address: "123 String St", // String -> covers false branch of `typeof loc.address === "object"`
         },
         {
            location_id: "v3", // Fallback ID 2
            name: "Valid Place 3",
            address: { lat: "10" }, // Object missing lon to hit the implicit else of if (addrLon)
         },
         {
            id: "ex1",
            name: "Hilltop", // Has hours, Excluded (Covers !EXCLUDED false branch)
         },
         {
            id: "ex2",
            name: "Campus Market", // NO hours, Excluded (Covers short-circuit branches)
         },
         {
            id: "m1",
            name: "Missing Hours Place", // NO hours, Not Excluded
         },
         {
            id: "c1",
            name: "Always Closed Place", // Has schedule entry but no open hours
         },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Valid Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Valid Place 2",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Valid Place 3",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Hilltop",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Always Closed Place",
               week: [
                  { day: 1, status: "closed", hours: [] },
                  { day: 2, status: "open", hours: [] },
               ],
            },
            // Campus Market and Missing Hours Place have no schedule entry
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalled();
      const upsertedData = getUpsertedData();

      expect(
         upsertedData.find((r) => r.name === "Valid Place")
            .menu_source_url,
      ).toBe(
         "https://apiv4.dineoncampus.com/locations/v1/menu",
      );
      expect(
         upsertedData.find(
            (r) => r.name === "Valid Place 2",
         ).menu_source_url,
      ).toBe(
         "https://apiv4.dineoncampus.com/locations/v2/menu",
      );
      expect(
         upsertedData.find(
            (r) => r.name === "Valid Place 3",
         ).menu_source_url,
      ).toBe(
         "https://apiv4.dineoncampus.com/locations/v3/menu",
      );

      // Ensure correct logging branches were hit
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "- Hilltop (Explicitly excluded)",
         ),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "- Campus Market (Explicitly excluded)",
         ),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "- Missing Hours Place (Missing hours)",
         ),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "- Always Closed Place (Missing hours)",
         ),
      );
   });

   it("should handle apiData.data object format", async () => {
      const mockData = {
         data: [{ id: "1", name: "1901 Kitchen - Dinner" }],
      };

      mockScraperResponses(mockData);

      await scrapeRestaurants();
      // With no schedule/hours, it goes into skippedRestaurants
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("Skipped"),
      );
   });

   it("should handle apiData.locations object format", async () => {
      const mockData = {
         locations: [{ id: "1", name: "Poly Choice" }],
      };

      mockScraperResponses(mockData);

      await scrapeRestaurants();
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("Skipped"),
      );
   });

   it("should handle apiData.buildings nested object format", async () => {
      const mockData = {
         buildings: [
            {
               buildingName: "UU",
               // Supplying two names that resolve to the same baseName ("Starbucks") covers the false branch of `if (!groupedLocations[baseName])`
               locations: [
                  { id: "1", name: "Starbucks" },
                  { id: "2", name: "Starbucks - Lunch" },
               ],
            },
            {
               buildingName: "Empty Building", // Missing 'locations' triggers the `(building.locations || [])` fallback
            },
         ],
      };

      mockScraperResponses(mockData);

      await scrapeRestaurants();
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("Skipped"),
      );
   });

   it("should log the raw response and throw an error for unexpected API format", async () => {
      const badApiData = {
         unexpected: "format",
         someKey: "someValue",
      };
      fetchDineOnCampusSource.mockResolvedValueOnce(
         JSON.stringify(badApiData),
      );

      await expect(scrapeRestaurants()).rejects.toThrow(
         "Could not find an array of locations in the API response.",
      );

      // Check for the specific console.error calls before the throw
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         "\n--- UNEXPECTED API RESPONSE ---",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         JSON.stringify(badApiData, null, 2).substring(
            0,
            1000,
         ),
      );
      // Check for the final error logging in the catch block
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         "Error scraping restaurants:",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         expect.objectContaining({
            message:
               "Could not find an array of locations in the API response.",
         }),
      );
   });

   it("should gracefully handle schedule fetch failure", async () => {
      fetchDineOnCampusSource
         .mockResolvedValueOnce(
            JSON.stringify([{ name: "Test Loc" }]),
         )
         .mockRejectedValueOnce(
            new Error("Network Timeout"),
         );

      await scrapeRestaurants();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
         "Could not fetch weekly schedule:",
         "Network Timeout",
      );
      // Since schedule failed, it will have no hours and be skipped
      expect(mockUpsert).not.toHaveBeenCalled();
   });

   it("should correctly parse and merge overlapping schedule intervals and midnight crosses", async () => {
      const mockLocations = [
         { name: "Test Place", id: "t1" },
      ];

      const mockSchedule = {
         theLocations: [
            {
               name: "Test Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 10,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                        {
                           start_hour: 11,
                           start_minutes: 0,
                           end_hour: 13,
                           end_minutes: 0,
                        }, // Overlaps first
                     ],
                  },
                  {
                     day: 2,
                     status: "open",
                     hours: [
                        {
                           start_hour: 22,
                           start_minutes: 0,
                           end_hour: 2,
                           end_minutes: 0,
                        }, // Crosses midnight
                        {
                           start_hour: 1,
                           start_minutes: 0,
                           end_hour: 3,
                           end_minutes: 0,
                        }, // Overlaps with midnight crossing
                     ],
                  },
                  {
                     day: 3,
                     status: "open",
                     hours: [
                        {
                           start_hour: 22,
                           start_minutes: 0,
                           end_hour: 2,
                           end_minutes: 0,
                        },
                        {
                           start_hour: 23,
                           start_minutes: 0,
                           end_hour: 3,
                           end_minutes: 0,
                        }, // intCrossesMidnight && lastCrossesMidnight && interval.end > last.end
                        {
                           start_hour: 23,
                           start_minutes: 30,
                           end_hour: 1,
                           end_minutes: 0,
                        }, // intCrossesMidnight && lastCrossesMidnight && !(interval.end > last.end)
                     ],
                  },
                  {
                     day: 4,
                     status: "open",
                     hours: [
                        {
                           start_hour: 20,
                           start_minutes: 0,
                           end_hour: 22,
                           end_minutes: 0,
                        },
                        {
                           start_hour: 21,
                           start_minutes: 0,
                           end_hour: 2,
                           end_minutes: 0,
                        }, // intCrossesMidnight && !lastCrossesMidnight
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalled();
      const upsertedData = getUpsertedData();
      const testPlace = upsertedData.find(
         (r) => r.name === "Test Place",
      );

      expect(testPlace.hours).toBeDefined();
      // Monday overlap check: 10:00 to 13:00
      expect(testPlace.hours[0]).toBe("10:00:00");
      expect(testPlace.hours[1]).toBe("13:00:00");

      // Wednesday overlap check: 22:00 to 03:00 (index 12 and 13)
      expect(testPlace.hours[12]).toBe("22:00:00");
      expect(testPlace.hours[13]).toBe("03:00:00");

      // Thursday overlap check: 20:00 to 02:00 (index 18 and 19)
      expect(testPlace.hours[18]).toBe("20:00:00");
      expect(testPlace.hours[19]).toBe("02:00:00");
   });

   it("should skip schedule locations with missing or invalid fields", async () => {
      const mockLocations = [
         { name: "Test Place", id: "t1" },
      ];

      const mockSchedule = {
         locations: [
            {
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 10,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            }, // Missing name
            { name: "Test Place" }, // Missing week
            {
               name: "Test Place",
               week: "invalid_week_string",
            }, // week is not an array
            {
               name: "Test Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 10,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            }, // Valid entry to ensure it keeps parsing
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalled();
      const upsertedData = getUpsertedData();
      const testPlace = upsertedData.find(
         (r) => r.name === "Test Place",
      );

      expect(testPlace.hours).toBeDefined();
      expect(testPlace.hours[0]).toBe("10:00:00");
      expect(testPlace.hours[1]).toBe("12:00:00");
   });

   it("should handle alternative scheduleData formats (buildings, data, empty fallback)", async () => {
      const mockLocations = [
         { name: "Fallback Place", id: "f1" },
      ];

      // 1. covers scheduleData.buildings fallback
      mockScraperResponses(mockLocations, {
         buildings: [
            {
               name: "Fallback Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 10,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      });
      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalledTimes(1);

      // 2. covers scheduleData.data fallback
      mockScraperResponses(mockLocations, {
         data: [
            {
               name: "Fallback Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 10,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      });
      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalledTimes(2);

      // 3. covers empty [] fallback
      mockScraperResponses(mockLocations, {
         unexpectedKey: "value",
      });
      await scrapeRestaurants();

      // Count remains 2 because no schedule = no hours = skipped location
      expect(mockUpsert).toHaveBeenCalledTimes(2);
   });

   it("should process multiple schedule locations with the same baseName and handle Sunday (day 0)", async () => {
      const mockLocations = [
         { id: "1", name: "Test Place - Lunch" },
         { id: "2", name: "Test Place - Dinner" },
         { id: "3", name: "Test Place - Late Night" },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Test Place - Lunch",
               week: [
                  {
                     day: 0, // Sunday (covers d.day === 0 branch)
                     status: "open",
                     hours: [
                        {
                           start_hour: 10,
                           start_minutes: 0,
                           end_hour: 14,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
               image: "uploads/images/lunch.png",
            },
            {
               name: "Test Place - Dinner",
               week: [
                  {
                     day: 1, // Monday (covers d.day !== 0 branch)
                     status: "open",
                     hours: [
                        {
                           start_hour: 16,
                           start_minutes: 0,
                           end_hour: 20,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
               image: "uploads/images/dinner.png",
            },
            {
               name: "Test Place - Late Night",
               week: [
                  {
                     day: 2, // Tuesday
                     status: "closed", // Covers the skipped status branches
                     closed: true,
                     hours: [],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalled();
      const upsertedData = getUpsertedData();
      const testPlace = upsertedData.find(
         (r) => r.name === "Test Place",
      );

      expect(testPlace).toBeDefined();

      // Check that both image extractions merged successfully
      expect(testPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/lunch.png",
      );
      expect(testPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/dinner.png",
      );

      // Sunday is mapped to index 6 (6 * 6 = 36)
      expect(testPlace.hours[36]).toBe("10:00:00");
      expect(testPlace.hours[37]).toBe("14:00:00");

      // Monday is mapped to index 0
      expect(testPlace.hours[0]).toBe("16:00:00");
      expect(testPlace.hours[1]).toBe("20:00:00");
   });

   it("should extract tags and images correctly", async () => {
      const mockLocations = [
         {
            name: "Complex Place",
            id: "c1",
            description:
               "vegan salad and sweet bakery items", // Triggers Vegan, Salads, Dessert, Bakery keywords
            address: { lat: 10, lon: 20 },
            // Deeply nested image to test recursive extraction
            nestedObj: {
               arr: [
                  "uploads/images/test.jpg", // /uploads/ path without leading slash
                  "/uploads/images/test2.jpg", // with leading slash
                  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // 32-char hex
                  "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4.png", // 32-char hex with explicit extension (hits the cleanName true branch)
                  "test.jpg", // plain image
                  "http://example.com/image.png", // absolute URL
                  null, // null inside object for extractImages recursive check!
                  undefined, // undefined inside object
               ],
            },
            categories: [
               { name: "RawTag1" }, // Valid object
               { name: 123 }, // Invalid name
               "StringTag", // Valid string
               "   ", // Empty string
               null, // null element
               123, // Invalid category
            ],
            buildingName: "Building 1",
         },
         {
            name: "Building Place 2",
            id: "bp2",
            building: "Building 2",
         },
         {
            name: "Building Place 3",
            id: "bp3",
            location: "Location 3",
         },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Complex Place",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Building Place 2",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Building Place 3",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(mockUpsert).toHaveBeenCalled();
      const upsertedData = getUpsertedData();
      const complexPlace = upsertedData.find(
         (r) => r.name === "Complex Place",
      );

      expect(complexPlace.lat).toBe(10);
      expect(complexPlace.lng).toBe(20);
      expect(
         complexPlace.location_mapping.locations["Default"]
            .label,
      ).toBe("Building 1");

      const bp2 = upsertedData.find(
         (r) => r.name === "Building Place 2",
      );
      expect(
         bp2.location_mapping.locations["Default"].label,
      ).toBe("Building 2");

      const bp3 = upsertedData.find(
         (r) => r.name === "Building Place 3",
      );
      expect(
         bp3.location_mapping.locations["Default"].label,
      ).toBe("Location 3");

      // Check image extraction
      expect(complexPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/test.jpg",
      );
      expect(complexPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/test2.jpg",
      );
      expect(complexPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4.jpg",
      );
      expect(complexPlace.image_urls).toContain(
         "https://apiv4.dineoncampus.com/uploads/images/f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4.png",
      );
      expect(complexPlace.image_urls).toContain(
         "http://example.com/image.png",
      );

      // Check tag extraction from description
      expect(complexPlace.tags).toContain("Vegan");
      expect(complexPlace.tags).toContain("Salads");
      expect(complexPlace.tags).toContain("Dessert");
      expect(complexPlace.tags).toContain("Bakery");
      expect(complexPlace.tags).toContain("Rawtag1");
      expect(complexPlace.tags).toContain("Stringtag");
   });

   it("should map Balance Cafe lat/lng to Hearth lat/lng", async () => {
      const mockLocations = [
         {
            name: "Hearth",
            id: "h1",
            latitude: "35.3",
            longitude: "-120.66",
         },
         {
            name: "Balance Café",
            id: "b1",
            // Missing lat/lng intentionally
         },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Hearth",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Balance Café",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      const upsertedData = getUpsertedData();
      const balanceCafe = upsertedData.find(
         (r) => r.name === "Balance Café",
      );
      const hearth = upsertedData.find(
         (r) => r.name === "Hearth",
      );

      // Balance Cafe should have copied Hearth's coordinates
      expect(hearth.lat).toBe(35.3);
      expect(balanceCafe.lat).toBe(35.3);
      expect(balanceCafe.lng).toBe(-120.66);
   });

   it("should completely exclude EXCLUDED_LOCATIONS", async () => {
      const mockLocations = [
         { name: "Hilltop", id: "ex1" },
         { name: "Poly Produce", id: "ex2" },
         { name: "Valid Restaurant", id: "v1" },
      ];

      const mockSchedule = {
         locations: [
            {
               name: "Hilltop",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
            {
               name: "Valid Restaurant",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      const upsertedData = getUpsertedData();
      expect(upsertedData.length).toBe(1);
      expect(upsertedData[0].name).toBe("Valid Restaurant");

      // Ensures log captures skipped restaurants appropriately
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("Skipped"),
      );
   });

   it("should return early without calling upsert if no valid restaurants exist", async () => {
      const mockLocations = [
         { name: "Hilltop", id: "ex1" },
      ]; // Excluded location
      const mockSchedule = { locations: [] };

      mockScraperResponses(mockLocations, mockSchedule);

      await scrapeRestaurants();

      expect(consoleLogSpy).toHaveBeenCalledWith(
         "No locations found.",
      );
      expect(mockUpsert).not.toHaveBeenCalled();
   });

   it("should catch and log errors thrown by the Supabase upsert operation", async () => {
      const mockLocations = [
         { name: "Valid Restaurant", id: "v1" },
      ];
      const mockSchedule = {
         locations: [
            {
               name: "Valid Restaurant",
               week: [
                  {
                     day: 1,
                     status: "open",
                     hours: [
                        {
                           start_hour: 8,
                           start_minutes: 0,
                           end_hour: 12,
                           end_minutes: 0,
                        },
                     ],
                  },
               ],
            },
         ],
      };

      mockScraperResponses(mockLocations, mockSchedule);

      // Simulate a database crash
      mockUpsert.mockResolvedValueOnce({
         error: new Error("Database Upsert Failed"),
      });

      await expect(scrapeRestaurants()).rejects.toThrow(
         "Database Upsert Failed",
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
         "Error scraping restaurants:",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         new Error("Database Upsert Failed"),
      );
   });

   describe("Scraper Initialization and Manual Execution", () => {
      const OLD_ENV = process.env;
      const originalArgv = process.argv;
      const originalExit = process.exit;

      beforeEach(() => {
         jest.resetModules(); // Crucial for re-running top-level code
         process.env = { ...OLD_ENV };
         process.exit = jest.fn(); // Mock process.exit to prevent tests from stopping
      });

      afterAll(() => {
         process.env = OLD_ENV;
         process.argv = originalArgv;
         process.exit = originalExit;
      });

      it("should warn if Supabase credentials are not set", async () => {
         process.env.SUPABASE_URL = "";
         process.env.SUPABASE_SECRET_KEY = "";
         const consoleWarnSpy = jest
            .spyOn(console, "warn")
            .mockImplementation(() => {});

         // Dynamically import to trigger top-level checks
         await import("../utils/restaurantScraper.js");

         expect(consoleWarnSpy).toHaveBeenCalledWith(
            "Supabase credentials missing. Scraper will not run.",
         );
         consoleWarnSpy.mockRestore();
      });

      it("should schedule a cron job if NODE_ENV is not 'test'", async () => {
         process.env.NODE_ENV = "production";

         // Mock cron before importing
         const cron = await import("node-cron");
         const scheduleSpy = jest.spyOn(cron, "schedule");

         await import("../utils/restaurantScraper.js");

         expect(scheduleSpy).toHaveBeenCalledWith(
            "0 8 * * 1",
            expect.any(Function),
         );

         // Execute the cron callback directly to test the `.catch(() => {})` logic
         const cronCallback = scheduleSpy.mock.calls[0][1];
         const { fetchDineOnCampusSource } =
            await import("../utils/scrapeCurrentMenus.js");
         fetchDineOnCampusSource.mockRejectedValueOnce(
            new Error("Cron execution failed"),
         );
         cronCallback();
         await new Promise((resolve) =>
            setTimeout(resolve, 200),
         );

         scheduleSpy.mockRestore();
      });

      it("should execute successfully from cron job", async () => {
         process.env.NODE_ENV = "production";
         const cron = await import("node-cron");
         const scheduleSpy = jest.spyOn(cron, "schedule");
         await import("../utils/restaurantScraper.js");

         const cronCallback = scheduleSpy.mock.calls[0][1];
         const { fetchDineOnCampusSource } =
            await import("../utils/scrapeCurrentMenus.js");
         fetchDineOnCampusSource
            .mockResolvedValueOnce(JSON.stringify([]))
            .mockResolvedValueOnce(
               JSON.stringify({ locations: [] }),
            );

         mockUpsert.mockResolvedValue({ error: null });

         cronCallback();
         await new Promise((resolve) =>
            setTimeout(resolve, 200),
         );

         scheduleSpy.mockRestore();
      });

      it("should trigger scrapeRestaurants and exit with 0 on success when run as main script", async () => {
         process.argv = [
            "node",
            "/path/to/backend/utils/restaurantScraper.js",
         ];

         // Mock dependencies of scrapeRestaurants
         const { fetchDineOnCampusSource } =
            await import("../utils/scrapeCurrentMenus.js");
         fetchDineOnCampusSource
            .mockResolvedValueOnce(
               JSON.stringify([{ name: "Test", id: "1" }]),
            )
            .mockResolvedValueOnce(
               JSON.stringify({
                  locations: [
                     {
                        name: "Test",
                        week: [
                           {
                              day: 1,
                              status: "open",
                              hours: [
                                 {
                                    start_hour: 8,
                                    end_hour: 10,
                                 },
                              ],
                           },
                        ],
                     },
                  ],
               }),
            );

         mockUpsert.mockResolvedValue({ error: null });

         // Dynamically import to trigger the script execution logic
         await import("../utils/restaurantScraper.js");

         // Allow async operations in scrapeRestaurants to complete
         await new Promise((resolve) =>
            setTimeout(resolve, 200),
         );

         expect(fetchDineOnCampusSource).toHaveBeenCalled();
         expect(mockUpsert).toHaveBeenCalled();
         expect(process.exit).toHaveBeenCalledWith(0);
      });

      it("should log an error and exit with 1 on failure when run as main script", async () => {
         process.argv = [
            "node",
            "/path/to/backend/utils/restaurantScraper.js",
         ];

         const { fetchDineOnCampusSource } =
            await import("../utils/scrapeCurrentMenus.js");
         fetchDineOnCampusSource.mockRejectedValue(
            new Error("API is down"),
         );
         const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});
         await import("../utils/restaurantScraper.js");
         await new Promise((resolve) =>
            setTimeout(resolve, 200),
         );
         expect(fetchDineOnCampusSource).toHaveBeenCalled();
         expect(consoleErrorSpy).toHaveBeenCalledWith(
            new Error("API is down"),
         );
         expect(process.exit).toHaveBeenCalledWith(1);
         consoleErrorSpy.mockRestore();
      });
   });
});
