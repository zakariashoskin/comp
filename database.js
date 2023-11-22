const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Database og krypteringskonfiguration
const db = new sqlite3.Database('storage.db');
const algorithm = 'aes-256-cbc'; 
const secretKey = Buffer.from('ee0b442daa87851bb795aaf2c6c329698dc3491ba19da7885085146b2f3e817b', 'hex');

// Krypterings- og dekrypteringsfunktioner
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};

const decrypt = (hash) => {
  try {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Dekrypteringsfejl:', error.message);
    return null;
  }
};

// Opdateret initializeDatabase funktion
function initializeDatabase() {
  db.serialize(() => {
    // Tilføj et 'iv' felt til 'inventory' tabellen
    db.run('CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY, item TEXT UNIQUE, quantity INTEGER, iv TEXT)');
    
        const items = [
      { item: "coffee beans", quantity: 1000 },
      { item: "whole milk", quantity: 100 },
      { item: "oat milk", quantity: 100 },
      { item: "water", quantity: 100 },
      { item: "oranges", quantity: 100 },
      { item: "apples", quantity: 100 },
      { item: "strawberries", quantity: 100 },
      { item: "blueberries", quantity: 100 },
      { item: "watermelon", quantity: 100 },
      { item: "pineapples", quantity: 100 },
      { item: "lemons", quantity: 100 },
      { item: "caramel", quantity: 100 },
      { item: "chocolate syrup", quantity: 100 },
      { item: "ice", quantity: 100 },
      { item: "vanilla ice cream", quantity: 100 },
      { item: "cup", quantity: 100 }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO inventory (item, quantity, iv) VALUES (?, ?, ?)');
    items.forEach(item => {
      const encryptedItem = encrypt(item.item); // Krypter item
      stmt.run(encryptedItem.content, item.quantity, encryptedItem.iv); // Gem også IV
    });
    stmt.finalize();
  });

  // Create and populate the menu table
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY, item TEXT UNIQUE, ingredient1 TEXT, quantity1 INTEGER, ingredient2 TEXT, quantity2 INTEGER, ingredient3 TEXT, quantity3 INTEGER)');
    const menu = [
      // Coffee Options
      { item: "Caffe Latte", ingredient1: "coffee beans", quantity1: 10, ingredient2: "whole milk", quantity2: 3, ingredient3: "cup", quantity3: 1 },
      { item: "Espresso", ingredient1: "coffee beans", quantity1: 7, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
      { item: "Cappuccino", ingredient1: "coffee beans", quantity1: 8, ingredient2: "whole milk", quantity2: 3, ingredient3: "cup", quantity3: 1 },
      { item: "Mocha", ingredient1: "coffee beans", quantity1: 9, ingredient2: "chocolate syrup", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Americano", ingredient1: "coffee beans", quantity1: 6, ingredient2: "water", quantity2: 4, ingredient3: "cup", quantity3: 1 },
      { item: "Macchiato", ingredient1: "coffee beans", quantity1: 8, ingredient2: "caramel", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Affogato", ingredient1: "coffee beans", quantity1: 7, ingredient2: "vanilla ice cream", quantity2: 1, ingredient3: "cup", quantity3: 1 },
      { item: "Iced Coffee", ingredient1: "coffee beans", quantity1: 12, ingredient2: "ice", quantity2: 6, ingredient3: "cup", quantity3: 1 },

      // Juice Options
      { item: "Orange Juice", ingredient1: "oranges", quantity1: 3, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
      { item: "Apple Juice", ingredient1: "apples", quantity1: 2, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
      { item: "Strawberry Smoothie", ingredient1: "strawberries", quantity1: 5, ingredient2: "whole milk", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Blueberry Smoothie", ingredient1: "blueberries", quantity1: 4, ingredient2: "whole milk", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Mixed Berry Juice", ingredient1: "blueberries", quantity1: 2, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Pineapple Juice", ingredient1: "pineapples", quantity1: 3, ingredient2: "water", quantity2: 1, ingredient3: "cup", quantity3: 1 },
      { item: "Watermelon Juice", ingredient1: "watermelons", quantity1: 4, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 },
      { item: "Lemonade", ingredient1: "lemons", quantity1: 4, ingredient2: "water", quantity2: 2, ingredient3: "cup", quantity3: 1 }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO menu (item, ingredient1, quantity1, ingredient2, quantity2, ingredient3, quantity3) VALUES (?, ?, ?, ?, ?, ?, ?)');
    menu.forEach(item => stmt.run(item.item, item.ingredient1, item.quantity1, item.ingredient2, item.quantity2, item.ingredient3, item.quantity3));
    stmt.finalize();
  });
}



// Opdateret getProducts funktion
function getProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT item, iv FROM inventory', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const products = rows.map((row) => {
          try {
            const decryptedItem = decrypt({ iv: row.iv, content: row.item }); // Dekrypter item
            return decryptedItem;
          } catch (error) {
            console.error('Dekrypteringsfejl:', error.message);
            return 'Ukendt'; // Eller håndter fejlen på en anden måde
          }
        });
        resolve(products);
      }
    });
  });
}

