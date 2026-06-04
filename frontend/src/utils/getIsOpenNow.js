// Determines whether a restaurant is currently open/closed based on hours
export function getIsOpenNow(restaurant) {
   const hours = restaurant.hours || [];
   const locationSchedule =
      restaurant.location_mapping?.schedule;

   const currentDayIdx = (new Date().getDay() + 6) % 7;
   const now = new Date();
   const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

   let intervals = [];

   if (locationSchedule) {
      intervals = locationSchedule[currentDayIdx] || [];
      intervals = intervals.map((s) => ({
         open: s.start,
         close: s.end,
      }));
   } else if (hours.length === 42) {
      for (let i = 0; i < 3; i++) {
         const openTime = hours[currentDayIdx * 6 + i * 2];
         const closeTime =
            hours[currentDayIdx * 6 + i * 2 + 1];

         if (openTime && closeTime) {
            intervals.push({
               open: openTime,
               close: closeTime,
            });
         }
      }
   } else if (hours.length === 14) {
      const openTime = hours[currentDayIdx * 2];
      const closeTime = hours[currentDayIdx * 2 + 1];

      if (openTime && closeTime) {
         intervals.push({
            open: openTime,
            close: closeTime,
         });
      }
   } else if (hours.length === 2) {
      const openTime = hours[0];
      const closeTime = hours[1];

      if (openTime && closeTime) {
         intervals.push({
            open: openTime,
            close: closeTime,
         });
      }
   }

   return intervals.some((interval) => {
      if (!interval.open || !interval.close) return false;

      if (interval.close < interval.open) {
         return (
            currentTimeStr >= interval.open ||
            currentTimeStr <= interval.close
         );
      }

      return (
         currentTimeStr >= interval.open &&
         currentTimeStr <= interval.close
      );
   });
}
