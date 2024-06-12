"use client";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { useSnackbar } from "notistack";
import { BigNumber, ethers } from "ethers";
import config from "./json/config.json";
import datafeeds from "./json/datafeeds.json";
import PriceFeedABI from '../contracts/solidity/artifacts/contracts/precompiles/PriceFeed.sol/AggregatorV3Interface.json'
import BatchABI from '../contracts/solidity/artifacts/contracts/precompiles/Batch.sol/Batch.json'
import GrandDAO from '../contracts/solidity/deployments/moonbase/GrandDAO.json';
import Web3 from 'web3'
import { getChain } from "../services/useContract";

const AppContext = createContext({
  USDPrice: null,
  LoadSmartAccount: async () => { },
  BatchDonate: async () => { },
  BatchJoin: async () => { },
  BatchVoteConviction: async () => { },
  getUSDPriceForChain: async () => { },
});

export function UtilsProvider({ children }) {
  const { enqueueSnackbar } = useSnackbar();
  const [USDPrice, SetUSDPrice] = useState('')


  async function loadPrice() {
    const targetNetwork = config.moonbase; //Moonbase

    let targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork.rpc);
    const PriceFeedContract = new ethers.Contract(config.price_feed_address, PriceFeedABI.abi, targetProvider);
    let symbol = await PriceFeedContract.decimals();
    let exchangePriceInfo = await PriceFeedContract.latestRoundData();
    let symoblvalue = 10 ** Number(symbol);
    let exchangePrice = Number(exchangePriceInfo.answer) / symoblvalue;
    SetUSDPrice(exchangePrice.toFixed(2));

  }
  async function getUSDPriceForChain() {
    if (window.localStorage.getItem("login-type") !== "metamask" || window.localStorage.getItem("loggedin") !== "true") {
      return;
    }
    try {
      let token = getChain(Number(window.ethereum.networkVersion)).nativeCurrency.symbol
      const targetNetwork = datafeeds[token];

      let targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork.rpc);
      const PriceFeedContract = new ethers.Contract(targetNetwork.price_feed_address, PriceFeedABI.abi, targetProvider);
      let symbol = await PriceFeedContract.decimals();
      let exchangePriceInfo = await PriceFeedContract.latestRoundData();
      let symoblvalue = 10 ** Number(symbol);
      let exchangePrice = Number(exchangePriceInfo.answer) / symoblvalue; // 1CELO = 0.001 ETH

      if (targetNetwork.price_feed_address2 != null) {
        const PriceFeedContract2 = new ethers.Contract(targetNetwork.price_feed_address2, PriceFeedABI.abi, targetProvider);
        symbol = await PriceFeedContract2.decimals();
        exchangePriceInfo = await PriceFeedContract2.latestRoundData();
        symoblvalue = 10 ** Number(symbol);
        let exchangePrice2 = Number(exchangePriceInfo.answer) / symoblvalue; // 1 ETH = 4 USD
        return (exchangePrice * exchangePrice2);
      }

    return exchangePrice;
    } catch (error) {

    }


  }


  async function BatchDonate(amount, Recipient, ideas_id, Coin) {
    if (Number(window.ethereum.networkVersion) === 1287 && Coin == "DEV") { //If Coin is DEV then it will use normal batch
      let to = [];
      let value = [];
      let callData = [];
      let gasLimit = [];

      //Adding Sending amount to Batch paramaters:
      to.push(Recipient);
      value.push(`${(amount * 1e18).toFixed(0)}`)
      callData.push("0x");

      //Adding save information into smart contract
      to.push(GrandDAO.address);


      let web3 = new Web3(window.ethereum);
      const GrandDAOContract = new web3.eth.Contract(GrandDAO.abi, GrandDAO.address).methods

      let encodedCallData = GrandDAOContract.add_donation(ideas_id, `${amount * 1e18}`, window?.ethereum?.selectedAddress?.toLocaleUpperCase()).encodeABI();

      callData.push(encodedCallData);


      //Sending Batch Transaction
      let batchAdd = "0x0000000000000000000000000000000000000808";
      let targetSigner = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      let BatchContract = new ethers.Contract(batchAdd, BatchABI.abi, targetSigner);

      await (await BatchContract.batchAll(to, value, callData, gasLimit)).wait();
    }
    

  }

  async function BatchJoin(amount, Recipient, dao_id) {
    if (Number(window.ethereum.networkVersion) === 1287) { //If it is sending from Moonbase Batch Transactions
      let to = [];
      let value = [];
      let callData = [];
      let gasLimit = [];

      //Adding Sending amount to Batch paramaters:
      to.push(Recipient);
      value.push(`${(amount * 1e18).toFixed(0)}`)
      callData.push("0x");

      //Adding save information into smart contract
      to.push(GrandDAO.address);


      let web3 = new Web3(window.ethereum);
      const GrandDAOContract = new web3.eth.Contract(GrandDAO.abi, GrandDAO.address).methods

      let encodedCallData = GrandDAOContract.join_community(dao_id, window?.ethereum?.selectedAddress?.toLocaleUpperCase()).encodeABI();

      callData.push(encodedCallData);


      //Sending Batch Transaction
      let batchAdd = "0x0000000000000000000000000000000000000808";
      let targetSigner = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      let BatchContract = new ethers.Contract(batchAdd, BatchABI.abi, targetSigner);

      await (await BatchContract.batchAll(to, value, callData, gasLimit)).wait();
    }
  }


  useEffect(() => {

    setTimeout(() => {
      loadPrice();
    }, 1000)

  }, [])
  return (
    <AppContext.Provider value={{ USDPrice: USDPrice, BatchDonate: BatchDonate, BatchJoin: BatchJoin, getUSDPriceForChain: getUSDPriceForChain }}>
      {children}
    </AppContext.Provider>
  );
}

export const useUtilsContext = () => useContext(AppContext);
