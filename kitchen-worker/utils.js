function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function calculatePrepTime(items) {
    const numberOfItems = items.reduce((acc, item) => acc + item.quantity, 0);
    console.log("numberOfItems", numberOfItems);
    
    return 5000 + (numberOfItems * 3000);
  }
  
  module.exports = { delay, calculatePrepTime };