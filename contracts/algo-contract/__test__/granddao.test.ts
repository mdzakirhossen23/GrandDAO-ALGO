import { describe, test, beforeAll, beforeEach, expect } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';

import algosdk, { ABIType, ABIValue, Algodv2 } from 'algosdk';
import { GranddaoClient } from '../contracts/contracts/DaoClient';

const fixture = algorandFixture();

let appClient: GranddaoClient;
let appId = 0;
let customAbiType = {
  "_dao_ids": "uint64",
  "_dao_uris": "(string,string,string)",
  "_template_uris": "string",
  "_goal_ids": "uint64",
  "_goal_uris": "(uint64,string)",
  "_ideas_ids": "uint64",
  "_ideas_uris": "(uint64,string,uint64)",
  "_ideas_vote_ids": "uint64",
  "all_ideas_votes": "(uint64,uint64,string)",
  "_donations_ids": "uint64",
  "_donated": "uint64",
  "_donations": "(uint64,string,uint64)",
  "_message_ids": "uint64",
    "all_messages": "(uint64,uint64,string,string)",
    "_join_ids":"uint64",
    "_joined_person": "(uint64,string)",

  abi: (key: string): string => {
    return customAbiType[key as keyof typeof customAbiType].toString();
  }
}
let allMaps: any = new Object();
type mapType = {
  key: string,
  value: any,
  multiple: boolean
}
function appendToMaps(key: string, value: ABIValue | undefined) {

  let oldValueId: number = Object.keys(allMaps).findIndex(e => e == key);
  if (oldValueId === -1) {
    let newValue: mapType = {
      key: key,
      value: value,
      multiple: false,
    }
    allMaps[key] = newValue;
  } else {
    let oldValue: mapType = allMaps[key];
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

//Daos
function getAllDaos() {
  let all_daos = [];
  let dao_uris = allMaps['_dao_uris'];
  if (dao_uris.multiple === false) {
    all_daos.push(dao_uris.value[1]);
  } else {
    all_daos = (dao_uris.value as []).map((item, i) => { return item[1] });
  }
  return all_daos;
}
function dao_uri(_dao_id: Number) {
  let dao = getAllDaos()[_dao_id as keyof typeof getAllDaos];
  return dao;
}

//Goals
function getAllGoals() {
  let all_goals = [];
  let goal_uris = allMaps['_goal_uris'];
  if (goal_uris.multiple === false) {
    all_goals.push(goal_uris.value[1]);
  } else {
    all_goals = (goal_uris.value as []).map((item, i) => { return item[1] });
  }
  return all_goals;
}
function goal_uri(_goal_id: Number) {
  let goal = getAllGoals()[_goal_id as keyof typeof getAllGoals];
  return goal;
}

function getAllGoalsByDaoId(dao_id: Number | null = null) {
  let all_goals = [];
  let goal_uris = allMaps['_goal_uris'];
  if (goal_uris.multiple === false) {
    if (dao_id !== null) {
      if (dao_id == Number(goal_uris.value[0])) all_goals.push(goal_uris.value[1]);
    }
  } else {
    let all_found_goals = (goal_uris.value as []).filter((item, i) => dao_id == Number(item[0]));
    all_goals = (all_found_goals as []).map((item, i) => { return item[1] });
  }
  return all_goals;
}

function getGoalIdByGoalUri(_goal_uri: string | null = null) {
  let goal_uris = allMaps['_goal_uris'];
  if (goal_uris.multiple === false) {
    if (_goal_uri !== null) {
      if (_goal_uri == goal_uris.value[1]) return 0;
    }
  } else {
    return (goal_uris.value as []).findIndex((item, i) => _goal_uri == item[1]);

  }
  return -1;
}

//Ideas
function getAllIdeas() {
  let all_ideas = [];
  let ideas_uris = allMaps['_ideas_uris'];
  if (ideas_uris.multiple === false) {
    all_ideas.push(ideas_uris.value[1]);
  } else {
    all_ideas = (ideas_uris.value as []).map((item, i) => { return item[1] });
  }
  return all_ideas;
}
function ideas_uri(_ideas_id: Number) {
  let ideas = getAllIdeas()[_ideas_id as keyof typeof getAllIdeas];
  return ideas;
}


//Donated Amount
function getAlldonated() {
  let all_donated = {};
  let donated_uris = allMaps['_donated'];
  if (donated_uris.multiple === false) {
    all_donated = (donated_uris.value[1]);
  } else {
    all_donated = Object.assign({}, ...donated_uris.value);
  }
  return all_donated;
}
function _donated(_donator: string) {
  let donated_amount = getAlldonated()[_donator as keyof typeof getAlldonated];
  return donated_amount;
}

//Donations
function getAllDonations() {

  let all_donations = [];
  let donation_uris = allMaps['_donations'];
  all_donations = donation_uris.value;
  return all_donations;
}
function donations_uri(_donations_id: Number) {
  let donations = getAllDonations()[_donations_id as keyof typeof getAllDonations];
  return donations;
}

async function getAllGlobalMap() {
  const { algod, testAccount } = fixture.context;

  var appInfo = await algod.getApplicationByID(appId).do();
  let all_global_states = appInfo.params['global-state'];
  if (all_global_states == undefined) return [];
  for (let i = 0; i < all_global_states.length; i++) {

    const element = all_global_states[i];
    let state_key = (atob(element.key)).replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '') as string;
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
        let newdata: any = {};
        newdata[splittedkey[1] as string] = data
        appendToMaps(key, newdata);
      } else {
        appendToMaps(key, data);
      }
    } else {

      if (splittedkey.length > 1) {
        let newdata: any = {};
        newdata[splittedkey[1] as string] = Number(element.value.uint);
        appendToMaps(key, newdata);
      } else {
        appendToMaps(key, Number(element.value.uint));
      }
    }
  }
  return allMaps;
}

