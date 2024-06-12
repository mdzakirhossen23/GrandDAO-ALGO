import React, { useState, useEffect } from "react";
import Head from "next/head"
import Image from "next/image"
import NavLink from "next/link"
import useContract from "../../../../services/useContract"

import { Header } from "../../../../components/layout/Header"
import isServer from "../../../../components/isServer"
import styles from "../../daos.module.css"
import Card from "../../../../components/components/Card/Card"
import { ControlsPlus, ControlsChevronRight, ControlsChevronLeft } from "@heathmont/moon-icons-tw"
import { Button } from "@heathmont/moon-core-tw"
import Skeleton from "@mui/material/Skeleton"
import { useAlgoContext } from "../../../../contexts/AlgoContext"
let running = true


export default function Goal() {
  //Variables
  const [list, setList] = useState([])
  const { getMapValue, payToApp, appClient, getRecordFromDB, getAllGlobalMap, accountAddress } = useAlgoContext();

  const [GoalURI, setGoalURI] = useState({
    goalId: "",
    Title: "",
    Description: "",
    Budget: "",
    End_Date: "",
    StructureLeft: [],
    StructureRight: [],
    wallet: "",
    logo: "",
    isOwner: true
  })
  const [goalId, setGoalID] = useState(-1)
  const { contract, signerAddress } = useContract()

  const regex = /\[(.*)\]/g
  let m
  let id = "" //id from url

  const sleep = milliseconds => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  useEffect(() => {
    fetchContractData()
  }, [accountAddress])

  setInterval(function () {
    calculateTimeLeft()
  }, 1000)
  if (isServer()) return null
  const str = decodeURIComponent(window.location.search)

  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    id = m[1]
  }
  function calculateTimeLeft() {
    //Calculate time left
    try {
      var allDates = document.getElementsByName("DateCount")
      for (let i = 0; i < allDates.length; i++) {
        var date = allDates[i].getAttribute("date")
        var status = allDates[i].getAttribute("status")
        allDates[i].innerHTML = LeftDate(date, status)
      }
    } catch (error) { }
  }

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  async function fetchContractData() {
    //Fetching data from Smart contract
    running = true
    try {
      if (accountAddress && id) {
        setGoalID(Number(id))


        const goalValue = await getMapValue('_goal_uris', Number(id))
        const goalURI = JSON.parse(goalValue[1]) //Getting dao URI




        let allMaps = await getAllGlobalMap();
        const totalIdeas = allMaps["_ideas_ids"]?.value //Getting total goal (Number)

        const arr = []
        for (let i = 0; i < Number(totalIdeas); i++) {
          let  ideasValue = null;
          try{
            ideasValue =await getMapValue('_ideas_uris', i)
          }catch(e){
            continue
          }

          if (Number(ideasValue[0]) !== Number(id)) continue;
          const object = JSON.parse(ideasValue[1]);
          let ideas_in_db =await getRecordFromDB('Ideas',object.properties.Description.description);

          if (object) {
            arr.push({
              //Pushing all data into array
              ideasId: i,
              Title: object.properties.Title.description,
              Description: ideas_in_db.fields['IdeasURI'],
              wallet: object.properties.wallet.description,
              logo: object.properties.logo.description.url,
              allfiles: object.properties.allfiles
            })
          }
        }
        setList(arr)

        setGoalURI({
          goalId: Number(id),
          Title: goalURI.properties.Title.description,
          Description: goalURI.properties.Description.description,
          Budget: goalURI.properties.Budget.description,
          End_Date: goalURI.properties.End_Date?.description,
          wallet: goalURI.properties.wallet.description,
          logo: goalURI.properties.logo.description.url,
          isOwner: goalURI.properties.wallet.description.toString().toLocaleUpperCase() === accountAddress?.address.toString().toLocaleUpperCase() ? true : false
        })

        /** TODO: Fix fetch to get completed ones as well */
        if (document.getElementById("Loading")) document.getElementById("Loading").style = "display:none";
      }
    } catch (error) {
      console.error(error)
    }
    running = false
  }

  function LeftDate(datetext, status) {
    //Counting Left date in date format
    var c = new Date(datetext).getTime()
    var n = new Date().getTime()
    var d = c - n
    var da = Math.floor(d / (1000 * 60 * 60 * 24))
    var h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    var m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60))
    var s = Math.floor((d % (1000 * 60)) / 1000)
    if (s.toString().includes("-") && status === "Finished") {
      return "Goal Ended"
    }
    return da.toString() + " Days " + h.toString() + " hours " + m.toString() + " minutes " + s.toString() + " seconds" + " Left"
  }
  function Loader({ element, type = "rectangular", width = "50", height = "23" }) {
    if (running) {
      return <Skeleton variant={type} width={width} height={height} />
    } else {
      return element
    }
  }
  return (
    <>
      <Header></Header>
      <Head>
        <title>Goal</title>
        <meta name="description" content="Goal" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${styles.container} flex items-center flex-col gap-8 relative`}>
        <div className={`${styles.title} gap-8 flex flex-col relative`}>
          <div>
            <h1 className="text-moon-32 font-bold" style={{ width: "78%" }}>
              {GoalURI.Title}
            </h1>
            <a
              style={{ width: "135px", position: "absolute", right: "1rem", top: "0" }}
              onClick={() => {
                window.history.back()
              }}>
              <Button iconleft style={{ width: "135px" }}>
                <ControlsChevronLeft />
                Back
              </Button>
            </a>
          </div>

          <div className={`${styles.tabs} flex gap-4`}>
            <NavLink href="?q=All">
              <a className="DonationBarLink tab block px-3 py-2 active">All</a>
            </NavLink>
            <NavLink href="?q=Today">
              <a className="DonationBarLink tab block px-3 py-2">Today</a>
            </NavLink>
            <NavLink href="?q=This Month">
              <a className="DonationBarLink tab block px-3 py-2">This Month</a>
            </NavLink>
            {!GoalURI.isOwner ? (
              <>
                <a href={`/CreateIdeas?[${goalId}]`}>
                  <Button style={{ width: "150px", position: "absolute", right: "1rem" }} iconLeft>
                    <ControlsPlus className="text-moon-24" />
                    <div className="card BidcontainerCard">
                      <div className="card-body bidbuttonText">Create Ideas</div>
                    </div>
                  </Button>
                </a>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className={styles.divider}></div>

        <Loader
          element={
            <div className="flex flex-col gap-8">
              <img src={GoalURI.logo} />{" "}
            </div>
          }
          width="90%"
          height={578}
        />
        <Loader
          element={
            <div className="flex flex-col gap-8">
              {list.map((listItem, index) => (
                <Card height={300} width={640} key={index} className="p-10">
                  <div className="flex flex-col gap-8 w-full">
                    <div className="flex gap-6 w-full">
                      <span className={styles.image}>
                        <img alt="" src={listItem.logo} />
                      </span>
                      <div className="flex flex-col gap-2 overflow-hidden text-left">
                        <div className="font-bold">{listItem.Title}</div>
                        <div>{listItem.Description.substring(0, 120)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between align-center ">
                      <div name="DateCount" date={GoalURI.End_Date} status={listItem.status} className="flex items-center font-bold">
                        {LeftDate(GoalURI.End_Date, listItem.status)}
                      </div>

                      <a href={`/daos/dao/goal/ideas?[${listItem.ideasId}]`}>
                        <Button iconleft>
                          <ControlsChevronRight />
                          See more
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
          width="90%"
          height={578}
        />
      </div>
    </>
  )
}
