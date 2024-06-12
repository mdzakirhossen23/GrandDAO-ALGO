import { Button } from "@heathmont/moon-core-tw";
import Head from "next/head";
import { useEffect, useState } from "react";
import SlideShow from "../../../../../components/components/Slideshow";
import useContract from "../../../../../services/useContract";
import { ControlsChevronLeft } from "@heathmont/moon-icons-tw";
import { useSnackbar } from 'notistack';
import UseFormTextArea from "../../../../../components/components/UseFormTextArea";
import isServer from "../../../../../components/isServer";
import DonateCoin from "../../../../../components/components/modal/DonateCoin";
import { Header } from "../../../../../components/layout/Header";
import styles from "../../../daos.module.css";
import Skeleton from "@mui/material/Skeleton";
import CommentBox from "../../../../../components/components/Card/Comment";
import { useUtilsContext } from '../../../../../contexts/UtilsContext';
import { useAlgoContext } from "../../../../../contexts/AlgoContext"
import { useWormholeContext } from "../../../../../contexts/WormholeContext"


let IdeasEnd = "";
let IdeasWaiting = false;
let running = true;
export default function GrantIdeas() {
  //variables
  const { enqueueSnackbar } = useSnackbar();
  const { USDPrice } = useUtilsContext();
  const { getMapValue, payToApp, appClient, getRecordFromDB, stringToBytes, getAllGlobalMap, accountAddress } = useAlgoContext();
  const { VoteFromEVM } = useWormholeContext();


  const [ideaId, setIdeasId] = useState(-1);
  const [Goal_id, setGoal_id] = useState(-1);
  const [PollIndex, setPollIndex] = useState(-1);
  const [imageList, setimageList] = useState([]);
  const [IdeasURI, setIdeasURI] = useState({ ideasId: "", Title: "", Description: "", wallet: "", logo: "", End_Date: "", voted: 0, delegAmount: 0, delegDated: "", isVoted: true, isOwner: true, allfiles: [] });
  const [DonatemodalShow, setDonatemodalShow] = useState(false);
  const [AccountAddress, setAccountAddress] = useState("");
  const { contract, signerAddress, sendTransaction, saveReadMessage } = useContract();
  const [Comment, CommentInput, setComment] = UseFormTextArea({
    defaultValue: "",
    placeholder: "Your comment",
    id: "",
    name: "comment",
    rows: 6
  });
  const [emptydata, setemptydata] = useState([])

  const [CommentsList, setCommentsList] = useState([{
    id: 0,
    comment: "",
    address: "",
    date: "",
    replies: [{
      id: 0,
      message: "",
      address: "",
      date: ""
    }]
  }]);

  let m;
  let id = ""; //Ideas id from url
  let Goalid = ""; //Goal id


  function LeftDate(datetext, int = false) {
    //String date to dd/hh/mm/ss format
    if (int) datetext = Number(datetext);
    var c = new Date(datetext).getTime();
    var n = new Date().getTime();
    var d = c - n;
    var da = Math.floor(d / (1000 * 60 * 60 * 24));
    var h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((d % (1000 * 60)) / 1000);
    return da.toString() + " Days " + h.toString() + " hours " + m.toString() + " minutes " + s.toString() + " seconds";
  }
  function LeftDateSmall(datetext) {
    //String date to d/h/m/s format

    var c = new Date(datetext).getTime();
    var n = new Date().getTime();
    var d = c - n;
    var da = Math.floor(d / (1000 * 60 * 60 * 24));
    var h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((d % (1000 * 60)) / 1000);
    if (IdeasEnd === "Finished" && s.toString().includes("-")) {
      return "Ideas Ended";
    } else if (s.toString().includes("-") && IdeasWaiting === true && IdeasEnd !== "Finished") {
      return "Waiting for release";
    } else {
      return da.toString() + "d " + h.toString() + "h " + m.toString() + "m " + s.toString() + "s" + " left";
    }
  }

  useEffect(() => {
    fetchContractData();
  }, [accountAddress]);

  useEffect(() => {
    function SetReadSettings() {
      var messages = document.querySelectorAll(".read-message");
      for (let i = 0; i < messages.length; i++) {
        const element = messages[i];
        observerMessage.observe(element);
      }
      var replys = document.querySelectorAll(".read-reply");
      for (let i = 0; i < replys.length; i++) {
        const element = replys[i];
        observerReply.observe(element);
      }
    }
    SetReadSettings();
  }, [emptydata]);

  useEffect(() => {
    DesignSlide();
  });

  if (isServer()) return null;
  const regex = /\[(.*)\]/g;
  const str = decodeURIComponent(window.location.search);

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches

    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    id = m[1];
  }

  async function fetchContractData() {
    running = true;
    try {
      if (accountAddress?.address && id) {
        setIdeasId(id); //setting Ideas id
        id = Number(id);
        let ideasValue = await getMapValue('_ideas_uris', id)

        const object = JSON.parse(ideasValue[1]);
        let goalValue = null;
        let goalURI = null;
        try {
          Goalid = Number(ideasValue[0]);
          setGoal_id(Goalid);
          goalValue = await getMapValue('_goal_uris', Number(Goalid))
          goalURI = JSON.parse(goalValue[1]) //Getting dao URI

        } catch (e) { }

        let isvoted = false;


        let allMaps = await getAllGlobalMap();
        const totalVotes = allMaps["_ideas_vote_ids"]?.value //Getting total vote (Number)

        const Allvotes = []

        for (let i = 0; i < Number(totalVotes); i++) {
          const voteValue = await getMapValue('all_ideas_votes', i)
          if (Number(voteValue[1]) !== Number(id)) continue;

          if (voteValue[2] === accountAddress.address) isvoted = true;

          Allvotes.push(voteValue[2]);
        }

        let ideas_in_db = await getRecordFromDB('Ideas', object.properties.Description.description);


        setAccountAddress(object.properties.wallet.description);
        let votecount = Allvotes.length;
        let donations = Number(ideasValue[2]) / 1e6;

        setIdeasURI({
          ideasId: id,
          Title: object.properties.Title.description,
          Description: ideas_in_db.fields['IdeasURI'],
          wallet: object.properties.wallet.description,
          logo: object.properties.logo.description.url,
          End_Date: goalURI?.properties?.End_Date?.description,
          voted: votecount,
          donation: donations,
          isVoted: isvoted,
          isOwner: object.properties.wallet?.description?.toString()?.toLocaleUpperCase() === accountAddress?.address.toString().toLocaleUpperCase() ? true : false,
          allfiles: object.properties.allFiles
        });

        setimageList(object.properties.allFiles);

        const totalComments = allMaps["_message_ids"]?.value;

        let arr = [];
        for (let i = 0; i < Number(totalComments); i++) {
          try {
            const messageValue = await getMapValue('all_messages', i)
            console.log(messageValue)
            if (Number(messageValue[1]) !== Number(id)) continue;

            const object = JSON.parse(messageValue[2].toString());
            let newComment = {
              address: object.address,
              message: object.message,
              date: object.date,
              id: object.id,
              replies: []
            };
            arr.push(newComment);

          } catch (e) { console.log(e); continue }


        }
        setCommentsList(arr)

        // // Comments and Replies
        // const totalComments = await contract.getMsgIDs(Number(id)) //Getting total comments (Number) of this idea
        // // const arr = []
        // for (let i = 0; i < Object.keys(totalComments).length; i++) {
        // 	//total comments number Iteration
        // 	const commentId = Number(totalComments[i]);
        // 	let commentInfo = await contract.all_messages(commentId);
        // 	const object = JSON.parse(commentInfo.message)
        // 	let newComment = {
        // 		address: object.address,
        // 		message: object.message,
        // 		date: object.date,
        // 		id: object.id,
        // 		replies: []
        // 	};

        // 	const totalReplies = await contract.getReplyIDs(Number(commentId)) //Getting total replies (Number) of this comment
        // 	for (let i = 0; i < Object.keys(totalReplies).length; i++) {
        // 		const replyId = Number(totalReplies[i]);
        // 		let replyInfo = await contract.all_replies(replyId);
        // 		const object = JSON.parse(replyInfo.message)
        // 		let newReply = {
        // 			id: object.id,
        // 			message: object.message,
        // 			address: object.address,
        // 			date: object.date
        // 		};
        // 		newComment.replies.push(newReply)
        // 	}
        // 	CommentsList.push(newComment);
        // }
        removeElementFromArrayBYID(emptydata, 0, setemptydata)
        if (document.getElementById("Loading")) document.getElementById("Loading").style = "display:none";
      }
    } catch (error) {
      console.error(error);
    }
    running = false;
  }
  // async function fetchContractData() {
  // 	running = true;
  // 	try {
  // 		if (contract && id) {
  // 			setIdeasId(id); //setting Ideas id
  // 			id = Number(id);

  // 			const ideaURI = await contract.ideas_uri(Number(id)); //Getting ideas uri
  // 			const object = JSON.parse(ideaURI); //Getting ideas uri
  // 			Goalid = await contract.get_goal_id_from_ideas_uri(ideaURI);
  // 			setGoal_id(Goalid);
  // 			const goalURI = JSON.parse(await contract.goal_uri(Number(Goalid))); //Getting goal URI
  // 			let isvoted = false;
  // 			const Allvotes = await contract.get_ideas_votes_from_goal(Number(Goalid), Number(id)); //Getting all votes
  // 			for (let i = 0; i < Allvotes.length; i++) {
  // 				const element = Allvotes[i];
  // 				if (element === signerAddress) isvoted = true;
  // 			}
  // 			setAccountAddress(object.properties.wallet.description);
  // 			setPollIndex(object.properties?.Referenda?.description);
  // 			setIdeasURI({
  // 				ideasId: id,
  // 				Title: object.properties.Title.description,
  // 				Description: object.properties.Description.description,
  // 				Referenda: object.properties?.Referenda?.description,
  // 				wallet: object.properties.wallet.description,
  // 				logo: object.properties.logo.description.url,
  // 				End_Date: goalURI.properties.End_Date?.description,
  // 				voted: Object.keys(Allvotes).length,
  // 				donation: Number((await contract._ideas_uris(Number(id))).donation) / 1e18,
  // 				isVoted: isvoted,
  // 				isOwner: object.properties.wallet.description.toString().toLocaleUpperCase() === signerAddress.toString().toLocaleUpperCase() ? true : false,
  // 				allfiles: object.properties.allFiles
  // 			});

  // 			setimageList(object.properties.allFiles);

  // 			// Comments and Replies
  // 			const totalComments = await contract.getMsgIDs(Number(id)) //Getting total comments (Number) of this idea
  // 			// const arr = []
  // 			for (let i = 0; i < Object.keys(totalComments).length; i++) {
  // 				//total comments number Iteration
  // 				const commentId = Number(totalComments[i]);
  // 				let commentInfo = await contract.all_messages(commentId);
  // 				const object = JSON.parse(commentInfo.message)
  // 				let newComment = {
  // 					address: object.address,
  // 					message: object.message,
  // 					date: object.date,
  // 					id: object.id,
  // 					replies: []
  // 				};

  // 				const totalReplies = await contract.getReplyIDs(Number(commentId)) //Getting total replies (Number) of this comment
  // 				for (let i = 0; i < Object.keys(totalReplies).length; i++) {
  // 					const replyId = Number(totalReplies[i]);
  // 					let replyInfo = await contract.all_replies(replyId);
  // 					const object = JSON.parse(replyInfo.message)
  // 					let newReply = {
  // 						id: object.id,
  // 						message: object.message,
  // 						address: object.address,
  // 						date: object.date
  // 					};
  // 					newComment.replies.push(newReply)
  // 				}
  // 				CommentsList.push(newComment);
  // 			}
  // 			removeElementFromArrayBYID(emptydata, 0, setemptydata)
  // 			if (document.getElementById("Loading")) document.getElementById("Loading").style = "display:none";
  // 		}
  // 	} catch (error) {
  // 		console.error(error);
  // 	}
  // 	running = false;
  // }

  async function DesignSlide() {
    if (document.querySelector('[data-type="prev"]') !== null) {
      document.querySelector('[data-type="prev"]').innerHTML =
        '<div className="undefined nav " data-type="prev" aria-label="Previous Slide" style="width: 45px;margin-right: -50px;cursor: pointer;"><div className="undefined nav " data-type="prev" aria-label="Previous Slide" style="color: black;cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79 79"><svg xmlns="http://www.w3.org/2000/svg" width="79" height="79" fill="none"><g filter="url(#filter0_b_48_4254)"><circle cx="39.5" cy="39.5" r="39.5" fill="white"></circle><circle cx="39.5" cy="39.5" r="39.25" stroke="#C4C4C4" stroke-width="0.5"></circle></g><path d="M29.0556 39.9087L42.3821 26.6582C42.8187 26.2244 43.5256 26.2251 43.9615 26.6605C44.3971 27.0958 44.3959 27.801 43.9592 28.2353L31.426 40.6971L43.9597 53.1588C44.3963 53.5931 44.3974 54.2979 43.9619 54.7333C43.7434 54.9515 43.4572 55.0606 43.1709 55.0606C42.8854 55.0606 42.6002 54.9522 42.3821 54.7355L29.0556 41.4854C28.8453 41.2768 28.7273 40.9929 28.7273 40.6971C28.7273 40.4013 28.8456 40.1177 29.0556 39.9087Z" fill="black"></path><defs><filter id="filter0_b_48_4254" x="-4" y="-4" width="87" height="87" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feGaussianBlur in="BackgroundImageFix" stdDeviation="2"></feGaussianBlur><feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_48_4254"></feComposite><feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_48_4254" result="shape"></feBlend></filter></defs></svg></svg></div></div>';
      document.querySelector('[data-type="next"]').innerHTML =
        '<div className="undefined nav " data-type="next" aria-label="Next Slide" style="width: 45px;margin-left: -17px;cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79 79" fill="#2e2e2e"><svg width="79" height="79" viewBox="0 0 79 79" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_b_48_4262)"><circle cx="39.5" cy="39.5" r="39.5" fill="white"></circle><circle cx="39.5" cy="39.5" r="39.25" stroke="#C4C4C4" stroke-width="0.5"></circle></g><path d="M43.9596 41.4853L30.6331 54.7358C30.1965 55.1697 29.4896 55.169 29.0537 54.7336C28.6181 54.2982 28.6192 53.593 29.0559 53.1588L41.5892 40.697L29.0555 28.2352C28.6188 27.801 28.6177 27.0962 29.0532 26.6608C29.2717 26.4425 29.558 26.3334 29.8443 26.3334C30.1298 26.3334 30.4149 26.4418 30.633 26.6585L43.9596 39.9087C44.1699 40.1173 44.2879 40.4012 44.2879 40.697C44.2879 40.9928 44.1696 41.2763 43.9596 41.4853Z" fill="black"></path><defs><filter id="filter0_b_48_4262" x="-4" y="-4" width="87" height="87" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feGaussianBlur in="BackgroundImageFix" stdDeviation="2"></feGaussianBlur><feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_48_4262"></feComposite><feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_48_4262" result="shape"></feBlend></filter></defs></svg></svg></div>';
      document.querySelector(".react-slideshow-zoom-wrapper").classList.add("rounded-xl");
      if (document.querySelector(".react-slideshow-container") != null) {
        document.querySelector(".react-slideshow-container").classList.add("overflow-hidden");
        document.querySelector(".react-slideshow-container").classList.add("rounded-xl");
        document.querySelector(".react-slideshow-container").style.height = "500px";
      }
    }
  }

  const observerMessage = new window.IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting) {
      let elm = entry.target;
      let id = Number(elm.dataset.id);
      await saveReadMessage(id, ideaId, "message")

      return
    }
    console.log('LEAVE')
  }, {
    root: null,
    threshold: 1, // set offset 0.1 means trigger if atleast 10% of element in viewport
  })


  const observerReply = new window.IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting) {
      let elm = entry.target;
      let id = Number(elm.dataset.id);

      await saveReadMessage(id, ideaId, "reply")


      return
    }
    console.log('LEAVE')
  }, {
    root: null,
    threshold: 1, // set offset 0.1 means trigger if atleast 10% of element in viewport
  })

  setInterval(function () {
    calculateTimeLeft();
  }, 1000);

  function calculateTimeLeft() {
    //Calculating time left
    try {
      var allDates = document.getElementsByName("dateleft");
      for (let i = 0; i < allDates.length; i++) {
        var date = allDates[i].getAttribute("date");
        var inttype = allDates[i].getAttribute("inttype");
        if (inttype != undefined) { inttype = true; } else { inttype = false; }
        allDates[i].innerHTML = LeftDate(date, inttype);
      }
      var allDates = document.getElementsByName("date");
      for (let i = 0; i < allDates.length; i++) {
        var date = allDates[i].getAttribute("date");
        if (date !== undefined && date !== "") {
          allDates[i].innerHTML = LeftDateSmall(date);
        }
      }
    } catch (error) { }
  }

  async function VoteIdees() {
    try {
      // Creating Ideas in Smart contract
      if (window.localStorage.getItem("login-type") == "pera" && window.localStorage.getItem("loggedin") == "true") {
        let boxMBRPayment = await payToApp();

        (await appClient.createIdeasVote({ boxMBRPayment: boxMBRPayment, _ideas_votes_id: await stringToBytes("", "_ideas_vote_ids"), _goal_id: Number(Goalid), _ideas_id: Number(id), _wallet: accountAddress.address }, {
          boxes: [await stringToBytes("all_ideas_votes", "_ideas_vote_ids")]
        }));

      } else {

        let allMaps = await getAllGlobalMap();
        const _ideas_vote_ids = Number(allMaps["_ideas_vote_ids"]?.value ?? 0)

        await VoteFromEVM(_ideas_vote_ids, Number(Goalid), Number(id), accountAddress?.address.toString().toLocaleUpperCase())
      }


    } catch (error) {
      console.error(error);
      return;
    }
    window.location.reload();
  }



  async function DonateToAddress() {
    setDonatemodalShow(true);
  }
  function Loader({ element, type = "rectangular", width = "50", height = "23" }) {
    if (running) {
      return <Skeleton variant={type} width={width} height={height} />;
    } else {
      return element;
    }
  }
  async function removeElementFromArrayBYID(all, specificid, seting) {
    seting([])
    var storing = [];
    for (let index = 0; index < all.length; index++) {
      const element = all[index];
      if (element.id == specificid) {
        continue
      }
      storing.push(element)
    }

    seting(storing)
  }
  async function PostComment(e) {
    e.preventDefault();

    let allMaps = await getAllGlobalMap();
    const messLatestId = allMaps["_message_ids"]?.value

    let newComment = {
      address: accountAddress.address?.toLocaleUpperCase().toString(),
      message: Comment,
      date: new Date().toISOString(),
      id: messLatestId
    };
    await saveMessage(newComment);
    newComment.replies = [];
    CommentsList.push(newComment);
    setComment("");
    removeElementFromArrayBYID(emptydata, 0, setemptydata)
  }
  async function saveMessage(newComment) {

    let boxMBRPayment = await payToApp();

    (await appClient.sendMsg({ boxMBRPayment: boxMBRPayment, _message_id: await stringToBytes("", "_message_ids"), _ideas_id: Number(ideaId), _message: JSON.stringify(newComment), _sender: accountAddress.address }, {
      boxes: [await stringToBytes("all_messages", "_message_ids")]
    }));


    removeElementFromArrayBYID(emptydata, 0, setemptydata)
    console.log("Saved Messages")
  }
  async function sendReply(replyText, MessageId, MessageIndex) {
    let allMaps = await getAllGlobalMap();
    const replyLatestId = allMaps["_reply_ids"]?.value

    let newReply = {
      id: replyLatestId,
      message: replyText,
      address: accountAddress.address?.toLocaleUpperCase().toString(),
      date: new Date().toISOString()
    };
    CommentsList[MessageIndex].replies.push(newReply);


    let boxMBRPayment = await payToApp();

    (await appClient.sendReply({ boxMBRPayment: boxMBRPayment, _reply_id: await stringToBytes("", "_reply_ids"), _message_id: Number(MessageId), _reply: JSON.stringify(newReply), ideas_id: Number(ideaId) }, {
      boxes: [await stringToBytes("all_replies", "_reply_ids")]
    }));


    // await sendTransaction(await window.contract.populateTransaction.sendReply(Number(MessageId), JSON.stringify(newReply), Number(ideaId), window?.ethereum?.selectedAddress?.toLocaleUpperCase()));
    removeElementFromArrayBYID(emptydata, 0, setemptydata)
    
  }





  return (
    <>
      <Head>
        <title>{IdeasURI.Title}</title>
        <meta name="description" content={IdeasURI.Title} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header></Header>
      <div className={`${styles.container} flex flex-col items-center gap-8`}>
        <div className={`${styles.title} flex flex-col gap-2`}>
          <div style={{ position: "relative" }}>
            <Loader
              element={
                <h1 className="text-moon-32 font-bold pb-2" style={{ width: "78%" }}>
                  {IdeasURI.Title}
                </h1>
              }
              width={"80%"}
            />
            <a
              style={{ width: "135px", position: "absolute", right: "0rem", top: "0" }}
              onClick={() => {
                window.history.back();
              }}
            >
              <Button iconleft style={{ width: "135px" }}>
                <ControlsChevronLeft />
                Back
              </Button>
            </a>
          </div>
          <div>
            <Loader
              element={
                <a className="font-medium text-[#0000ff]" href={`/Profile/${IdeasURI.wallet}`} style={{ color: "var(--title-a-text)" }} rel="noreferrer" target="_blank">
                  {IdeasURI.wallet}
                </a>
              }
              width={"80%"}
            />
          </div>
          <Loader
            element={
              <a className="text-piccolo" name="dateleft" date={IdeasURI.End_Date}>
                {LeftDate(IdeasURI.End_Date)}
              </a>
            }
            width={"80%"}
          />

          <Loader element={<div className="flex">Voted: {IdeasURI.voted} </div>} width={"100%"} />
          <Loader element={<div className="flex">Donated: {IdeasURI.donation} Algo ( {USDPrice * IdeasURI.donation} USD) </div>} width={"100%"} />

          <Loader element={<p>{IdeasURI.Description} </p>} width={"100%"} />
        </div>
        <div className={`${styles.tabtitle} flex gap-4 justify-start`}>
          <a className={`tab block cursor-pointer py-2 text-3xl text-[#0000ff]`} style={{ color: "var(--title-a-text)" }}>Ideas</a>
          {!IdeasURI.isOwner ? (<>
            <div className="flex justify-end w-full gap-4">
              {!IdeasURI.isVoted ? (
                <>
                  <Button
                    data-element-id="btn_vote"
                    style={{ width: "135px" }}
                    data-analytic-event-listener="true"
                    onClick={() => {
                      VoteIdees();
                    }}
                  >
                    Vote
                  </Button>
                </>
              ) : (
                <></>
              )}

              <Button
                data-element-id="btn_donate"
                style={{ width: "135px" }}
                data-analytic-event-listener="true"
                onClick={() => {
                  DonateToAddress();
                }}
              >
                Donate
              </Button>
            </div>
          </>) : (<></>)}

        </div>
        <div className={styles.divider}></div>
        <>
          <div className={`flex gap-8`}>
            <Loader
              type="rounded"
              element={
                imageList.length > 1 ? (
                  <>
                    <SlideShow className={styles.slideshow} images={imageList} />
                  </>
                ) : (
                  <>
                    <div className="flex-1 rounded-xl overflow-hidden flex" style={{ height: "500px" }}>
                      <img type={imageList[0]?.type} src={imageList[0]?.url} alt="" />
                    </div>
                  </>
                )
              }
              width={750}
              height={500}
            />
          </div>
        </>
      </div>
      <div style={{ padding: "4% 10%", display: "flex", justifyContent: "center" }}>
        <form onSubmit={PostComment} style={{ width: "60rem", display: "flex", flexDirection: "column", rowGap: "1rem" }}>
          {CommentInput}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button data-element-id="btn_donate" style={{ width: "135px" }} data-analytic-event-listener="true" type="submit">
              Post Comment
            </Button>
          </div>
        </form>
      </div>

      <div style={{ padding: "0 10%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "60rem", height: "100%" }}>
          {CommentsList.map((listItem, index) => (
            (listItem.address !== "") ?
              <CommentBox address={listItem.address} MessageID={listItem.id} MessageIndex={index} date={listItem.date} sendReply={sendReply} message={listItem.message} replies={listItem.replies} id={listItem.id} key={listItem.id} /> : <></>
          ))}
        </div>
      </div>
      {/*
			<DonateCoin
				ideasid={ideaId}
				show={DonatemodalShow}
				onHide={() => {
					setDonatemodalShow(false);
				}}
				address={AccountAddress}
			/>
		*/}
    </>
  );
}