async function getAllBoxMap() {
  const { algod, testAccount } = fixture.context;
  let output = algod.getApplicationBoxes(appId).do();

  console.log(output);

  // var appInfo = await algod.getApplicationByID(appId).do();
  // let all_global_states = appInfo.params['global-state'];
  // for (let i = 0; i < all_global_states.length; i++) {

  //   const element = all_global_states[i];
  //   let state_key = (atob(element.key)).replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '') as string;
  //   let key = state_key;
  //   let splittedkey = key.split("/");
  //   if (splittedkey.length > 1) {
  //     key = splittedkey[0];
  //   }

  //   let variable_abi = customAbiType.abi(key);
  //   let valueType = ABIType.from(variable_abi);
  //   if (element.value.type == 1) {
  //     const globalValue = Buffer.from(element.value.bytes, 'base64');
  //     let data = null;
  //     data = (valueType.decode(globalValue));

  //     if (splittedkey.length > 1) {
  //       let newdata :any = {};
  //       newdata[splittedkey[1] as string] = data
  //       appendToMaps(key, newdata);
  //     } else {
  //       appendToMaps(key, data);
  //     }
  //   } else {

  //     if (splittedkey.length > 1) {
  //       let newdata :any = {};
  //       newdata[splittedkey[1] as string] =Number( element.value.uint);
  //       appendToMaps(key, newdata);
  //     } else {
  //       appendToMaps(key, Number( element.value.uint));
  //     }
  //   }
  // }
  return allMaps;
}
async function stringToBytes(keyid: string, increment_id: string = "") {
  let increment: string = "";

  if (increment_id !== "") {
    let increment_in_db  = (await getAllGlobalMap())[increment_id];
    increment = increment_in_db === undefined?0:increment_in_db;
  }

  return new Uint8Array(Buffer.from(keyid + increment));
}

let sender: algosdk.Account;
let algod2: algosdk.Algodv2;

