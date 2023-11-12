document.addEventListener("DOMContentLoaded", () => {
  //remove  || window.location.pathname === "/"
  if (window.location.pathname.includes("index.html")) {
    displayTasks();
  } else if (window.location.pathname.includes("view_task.html")) {
    loadTask();
    //setEndAuctionBtnState();
  } else if (window.location.pathname.includes("create_task.html")) {
    document.getElementById("provide-dataset").addEventListener('change', function() {
      document.getElementById("dataset-name").disabled = this.checked;
    });
  }
});


// let bidderAddress = '';
// let filename = '';

//addAsset("asset1")
function resetTasks() {
  localStorage.clear()
  displayTasks();
}

async function createTask() {
  const taskId = document.getElementById("task-id").value;
  const conclusionTime = new Date(document.getElementById("conclusion-time").value).getTime();
  const taskTypeElement = document.querySelector('input[name="task-type"]:checked');
  const taskType = taskTypeElement ? taskTypeElement.value : null;
  const otherTaskType = taskType === 'Other' ? document.getElementById("other-task-type").value : '';
  const provideDataset = document.getElementById("provide-dataset").checked;
  const datasetName = provideDataset ? '' : document.getElementById("dataset-name").value;
  const description = document.getElementById("task-description").value;
  const paymentNetworks = document.querySelectorAll('input[name="payment-network"]:checked');
  const selectedPaymentNetworks = Array.from(paymentNetworks).map(checkbox => checkbox.value);

  const buyerAddress = document.getElementById("buyer-addr").textContent;

  //const buyerAddress = localStorage.getItem("buyerAddress");
  if (!buyerAddress) {
    alert("Please load your key file before submitting the task.");
    return;
  }

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];  
  const mlTask = {
      id: tasks.length + 1,
      taskId: taskId,
      conclusionTime: conclusionTime,
      taskType: otherTaskType || taskType,
      provideDataset: provideDataset,
      datasetName: datasetName,
      description: description,
      paymentOptions: selectedPaymentNetworks,
      claims: [],
      buyerAddress: buyerAddress,
  };

  tasks.push(mlTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  window.location.href = "index.html";
  // Potentially refresh the list of tasks if you're staying on the same page
  // displayTasks();
}

function loadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const reader = new FileReader();

  //window.alert("load?");
  reader.onload = function (event) {
    const contents = event.target.result;
    const json = JSON.parse(contents);

    let userAddress = json.address;
    //window.alert(bidderAddress);
    const shortenedBidderAddress = userAddress.slice(0, 5) + '...' + userAddress.slice(-5);
    document.getElementById("user-address").textContent = "0x" + shortenedBidderAddress;
    filename = file.name;

    localStorage.setItem("userAddress", userAddress); 
    // localStorage.setItem("buyerAddress", userAddress);

    if (window.location.pathname.includes("view_task.html")) {
      loadTask();
      document.getElementById("claim-model-form").addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
        //window.alert("Catch submit?");
        addModelClaim(); // Call the handleMakeBid function
        //window.alert("Adding ?")
      });
    } else if (window.location.pathname.includes("create_task.html")) {
        // Assuming the user address is the necessary data to enable actions
        const userAddress = json.address;
        document.getElementById("buyer-addr").textContent = userAddress;
        //alert("Load:", json.address)
        enableActionButtons();
    }
    //localStorage.setItem("fileContents", contents)
    //updateBidderAddressDisplay();

  };

  reader.readAsText(file);
}

// This function enables all buttons with the 'submit-btn' class
function enableActionButtons() {
  const buttons = document.querySelectorAll('.submit-btn');
  buttons.forEach(button => {
    button.disabled = false;
  });
}

