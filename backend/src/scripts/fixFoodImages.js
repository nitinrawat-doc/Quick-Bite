/**
 * QuickBite Food Image Repair Migration (Delegates to centralized batch migration)
 */

'use strict';

const batchFixFoodImages = require('./batchFixFoodImages');

if (require.main === module) {
  batchFixFoodImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = batchFixFoodImages;