describe('Granddao', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount } = fixture.context;
    algod2 = algod;

    sender = testAccount;


    appClient = new GranddaoClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    let output = await appClient.create.createApplication({});
    appId = Number(output.confirmation?.applicationIndex);
  });

  test('getState', async () => {
    const { appAddress } = await appClient.appClient.getAppReference();

    const boxMBRPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: appAddress,
      amount: 15_7000,
      suggestedParams: await algokit.getTransactionParams(undefined, algod2),
    });
    // (await appClient.pay({ boxMBRPayment }));


    //Dao

    // (await appClient.createDao({boxMBRPayment:boxMBRPayment, _dao_id: await stringToBytes("", "_dao_ids"), _dao_wallet: "wallet", _dao_uri: "test", "_template": "False" }, {
    //   boxes: [await stringToBytes("_dao_uris", "_dao_ids"),await stringToBytes("_template_uris", "_dao_ids")]
    // })).return!;


    // (await appClient.setDao({ _dao_id: 0, _dao_wallet: "wallet2", _dao_uri: "test" })).return;
    // (await appClient.updateTemplate({ _dao_id: Number(0), "_template": "True" })).return;

    // //Goal
    // (await appClient.createGoal({boxMBRPayment:boxMBRPayment, _goal_id: await stringToBytes("", "_goal_ids"),  _goal_uri: "goal", _dao_id: 0 } ,{
    //     boxes: [await stringToBytes("_goal_uris", "_goal_ids")]
    //   })).return!;
    // (await appClient.setGoal({ _goal_uri: "goal2", _goal_id: 0 })).return!;


    // //Ideas
    // (await appClient.createIdeas({ boxMBRPayment:boxMBRPayment,  _ideas_id: await stringToBytes("", "_ideas_ids"), _ideas_uri: "goal", _goal_id: 0 } ,{
    //   boxes: [await stringToBytes("_ideas_uris", "_ideas_ids")]
    // })).return!;

    // (await appClient.createIdeas({ _ideas_uri: "goal", _goal_id: 0 })).return!;
    // (await appClient.setIdeas({ _ideas_uri: "goal2", _ideas_id: 0 })).return!;
    // (await appClient.addDonation({ _donation_id: new Uint8Array(Buffer.from("0")), _ideas_id: 0, _doantion: 20, _donator: "tester" }, {
    //   boxes: [new Uint8Array(Buffer.from("_donations0"))]
    // })).return!;
    // (await appClient.addDonation({ _donation_id: new Uint8Array(Buffer.from("1")), _ideas_id: 0, _doantion: 20, _donator: "tester" }, {
    //   boxes: [new Uint8Array(Buffer.from("_donations1"))]
    // })).return!;
    // (await appClient.addDonation({ _ideas_id: 0, _doantion: 15, _donator: "test2" })).return!;


    // (await appClient.createIdeasVote({ boxMBRPayment: boxMBRPayment, _ideas_votes_id: await stringToBytes("", "_ideas_vote_ids"), _goal_id: 0, _ideas_id: 0, _wallet: "test" }, {
    //   boxes: [await stringToBytes("all_ideas_votes", "_ideas_vote_ids")]
    // }));

    // (await appClient.sendMsg({ boxMBRPayment: boxMBRPayment, _message_id: await stringToBytes("", "_message_ids"), _ideas_id:0, _message:"test", _sender: "tset" }, {
    //   boxes: [await stringToBytes("all_messages", "_message_ids")]
    // }));




    (await appClient.joinCommunity({ boxMBRPayment: boxMBRPayment, _join_id: await stringToBytes("", "_join_ids"), dao_id: Number(0), person:"test" }, {
      boxes: [await stringToBytes("_joined_person", "_join_ids")]
    }));


    //View

    let output = await getAllGlobalMap();

    // //Dao
    // await getAllDaos();
    // await dao_uri(1);


    // //Goal
    // await getAllGoals();
    // await goal_uri(0);
    // await getAllGoalsByDaoId(1);
    // await getGoalIdByGoalUri("goal1");


    // //Ideas
    // await ideas_uri(0);
    // await getAlldonated();
    // await _donated("test");
    // await getAllDonations();
    // let output = await donations_uri(0);
    // await getAllBoxMap();

    console.log();
  });


  test('vote & getVotes', async () => {

    const res = (await appClient.appClient.getBoxValueFromABIType(
      '_donations1',
      algosdk.ABIType.from('string')
    )) as String;

    console.log(res)

  });
});