async function addModelClaim() {
  const taskId = new URLSearchParams(window.location.search).get("id");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const task = tasks.find((task) => task.id === parseInt(taskId));
  const index = tasks.findIndex((task) => task.id === parseInt(taskId));

  // Collect input values for the model claim
  // const modelDetail = document.getElementById('model-detail').value || 'Unknown';
  const provider = document.getElementById('service-provider').value;
  const quotedPrice = parseFloat(document.getElementById('quoted-price').value);
  const overallAccuracy = parseFloat(document.getElementById('overall-accuracy').value);
  const inferenceTime = parseFloat(document.getElementById('inference-time').value);
  const inferenceCost = parseFloat(document.getElementById('inference-cost').value);
  const modelDescription = document.getElementById('model-description').value || '';
  // const scalability = document.getElementById('scalability').value || '';
  // const modelSize = document.getElementById('model-size').value || '';

  // Create the model claim object
  const modelClaim = {
    id: task.claims.length + 1,
    // modelDetail: modelDetail,
    provider: provider,
    quotedPrice: quotedPrice,
    overallAccuracy: overallAccuracy,
    inferenceTime: inferenceTime,
    inferenceCost: inferenceCost,
    modelDescription: modelDescription,
    // scalability: scalability,
    // modelSize: modelSize,
    timestamp: new Date().toLocaleString(),
  };

  // Validate required fields
  if (!provider || !quotedPrice || !overallAccuracy || !inferenceTime || !inferenceCost) {
    alert('Please fill in all required fields.');
    return;
  }

  // Add the model claim to the task
  tasks[index].claims.push(modelClaim);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  // Refresh the display of claims
  loadTask(); // This will need to refresh the part of the page that shows claims
  //document.getElementById('claim-model-list').appendChild(claimElement);
}


function displayTasks() {
  const tasksContainer = document.getElementById("task-list");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || []; // Ensure this matches your localStorage key
  let tasksHtml = '';

  tasks.forEach((task) => {
    const isActive = new Date(task.conclusionTime) > new Date()? true : false;;

    tasksHtml += `
      <div class="task-item" data-active="${isActive}">
        <h4>Task #${task.id}</h4>
        <p>Task Type: ${task.taskType}</p>
        <p>Number of Claims: ${task.claims.length}</p>
        <p>Dataset Name: ${task.datasetName || 'Not provided'}</p>
        <a href="view_task.html?id=${task.id}"><button class="view-btn">View Details</button></a>
      </div>
    `;
  });

  tasksContainer.innerHTML = tasksHtml;
}

function loadTask() {
  const taskId = new URLSearchParams(window.location.search).get("id");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const task = tasks.find((task) => task.id === parseInt(taskId));

  if (!task) {
    alert("Task not found!");
    window.location.href = "index.html";
    return;
  }
  // Get the buyer's address from localStorage
  const buyerAddress = task.buyerAddress;
  //alert("Task.buyeraddress:", buyerAddress)

  const userAddress = localStorage.getItem("userAddress");
  // Check if the current user is the buyer
  const isBuyer = buyerAddress && userAddress && buyerAddress.toLowerCase() === userAddress.toLowerCase();
  

  document.getElementById("task-id").textContent = task.id;
  document.getElementById("task-description").textContent = task.description;
  document.getElementById("claim-id").textContent = task.selectedProvider;
  document.getElementById("conclusion-time").textContent = new Date(task.conclusionTime).toLocaleString();
  document.getElementById("buyer-addr").textContent = task.buyerAddress;
  // Get the form and claim submission section
  const claimFormSection = document.getElementById("claim-section");
  // If the user is the buyer, hide the claim submission form and enable the 'Select' buttons
  if (isBuyer || task.selectedProvider) {
    //alert("is Buyer");
    claimFormSection.style.display = "none";
    document.querySelectorAll('.select-provider-btn').forEach(button => {
      button.disabled = false;
    });
    // Code to enable 'Select' buttons goes here
  } else {
    //alert("not buyer");
    claimFormSection.style.display = "block";
    document.querySelectorAll('.select-provider-btn').forEach(button => {
      button.disabled = true;
    });
    enableActionButtons();
    // Code to disable 'Select' buttons goes here
  }
  
  const claimsList = document.getElementById("claims-list");
  claimsList.innerHTML = ''; // Clear out any existing claims

  task.claims.forEach(claim => {
    const claimElement = document.createElement('div');
    claimElement.className = 'claim';
    claimElement.dataset.id = claim.id; // Add data-id attribute
  
    // Check if this claim is the selected provider
    const isSelectedProvider = task.selectedProvider === claim.id;
  
    // Set background color and button disabled state based on whether this claim is selected
    if (isSelectedProvider){
      claimElement.dataset.selected = "true";
    }

    //claimElement.style.backgroundColor = isSelectedProvider ? '#009600' : '';
    const disabledAttribute = isSelectedProvider || (buyerAddress !== userAddress) ? 'disabled' : '';
  
    claimElement.innerHTML = `
      <p>Claim #${claim.id}</p>
      <p>Service Provider: ${claim.provider}</p>        
      <p>Service Cost: $${claim.quotedPrice}</p>
      <p>Model Accuracy: ${claim.overallAccuracy}%</p>
      <p>Inference Cost: $${claim.inferenceCost} Time: ${claim.inferenceTime}ms</p>
      <p>Short Description: ${claim.modelDescription}</p>
      <p>Timestamp: ${claim.timestamp}</p>
      <button 
      class="select-provider-btn" 
      ${disabledAttribute}
      onclick="selectServiceProvider(${claim.id})">Select</button>
    `;
  
    claimsList.appendChild(claimElement);
  });
  
  
  // Update the button based on task status
  // const selectProviderBtn = document.getElementById("select-provider-btn");
  // selectProviderBtn.style.display = (new Date(task.conclusionTime) > new Date()) ? "block" : "none";
}

