document.addEventListener('DOMContentLoaded', () => {
    fetchInventory();
    fetchMenu();
    setupSocket();
  });
  
  function fetchInventory() {
    fetch('/api/inventory')
        .then(response => response.json())
        .then(data => {
            const inventoryList = document.getElementById('inventory-list');
            inventoryList.innerHTML = ''; // Clear the list before appending new items
            data.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = `${item.name}: ${item.quantity}`;
                inventoryList.appendChild(listItem);
            });
        });
  }
  
  function fetchMenu() {
    fetch('/api/menu')
        .then(response => response.json())
        .then(data => {
            const menuList = document.getElementById('menu-list');
            menuList.innerHTML = ''; // Clear the list before appending new items
            data.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item.item;
  
                // Create a "Sell" button for each product
                const sellButton = document.createElement('button');
                sellButton.textContent = 'Sell';
                sellButton.addEventListener('click', () => sellProduct(item.item));
  
                listItem.appendChild(sellButton);
                menuList.appendChild(listItem);
            });
        });
  }
  
  function sellProduct(productName) {
    fetch(`/sell/${productName}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error selling product:', error);
    });
  }
  

  function setupSocket() {
    const socket = io.connect();
  
    socket.on('itemSold', (productName) => {
        console.log(`Item sold: ${productName}`);
        fetchInventory(); // Refresh the inventory list when an item is sold
    });
  }

