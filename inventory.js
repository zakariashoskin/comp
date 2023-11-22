const { db, encrypt, decrypt } = require('./database');

// Function to get the quantity of a specific item from the database
function getInventoryItemQuantity(itemName) {
  return new Promise((resolve, reject) => {
    const encryptedItem = encrypt(itemName);
    db.get('SELECT quantity FROM inventory WHERE item = ?', [encryptedItem.content], (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(row ? row.quantity : 0);
      }
    });
  });
}

// Function to update the quantity of an inventory item
async function updateInventoryItemQuantity(itemName, quantityChange) {
  return new Promise((resolve, reject) => {
    const encryptedItem = encrypt(itemName);
    db.run(
      'UPDATE inventory SET quantity = quantity + ? WHERE item = ?',
      [quantityChange, encryptedItem.content],
      (err) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(true);
        }
      }
    );
  });
}

module.exports = { getInventoryItemQuantity, updateInventoryItemQuantity };
