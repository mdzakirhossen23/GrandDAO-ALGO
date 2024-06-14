"use client";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import algosdk, { ABIType, ABIValue, Algodv2 } from 'algosdk';
import { GranddaoClient } from './contracts/DaoClient';
import { useWallet } from '@txnlab/use-wallet'
import { algodToken, algodServer, algodPort } from '../services/useContract'
import * as algokit from '@algorandfoundation/algokit-utils';
import Airtable from 'airtable';



const isKmd = (provider) => provider.metadata.name.toLowerCase() === 'kmd'
declare let window;

let appId = 681197121;
let appAddress = "VFML5EUIXB5DPCMYZY366LOS7VLB7S2Z3BTRLNE4RWNHNKSPDGHB3ESKBU"
let memonic_for_evm = "flush artefact leaf drip resource matrix divorce orbit raven car saddle wine between year sock able tool talent cinnamon gold search firm olympic abstract primary"

const algodClient = algokit.getAlgoClient({
  server: algodServer,
  port: algodPort,
  token: algodToken,
})


const AppContext = createContext({
  appId: appId,
  provider: null,
  base: null,
  appClient: null,
  sender: null,
  payToApp: async (): Promise<algosdk.Transaction> => { return null },
  algodClient: null,
  stringToBytes: async (keyid: any, increment_id?: string): Promise<Uint8Array> => { return null },
  accountAddress: null,
  getAllGlobalMap: async (): Promise<Object> => { return null },
  getMapValue: (key: any, id: any): Promise<any> => { return null },
  createRecordInDB: async (type, fields) => { return null },
  getRecordFromDB: async (type, id) => { return null },
  getMapIds: async (keyid): Promise<any> => { return 0 },

  //EVM
  VoteIdeasEVM: async (payload) => { }
});
export function AlgoContext({ children }) {

  const { providers, activeAccount, signer, signTransactions, sendTransactions } = useWallet()
  const [provider, setProvider] = useState(null)

  const [accountAddress, setAccountAddress] = useState(null)
  const [sender, setSender] = useState(null)
  const [appClient, setAppClient] = useState(null)

  Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'patN8WG203lChH9PN.c536f164e2b835b15d927620e978ab65f263492f41f92d4681341449474f56f2'
  });
  var base = Airtable.base('applkiuH5e4Fm4xJi');



  let customAbiType = {
    "_dao_ids": ["uint64", 0],
    "_dao_uris": ["(string,string,string)", ["", "", ""]],
    "_template_uris": ["string", ""],
    "_goal_ids": ["uint64", 0],
    "_goal_uris": ["(uint64,string)", [0, ""]],
    "_ideas_ids": ["uint64", 0],
    "_ideas_uris": ["(uint64,string,uint64)", [0, "", ""]],
    "_donations_ids": ["uint64", 0],
    "_donated": ["uint64", 0],
    "_donations": ["(uint64,string,uint64)", [0, "", 0]],
    "_ideas_vote_ids": ["uint64", 0],
    "all_ideas_votes": ["(uint64,uint64,string)", [0, 0, ""]],
    "_message_ids": ["uint64", 0],
    "all_messages": ["(uint64,uint64,string,string)", [0, 0, "", ""]],
    "_reply_ids": ["uint64", 0],
    "all_replies": ["(uint64,uint64,uint64,string)", [0, 0, "", ""]],
    "_join_ids": ["uint64", 0],
    "_joined_person": ["(uint64,string)", [0, ""]],

    abi: (key) => {
      return customAbiType[key][0].toString();
    },
    abiType: (key) => {
      return customAbiType[key][1]

    }
  }
  let allMaps = new Object();
  function appendToMaps(key, value) {

    let oldValueId = Object.keys(allMaps).findIndex(e => e == key);
    if (oldValueId === -1) {
      let newValue = {
        key: key,
        value: value,
        multiple: false,
      }
      allMaps[key] = newValue;
    } else {
      let oldValue = allMaps[key];
      if (oldValue.multiple === true) {
        oldValue.value.push(value);
        allMaps[key] = oldValue;
      } else {
        oldValue.value = [oldValue.value, value];
        oldValue.multiple = true;
        allMaps[key] = oldValue;
      }
    }
  }


  async function getAllGlobalMap() {
    allMaps = new Object();
    var appInfo = await algodClient.getApplicationByID(appId).do();
    let all_global_states = appInfo.params['global-state'];
    if (all_global_states == undefined) return {};
    for (let i = 0; i < all_global_states.length; i++) {

      const element = all_global_states[i];
      let state_key = (atob(element.key)).replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '');
      let key = state_key;
      let splittedkey = key.split("/");
      if (splittedkey.length > 1) {
        key = splittedkey[0];
      }

      let variable_abi = customAbiType.abi(key);
      let valueType = ABIType.from(variable_abi);
      if (element.value.type == 1) {
        const globalValue = Buffer.from(element.value.bytes, 'base64');
        let data = null;
        data = (valueType.decode(globalValue));

        if (splittedkey.length > 1) {
          let newdata = {};
          newdata[splittedkey[1]] = data
          appendToMaps(key, newdata);
        } else {
          appendToMaps(key, data);
        }
      } else {

        if (splittedkey.length > 1) {
          let newdata = {};
          newdata[splittedkey[1]] = Number(element.value.uint);
          appendToMaps(key, newdata);
        } else {
          appendToMaps(key, Number(element.value.uint));
        }
      }
    }
    return allMaps;
  }
  async function stringToBytes(keyid, increment_id = "") {
    let increment = "";

    if (increment_id !== "") {
      let increment_in_db = (await getAllGlobalMap())[increment_id];
      increment = increment_in_db === undefined ? 0 : increment_in_db.value;
    }
    console.log(increment)

    return new Uint8Array(Buffer.from(keyid + increment));
  }

  async function getMapIds(keyid) {
    return Number((await getAllGlobalMap())[keyid]);
  }
  async function payToApp() {
    const boxMBRPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: appAddress,
      amount: 450200,
      suggestedParams: await algokit.getTransactionParams(undefined, algodClient),
    });
    console.log(boxMBRPayment)

    return boxMBRPayment;
  }

  async function getMapValue(key, id) {
    let abiType = customAbiType.abi(key)
    const res = (await appClient.appClient.getBoxValueFromABIType(
      key + id,
      algosdk.ABIType.from(abiType)
    ));

    return res;

  }

  async function createRecordInDB(type, fields) {

    let records = await base(type).create([
      {
        "fields": fields
      }
    ]);

    return records[0].getId();
  }
  async function getRecordFromDB(type, id) {

    let record = await base(type).find(id);

    return record;
  }


  //-------------------------EVM------------------------------
  function hexToUtf8(s) {
    return decodeURIComponent(
      s.replace(/\s+/g, '') // remove spaces
        .replace(/[0-9a-f]{2}/g, '%$&') // add '%' before each 2 characters
    );
  }


  async function VoteIdeasEVM(output) {
    let _ideas_votes_id = Number(hexToUtf8(Buffer.from(output[0]).toString()));
    let boxMBRPayment = await payToApp();

    await appClient.createIdeasVote({ boxMBRPayment: boxMBRPayment,_ideas_votes_id: await stringToBytes(_ideas_votes_id), _goal_id: Number(output[1]), _ideas_id: Number(output[2]), _wallet: output[3].toString() }, {
      boxes: [await stringToBytes("all_ideas_votes" + _ideas_votes_id, "")]
    })


  }


  useEffect(() => {
    console.log(providers)
    let provider1 = providers?.filter((provider) => (!isKmd(provider)))[0];
    setProvider(provider1);
  }, [providers,activeAccount])

  useEffect(() => {
    let newsender = null;
    if (window.localStorage.getItem("loggedin") == "true" && window.localStorage.getItem("login-type") == "metamask") {
      newsender = algosdk.mnemonicToSecretKey(memonic_for_evm)
    } else {
      newsender = { signer, addr: activeAccount?.address }
    }
    setSender(newsender)
    setAppClient( new GranddaoClient(
      {
        sender: newsender,
        resolveBy: 'id',
        id: appId,
      },
      algodClient
    ));
    if (window.localStorage.getItem("loggedin") == "true" && window.localStorage.getItem("login-type") == "pera") {
      setAccountAddress(activeAccount);
    } else if (window.localStorage.getItem("loggedin") == "true" && window.localStorage.getItem("login-type") == "metamask") {
      setAccountAddress({ address: window?.ethereum?.selectedAddress?.toLocaleUpperCase() });
    }
  }, [providers])


  return (
    <AppContext.Provider value={{ appId: appId, VoteIdeasEVM: VoteIdeasEVM, createRecordInDB: createRecordInDB, getRecordFromDB: getRecordFromDB, getMapIds: getMapIds, base: base, provider: provider, appClient: appClient, payToApp: payToApp, stringToBytes: stringToBytes, sender: sender, algodClient: algodClient, getAllGlobalMap: getAllGlobalMap, accountAddress: accountAddress, getMapValue: getMapValue }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAlgoContext = () => useContext(AppContext);


