import React, { useState, useEffect } from "react";
import Dialog, { DialogProps } from "@mui/material/Dialog";

import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { ethers } from "ethers";
import FormControl, { useFormControl } from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import vTokenAbi from '../../../services/json/vTokenABI.json';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import LoadingButton from "@mui/lab/LoadingButton";
import Container from "@mui/material/Container";
import { getChain } from "../../../services/useContract";
import Alert from "@mui/material/Alert";
import { useUtilsContext } from '../../../contexts/UtilsContext';
import algosdk from 'algosdk';



export default function DonateCoin({ ideasid, show, onHide, address }) {
  const [Balance, setBalance] = useState("");
  const [Token, setToken] = useState("");
  const [Coin, setCoin] = useState("Algo");
  const [isLoading, setisLoading] = useState(false);
  const [Amount, setAmount] = useState(0);
  const {  getUSDPriceForChain } = useUtilsContext();
  let alertBox = null;


  function ShowAlert(type = "default", message) {
    const pendingAlert = alertBox.children["pendingAlert"];
    const successAlert = alertBox.children["successAlert"];
    const errorAlert = alertBox.children["errorAlert"];

    alertBox.style.display = "block";
    pendingAlert.style.display = "none";
    successAlert.style.display = "none";
    errorAlert.style.display = "none";
    switch (type) {
      case "pending":
        pendingAlert.querySelector(".MuiAlert-message").innerText = message;
        pendingAlert.style.display = "flex";
        break;
      case "success":
        successAlert.querySelector(".MuiAlert-message").innerText = message;
        successAlert.style.display = "flex";
        break;
      case "error":
        errorAlert.querySelector(".MuiAlert-message").innerText = message;
        errorAlert.style.display = "flex";
        break;
    }
  }

  async function DonateCoinSubmission(e) {
    e.preventDefault();
    console.clear();
    const { amount } = e.target;
    alertBox = e.target.querySelector("[name=alertbox]");
    setisLoading(true);

    ShowAlert("pending", "Sending Transaction....");
    const boxMBRPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: CurrentAddress,
      to: address,
      amount: Number(amount.value) * 1e6,
      suggestedParams: await algokit.getTransactionParams(undefined, algodClient),
    });

    (await appClient.addDonation({ boxMBRPayment: boxMBRPayment, _donation_id: await stringToBytes("", "_donations_ids"), _ideas_id: await stringToBytes(ideasid, ""), _ideas_id_int: Number(ideasid), _doantion: Number(amount.value) * 1e6, _donator: CurrentAddress }, {
      boxes: [await stringToBytes("_donations", "_donation_id"), await stringToBytes("_ideas_uris" + ideasid, "")]
    }));

    ShowAlert("success", "Donation success!");

    LoadData();
    setisLoading(false);
  }
  const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(2),
    color: theme.palette.text.primary
  }));

  async function LoadData() {

    if (window.localStorage.getItem("login-type") === "pera") {
      if (!accountAddress) return;
      setToken(" Algo");
      const acctInfo = await algodClient.accountInformation(accountAddress?.address).do();
      setBalance(acctInfo.amount / 1e6);
      let UsdEchangePrice = 0.14;
      let amount = (SubsPrice) / Number(UsdEchangePrice);
      setAmount(Number(amount.toPrecision(5)))
    } else {
      const Web3 = require("web3");
      const web3 = new Web3(window.ethereum);
      let Balance = await web3.eth.getBalance(window?.ethereum?.selectedAddress?.toLocaleUpperCase());
      let token = " " + getChain(Number(window.ethereum.networkVersion)).nativeCurrency.symbol;
      setToken(token);
      setBalance((Balance / 1000000000000000000).toPrecision(5));
      let UsdEchangePrice = await getUSDPriceForChain();
      let amount = (SubsPrice) / Number(UsdEchangePrice);
      setAmount(Number(amount.toPrecision(5)))
    }

  }

  useEffect(() => {
    LoadData();
  }, [show]);
  return (
    <Dialog open={show} onClose={onHide} fullWidth="true" aria-labelledby="contained-modal-title-vcenter" centered="true">
      <DialogTitle>Donate Coin</DialogTitle>
      <DialogContent>
        <Container>
          <form id="doanteForm" onSubmit={DonateCoinSubmission} autoComplete="off">
            <div name="alertbox" hidden="true">
              <Alert variant="filled" sx={{ my: 1 }} name="pendingAlert" severity="info">
                Pending....
              </Alert>
              <Alert variant="filled" sx={{ my: 1 }} name="successAlert" severity="success">
                Success....
              </Alert>
              <Alert variant="filled" sx={{ my: 1 }} name="errorAlert" severity="error">
                Error....
              </Alert>
            </div>

            <StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
              <div variant="standard">
                <InputLabel>Ideas</InputLabel>
                <span>{title}</span>
              </div>
            </StyledPaper>

            <StyledPaper sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", my: 1, mx: "auto", p: 2 }}>
              <FormControl variant="standard">
                <InputLabel>Amount ({Token})</InputLabel>

                <Input name="amount"   onChange={(e) => setAmount(Number(e.target.value))} />
                <div>
                  <p>Balance {Balance} {Token}</p>
                </div>
              </FormControl>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <InputLabel>USD</InputLabel>
                <p>${SubsPrice}</p>
              </div>
            </StyledPaper>

            <DialogActions>
              {Amount <= Number( Balance) ? (<><LoadingButton type="submit" name="JoinBTN" loading={isLoading} className="btn-secondary" size="medium">
                Join
              </LoadingButton></>) : (<>
                <span style={{ color: "red" }}>
                  Insufficent funds

                </span>
              </>)}

            </DialogActions>

            {CurrentChainNetwork !== 1287 ? <><StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
              <div variant="standard">
                <InputLabel>Target Chain</InputLabel>
                <span>Moonbase Alpha</span>
              </div>
            </StyledPaper></> : <></>}

            <StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
              <div variant="standard">
                <InputLabel>Target Address</InputLabel>
                <span>{address}</span>
              </div>
            </StyledPaper>
            {CurrentChainNetwork !== 1287 ? <>
              <StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
                <div variant="standard">
                  <InputLabel>From Chain</InputLabel>
                  <span>{CurrentChain}</span>
                </div>
              </StyledPaper>
            </> : <>
              <StyledPaper sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", my: 1, mx: "auto", p: 2 }}>
                <FormControl variant="standard" fullWidth>
                  <InputLabel>Coin</InputLabel>

                  <Select value={Coin} onChange={(e) => setCoin(e.target.value)}>

                    <MenuItem value="DEV" selected>DEV</MenuItem>
                    <MenuItem value="xcvGLMR">xcvGLMR</MenuItem>
                  </Select>
                </FormControl>

              </StyledPaper>
            </>}
            <StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
              <div variant="standard">
                <InputLabel>From Address</InputLabel>
                <span>{CurrentAddress} (Your)</span>
              </div>
            </StyledPaper>
            <StyledPaper sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", my: 1, mx: "auto", p: 2 }}>
              <FormControl variant="standard">
                <InputLabel>Amount</InputLabel>
                <Input name="amount" />
              </FormControl>
              <div>
                <InputLabel>Balance</InputLabel>
                <p>{Balance}</p>
              </div>
            </StyledPaper>

            <DialogActions>
              <LoadingButton type="submit" name="DonateBTN" loading={isLoading} className="btn-secondary" size="medium">
                Donate
              </LoadingButton>
            </DialogActions>
          </form>
        </Container>
      </DialogContent>
    </Dialog>
  );
}
