import React, { useState, useEffect } from "react";
import { Header } from "../../components/layout/Header";
import Head from "next/head";
import styles from "./Login.module.scss";
import Button from "@heathmont/moon-core-tw/lib/button/Button";
import GenericClose from "@heathmont/moon-icons-tw/icons/GenericClose";
import GenericCheckRounded from "@heathmont/moon-icons-tw/icons/GenericCheckRounded";
import isServer from "../../components/isServer";
import { useAlgoContext } from "../../contexts/AlgoContext";

let redirecting = "";
export default function Login() {
  const {accountAddress,provider} = useAlgoContext();


  const [ConnectStatus, setConnectStatus] = useState(false);

  const isConnectedToPeraWallet = !!accountAddress  && window.localStorage.getItem("loggedin") == "true" && window.localStorage.getItem("login-type") == "pera";

  if (!isServer()) {
    const regex = /\[(.*)\]/g;
    const str = decodeURIComponent(window.location.search);
    let m;

    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      redirecting = m[1];
    }
  }



  const fetchDataStatus = async () => {
    if ( window.localStorage.getItem("login-type") == "metamask" && window.localStorage.getItem("loggedin") == "true") {
      setConnectStatus(true);
    } else {
      setConnectStatus(false);
    }

  };
  useEffect(() => {
    if (!isServer()) {
      setInterval(() => {
        if (  window.localStorage.getItem("login-type") != "" && window.localStorage.getItem("loggedin") == "true") {

          window.location.href = redirecting;
        }
        fetchDataStatus();
      }, 1000);
    }
  }, []);


  if (isServer()) return null;

  function AlgoWallet() {

    if (!isConnectedToPeraWallet) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://github.com/perawallet.png" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Pera wallet</span>
              <span
                className="flex items-center gap-1 " style={{ color: 'rgb(255, 78, 100)' }}
              >
                <GenericClose
                  className="text-moon-32 "
                ></GenericClose>
                Disconnected
              </span>
            </div>
            <Button onClick={onClickConnectPera} style={{ width: 112 }}>
              Connect
            </Button>
          </div>
        </>
      );
    }
    if (isConnectedToPeraWallet) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://github.com/perawallet.png" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Pera wallet</span>
              <span
                className="flex items-center gap-1"
                style={{ color: "#40A69F" }}
              >
                <GenericCheckRounded
                  className="text-moon-32"
                  color="#40A69F"
                ></GenericCheckRounded>
                Connected
              </span>
            </div>
            <Button
              onClick={onClickDisConnectPera}
              variant="secondary"
              style={{ width: 112 }}
            >
              Disconnect
            </Button>
          </div>
        </>
      );
    }
  }
  async function onClickConnectPera() {
    await provider.connect();

    window.localStorage.setItem('loggedin', 'true')
    window.localStorage.setItem('login-type', "pera");

  }
  async function onClickDisConnectPera() {
    await provider.disconnect();

    window.localStorage.setItem('loggedin', 'false')
    window.localStorage.setItem('login-type', "");
  }
  function MetamaskWallet() {
    if (typeof window.ethereum === "undefined") {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://metamask.io/images/metamask-logo.png" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Metamask wallet</span>

            </div>
            <Button onClick={onClickConnect} style={{ width: 148 }}>
              Install Metamask
            </Button>
          </div>
        </>
      );
    }
    if (!ConnectStatus) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://metamask.io/images/metamask-logo.png" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Metamask wallet</span>
              <span
                className="flex items-center gap-1 " style={{ color: 'rgb(255, 78, 100)' }}
              >
                <GenericClose
                  className="text-moon-32 "
                ></GenericClose>
                Disconnected
              </span>
            </div>
            <Button onClick={onClickConnect} style={{ width: 112 }}>
              Connect
            </Button>
          </div>
        </>
      );
    }
    if (ConnectStatus) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://metamask.io/images/metamask-logo.png" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Metamask wallet</span>
              <span
                className="flex items-center gap-1"
                style={{ color: "#40A69F" }}
              >
                <GenericCheckRounded
                  className="text-moon-32"
                  color="#40A69F"
                ></GenericCheckRounded>
                Connected
              </span>
            </div>
            <Button
              onClick={onClickDisConnect}
              variant="secondary"
              style={{ width: 112 }}
            >
              Disconnect
            </Button>
          </div>
        </>
      );
    }
  }
  async function onClickConnect() {
    if (typeof window.ethereum === "undefined") {
      window.open(
        "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
        "_blank"
      );
      return;
    }
    let result = await window.ethereum.request({ method: 'eth_requestAccounts' });
    result;
    try {
      const getacc = await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x507', }], //1287
      });
      getacc;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x507', //1287
                chainName: 'Moonbeam Alpha',
                nativeCurrency: {
                  name: 'DEV',
                  symbol: 'DEV',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
              },
            ],
          });
        } catch (addError) {
          // handle "add" error
          console.log(addError);
        }
      }
      // handle other "switch" errors
    }

    window.localStorage.setItem('loggedin', 'true')
    window.localStorage.setItem('login-type', "metamask");

  }
  async function onClickDisConnect() {
    window.localStorage.setItem('loggedin', 'false')
    window.localStorage.setItem('login-type', "");
  }



  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="GrandDAO - Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header></Header>
      <div className={`${styles.container} flex items-center flex-col gap-8`}>
        <div className={`${styles.title}  flex flex-col`}>
          <h1 className="text-moon-32  font-bold">Login to your account</h1>
          <p className="text-trunks mt-4">Please connect to Pera or Metamask wallet in order to login.</p>
          <p className="text-trunks">You can use one of these networks:</p>

          <p className="text-trunks">Algorand Testnet (Default), Moonbase alpha, Celo Alfajore, BNB, Goerli Test Network</p>
        </div>
        <div className={styles.divider}></div>
        <div className={`${styles.title} flex flex-col items-center gap-8 `}>
          <MetamaskWallet />
        </div>
        <div className={`${styles.title} flex flex-col items-center gap-8 `}>
          <AlgoWallet />
        </div>
      </div>
    </>
  );
}
