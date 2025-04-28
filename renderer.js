let stockData;
let activityLog;
let prevOrder;
let customConfig;

async function loadData() {
  stockData = JSON.parse(await window.dataStore.readDataStore('stockData.json'))
  activityLog = JSON.parse(await window.dataStore.readDataStore('activityLog.json'))
  prevOrder = JSON.parse(await window.dataStore.readDataStore('previousOrderNumber.json'))

  displayStock()
  displayLog()
}

async function loadConfig() {
  customConfig = JSON.parse(await window.dataStore.readDataStore('config.json'))
  document.getElementById("ProgramTitle").textContent = customConfig.title;
}

async function displayStock() {
  const stockListDiv = document.getElementById('stock-list');
  stockListDiv.innerHTML = '';

  for (const itemKey in stockData) {
    const item = stockData[itemKey];
    const itemDiv = document.createElement('div');

    if (item.hideorder === true){
      itemDiv.className = 'item-container green-bg';
    } else if (item.quantity <= item.verylow) {
      itemDiv.className = 'item-container red-bg';
    } else if (item.quantity <= item.low) {
      itemDiv.className = 'item-container orange-bg';
    } else {
      itemDiv.className = 'item-container green-bg';
    }

    const OrderStatus = item.orders.length > 0 && !item.hideorder ?
      `<span class="Order">- ${item.orders.map(order => `Order ${order.orderNumber} (${order.quantity} items)`).join(', ')}</span>` :
      '';

      itemDiv.innerHTML = `
      <div>
        <h3>
          ${item.name} 
          ${item.model ? '- <span style="font-size: 0.8em;">' + item.model + '</span>' : ''}
        </h3>
        <p>Quantity: <span class="quantity">${item.quantity}</span> ${OrderStatus}</p>
      </div>
      <div class="buttons-container">
        <div class="buttons">
          <button onclick="openModal('takeOutOfStock', '${itemKey}')">Take Out of Stock</button>
          ${!item.hideorder ? `
            <button onclick="openModal('orderItem', '${itemKey}')">Order</button>
            <button onclick="openModal('addToStock', '${itemKey}')">Order Arrived</button>
          ` : `<span style="padding-top: 7px;">Don't Order More Stock</span>`}
        </div>
        <div class="edit-buttons">
          <button class="edit-button" onclick="openEditModal('${itemKey}')">Edit Quantity</button>
          <button class="edit-button" onclick="openThresholdModal('${itemKey}')">Edit Properties</button>
        </div>
      </div>
    `;    

    stockListDiv.appendChild(itemDiv);
  }
}

async function displayLog() {
  const logContainer = document.getElementById('activity-log');
  logContainer.innerHTML = '';

  activityLog.slice(0, 1000).forEach(entry => {
    const logEntryDiv = document.createElement('div');
    logEntryDiv.className = 'log-entry';
    logEntryDiv.textContent = entry;
    logContainer.appendChild(logEntryDiv);
  });
}

async function saveStockData() {
  await window.dataStore.writeDataStore('stockData.json',stockData)
}

async function openModal(action, itemKey) {
  const modal = document.getElementById('action-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmButton = document.getElementById('modal-confirm-button');
  const item = stockData[itemKey];

  modalBody.innerHTML = '';

  if (action === 'takeOutOfStock') {
    modalTitle.innerHTML= `Take Out of Stock: <br> <i>${item.name}</i>`;
    modalBody.innerHTML = `
      <input type="text" id="user-name" class="modal-input" placeholder="Enter your name">
      <input type="number" id="quantity" class="modal-input" placeholder="Quantity" min="1">
      <input type="text" id="task-reference" class="modal-input" placeholder="Task reference number or description of use">
    `;
    confirmButton.onclick = async function() {
      takeOutOfStock(itemKey);
    };
  } else if (action === 'orderItem') {
    modalTitle.innerHTML = `Order Stock: <br> <i>${item.name}</i>`;
    modalBody.innerHTML = `
      <p>Recommended Maximum Stock: ${item.max}</p>
      <input type="text" id="user-name" class="modal-input" placeholder="Enter your name">
      <input type="number" id="order-quantity" class="modal-input" placeholder="Quantity" min="1">
    `;
    confirmButton.onclick = async function() {
      await orderItem(itemKey);
      const tempQuantity = document.getElementById('order-quantity').value;
      let tmporderNumber = `${customConfig.orderPrefix}#${prevOrder.toString().padStart(6, '0')}`;
      showAlert(`${customConfig.orderMessage}<br>${tempQuantity} ${item.name}(s)<br>${item.model}${item.specs ? `<br>(${item.specs})` : ''}<br>Order Number: ${tmporderNumber}`);
    };
  } else if (action === 'addToStock') {
    modalTitle.innerHTML = `Order Arrived: <br> <i>${item.name}</i>`;
    modalBody.innerHTML = `
      <input type="text" id="user-name" class="modal-input" placeholder="Enter your name">
      <select id="order-selection" class="modal-select">
        <option value="">Select an order</option>
        ${item.orders.map((order, index) => `
          <option value="${index}">Order ${order.orderNumber} (${order.quantity} items)</option>
        `).join('')}
      </select>
    `;
    confirmButton.onclick = async function() {
      addToStock(itemKey);
    };
  }

  modal.style.display = "block";
}