function endAuctionOnClick() {
  //window.alert("Ending Auction");
  const auctionId = new URLSearchParams(window.location.search).get("id");
  const auctions = JSON.parse(localStorage.getItem("auctions")) || [];
  const auction = auctions.find((auction) => auction.id === parseInt(auctionId));

  const assetID = auction.assetId;

  endAuction(assetID, auctionId);
  const endAuctionBtn = document.getElementById("end-auction-btn");
  endAuctionBtn.setAttribute("disabled", "disabled");
  localStorage.setItem(`endAuctionBtnDisabled_${auctionId}`, true);
}

function selectServiceProvider(claimId) {
  const taskId = new URLSearchParams(window.location.search).get("id");
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const taskIndex = tasks.findIndex((task) => task.id === parseInt(taskId));

  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    
    // Check if this task already has a selected provider
    if (task.selectedProvider) {
      alert('A provider has already been selected for this task.');
      return;
    }

    task.selectedProvider = claimId;
    localStorage.setItem("tasks", JSON.stringify(tasks));
    
    // Update the UI to reflect the selection
    const claimsList = document.getElementById("claims-list");
    for (const claimElement of claimsList.children) {
      const btn = claimElement.querySelector('.select-provider-btn');
      if (btn) {
        btn.disabled = true; // Disable all select buttons
      }

        // Add 'data-selected' attribute to the selected claim
      if (parseInt(claimElement.dataset.id) === claimId) {
        claimElement.dataset.selected = "true";
      } else {
        claimElement.dataset.selected = "false";
      }
    }

    
  } else {
    alert('Task not found.');
  }
}


function setEndAuctionBtnState() {
  const auctionId = new URLSearchParams(window.location.search).get("id");
  const endAuctionBtn = document.getElementById("end-auction-btn");
  const isBtnDisabled = localStorage.getItem(`endAuctionBtnDisabled_${auctionId}`);


  if (isBtnDisabled === "true") {
    endAuctionBtn.setAttribute("disabled", "disabled");
  } else {
    endAuctionBtn.removeAttribute("disabled");
  }
}


function displayBid(bid) {
  const bidElement = document.createElement('div');
  bidElement.className = 'bid';

  bidElement.innerHTML = `
    <p>Bid #${bid.id}</p>
    <p>Bidder Platform: ${bid.platform} </p>
    <p>Address: ${bid.bidder}</p>
    <p>Amount: $${bid.amount}</p>
    <p>Timestamp: ${bid.timestamp}</p>
  `;

  
  document.getElementById('bid-list').appendChild(bidElement);
  //const nftName = document.getElementById("name").value;

  
}
// ---------------------------------------------------


async function addAsset(assetID) {
  //window.alert("Try add asset");
  try {    
      const response = await fetch(`http://localhost:6789/api/add-asset?asset_id=${assetID}`);

      console.log("Response object:", response);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      //console.log("Asset added:"+data);
      return data;
      //window.alert(data.owner);
  } catch (error) {
      //window.alert(error);
      console.error("Error adding asset:", error);
  }
}

async function startAuction(assetID) {
  //window.alert("Start Auction?");
  try {
      const response = await fetch(`http://localhost:6789/api/start-auction?asset_id=${assetID}`);
      const data = await response.json();
      //window.alert("start Auction on address: "+data.Quorum);
      return data;

  } catch (error) {
      //window.alert(error);
      console.error("Error adding asset:", error);
  }
}

async function endAuction(assetID, auctionID) {
  try {
    const response = await fetch(`http://localhost:6789/api/end-auction?asset_id=${assetID}&auction_id=${auctionID}`);
    const data = await response.json();
    //console.log(data.message);
    return data;
  } catch (error) {
    console.error("Error ending auction:", error);
  }
}



