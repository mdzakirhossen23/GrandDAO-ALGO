"use client";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { ethers } from 'ethers';
import { parseSequenceFromLogEth, getEmitterAddressEth, getSignedVAAWithRetry, parseVaa, CHAINS } from '@certusone/wormhole-sdk'
import chains from './json/EVMCrossChain.json'
import ECCABI from '../contracts/solidity/artifacts/contracts/CrossChain.sol/CrossChain.json'
import { useAlgoContext } from "./AlgoContext";


declare let window;
const WORMHOLE_RPC_HOST = 'https://wormhole-v2-testnet-api.certus.one'

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

    const reciept = await (await ECCcontract.sendVAA(Buffer.from(_ideas_votes_id.toString()), _goal_id,_ideas_id,_wallet, {
      value: wormholeFee
    })).wait();

    const emitterAddress = getEmitterAddressEth(chainInfo.ECC);
    const sequence = await parseSequenceFromLogEth(reciept, chainInfo.Core);

    const { vaaBytes } = await getSignedVAAWithRetry(
      [WORMHOLE_RPC_HOST],
      CHAINS[chainInfo.wormholeChain],
      emitterAddress,
      sequence
    );
    let parsedVaaBytes = parseVaa(vaaBytes);
    let ParsedVaa = parsedVaaBytes.payload;

     let output =   ethers.utils.defaultAbiCoder.decode(["tuple(bytes,uint64,uint64,string)"], ParsedVaa,true);
    VoteIdeasEVM(output[0]);
  }


  return (
    <AppContext.Provider value={{ VoteFromEVM: VoteFromEVM }}>
      {children}
    </AppContext.Provider>
  );
}

export const useWormholeContext = () => useContext(AppContext);