// Opdateret getInventory funktion
function getInventory() {
  return new Promise((resolve, reject) => {
    db.all('SELECT item, quantity, iv FROM inventory', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const inventory = rows.map((row) => {
          // Tjek at både 'item' og 'iv' ikke er null
          if (row.item && row.iv) {
            const decryptedItem = decrypt({ iv: row.iv, content: row.item });
            return { name: decryptedItem, quantity: row.quantity };
          } else {
            // Hvis der mangler data, vises 'Ukendt'
            return { name: 'Ukendt', quantity: row.quantity };
          }
        });
        resolve(inventory);
      }
    });
  });
}


// Function to get menu data from the database
function getMenu() {
  return new Promise((resolve, reject) => {
    db.all('SELECT item, quantity1, quantity2, quantity3 FROM menu', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const menu = rows.map((row) => ({
          item: row.item,
          quantity: row.quantity1 + row.quantity2 + row.quantity3,
        }));
        resolve(menu);
      }
    });
  });
}



function getDecryptedInventory() {
  return new Promise((resolve, reject) => {
    db.all('SELECT item, quantity, iv FROM inventory', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const decryptedInventory = rows.map(row => {
          const decryptedItem = decrypt({ iv: row.iv, content: row.item });
          return { item: decryptedItem, quantity: row.quantity };
        });
        resolve(decryptedInventory);
      }
    });
  });
}


// Funktion til at hente produkter
function getProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT item, iv FROM inventory', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const products = rows.map(row => decrypt({ iv: row.iv, content: row.item }));
        resolve(products);
      }
    });
  });
}

// Funktion til at opdatere lager
function updateInventory(itemName, soldQuantity) {
  const encryptedItem = encrypt(itemName);
  db.get('SELECT quantity FROM inventory WHERE item = ? AND iv = ?', [encryptedItem.content, encryptedItem.iv], (err, row) => {
    if (err) {
      console.error('Fejl ved hentning af lagerdata:', err.message);
      return;
    }
    if (!row || row.quantity < soldQuantity) {
      console.error('Ikke nok lagerbeholdning til at fuldføre salget');
      return;
    }
    const newQuantity = row.quantity - soldQuantity;
    db.run('UPDATE inventory SET quantity = ? WHERE item = ? AND iv = ?', [newQuantity, encryptedItem.content, encryptedItem.iv], (updateErr) => {
      if (updateErr) {
        console.error('Fejl ved opdatering af lager:', updateErr.message);
      }
    });
  });
}




module.exports = { db, initializeDatabase, getProducts, getInventory, getMenu, updateInventory, getDecryptedInventory, encrypt, decrypt };