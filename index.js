// importing qs module so we can call prices
const  qs = require('qs');
const BigNumber = require('bignumber.js');

//this is our global variables, so we keep track of state
let currentTrade = {};
let currentSelectSide;

// inits our tokens avail
async function init(){
    await listAvailTokens();
}

// see  above
async function listAvailTokens(){
    console.log("initializing");
    // fetching from that specific API
    let response = await fetch('https://tokens.coingecko.com/uniswap/all.json')
    // converting response into a json object
    let tokenListJson = await response.json();
    console.log("listing avail tokens: ", tokenListJson);
    // pulling out the tokens field from the json field
    let tokens = tokenListJson.tokens;
    console.log("getting tokens out", tokens);

    // creating the pop up token list here
    let parent = document.getElementById("token_list");
    for (const i in tokens) {
        let div = document.createElement("div");
        div.className = "token_row";
        let html = 
            `<img class = "token_list_img" src="${tokens[i].logoURI}">
            <span class = "token_list_text"> ${tokens[i].symbol} </span>
            `;
        div.innerHTML = html;
        // allows me to call this select token when i click that 
        // pop up box
        div.onclick = () => {
            selectToken(tokens[i]);
        };
        parent.appendChild(div);
    };
    
}

// when users choose the token we want, we update state + render interface
async function selectToken(token) {
    closeModal();
    currentTrade[currentSelectSide] = token;
    console.log("check which side", currentTrade)
    renderInterfaces();
}

// puts the token into the box
function renderInterfaces() {
    if (currentTrade.from){
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }

    if (currentTrade.to){
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}

async function connect() {
    //when metamask is installed, it injects this object into
    //web browser, this checks if metamask is installed basically
    if (typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            await ethereum.request({method : "eth_requestAccounts"});
        } catch (error) {
            console.log(error);
        }
        //prompts us to create 
       
        document.getElementById("login_button").innerHTML = "Connected";
        document.getElementById("swap_button").disabled = false;
    }

    else {
        document.getElementById("login_button").innerHTML = "Please install Metamask!";
    }
}

async function getPrice(){
    console.log("getting the price now");
    // Only fetch price if from token, to token, and from token amount have been filled in 
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
      }
      // Fetch the swap price.
      const response = await fetch(
        `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
        );
    // Await and parse the JSON response 
    swapPriceJSON = await response.json();
    console.log("Price: ", swapPriceJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(account){
    console.log("getting the quote now");
    // Only fetch price if from token, to token, and from token amount have been filled in 
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
        takerAddress: account,
      }
    // Fetch the quote.
    const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
    // Await and parse the JSON response 
    swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;
    return swapQuoteJSON;
}

async function trySwap() {
    // most recently used account that caller is permitted to access
    const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
    console.log("trying swap");

    const web3 = new Web3(Web3.givenProvider);

    let accounts = await ethereum.request({method: "eth_accounts"});
    let takerAddress = accounts[0];
    console.log("this is taker addy", takerAddress);
    // login as the most recentyl used addy in metamask wallet
    console.log("taker address: ", takerAddress);

    const swapQuoteJSON = await getQuote(takerAddress);

    // Setup the erc20abi in json format so we can interact with the approve method below
   
        // Set up approval amount for the token we want to trade from
    const fromTokenAddress = currentTrade.from.address;


    const maxApproval = new BigNumber(2).pow(256).minus(1);
    console.log("approval amount: ", maxApproval);
        
    // In order for us to interact with a ERC20 contract's method's, need to create a web3 object. This web3.eth.Contract object needs a erc20abi which we can get from any erc20 abi as well as the specific token address we are interested in interacting with, in this case, it's the fromTokenAddrss
    // Read More: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#web3-eth-contract



    // now we need to call erc20 token approve mthod.
    // since we need to interact with erc20 contract methods
    // we need to set up web3 object -> web3.eth.Contract
    // takes in erc20abi, json representation of erc20 contract
    // erc20abi is blueprint for any token that follows erc20 standard
    // also needs specific token address we're interested in interacting with
    // in this case, would be 0x SC, bcs we want them to act on the tokens
   
    const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
    console.log("setup ERC20TokenContract: ", ERC20TokenContract);

    // we just get a big number and set it lol

    const tx = await ERC20TokenContract.methods.approve(
        swapQuoteJSON.allowanceTarget,
        maxApproval,
    )
    // error here. invalid address. 
    .send({ from: takerAddress })
    .then(tx => {
        console.log("tx: ", tx)
    });

    const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt: ", receipt);

}

init();

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}

document.getElementById("login_button").onclick = connect();
document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;
document.getElementById("swap_button").onclick = trySwap;
