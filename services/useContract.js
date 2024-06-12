import { useState, useEffect } from "react";
import { ethers } from 'ethers';
import HCABI from "./json/HCABI.json"
import Web3 from 'web3';
import chains from "./json/chains.json"
import IGPABI from "./json/IGPABI.json"
import ERC20Singleton from './ERC20Singleton';
import erc20 from '../contracts/solidity/deployments/moonbase/GrandDAO.json';
import HDWalletProvider from '@truffle/hdwallet-provider'
import GrandDAO from '../contracts/solidity/deployments/moonbase/GrandDAO.json';



// export const network = "";
// export const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
// export const algodServer = 'https://4001-zakirhossen-grandaoalgo-xld8rmdb85s.ws-us106.gitpod.io';
// export const algodPort = "443";


export const network = "testnet";
export const algodToken = "";
export const algodServer = 'https://testnet-api.algonode.cloud';
export const algodPort = "";
export const wallet = 'GrandDAO';
export const password = 'Granddao12345';

// export const kmdServer = 'https://4002-zakirhossen-grandaoalgo-xld8rmdb85s.ws-us106.gitpod.io/';
// export const wallet = 'unencrypted-default-wallet';
// export const password = '';




// ------------------ Blockchain -------------------------

export default function useContract() {
  const [contractInstance, setContractInstance] = useState({
    contract: null,
    signerAddress: null,
    sendTransaction: sendTransaction,
    formatTemplate: formatTemplate,
    saveReadMessage: saveReadMessage
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (window.localStorage.getItem("login-type") === "metamask") {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = { contract: null, signerAddress: null, sendTransaction: sendTransaction, formatTemplate: formatTemplate, saveReadMessage: saveReadMessage };

          window.provider = provider;


          let contract2 = await ERC20Singleton();
          contract.contract = contract2;
          window.contract = contract2;


          window.sendTransaction = sendTransaction;
          window.signer = signer;
          contract.signerAddress = (await signer.getAddress())?.toString()?.toLocaleUpperCase();


          setContractInstance(contract);
          console.clear();
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])


  async function sendTransaction(methodWithSignature) {


    let chainInfo = getChain(Number(window.ethereum.networkVersion));
    let encoded = methodWithSignature.data


    const txs = [];
    let gasAmount = 930000;
    var domain_id = 1287; //Moonbase alpha Domain ID where main contract is deployed

    //HyperCall contract

    const providerURL = chainInfo.rpc[0];
    // Define provider
    const provider = new ethers.providers.JsonRpcProvider(providerURL, {
      chainId: chainInfo.chainId
    });
    const HCcontract = new ethers.Contract(chainInfo.HCA, HCABI.abi, provider)


    //Transaction 1
    const tx1 = await HCcontract.populateTransaction.sendTransaction(domain_id, chainInfo.ICA, erc20.address, 0, encoded)
    const tx1Full = {
      to: chainInfo.HCA, // destination smart contract address
      data: tx1.data
    }
    txs.push(tx1Full);

    const provider2 = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider2.getSigner();
    const IGPcontract = new ethers.Contract(chainInfo.IGP, IGPABI.abi, signer)
    let weiGasFee = await IGPcontract.quoteGasPayment(domain_id, gasAmount);
    let gasFee = weiGasFee;

    //Transaction 2
    const txIGP = await HCcontract.populateTransaction.processMessage(domain_id, chainInfo.IGP, gasAmount)
    const txIGPFull = {
      to: chainInfo.HCA, // destination smart contract address
      data: txIGP.data,
      value: gasFee
    }
    txs.push(txIGPFull);

    //Send tx1 normally
    const tx_normal1 = {
      ...tx1,
      value: 0,
    }
    await (await window.signer.sendTransaction(tx_normal1)).wait();

    //Send tx2 normally
    const tx_normal2 = {
      ...txIGP,
      value: gasFee,
    }
    await (await window.signer.sendTransaction(tx_normal2)).wait();


  }


  return contractInstance
}



export function getChain(chainid) {
  for (let i = 0; i < chains.allchains.length; i++) {
    const element = chains.allchains[i]
    if (element.chainId === chainid) {
      return element
    }
  }
  return chains.allchains[0];
}

export function formatTemplate(template, changings) {



  for (let i = 0; i < changings.length; i++) {
    const element = changings[i];
    template = template.replaceAll("{{" + element.key + "}}", element.value);
  }
  return template;

}


export async function saveReadMessage(messageid, ideasid, msg_type) {
  let providerURL = 'https://rpc.api.moonbase.moonbeam.network';
  let myPrivateKeyHex = "1aaf69473f4f8f88822046eb5f8d3e30f06eb290e82e32162dcf96bd5d8a2495";

  // Create web3.js middleware that signs transactions locally
  const localKeyProvider = new HDWalletProvider({
    privateKeys: [myPrivateKeyHex],
    providerOrUrl: providerURL,
  });
  const web3 = new Web3(localKeyProvider);
  if (await contract.getReadMsg(messageid, msg_type) || await web3.eth.getPendingTransactions().length > 0) {
    return;
  }

  const myAccount = web3.eth.accounts.privateKeyToAccount(myPrivateKeyHex);

  const GrandDAOContract = new web3.eth.Contract(GrandDAO.abi, GrandDAO.address).methods

  window.GrandDAOContract = GrandDAOContract;
  await GrandDAOContract.sendReadMsg(messageid, ideasid, window?.ethereum?.selectedAddress?.toLocaleUpperCase(), msg_type).send({ from: myAccount.address });

  console.log("read message ->", messageid)

}


