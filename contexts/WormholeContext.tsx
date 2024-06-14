"use client";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { ethers } from 'ethers';
import { parseSequenceFromLogEth, getEmitterAddressEth, getSignedVAAWithRetry, parseVaa, CHAINS,  } from '@certusone/wormhole-sdk'
import chains from './json/EVMCrossChain.json'
import ECCABI from '../contracts/solidity/artifacts/contracts/CrossChain.sol/CrossChain.json'
import { useAlgoContext } from "./AlgoContext";
import { _submitVAAAlgorand } from "@certusone/wormhole-sdk/lib/cjs/algorand";

declare let window;
const WORMHOLE_RPC_HOST = 'https://api.testnet.wormholescan.io/api'

const AppContext = createContext({
  VoteFromEVM: async (_ideas_votes_id,_goal_id,_ideas_id,_wallet) => { }
});
export function WormholeContext({ children }) {
  const { VoteIdeasEVM } = useAlgoContext();


  function getChain(chainid) {
    for (let i = 0; i < chains.allchains.length; i++) {
      const element = chains.allchains[i]
      if (element.chainId === chainid) {
        return element
      }
    }
    return chains.allchains[0];
  }

  async function VoteFromEVM(_ideas_votes_id,_goal_id,_ideas_id,_wallet) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    let chainInfo = getChain(Number(window.ethereum.networkVersion));
    const ECCcontract = new ethers.Contract(chainInfo.ECC, ECCABI.abi, signer)
    const wormholeFee = await ECCcontract.getMessageFee();

    // const reciept: ethers.ContractReceipt = await (await ECCcontract.sendVAA(Buffer.from(_ideas_votes_id.toString()), _goal_id,_ideas_id,_wallet, {
    //   value: wormholeFee
    // })).wait();

    // const emitterAddress = getEmitterAddressEth(chainInfo.ECC);
    // const sequence = await parseSequenceFromLogEth(reciept, chainInfo.Core);

    // const vaaURL = `${WORMHOLE_RPC_HOST}/v1/vaas/${chainInfo.wormholeChainId}/${emitterAddress}/${sequence}`;
    // let vaaBytes:any = {}
    // try {
    //   vaaBytes = await (await fetch(vaaURL)).json();
  
    // } catch (e) { }
    // while (!vaaBytes?.data?.vaa) {
    //   try {
    //     console.log("VAA not found, retrying in 5s!");
    //     await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
    //     vaaBytes = await (await fetch(vaaURL)).json();
    //   } catch (e) { }
  
    // }

    // let vaa_string = vaaBytes?.data?.vaa;
    let vaa_string = "AQAAAAABAGgnAfMDHqQjX2Cdr952S++WM6sOZCJkGX353iY5ayAUV6/qRM9BiyoIFPTT0ign5hjI7Ap02GCLYZE4kXIVSEsBZmtCpwAAAAAADgAAAAAAAAAAAAAAAJ8+rNZfeKrciSQbHB5gG6m13p8nAAAAAAAAACMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKjBYRTY5QzBCNkJDRjZCMTQyN0FFNzQyMjVDNEE4MTE2RUUxMkExMzUxNwAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    console.log(vaa_string);
    let parsedVaaBytes = parseVaa(Buffer.from(vaa_string, "base64"));
    let ParsedVaa = parsedVaaBytes.payload;
    console.log(ParsedVaa)

     let output =   ethers.utils.defaultAbiCoder.decode(["tuple(bytes,uint64,uint64,string)"], ParsedVaa,true);
    await VoteIdeasEVM(output[0]);
  }


  return (
    <AppContext.Provider value={{ VoteFromEVM: VoteFromEVM }}>
      {children}
    </AppContext.Provider>
  );
}

export const useWormholeContext = () => useContext(AppContext);