async function closeModal(isAlert = false) {
  if (isAlert) {
    document.getElementById('alert-modal').style.display = "none";
  } else {
    document.getElementById('action-modal').style.display = "none";
    document.getElementById('alert-modal').style.display = "none";
  }
}

async function showAlert(message) {
  const alertMessage = document.getElementById('alert-message');
  alertMessage.innerHTML = message;
  document.getElementById('alert-modal').style.display = "block";
}

async function addToLog(action, name, itemName, quantity, additionalInfo = "") {
  const timestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let logEntry = `${timestamp} - ${name} - ${action}`;

  if (action.includes('Order Arrived')) {
    logEntry = `${timestamp} - ${name} - Order Arrived: ${quantity} ${itemName}(s) - ${additionalInfo}`;
  } else if (action.includes('Order')) {
    logEntry = `${timestamp} - ${name} - Ordered: ${quantity} ${itemName}(s) - ${additionalInfo}`;
  } else if (action.includes('Took out of Stock')) {
    logEntry = `${timestamp} - ${name} - Took out of Stock: ${quantity} ${itemName}(s) - ${additionalInfo}`;
  } else if (action === 'Edit Quantity') {
    logEntry = `${timestamp} - ${name} - Edit Quantity: ${itemName} - From ${additionalInfo.oldQuantity} to ${additionalInfo.newQuantity} - ${additionalInfo.description}`;
  } else if (action === 'Edit Properties') {
    logEntry = `${timestamp} - ${name} - ${action} - ${itemName}`;
  }

  activityLog.unshift(logEntry);

  await window.dataStore.writeDataStore('activityLog.json', activityLog)

  }

async function takeOutOfStock(itemKey) {
  const userName = document.getElementById('user-name').value;
  const quantity = parseInt(document.getElementById('quantity').value, 10);
  const taskReference = document.getElementById('task-reference').value;
  const item = stockData[itemKey];

  if (!userName || isNaN(quantity) || quantity <= 0 || !taskReference) {
    showAlert("Please fill in all fields.");
    return;
  }

  if (item && item.quantity >= quantity) {
    item.quantity -= quantity;
    addToLog(`Took out of Stock`, userName, item.name, quantity, taskReference);
    showAlert(`${userName} took out ${quantity} ${item.name}(s) for task reference: ${taskReference}`);
    closeModal();
  } else {
    showAlert("Item not found or insufficient stock.");
  }

  saveStockData();
  loadData();
}

async function orderItem(itemKey) {
  const userName = document.getElementById('user-name').value;
  const quantity = parseInt(document.getElementById('order-quantity').value, 10);

  if (!userName || isNaN(quantity) || quantity <= 0) {
    showAlert("Please fill in all fields.");
    return;
  }

  prevOrder = prevOrder + 1;
  window.dataStore.writeDataStore("previousOrderNumber.json", prevOrder)
  let orderNumber = `${customConfig.orderPrefix}#${prevOrder.toString().padStart(6, '0')}`;

  const item = stockData[itemKey];
  if (item) {
    item.orders.push({ orderNumber, quantity });
    addToLog(`Order`, userName, item.name, quantity, orderNumber);
    showAlert(`${userName} Order ${quantity} ${item.name}(s).`);
    closeModal();
  } else {
    showAlert("Item not found.");
  }

  saveStockData();
  loadData();
}

async function addToStock(itemKey) {
  const userName = document.getElementById('user-name').value;
  const selectedOrderIndex = parseInt(document.getElementById('order-selection').value, 10);
  const item = stockData[itemKey];

  if (!userName || selectedOrderIndex === "") {
    showAlert("Please fill in all fields.");
    return;
  }

  const selectedOrder = item.orders[selectedOrderIndex];

  if (selectedOrder) {
    item.quantity += selectedOrder.quantity;
    item.orders.splice(selectedOrderIndex, 1);
    addToLog(`Order Arrived`, userName, item.name, selectedOrder.quantity, selectedOrder.orderNumber);
    showAlert(`${userName} added ${selectedOrder.quantity} ${item.name}(s) to stock.`);
    closeModal();
  } else {
    showAlert("Order not found.");
  }

  saveStockData();
  loadData();
}

