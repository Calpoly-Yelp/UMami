import { describe, expect, it } from "@jest/globals";
import {
   buildMenuUrl,
   parseSubwayNutritionText,
   replaceRestaurantMenu,
} from "../utils/scrapeCurrentMenus.js";

describe("Subway menu scraping", () => {
   it("resolves the Subway nutrition alias to the official PDF", () => {
      expect(buildMenuUrl("subway:nutrition")).toBe(
         "https://www.subway.com/en-us/-/media/northamerica/usa/nutrition/nutritiondocuments/2026/us_nutrition_en_1-2026.pdf",
      );
   });

   it("parses Subway nutrition PDF text into menu items", () => {
      const text = `
         6" Sandwiches
         Cheesesteaks
         6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100
         Wraps
         Chicken
         Grilled Chicken 349 680 31 9 1 135 1240 55 3 5 1 48 25 15 25 20
         Cookies & Sides
         White Chip Macadamia Nut Cookie 45 210 10 5 0 15 125 28 <1 17 17 2 0 0 0 10
      `;

      expect(
         parseSubwayNutritionText(text, {
            sourceUrl: "subway.pdf",
         }),
      ).toEqual([
         expect.objectContaining({
            category: '6" Sandwiches - Cheesesteaks',
            name: '6" Steak Philly',
            portion: "192 g",
            calories: 510,
            fat: "25g",
            carbs: "43g",
            protein: "28g",
            meal_period: "every-day",
            source_url: "subway.pdf",
         }),
         expect.objectContaining({
            category: "Wraps - Chicken",
            name: "Grilled Chicken",
            portion: "349 g",
            calories: 680,
            fat: "31g",
            carbs: "55g",
            protein: "48g",
         }),
         expect.objectContaining({
            category: "Cookies & Sides",
            name: "White Chip Macadamia Nut Cookie",
            portion: "45 g",
            calories: 210,
            carbs: "28g",
            protein: "2g",
         }),
      ]);
   });
});

describe("menu replacement safety", () => {
   it("does not delete existing rows when no items were parsed", async () => {
      const result = await replaceRestaurantMenu({
         restaurantId: 13,
         items: [],
         mealPeriod: "lunch",
      });

      expect(result).toEqual([]);
   });
});
