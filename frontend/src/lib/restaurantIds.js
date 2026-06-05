export const parseRestaurantPathId = (id) => {
   const restaurantId = Number(id);
   return Number.isInteger(restaurantId) && restaurantId > 0
      ? restaurantId
      : null;
};
