const { db, encrypt, decrypt } = require('./database');

// Funktion til at hente mængden af et specifikt element fra databasen
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

// Funktion til at opdatere mængden af et element i lageret
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

// Hjælpefunktion til at hente opskriften for et produkt
async function getRecipe(itemName) {
  return new Promise(async (resolve, reject) => {
    db.get('SELECT ingredient1, quantity1, ingredient2, quantity2, ingredient3, quantity3 FROM menu WHERE item = ?', [itemName], async (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const ingredients = [
          { name: await decrypt(row.ingredient1), quantity: row.quantity1 },
          { name: await decrypt(row.ingredient2), quantity: row.quantity2 },
          { name: await decrypt(row.ingredient3), quantity: row.quantity3 },
        ];
        resolve({ ingredients });
      } else {
        resolve(null);
      }
    });
  });
}





// Funktion til at tjekke, om en vare kan sælges
async function canSellItem(itemName) {
  try {
    const recipe = await getRecipe(itemName);
    if (!recipe) {
      console.error('Opskrift ikke fundet for:', itemName);
      return false;
    }

    for (const ingredient of recipe.ingredients) {
      const quantityAvailable = await getInventoryItemQuantity(ingredient.name);
      if (quantityAvailable < ingredient.quantity) {
        console.error(`Not enough of ${ingredient.name} to sell ${itemName}.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Fejl i canSellItem:', error);
    return false;
  }
}


// Funktion til at sælge en vare
async function sellItem(itemName) {
  if (!await canSellItem(itemName)) {
    throw new Error(`Not enough ingredients to sell ${itemName}.`);
  }

  const recipe = await getRecipe(itemName);
  for (const ingredient of recipe.ingredients) {
    await updateInventoryItemQuantity(ingredient.name, -ingredient.quantity);
  }

  return true;
}


module.exports = { getInventoryItemQuantity, updateInventoryItemQuantity, sellItem, canSellItem };
