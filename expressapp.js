const express = require('express');
const cors = require('cors');
const { getProducts, getInventory, getMenu } = require('./database');
const { sendLowInventoryEmail } = require('./emailer');

const app = express();
const PORT = 3000;

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { sellItem } = require('./menu'); 

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve static files from the 'public' directory

// API Endpoints
app.get('/api/products', async (req, res) => {
    const products = await getProducts();
    res.json(products);
});

app.get('/api/inventory', async (req, res) => {
    const inventory = await getInventory();
    res.json(inventory);
});

app.get('/api/menu', async (req, res) => {
    const menu = await getMenu();
    res.json(menu);
});

app.post('/sell/:productName', async (req, res) => {
  const productName = req.params.productName;
  try {
      const result = await sellItem(productName);
      if (result) {
          io.emit('itemSold', productName); // Emit an event to update the frontend
          res.status(200).send({ message: `Sold one ${productName}.` });
      } else {
          res.status(400).send({ message: `Item "${productName}" cannot be sold due to ingredient shortage.` });
      }
  } catch (error) {
      console.error('Error selling product:', error); // Log fejlmeddelelsen
      res.status(500).send({ message: 'Error selling product', error });
  }
});


// Node mailer. Function to check inventory levels
const checkInventoryLevels = () => {
    getInventory().then(inventory => {
      inventory.forEach(item => {
        if (item.quantity < 50) {
          sendLowInventoryEmail(item.name);
        }
      });
    }).catch(error => {
      console.error('Failed to check inventory levels:', error);
    });
  };

// Start the server
http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// You might want to call checkInventoryLevels() at a regular interval or after certain actions
// For example, using setInterval to check every hour
setInterval(checkInventoryLevels, 3600000); // 3600000 milliseconds = 1 hour
