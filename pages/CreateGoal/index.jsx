import React, { useEffect, useState } from "react";
import Head from "next/head";
import UseFormInput from "../../components/components/UseFormInput";
import UseFormTextArea from "../../components/components/UseFormTextArea";
import { Header } from "../../components/layout/Header";
import NavLink from "next/link";
import isServer from "../../components/isServer";
import useContract from '../../services/useContract'
import { NFTStorage, File } from "nft.storage";
import styles from "./CreateGoal.module.css";
import { Button } from "@heathmont/moon-core-tw";
import { GenericPicture, ControlsPlus } from "@heathmont/moon-icons-tw";
import { useAlgoContext } from "../../contexts/AlgoContext";

export default function CreateGoal() {
  const [GoalImage, setGoalImage] = useState([]);
  const { contract, signerAddress,sendTransaction } = useContract()
  const { sender, appClient, payToApp, stringToBytes,getMapIds, createRecordInDB,accountAddress } = useAlgoContext();

  if (isServer()) return null;

  //Storage API for images and videos
  const NFT_STORAGE_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJDMDBFOGEzZEEwNzA5ZkI5MUQ1MDVmNDVGNUUwY0Q4YUYyRTMwN0MiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1NDQ3MTgxOTY2NSwibmFtZSI6IlplbmNvbiJ9.6znEiSkiLKZX-a9q-CKvr4x7HS675EDdaXP622VmYs8";
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  //Input fields
  const [GoalTitle, GoalTitleInput] = UseFormInput({
    defaultValue: "",
    type: "text",
    placeholder: "Goal name",
    id: "",
  });

  const [GoalDescription, GoalDescriptionInput] = UseFormTextArea({
    defaultValue: "",
    placeholder: "Goal Description",
    id: "",
    rows: 4,
  });


  const [EndDate, EndDateInput] = UseFormInput({
    defaultValue: "",
    type: "datetime-local",
    placeholder: "End date",
    id: "enddate",
  });

  const [Budget, BudgetInput] = UseFormInput({
    defaultValue: "",
    type: "text",
    placeholder: "Budget",
    id: "goal",
  });
  let id = -1;

  let StructureLeft = {
    0: "Representatives Berlin",
    1: "Community",
    2: "Children"
  }
  let StructureRight = {
    0: "20%",
    1: "70%",
    2: "10%"
  }


  async function CheckTransaction() {
    let params = (new URL(window.location)).searchParams;
    if (params.get("transactionHashes") !== null) {
      window.location.href = `/daos`;
    }
  }

  CheckTransaction();


  //Function after clicking Create Goal Button
  async function createGoal() {
    var CreateGoalBTN = document.getElementById("CreateGoalBTN");
    CreateGoalBTN.disabled = true;
    let allFiles = [];
    for (let index = 0; index < GoalImage.length; index++) {
      //Gathering all files link
      const element = GoalImage[index];
      const metadata = await client.storeBlob(element);
      const urlImageGoal = {
        url: "https://" + metadata + ".ipfs.nftstorage.link",
        type: element.type,
      };
      allFiles.push(urlImageGoal);
    }
    let _goal_ids = await getMapIds("_goal_ids");
    let db_goal_id =  await createRecordInDB('Goal',{
      "ID": _goal_ids,
      "GoalURI": GoalDescription
    })

    //Creating an object of all information to store in EVM
    const createdObject = {
      id: db_goal_id,
      title: "Asset Metadata",
      type: "object",
      properties: {
        Title: {
          type: "string",
          description: GoalTitle,
        },
        Description: {
          type: "string",
          description: "",
        },
        Budget: {
          type: "string",
          description: Budget,
        },
        End_Date: {
          type: 'string',
          description: EndDate,
        },
        wallet: {
          type: "string",
          description: accountAddress?.address,
        },
        logo: {
          type: "string",
          description: allFiles[0],
        },
        allFiles,
      },
    };
    console.log("======================>Creating Goal");
    try {

      // Creating Goal in Smart contract

      let boxMBRPayment = await payToApp();


      (await appClient.createGoal({boxMBRPayment:boxMBRPayment, _goal_id: await stringToBytes("", "_goal_ids"),  _goal_uri: JSON.stringify(createdObject), _dao_id: Number(id) } ,{
        boxes: [await stringToBytes("_goal_uris", "_goal_ids")]
      }))

        // await sendTransaction(await window.contract.populateTransaction.create_goal(JSON.stringify(createdObject),Number(id),signerAddress.toLocaleUpperCase()));

    } catch (error) {
      console.error(error);
      return;
      // window.location.href = "/login?[/]"; //If found any error then it will let the user to login page
    }
    window.location.href = `/daos/dao?[${id}]`; //After the success it will redirect the user to dao page

  }

  function CreateGoalBTN() {
    return (
      <>
        <div className="flex gap-4 justify-end">
          <NavLink href="/daos">
            <Button variant="secondary">Cancel</Button>
          </NavLink>
          <Button id="CreateGoalBTN" onClick={createGoal}>
            <ControlsPlus className="text-moon-24" />
            Create goal
          </Button>
        </div>
      </>
    );
  }
  function FilehandleChange(goal) {
    // If user uploaded images/videos
    var allNames = [];
    for (let index = 0; index < goal.target.files.length; index++) {
      const element = goal.target.files[index].name;
      allNames.push(element);
    }
    for (let index2 = 0; index2 < goal.target.files.length; index2++) {
      setGoalImage((pre) => [...pre, goal.target.files[index2]]);
    }
  }
  if (!isServer()) {
    const regex = /\[(.*)\]/g;
    const str = decodeURIComponent(window.location.search);
    let m;

    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      id = m[1];
    }
  }
  function AddBTNClick(goal) {
    //Clicking on +(Add) Function
    var GoalImagePic = document.getElementById("GoalImage");
    GoalImagePic.click();
  }

  function DeleteSelectedImages(goal) {
    //Deleting the selected image
    var DeleteBTN = goal.currentTarget;
    var idImage = Number(DeleteBTN.getAttribute("id"));
    var newImages = [];
    var allUploadedImages = document.getElementsByName("deleteBTN");
    for (let index = 0; index < GoalImage.length; index++) {
      if (index != idImage) {
        const elementDeleteBTN = allUploadedImages[index];
        elementDeleteBTN.setAttribute("id", newImages.length.toString());
        const element = GoalImage[index];
        newImages.push(element);
      }
    }
    setGoalImage(newImages);
  }

  return (
    <>
      <Head>
        <title>Create Goal</title>
        <meta name="description" content="Create Goal" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header></Header>
      <div
        className={`${styles.container} flex items-center justify-center flex-col gap-8`}
      >
        <div className={`${styles.title} gap-8 flex flex-col`}>
          <h1 className="text-moon-32 font-bold">Create goal</h1>

        </div>
        <div className={styles.divider}></div>
        <div className={`${styles.form} flex flex-col gap-8`}>
          <div>
            <h6>Goal name</h6>
            {GoalTitleInput}
          </div>

          <div>
            <h6>Description</h6>
            {GoalDescriptionInput}
          </div>
          <div className="flex gap-8 w-full">
            <div className="flex-1">
              <h6>Budget</h6>
              {BudgetInput}
            </div>
          </div>
          <div className="flex gap-8 w-full">
            <div className="flex-1">
              <h6>End Date</h6>
              {EndDateInput}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h6>Content</h6>
            <div style={{ borderColor: '#6578F2' }} className="border-4 border-dashed content-start flex flex-row flex-wrap gap-4 h-full inset-0 justify-start m-auto overflow-auto p-1 relative text-center text-white w-full z-20">
              <input
                className="file-input"
                hidden
                onChange={FilehandleChange}
                id="GoalImage"
                name="GoalImage"
                type="file"
                multiple="multiple"
              />
              <div className="flex gap-4">
                {GoalImage.map((item, i) => {
                  return (
                    <div key={i} className="flex gap-4">
                        <button
                          onClick={DeleteSelectedImages}
                          name="deleteBTN"
                          id={i}
                        >
                          {item.type.includes("image") ? (
                            <img
                              className={styles.image}
                              src={URL.createObjectURL(item)}
                            />
                          ) : (
                            <>
                              <div className="Goal-Uploaded-File-Container">

                                <span className="Goal-Uploaded-File-name">
                                  {item.name.substring(0, 10)}...
                                </span>
                              </div>
                            </>
                          )}
                        </button>
                      </div>
                  );
                })}
                <div className="Goal-ImageAdd">
                  <Button
                    id="Add-Image"
                    onClick={AddBTNClick}
                    variant="secondary"
                    style={{ height: 80, padding: "1.5rem" }}
                    iconLeft
                    size="lg"
                  >
                    <GenericPicture className="text-moon-24" />
                    Add image
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h6>Structure</h6>
            <div className="flex gap-8"  style={{color: "black"}}>
              <div style={{ boxShadow: '#907979 0 0 10px 0px' }} className="bg-white rounded-lg flex flex-col p-2  pb-2 w-48 pb-0">
                <h6 onInput={e => { StructureLeft[0] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                 Representatives Lake Nona
                </h6>
                <h6 onInput={e => { StructureLeft[1] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                  Community
                </h6>
                <h6 onInput={e => { StructureLeft[2] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                  Children
                </h6>
              </div>
              <div style={{ boxShadow: '#907979 0 0 10px 0px' }} className="bg-white rounded-lg flex flex-col p-2  pb-2 w-48 pb-0">

                <h6 onInput={e => { StructureRight[0] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                  20%
                </h6>
                <h6 onInput={e => { StructureRight[1] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                  70%
                </h6>
                <h6 onInput={e => { StructureRight[2] = e.currentTarget.innerText }} contentEditable="true" suppressContentEditableWarning={true} className="border-2 hover:bg-[#d1d5db] hover:cursor-pointer bg-white flex hover:bg-gray-200 items-center p-2 rounded-lg w-full">
                  10%
                </h6>
              </div>
            </div>
          </div>

          <CreateGoalBTN />
        </div>
      </div>
    </>
  );
}