async function openEditModal(itemKey) {
  const item = stockData[itemKey];
  const currentQuantity = item.quantity;
  const modal = document.getElementById('action-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmButton = document.getElementById('modal-confirm-button');

  modalTitle.innerHTML = `Edit Quantity: <br> <i>${item.name}</i>`;
  modalBody.innerHTML = `
    <p>Recommended Maximum Stock: ${item.max}</p>
    <input type="text" id="user-name" class="modal-input" placeholder="Enter your name">
    <textarea id="description" class="modal-input" placeholder="Description of edit"></textarea>
    <input type="number" id="updated-quantity" class="modal-input" placeholder="Updated quantity" value="${currentQuantity}">
  `;
  confirmButton.onclick = async function() {
    manualEditQuantity(itemKey);
  };

  modal.style.display = "block";
}

async function manualEditQuantity(itemKey) {
  const userName = document.getElementById('user-name').value;
  const description = document.getElementById('description').value;
  const updatedQuantity = parseInt(document.getElementById('updated-quantity').value, 10);

  if (!userName || !description || isNaN(updatedQuantity)) {
    showAlert("Please fill in all fields.");
    return;
  }

  const item = stockData[itemKey];
  if (item) {
    const oldQuantity = item.quantity;
    item.quantity = updatedQuantity;

    addToLog('Edit Quantity', userName, item.name, updatedQuantity, {
      oldQuantity: oldQuantity,
      newQuantity: updatedQuantity,
      description: description
    });

    showAlert(`${userName} manually updated ${item.name} quantity from ${oldQuantity} to ${updatedQuantity} for: ${description}`);
    closeModal();
  } else {
    showAlert("Item not found.");
  }

  saveStockData();
  loadData();
}

async function openThresholdModal(itemKey) {
  const item = stockData[itemKey];
  const modal = document.getElementById('action-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmButton = document.getElementById('modal-confirm-button');

  modalTitle.innerHTML = `Edit Properties: <br> <i>${item.name}</i>`;
  modalBody.innerHTML = `
    <p style="display: inline;">Item:</p>
    <input id="item-threshold" class="modal-input" placeholder="Item Name threshold" value="${item.name}" style="display: inline;">
    <br>

    <p style="display: inline;">Model:</p>
    <input id="model-threshold" class="modal-input" placeholder="Item Model threshold" value="${item.model}" style="display: inline;">
    <br>

    <p style="display: inline;">Specs:</p>
    <input id="Specs-threshold" class="modal-input" placeholder="Item Specs threshold" value="${item.specs}" style="display: inline;">
    <br>

    <p style="display: inline;">Max Stock:</p>
    <input type="number" id="max-threshold" class="modal-input" placeholder="Maximum threshold" value="${item.max}" style="display: inline;">
    <br>

    <p style="display: inline;">Low Stock:</p>
    <input type="number" id="low-threshold" class="modal-input" placeholder="Low threshold" value="${item.low}" style="display: inline;">
    <br>

    <p style="display: inline;">Very Low Stock:</p>
    <input type="number" id="verylow-threshold" class="modal-input" placeholder="Very low threshold" value="${item.verylow}" style="display: inline;">

    <p></p>
    <p style="display: inline;">Don't Order More Stock:</p>
    <input type="checkbox"  id="hideorder-threshold" name="Hide Order Options" value="true" ${item.hideorder ? 'checked' : ''}>
  `;
  confirmButton.onclick = async function() {
    manualEditThreshold(itemKey);
  };

  modal.style.display = "block";
}

async function manualEditThreshold(itemKey) {
  const lowThreshold = parseInt(document.getElementById('low-threshold').value, 10);
  const veryLowThreshold = parseInt(document.getElementById('verylow-threshold').value, 10);
  const maxThreshold = parseInt(document.getElementById('max-threshold').value, 10);
  const ItemName = document.getElementById('item-threshold').value;
  const ItemModel = document.getElementById('model-threshold').value;
  const ItemSpecs = document.getElementById('Specs-threshold').value;
  const hideOrder = document.getElementById('hideorder-threshold').checked;

  if (isNaN(lowThreshold) || isNaN(veryLowThreshold) || isNaN(maxThreshold) || !ItemName || !ItemModel) {
    showAlert("Please fill in all fields.");
    return;
  }

  const item = stockData[itemKey];
  if (item) {
    const oldLow = item.low;
    const oldVeryLow = item.verylow;
    const oldMax = item.max;
    const oldItemName = item.name;
    const oldItemModel = item.model;
    const oldItemSpecs = item.specs;
    const oldHideOrder = item.hideorder

    item.low = lowThreshold;
    item.verylow = veryLowThreshold;
    item.max = maxThreshold;
    item.name = ItemName;
    item.model = ItemModel;
    item.hideorder = hideOrder
    if (!(ItemSpecs == "undefined" || ItemSpecs == "")){
      item.specs = ItemSpecs;
    }
    closeModal();
  } else {
    showAlert("Item not found.");
  }
  addToLog('Edit Properties', 'System', ItemName);
  saveStockData();
  loadData();
}

async function openRemoveItemModal() {
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmButton = document.getElementById('modal-confirm-button');

    modalTitle.innerHTML = 'Remove Stock Item';
    
    let options = '';
    for (const [id, item] of Object.entries(stockData)) {
        options += `<option value="${id}">${item.name}</option>`;
    }
    
    modalBody.innerHTML = `
        <div>
            <label for="remove-item">Select Item to Remove</label>
            <select id="remove-item" class="modal-input" required>
                <option value="">-- Select an Item --</option>
                ${options}
            </select>
        </div>
    `;

    confirmButton.onclick = async function() {
        removeItemFromStock();
    };

    modal.style.display = "block";
}

async function removeItemFromStock() {
    const selectedItemId = document.getElementById('remove-item').value;

    if (!selectedItemId) {
        showAlert("Please select an item to remove.");
        return;
    }

    delete stockData[selectedItemId];

    saveStockData();

    addToLog('Remove Item', 'System', stockData[selectedItemId]?.name || 'Unknown Item', 0, 'Item removed from stock');

    closeModal();

    loadData();
}

async function openAddItemModal() {
  const modal = document.getElementById('action-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmButton = document.getElementById('modal-confirm-button');
  
  modalTitle.innerHTML = 'Add New Stock Item';
  modalBody.innerHTML = `
      <div>
          <input type="text" id="item-name" class="modal-input" placeholder="Item Name" required>
          <input type="text" id="item-model" class="modal-input" placeholder="Item Model">
          <input type="text" id="item-specs" class="modal-input" placeholder="Item Specifications">
          <input type="number" id="item-max" class="modal-input" placeholder="Maximum Stock Level" min="1" required>
          <input type="number" id="item-low" class="modal-input" placeholder="Low Stock Threshold" min="1" required>
          <input type="number" id="item-verylow" class="modal-input" placeholder="Very Low Stock Threshold" min="1" required>
          <input type="number" id="item-quantity" class="modal-input" placeholder="Initial Quantity" min="0" required>
          <p></p>
          <p style="display: inline; color: gray">Don't Order More Stock:</p>
          <input type="checkbox"  id="hideorder-threshold" name="Hide Order Options" value="true">
      </div>
  `;
  
  confirmButton.onclick = async function() {
    addItemToStock();
  };

  modal.style.display = "block";
}

async function addItemToStock() {
  const itemName = document.getElementById('item-name').value;
  const itemModel = document.getElementById('item-model').value;
  const itemSpecs = document.getElementById('item-specs').value;
  const maxStock = parseInt(document.getElementById('item-max').value, 10);
  const lowStock = parseInt(document.getElementById('item-low').value, 10);
  const veryLowStock = parseInt(document.getElementById('item-verylow').value, 10);
  const initialQuantity = parseInt(document.getElementById('item-quantity').value, 10);
  const hideOrder = document.getElementById('hideorder-threshold').checked;
  
  if (!itemName || isNaN(maxStock) || isNaN(lowStock) || isNaN(veryLowStock) || isNaN(initialQuantity)) {
      showAlert("Please fill in all required fields.");
      return;
  }
  
  if (lowStock > maxStock || veryLowStock > lowStock) {
      showAlert("Threshold values must be in order: Very Low < Low < Maximum");
      return;
  }
  
  const newId = Math.floor(Date.now() / 1000);
  
  stockData[newId] = {
      name: itemName,
      model: itemModel,
      specs: itemSpecs,
      quantity: initialQuantity,
      low: lowStock,
      verylow: veryLowStock,
      max: maxStock,
      hideorder: hideOrder,
      orders: []
  };
  
  await saveStockData();
  
  await addToLog('Add Item', 'System', itemName, initialQuantity, 'New item added to stock');
  
  showAlert("Item added successfully!");
  closeModal();
  
  loadData();
}

loadConfig()
loadData();