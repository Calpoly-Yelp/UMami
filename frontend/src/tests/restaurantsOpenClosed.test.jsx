import "../test-setup.js";
import {
   describe,
   test,
   expect,
   beforeEach,
   afterEach,
   jest,
} from "@jest/globals";
import { getIsOpenNow } from "../utils/getIsOpenNow";

describe("getIsOpenNow", () => {
   beforeEach(() => {
      jest.useFakeTimers();
   });

   afterEach(() => {
      jest.useRealTimers();
   });

   test("returns true when the restaurant is currently open", () => {
      jest.setSystemTime(new Date("2025-06-02T12:00:00"));

      const restaurant = {
         hours: [
            "09:00:00",
            "17:00:00",
            ...Array(12).fill(null),
         ],
      };

      expect(getIsOpenNow(restaurant)).toBe(true);
   });

   test("returns false when the restaurant is currently closed", () => {
      jest.setSystemTime(new Date("2025-06-02T20:00:00"));

      const restaurant = {
         hours: [
            "09:00:00",
            "17:00:00",
            ...Array(12).fill(null),
         ],
      };

      expect(getIsOpenNow(restaurant)).toBe(false);
   });

   test("returns true for overnight hours that cross midnight", () => {
      jest.setSystemTime(new Date("2025-06-02T23:00:00"));

      const restaurant = {
         hours: [
            "21:00:00",
            "02:00:00",
            ...Array(12).fill(null),
         ],
      };

      expect(getIsOpenNow(restaurant)).toBe(true);
   });

   test("returns false when no hours are available", () => {
      jest.setSystemTime(new Date("2025-06-02T12:00:00"));

      const restaurant = {
         hours: [],
      };

      expect(getIsOpenNow(restaurant)).toBe(false);
   });
});
