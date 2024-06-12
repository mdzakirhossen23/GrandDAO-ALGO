import React, { useState, useEffect } from "react";

import Head from "next/head"
import useContract from "../../services/useContract"
import { Header } from "../../components/layout/Header"
import isServer from "../../components/isServer"
import styles from "../daos/daos.module.css"
import Card from "../../components/components/Card/Card"
import { ControlsPlus, ControlsChevronRight, ControlsChevronLeft } from "@heathmont/moon-icons-tw"
import { formatDistance } from "date-fns";
import Skeleton from "@mui/material/Skeleton"


let running = true;
export default function Profile() {
	//Variables
	const { contract, signerAddress } = useContract()
	const [Donated, setDonated] = useState([])
	const [UserBadges, setUserBadges] = useState({
		dao:false,
		joined:false,
		goal:false,
		ideas: false,
		vote:false,
		donation:false,
		comment:false,
		reply:false
	})
	const [TotalRead, setTotalRead] = useState(0)
	const [Replied, setReplied] = useState(0)
	const [Daos, setDaos] = useState([])
	const [Ideas, setIdeas] = useState([])
	const [DontatedIdeas, setDontatedIdeas] = useState([])
	const [RepliesIdeas, setRepliesIdeas] = useState([])
	const [AllMessages, setAllMessages] = useState([])


	useEffect(() => {
		fetchContractData();
	}, [contract])


	if (isServer()) return null;
	let address = window.location.pathname.replace("/Profile/", "");


	async function fetchContractData() {
		if (!contract) return false;
		running = true;
		//Fetching data from Smart contract
		let allDaos = await contract.get_all_daos();
		let allIdeas = await contract.get_all_ideas();
		let donated = Number(await contract._donated(address.toLocaleUpperCase())) / 1e18;

		setUserBadges(await contract._user_badges(address.toLocaleUpperCase()));

		let total_read = 0;
		let _message_read_ids = await contract._message_read_ids();
		for (let i = 0; i < _message_read_ids; i++) {
			let ReadURI = await contract.all_read_messages(i);
			if (ReadURI.wallet.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				total_read += 1;
			}
		}



		let founddao = [];
		for (let i = 0; i < allDaos.length; i++) {
			let dao_info = JSON.parse(allDaos[i]);
			if (dao_info.properties.wallet.description.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				dao_info.id = i;
				let goal = await contract.get_all_goals_by_dao_id(i);;
				dao_info.goals = goal.filter(e => { return e !== "" });

				founddao.push(dao_info);

			}
		}
		founddao.sort(function (a, b) { return b.goals.length - a.goals.length });
		let foundidea = [];

		for (let i = 0; i < allIdeas.length; i++) {
			let idea_uri_json = allIdeas[i];

			let goalid = Number(await contract.get_goal_id_from_ideas_uri(idea_uri_json));
			let idea_uri = JSON.parse(idea_uri_json);
			idea_uri.id = i;

			if (idea_uri.properties.wallet.description.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				let votes = await contract.get_ideas_votes_from_goal(goalid, i);
				idea_uri.votes = votes;

				foundidea.push(idea_uri);
			}
		}

		foundidea.sort(function (a, b) { return b.votes.length - a.votes.length });


		let _donations_ids = await contract._donations_ids();
		let ideasURIS = [];
		for (let i = 0; i < _donations_ids; i++) {
			let donationURI = await contract._donations(i);
			if (donationURI.wallet.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				let existsIdea = ideasURIS.findIndex(e => e.id == Number(donationURI.ideas_id));
				if (existsIdea != -1) {
					ideasURIS[existsIdea].donation += Number(donationURI.donation) / 1e18;
					continue;
				}
				let ideaURI = JSON.parse((await contract._ideas_uris(Number(donationURI.ideas_id))).ideas_uri);
				ideaURI.donation = Number(donationURI.donation) / 1e18;
				ideaURI.id = Number(donationURI.ideas_id);
				ideasURIS.push(ideaURI);
			}
		}
		let allMessages = [];

		let ideasReplied = 0;
		let MessagesIdeasURIS = [];
		let _message_ids = await window.contract._message_ids();
		for (let i = 0; i < _message_ids; i++) {
			let messageURI = await window.contract.all_messages(i);
			if (messageURI.sender.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				ideasReplied += 1;
				let ideaURI = JSON.parse((await window.contract._ideas_uris(Number(messageURI.ideas_id))).ideas_uri);

				let parsed_message = JSON.parse(messageURI.message);
				parsed_message.idea = ideaURI;

				allMessages.push(parsed_message);

				let existsIdea = MessagesIdeasURIS.findIndex(e => e.id == Number(messageURI.ideas_id));
				if (existsIdea != -1) {
					MessagesIdeasURIS[existsIdea].replied += 1;
					continue;
				}

				ideaURI.replied = 1;
				ideaURI.id = Number(messageURI.ideas_id);
				MessagesIdeasURIS.push(ideaURI);
			}
		}

		let _reply_ids = await contract._reply_ids();
		for (let i = 0; i < _reply_ids; i++) {
			let repliesURI = await contract.all_replies(i);
			if (JSON.parse(repliesURI.message).address.toLocaleUpperCase() == address.toLocaleUpperCase()) {
				ideasReplied += 1;
				let ideaURI = JSON.parse((await window.contract._ideas_uris(Number(repliesURI.ideas_id))).ideas_uri);

				let parsed_rplied = JSON.parse(repliesURI.message);
				parsed_rplied.idea = ideaURI;
				allMessages.push(parsed_rplied);

				let existsIdea = MessagesIdeasURIS.findIndex(e => e.id == Number(repliesURI.ideas_id));
				if (existsIdea != -1) {
					MessagesIdeasURIS[existsIdea].replied += 1;
					continue;
				}

				ideaURI.replied = 1;
				ideaURI.id = Number(repliesURI.ideas_id);
				MessagesIdeasURIS.push(ideaURI);
			}
		}



		setReplied(ideasReplied);
		setDonated(donated);
		setTotalRead(total_read);
		setDaos(founddao);
		setIdeas(foundidea);
		setDontatedIdeas(ideasURIS);
		setRepliesIdeas(MessagesIdeasURIS)

		setAllMessages(allMessages);

		running = false
	}


	function Loader({ element, type = "rectangular", width = "50", height = "23", many = 1 }) {
		if (running) {
			let allElements = [];
			for (let i = 0; i < many; i++) {
				allElements.push(<Skeleton variant={type} width={width} height={height} />)
				allElements.push(<div style={{ marginBottom: "5px" }}></div>)
			}
			return allElements;
		} else {
			return element;
		}
	}

	function showPanel(panelIndex, colorCode) {
		var tabButtons = document.querySelectorAll(".tabContainer .buttonContainer button");
		var tabPanels = document.querySelectorAll(".tabContainer  .tabPanel");
		if (!(tabButtons.length > 0)) return false;
		tabButtons.forEach(function (node) {
			node.style.backgroundColor = "";
			node.style.color = "";
		});
		tabButtons[panelIndex].style.backgroundColor = "white";
		tabButtons[panelIndex].style.color = "#7e8b93";
		tabPanels.forEach(function (node) {
			node.style.display = "none";
		});
		tabPanels[panelIndex].style.display = "block";
		tabPanels[panelIndex].style.backgroundColor = "white";
	}



	return (
		<>
			<Header></Header>
			<Head>
				<title>Profile</title>
				<meta name="description" content="Profile" />
				<link rel="icon" href="/favicon.ico" />
			</Head>


			<div className={`${styles.container} flex items-center flex-col gap-8 relative`}>
				<div className={`${styles.title} gap-8 flex flex-col relative`}>
					<div className={styles.avatarContainer}>
						<div className={styles.topicAvatar}>
							<div className="post-avatar" style={{
								display: 'flex',
								alignItems: 'center',
								gap: '1rem'
							}}>
								<a className="trigger-user-card main-avatar " aria-hidden="true" tabIndex={-1}>
									<svg width={45} height={45} xmlns="http://www.w3.org/2000/svg" style={{ fill: "var(--foreground)" }} viewBox="0 0 459 459">
										<g>
											<g>
												<path d="M229.5,0C102.53,0,0,102.845,0,229.5C0,356.301,102.719,459,229.5,459C356.851,459,459,355.815,459,229.5    C459,102.547,356.079,0,229.5,0z M347.601,364.67C314.887,393.338,273.4,409,229.5,409c-43.892,0-85.372-15.657-118.083-44.314    c-4.425-3.876-6.425-9.834-5.245-15.597c11.3-55.195,46.457-98.725,91.209-113.047C174.028,222.218,158,193.817,158,161    c0-46.392,32.012-84,71.5-84c39.488,0,71.5,37.608,71.5,84c0,32.812-16.023,61.209-39.369,75.035    c44.751,14.319,79.909,57.848,91.213,113.038C354.023,354.828,352.019,360.798,347.601,364.67z" />
											</g>
										</g>
									</svg>
								</a>
								<a href={`https://moonbase.moonscan.io/address/${address}`} rel="noreferrer" target="_blank">
									<h1 className="font-bold" style={{ color: 'var(--title-a-text)', width: "78%" }} >
										{address}
									</h1>

								</a>
							</div>
						</div>

					</div>
				</div>

				<div className={styles.divider}></div>

				<div className="tabContainer">
					<div className="buttonContainer">
						<button style={{
							backgroundColor: 'white',
							color: 'rgb(126, 139, 147)'
						}} onClick={() => { showPanel(0, '#f44336') }} >
							Summary
						</button>
						<button onClick={() => { showPanel(1, '#4caf50') }} >
							Activity
						</button>
						<button onClick={() => { showPanel(2, '#4caf50') }} >
							Badges
						</button>


					</div>
					<div
						className="tabPanel"
						style={{ display: "block", backgroundColor: "white" }}
					>

						<div className="top-section stats-section">
							<h3 className="stats-title">Stats</h3>
							<Loader
								element={
									<ul>
										<li className="stats-topic-count linked-stat">
											<a
												id="ember1267"
												className="ember-view"

											>
												<div id="ember1268" className="user-stat ember-view">
													<span className="value">
														<span className="number">{TotalRead}</span>
													</span>
													<span className="label">
														total message read
													</span>
												</div>
											</a>
										</li>
										<li className="stats-topic-count linked-stat">
											<a
												id="ember1267"
												className="ember-view"

											>
												<div id="ember1268" className="user-stat ember-view">
													<span className="value">
														<span className="number">{Daos.length}</span>
													</span>
													<span className="label">
														dao created
													</span>
												</div>
											</a>
										</li>
										<li className="stats-post-count linked-stat">
											<a
												id="ember1269"
												className="ember-view"
											>
												<div id="ember1270" className="user-stat ember-view">
													<span className="value">
														<span className="number">{Ideas.length}</span>
													</span>
													<span className="label">
														ideas created
													</span>
												</div>
											</a>
										</li>
										<li className="stats-post-count linked-stat">
											<a
												id="ember1269"
												className="ember-view"
											>
												<div id="ember1270" className="user-stat ember-view">
													<span className="value">
														<span className="number">{Donated} DEV</span>
													</span>
													<span className="label">
														donated
													</span>
												</div>
											</a>
										</li>
										<li className="stats-post-count linked-stat">
											<a
												id="ember1269"
												className="ember-view"
											>
												<div id="ember1270" className="user-stat ember-view" >
													<span className="value">
														<span className="number">{Replied}</span>
													</span>
													<span className="label">
														ideas replied
													</span>
												</div>
											</a>
										</li>
									</ul>
								}
								width="100%"
								height={54}
							/>

						</div>
						<div className="top-section" >

							<div>
								<div
									id="ember152"
									className="replies-section pull-left top-sub-section ember-view"
								>
									<h3 className="stats-title">Top Daos</h3>
									<ul>
										{Daos.length < 1 && running == false ? <>
											<li style={{
												border: '0px',
												color: 'gray',
												padding: '0'
											}} >No daos yet.</li>
										</> : <></>}

										<Loader
											element={
												Daos.map((item, idx) => {
													return <li id="ember154" key={idx} className="ember-view">
														<span className="topic-info">
															<span className="like-count"><span className="number">{item.goals.length} Goals</span></span>
														</span>
														<br></br>
														<a href={"/daos/dao?[" + item.id + "]"}>
															{item.properties.Title.description}
														</a>
													</li>
												})
											}
											width="100%"
											height={54}
											many={5}
										/>
									</ul>
								</div>
								<div
									id="ember152"
									className="replies-section pull-left top-sub-section ember-view"
								>
									<h3 className="stats-title">Top Ideas</h3>
									<ul>
										{Ideas.length < 1 && running == false ? <>
											<li style={{
												border: '0px',
												color: 'gray',
												padding: '0'
											}} >No ideas yet.</li>
										</> : <></>}
										<Loader
											element={
												Ideas.map((item, idx) => {
													return <li id="ember154" key={idx} className="ember-view">
														<span className="topic-info">
															<span className="like-count"><span className="number">{item.votes.length} Votes</span></span>
														</span>
														<br></br>
														<a href={"/daos/dao/goal/ideas?[" + item.id + "]"}>
															{item.properties.Title.description}
														</a>
													</li>
												})
											}
											width="100%"
											height={54}
											many={5}
										/>
									</ul>
								</div>
							</div>
							<div><div
								id="ember152"
								className="replies-section pull-left top-sub-section ember-view"
							>
								<h3 className="stats-title">Top Donated Ideas</h3>
								<ul>
									{DontatedIdeas.length < 1 && running == false ? <>
										<li style={{
											border: '0px',
											color: 'gray',
											padding: '0'
										}} >No donate yet.</li>
									</> : <></>}
									<Loader
										element={DontatedIdeas.map((item, idx) => {
											return <li id="ember154" key={idx} className="ember-view">
												<span className="topic-info">
													<span className="like-count"><span className="number">{item.donation} DEV</span></span>
												</span>
												<br></br>
												<a href={"/daos/dao/goal/ideas?[" + item.id + "]"}>
													{item.properties.Title.description}
												</a>
											</li>
										})}
										width="100%"
										height={54}
										many={5}
									/>
								</ul>
							</div>
								<div
									id="ember152"
									className="replies-section pull-left top-sub-section ember-view"
								>
									<h3 className="stats-title">Top Replies</h3>
									<ul>
										{RepliesIdeas.length < 1 && running == false ? <>
											<li style={{
												border: '0px',
												color: 'gray',
												padding: '0'
											}} >No reply yet.</li>
										</> : <></>}
										<Loader
											element={RepliesIdeas.map((item, idx) => {
												return <li id="ember154" key={idx} className="ember-view">
													<div className="topic-info" style={{ gap: '0.5rem', display: 'flex' }}>
														<svg
															className="fa d-icon d-icon-reply svg-icon svg-string"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 512 512"
														>
															<path d="M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z" />
														</svg>
														<span className="replies">
															<span className="number">{item.replied}</span>
														</span>
													</div>
													<a href={"/daos/dao/goal/ideas?[" + item.id + "]"}>
														{item.properties.Title.description}
													</a>
												</li>
											})}
											width="100%"
											height={54}
											many={5}
										/>
									</ul>
								</div>
							</div>
						</div>

					</div>
					<div
						className="tabPanel"
						style={{ display: "none", backgroundColor: "rgb(76, 175, 80)" }}
					>
						<ul>
							{
								AllMessages.map((item, idx) =>

									<>
										<li>
											<div className="row" style={{ display: "flex", gap: "0.5rem" }}>
												<div className="Comment_topicAvatar__zEU3E">
													<div className="post-avatar">
														<a
															className="trigger-user-card main-avatar "
															aria-hidden="true"
															tabIndex={-1}
														>
															<svg
																width={45}
																height={45}
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 459 459"
																style={{ fill: "var(--foreground)" }}
															>
																<g>
																	<g>
																		<path d="M229.5,0C102.53,0,0,102.845,0,229.5C0,356.301,102.719,459,229.5,459C356.851,459,459,355.815,459,229.5 C459,102.547,356.079,0,229.5,0z M347.601,364.67C314.887,393.338,273.4,409,229.5,409c-43.892,0-85.372-15.657-118.083-44.314 c-4.425-3.876-6.425-9.834-5.245-15.597c11.3-55.195,46.457-98.725,91.209-113.047C174.028,222.218,158,193.817,158,161 c0-46.392,32.012-84,71.5-84c39.488,0,71.5,37.608,71.5,84c0,32.812-16.023,61.209-39.369,75.035 c44.751,14.319,79.909,57.848,91.213,113.038C354.023,354.828,352.019,360.798,347.601,364.67z" />
																	</g>
																</g>
															</svg>
														</a>
													</div>
												</div>
												<div className="Comment_clearfix__JMJ_m w-full">
													<div
														role="heading"
														className="Comment_TopicMetaData__PJQS5 w-full"
														style={{
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															height: 52
														}}
													>
														<div className="Comment_TriggerUserCard__fXK8r">
															<span className="font-bold text-piccolo">
																<a
																	href={"/daos/dao/goal/ideas?[" + item.idea.id + "]"}
																	style={{ color: "var(--title-a-text)" }}
																>
																	{item.idea.properties.Title.description}
																</a>
															</span>
														</div>
														<div className="Comment_PostInfos__V99FJ">
															<div
																className="post-info post-date"
																style={{ flex: "0 0 auto", marginRight: 0 }}
															>
																<a className="widget-link post-date" title="Post date">
																	<span style={{ whiteSpace: "nowrap" }}>{formatDistance(new Date(item.date), new Date(), { addSuffix: true })}</span>
																</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div className="mt-4">
												<div className="Comment_cooked__PWlQn">
													<p>
														{item.message}
													</p>
												</div>
											</div>
											<hr className="mt-4" style={{ marginBottom: '1rem' }} />
										</li>
									</>)
							}

						</ul>

					</div>
					<div
						className="tabPanel"
						style={{ display: "none", backgroundColor: "rgb(76, 175, 80)" }}
					>
						<div className="badge-group-list">
							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className="badge-icon badge-type-bronze granted">
										<svg
											width={45}
											height={45}
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 500 520"
										>
											<g>
												<g>
													<path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z" />
												</g>
											</g>
										</svg>
									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													Basic
												</a>
											</h3>
											<div className="badge-summary">
												<a href="#">
													Granted
												</a> <span> all essential community functions</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.dao?"granted":""}`}>
										<svg xmlns="http://www.w3.org/2000/svg" width={45} height={45} viewBox="0 0 100 100">
											<g>
												<path
													xmlns="http://www.w3.org/2000/svg"
													style={{ stroke: "none" }}
													d="M46.0586 3.02778C42.0746 5.19973 42.288 10.1911 38.8519 12.8951C34.3029 16.4748 26.786 20.9086 21.1698 22.3889C15.9009 23.7776 8.88085 19.524 6.51466 27.044C4.49557 33.4609 9.35355 35.2408 11.4005 40.2091C13.1957 44.5665 12.355 52.3381 11.9414 56.9853C11.4067 62.9924 4.94163 65.2655 6.28241 71.9846C8.06449 80.9152 16.5064 75.8493 22.1698 77.9252C27.6535 79.9352 36.5422 84.1715 40.4005 88.6096C42.3396 90.8401 42.0913 94.1209 44.4336 96.1065C47.0378 98.3139 51.8647 98.5955 54.7716 96.821C58.3504 94.6363 57.8308 89.7167 61.1481 87.1049C65.6955 83.5249 73.215 79.0911 78.8302 77.6111C84.004 76.2474 91.4028 80.5132 93.5656 72.956C95.6023 65.8393 89.1127 63.8766 88.1481 57.9568C86.4418 47.4851 89.7102 42.5211 93.2585 33.8958C94.4453 31.011 94.1727 26.8628 92.1065 24.4336C88.7219 20.4546 83.3371 23.0125 79 22.1929C74.3787 21.3196 70.0608 17.9889 66 15.7693C59.3495 12.1342 55.3514 -2.03828 46.0586 3.02778z"
												/>
												<path
													style={{ fill: "#a2a2a2", stroke: "none" }}
													d="M44 3L45 4L44 3M55 3L56 4L55 3M43 4L44 5L43 4M38 13L39 14L38 13M61 13L62 14L61 13z"
												/>
												<path
													style={{ fill: "#a2a2a2", stroke: "none" }}
													d="M44 16L45 17L44 16M55 16L56 17L55 16z"
												/>
												<path
													d="M42 17.6883C-1.36265 28.7966 15.556 92.6606 58 82.3225C101.539 71.7176 84.2958 6.85324 42 17.6883z"
													fill="white"
												/>
												<path
													style={{ stroke: "none" }}
													d="M32 44L36 44L36 56L32 56L32 60L68 60L68 56L64 56L64 44L68 44C67.3703 24.7578 32.6297 24.7578 32 44z"
												/>
												<path
													style={{ fill: "#010101", stroke: "none" }}
													d="M40 44L40 56L44 56L44 44L40 44M48 44L48 56L52 56L52 44L48 44M56 44L56 56L60 56L60 44L56 44z"
												/>
												<path style={{ stroke: "none" }} d="M30 62L30 66L70 66L70 62L30 62z" />
											</g>
										</svg>

									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First DAO
												</a>
											</h3>
											<div className="badge-summary">
												<span>Created a DAO</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.joined?"granted":""}`}>
										<svg xmlns="http://www.w3.org/2000/svg" width={45} height={45} viewBox="0 0 100 100">
											<g>
												<path
													xmlns="http://www.w3.org/2000/svg"
													style={{ stroke: "none" }}
													d="M14 86L86 86C85.1165 69.0052 65.336 73.6583 60.6042 60.9846C58.0748 54.2101 64.277 47.9312 66.2731 42C67.8539 37.3031 67.3845 29.9164 66.8951 25C66.0472 16.4827 58.5525 16.1499 55 10C36.4367 10.0512 28.314 24.5475 33.5625 42C35.4299 48.2093 42.6291 55.0349 38.9722 61.9568C32.8241 73.5942 14.8637 69.3859 14 86z"
												/>
												<path
													style={{ fill: "currentColor", stroke: "none" }}
													d="M55 12L56 13L55 12M39 13L40 14L39 13M57 13L58 14L57 13M60 14L61 15L60 14M36 16L37 17L36 16z"
												/>
												<path style={{ fill: "#7f7f7f", stroke: "none" }} d="M63 16L64 17L63 16z" />
												<path
													style={{ fill: "#a8a8a8", stroke: "none" }}
													d="M35 17L36 18L35 17M65 19L66 20L65 19z"
												/>
												<path
													style={{ /* fill: 'currentColor', */ stroke: "none" }}
													d="M0 80C12.3488 80 13.7119 73.6453 24 68.3742C28.4554 66.0915 36.0925 64.9456 36.8333 58.9599C37.601 52.7573 32.3121 47.6133 30.6481 42C28.6752 35.3443 29.2941 26.6106 31 20C16.0531 20.1336 10.5317 32.4105 14.5486 46C15.6461 49.713 19.8661 53.8857 18.5471 57.9815C15.0802 68.7463 0.134448 65.1451 0 80M69 20C70.5186 26.3186 71.4227 35.7535 69.2762 42C67.3614 47.5724 62.3914 52.6587 63.1667 58.9846C63.9124 65.0688 71.4235 66.0925 76 68.3241C86.4361 73.4129 87.4606 80 100 80C99.9556 64.5405 87.2584 69.418 82.071 58.8951C79.8626 54.4152 84.3972 49.1988 85.5046 45C89.0145 31.6929 83.7118 20.0521 69 20z"
												/>
											</g>
										</svg>

									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Join
												</a>
											</h3>
											<div className="badge-summary">
												<span>Joined a DAO community</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.goal?"granted":""}`}>
										<svg
											width={45} height={45}
											viewBox="0 0 240 240"
											style={{
												shapeRendering: "geometricPrecision",
												textRendering: "geometricPrecision",
												imageRendering: "optimizeQuality",
												fillRule: "evenodd",
												clipRule: "evenodd"
											}}
										>
											<g xmlns="http://www.w3.org/2000/svg">
												<path
													style={{ opacity: "0.973" }}
													d="M 109.5,9.5 C 140.981,6.49344 169.481,14.1601 195,32.5C 201.624,26.8782 207.957,20.8782 214,14.5C 214.5,21.1583 214.666,27.825 214.5,34.5C 221.175,34.3337 227.842,34.5004 234.5,35C 226.5,43 218.5,51 210.5,59C 206.167,59.3333 201.833,59.6667 197.5,60C 176.667,80.8333 155.833,101.667 135,122.5C 133.932,134.058 128.098,137.391 117.5,132.5C 114.576,128.685 113.742,124.351 115,119.5C 117.607,115.254 121.44,113.421 126.5,114C 132,108.5 137.5,103 143,97.5C 143.688,96.6683 143.521,96.0016 142.5,95.5C 123.572,85.8659 107.739,89.5326 95,106.5C 85.7126,126.625 90.2126,142.791 108.5,155C 132.439,163.611 148.939,156.111 158,132.5C 158.667,127.167 158.667,121.833 158,116.5C 157.691,115.234 157.191,114.067 156.5,113C 159.333,110.167 162.167,107.333 165,104.5C 174.184,125.717 170.351,144.217 153.5,160C 138.621,170.283 122.621,172.283 105.5,166C 84.1249,154.41 75.7916,136.577 80.5,112.5C 89.7781,87.4214 107.778,76.5881 134.5,80C 141.084,81.3759 146.918,84.2093 152,88.5C 157.333,83.1667 162.667,77.8333 168,72.5C 168.617,71.5509 168.451,70.7175 167.5,70C 139.367,50.0886 111.034,49.7552 82.5,69C 56.8513,91.0893 49.3513,118.256 60,150.5C 79.5941,188.214 109.761,201.048 150.5,189C 185.603,171.291 199.103,143.124 191,104.5C 189.096,98.1918 186.262,92.3585 182.5,87C 184.833,84.6667 187.167,82.3333 189.5,80C 190.449,79.3828 191.282,79.5494 192,80.5C 205.959,104.347 208.292,129.347 199,155.5C 181.174,191.835 152.007,208.002 111.5,204C 82.4808,198.649 61.9808,182.482 50,155.5C 37.3014,118.457 45.468,86.9572 74.5,61C 99.4978,43.2236 126.498,39.5569 155.5,50C 163.256,53.6245 170.423,58.1245 177,63.5C 181,59.5 185,55.5 189,51.5C 189.667,48.5 189.667,45.5 189,42.5C 146.794,12.9617 104.294,12.4617 61.5,41C 22.4558,74.4831 11.2891,115.65 28,164.5C 47.344,204.982 79.5106,226.649 124.5,229.5C 181.543,224.738 216.043,194.405 228,138.5C 230.99,113.966 226.157,91.1329 213.5,70C 215.615,66.8815 218.115,64.0482 221,61.5C 240.117,91.6523 244.784,123.986 235,158.5C 223.147,194.353 199.647,219.186 164.5,233C 115.224,248.223 72.7242,237.39 37,200.5C 9.12421,165.729 2.12421,127.063 16,84.5C 33.4035,42.256 64.5702,17.256 109.5,9.5 Z"
												/>
											</g>
										</svg>


									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Goal
												</a>
											</h3>
											<div className="badge-summary">
												<span>Created a Goal</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.ideas?"granted":""}`}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width={45} height={45}
											viewBox="0 0 240 240"
											clipRule="evenodd"
											version="1.1"
										>
											<g>
												<path
													strokeWidth={8}
													id="svg_2"
													opacity="0.995"
													d="m120.14516,3.66129c4,0 8,0 12,0c6.453,2.95542 11.12,7.78875 14,14.5c20.333,0.3333 40.667,0.6667 61,1c4.167,1.5 7,4.3333 8.5,8.5c0.667,69 0.667,138 0,207c-1.5,4.167 -4.333,7 -8.5,8.5c-54,0.667 -108,0.667 -162,0c-3.8333,-1.833 -6.6667,-4.667 -8.5,-8.5c-0.6667,-69 -0.6667,-138 0,-207c1.5,-4.1667 4.3333,-7 8.5,-8.5c20.3333,-0.3333 40.6667,-0.6667 61,-1c2.88,-6.71125 7.547,-11.54458 14,-14.5zm2,11c3.478,-0.3158 6.812,0.1842 10,1.5c2.148,3.9295 4.148,7.9295 6,12c7.659,0.4997 15.326,0.6664 23,0.5c0.166,5.0111 -0.001,10.0111 -0.5,15c-0.309,1.2659 -0.809,2.4326 -1.5,3.5c-10.932,1.1333 -21.932,1.6333 -33,1.5c-11.068,0.1333 -22.068,-0.3667 -33,-1.5c-0.6905,-1.0674 -1.1905,-2.2341 -1.5,-3.5c-0.4993,-4.9889 -0.6659,-9.9889 -0.5,-15c7.6739,0.1664 15.341,-0.0003 23,-0.5c2.023,-3.2322 3.523,-6.7322 4.5,-10.5c1.145,-1.1364 2.312,-2.1364 3.5,-3zm-71,14c10,0 20,0 30,0c-0.1663,7.0079 0.0004,14.0079 0.5,21c1.4488,3.116 3.6155,5.616 6.5,7.5c12.5752,1.1486 25.242,1.6486 38,1.5c12.758,0.1486 25.425,-0.3514 38,-1.5c2.973,-1.7648 5.14,-4.2648 6.5,-7.5c0.5,-6.9921 0.666,-13.9921 0.5,-21c10.006,-0.1665 20.006,0.0002 30,0.5c2.833,0.1667 4.333,1.6667 4.5,4.5c0.667,65 0.667,130 0,195c-0.167,2.833 -1.667,4.333 -4.5,4.5c-50,0.667 -100,0.667 -150,0c-1.2659,-0.309 -2.4326,-0.809 -3.5,-1.5c-1.6561,-65.943 -1.9894,-131.9426 -1,-198c0.3477,-2.8424 1.8477,-4.509 4.5,-5z"
													stroke="currentColor"
													fill="#ffffff"
												/>
												<g id="svg_5">
													<path
														id="svg_6"
														opacity="0.993"
														d="m115.5,94.5c22.336,-0.1666 44.669,0 67,0.5c4,3 4,6 0,9c-21.573,0.173 -43.073,0.673 -64.5,1.5c-4.9,-2.733 -5.734,-6.3992 -2.5,-11z"
														fill="currentColor"
													/>
												</g>
												<g id="svg_9">
													<path
														id="svg_10"
														opacity="0.993"
														d="m115.5,134.5c22.336,-0.167 44.669,0 67,0.5c4,3 4,6 0,9c-21.573,0.173 -43.073,0.673 -64.5,1.5c-4.9,-2.733 -5.734,-6.399 -2.5,-11z"
														fill="currentColor"
													/>
												</g>
												<g id="svg_11">
													<path
														id="svg_12"
														opacity="0.996"
														d="m72.45202,164.89648c8.6731,-0.166 13.12696,-0.21858 22.33371,-0.04645c2.68579,0.06284 4.06011,0.12568 4.12295,2.92077c-0.13576,8.64903 -0.09982,15.63677 -0.12726,24.30377c0.04795,2.96575 -1,2.82648 -3.60046,2.86986c-9.57994,-0.06359 -13.68033,-0.15492 -22.34703,-0.3653c-1.23059,-0.1347 -2.82648,0.82648 -2.96119,-2.32192c0.15522,-9.12362 -0.21008,-14.22798 0.09132,-23.7169c-0.00565,-1.63203 -0.39508,-3.50604 2.48795,-3.64384zm6.73808,10c0,3.333 0,6.667 0,10c3.3333,0 6.6667,0 10,0c0,-3.333 0,-6.667 0,-10c-3.3333,0 -6.6667,0 -10,0z"
														fill="currentColor"
													/>
												</g>
												<g id="svg_13">
													<path
														id="svg_14"
														opacity="0.993"
														d="m115.5,174.5c22.336,-0.167 44.669,0 67,0.5c4,3 4,6 0,9c-21.573,0.173 -43.073,0.673 -64.5,1.5c-4.9,-2.733 -5.734,-6.399 -2.5,-11z"
														fill="currentColor"
													/>
												</g>
												<g id="svg_16">
													<path
														id="svg_15"
														opacity="0.996"
														d="m72.45202,126.06692c8.6731,-0.166 13.12696,-0.21858 22.3337,-0.04645c2.6858,0.06284 4.06011,0.12569 4.12296,2.92077c-0.13576,8.64903 -0.09983,15.63676 -0.12726,24.30376c0.04795,2.96576 -1,2.82649 -3.60046,2.86987c-9.57994,-0.0636 -13.68033,-0.15492 -22.34703,-0.3653c-1.23059,-0.1347 -2.82648,0.82648 -2.96119,-2.32192c0.15522,-9.12362 -0.21007,-14.22798 0.09133,-23.71689c-0.00565,-1.63204 -0.39509,-3.50605 2.48795,-3.64384zm6.73808,10c0,3.333 0,6.667 0,10c3.3333,0 6.6667,0 10,0c0,-3.333 0,-6.667 0,-10c-3.3333,0 -6.6667,0 -10,0z"
														fill="currentColor"
													/>
												</g>
												<g id="svg_18">
													<path
														id="svg_17"
														opacity="0.996"
														d="m72.45202,86.3504c8.6731,-0.166 13.12696,-0.21858 22.3337,-0.04645c2.6858,0.06284 4.06011,0.12569 4.12296,2.92077c-0.13576,8.64903 -0.09983,15.63676 -0.12726,24.30376c0.04795,2.96576 -1,2.82649 -3.60046,2.86987c-9.57994,-0.0636 -13.68033,-0.15492 -22.34703,-0.3653c-1.23059,-0.1347 -2.82648,0.82648 -2.96119,-2.32192c0.15522,-9.12362 -0.21007,-14.22798 0.09133,-23.71689c-0.00565,-1.63204 -0.39509,-3.50605 2.48795,-3.64384zm6.73808,10c0,3.333 0,6.667 0,10c3.3333,0 6.6667,0 10,0c0,-3.333 0,-6.667 0,-10c-3.3333,0 -6.6667,0 -10,0z"
														fill="currentColor"
													/>
												</g>
											</g>
										</svg>



									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Ideas
												</a>
											</h3>
											<div className="badge-summary">
												<span>Created a ideas</span>
											</div>
										</div>
									</div>
								</div>
							</div><div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.vote?"granted":""}`}>
									<svg
									xmlns="http://www.w3.org/2000/svg"
									xmlnsXlink="http://www.w3.org/1999/xlink"
									version="1.1"
									width={45} height={45}
									viewBox="0 0 240 240"
									style={{
										shapeRendering: "geometricPrecision",
										textRendering: "geometricPrecision",
										imageRendering: "optimizeQuality",
										fillRule: "evenodd",
										clipRule: "evenodd"
									}}
									>
									<g>
										<path
										style={{ opacity: "0.996" }}
										d="M 97.5,11.5 C 106.635,13.2099 115.635,15.5432 124.5,18.5C 131.863,16.4346 139.196,14.2679 146.5,12C 148.167,11.3333 149.833,11.3333 151.5,12C 157.833,17.6667 164.167,23.3333 170.5,29C 179.217,30.4526 187.884,32.1193 196.5,34C 200.572,41.8692 204.072,50.0359 207,58.5C 214,63.5 221,68.5 228,73.5C 228.398,82.8507 228.398,92.1841 228,101.5C 232.588,108.884 236.421,116.55 239.5,124.5C 236.421,132.45 232.588,140.116 228,147.5C 228.398,156.816 228.398,166.149 228,175.5C 221,180.5 214,185.5 207,190.5C 204.072,198.964 200.572,207.131 196.5,215C 187.884,216.881 179.217,218.547 170.5,220C 164.167,225.667 157.833,231.333 151.5,237C 149.833,237.667 148.167,237.667 146.5,237C 139.196,234.732 131.863,232.565 124.5,230.5C 117.137,232.565 109.804,234.732 102.5,237C 100.833,237.667 99.1667,237.667 97.5,237C 91.1667,231.333 84.8333,225.667 78.5,220C 69.7827,218.547 61.116,216.881 52.5,215C 48.4283,207.131 44.9283,198.964 42,190.5C 35,185.5 28,180.5 21,175.5C 20.6017,166.149 20.6017,156.816 21,147.5C 16.6133,140.06 12.7799,132.393 9.5,124.5C 12.7799,116.607 16.6133,108.94 21,101.5C 20.6017,92.1841 20.6017,82.8507 21,73.5C 28,68.5 35,63.5 42,58.5C 44.9283,50.0359 48.4283,41.8692 52.5,34C 61.116,32.1193 69.7827,30.4526 78.5,29C 85.0296,23.3006 91.3629,17.4673 97.5,11.5 Z M 169.5,72.5 C 171.781,73.6082 173.948,74.9415 176,76.5C 176.667,77.5 176.667,78.5 176,79.5C 156.5,109.667 137,139.833 117.5,170C 116.833,170.667 116.167,170.667 115.5,170C 101.167,157 86.8333,144 72.5,131C 74.4015,128.387 76.7348,126.72 79.5,126C 91.3333,136.5 103.167,147 115,157.5C 133.687,129.45 151.853,101.116 169.5,72.5 Z"
										/>
									</g>
									</svg>



									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Vote
												</a>
											</h3>
											<div className="badge-summary">
												<span>Voted to a ideas</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.donation?"granted":""}`}>
									<svg
									xmlns="http://www.w3.org/2000/svg"
									xmlnsXlink="http://www.w3.org/1999/xlink"
									width={45} height={45}
									viewBox="0 0 240 240"
									style={{
										shapeRendering: "geometricPrecision",
										textRendering: "geometricPrecision",
										imageRendering: "optimizeQuality",
										fillRule: "evenodd",
										clipRule: "evenodd"
									}}
									>
									<g>
										<path
										style={{ opacity: "0.993" }}
										d="M 168.5,4.5 C 188.087,4.64005 205.753,10.4734 221.5,22C 225.159,24.8155 227.826,28.3155 229.5,32.5C 226.678,36.1279 223.845,39.7946 221,43.5C 215.111,57.2793 209.778,71.2793 205,85.5C 199.618,99.1113 190.451,109.278 177.5,116C 169.284,119.941 160.951,123.608 152.5,127C 144.788,133.714 136.788,140.047 128.5,146C 114.148,153.217 103.648,149.717 97,135.5C 96.2803,129.377 97.6136,123.711 101,118.5C 109.926,107.589 121.093,99.756 134.5,95C 140.833,86.6667 147.167,78.3333 153.5,70C 145.04,71.1717 136.707,70.505 128.5,68C 127.069,67.5348 125.903,66.7014 125,65.5C 120.686,74.4813 113.853,80.648 104.5,84C 107.533,88.7622 108.7,93.9288 108,99.5C 100.186,104.978 94.1864,111.978 90,120.5C 83.9102,108.312 78.9102,95.645 75,82.5C 74.0229,77.2661 74.6896,72.2661 77,67.5C 83.5993,54.2427 91.7659,42.076 101.5,31C 119.934,23.4104 138.601,16.4104 157.5,10C 161.507,8.6634 165.173,6.83006 168.5,4.5 Z"
										/>
									</g>
									<g>
										<path
										style={{ opacity: "0.994" }}
										d="M 79.5,134.5 C 82.5,134.5 85.5,134.5 88.5,134.5C 91.1566,149.484 100.157,157.484 115.5,158.5C 122.712,158.04 129.379,155.874 135.5,152C 142.5,146.333 149.5,140.667 156.5,135C 159.146,134.503 161.813,134.336 164.5,134.5C 164.5,149.5 164.5,164.5 164.5,179.5C 136.167,179.5 107.833,179.5 79.5,179.5C 79.5,164.5 79.5,149.5 79.5,134.5 Z"
										/>
									</g>
									<g>
										<path
										style={{ opacity: "0.989" }}
										d="M 113.5,249.5 C 108.833,249.5 104.167,249.5 99.5,249.5C 82.7601,242.754 65.5934,237.087 48,232.5C 43.4948,232.446 39.3282,233.613 35.5,236C 30.3062,240.027 24.9728,243.86 19.5,247.5C 19.1667,246.167 18.8333,244.833 18.5,243.5C 19.1017,228.502 19.7683,213.502 20.5,198.5C 27.1238,195.237 33.7905,192.07 40.5,189C 49.961,185.324 59.6276,184.657 69.5,187C 86.1667,193 102.833,199 119.5,205C 126.205,209.23 127.205,214.563 122.5,221C 120.487,222.257 118.321,223.091 116,223.5C 105.14,220.602 94.3069,217.602 83.5,214.5C 77.8755,216.235 77.2089,219.068 81.5,223C 92.7524,226.473 104.086,229.64 115.5,232.5C 126.608,231.225 132.942,225.058 134.5,214C 134.054,209.828 132.721,205.994 130.5,202.5C 130.709,201.914 131.043,201.414 131.5,201C 146.192,195.069 161.025,189.569 176,184.5C 190.239,187.083 194.572,195.083 189,208.5C 187.5,210 186,211.5 184.5,213C 160.741,225.212 137.074,237.378 113.5,249.5 Z"
										/>
									</g>
									</svg>
									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Donation
												</a>
											</h3>
											<div className="badge-summary">
												<span>Donated to a ideas</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.comment?"granted":""}`}>
									<svg
									xmlns="http://www.w3.org/2000/svg"
									xmlnsXlink="http://www.w3.org/1999/xlink"
									width={45} height={45}
									viewBox="0 0 240 240"
									style={{
										shapeRendering: "geometricPrecision",
										textRendering: "geometricPrecision",
										imageRendering: "optimizeQuality",
										fillRule: "evenodd",
										clipRule: "evenodd"
									}}
									>
									<g>
										<path d="M 111.5,14.5 C 157.991,10.8421 195.491,27.1754 224,63.5C 246.362,101.541 244.362,138.208 218,173.5C 184.831,207.943 144.665,220.61 97.5,211.5C 82.0914,227.035 63.4247,234.535 41.5,234C 39.5561,231.847 39.0561,229.347 40,226.5C 46.8633,216.604 51.6966,205.771 54.5,194C 18.461,169.412 4.29434,135.579 12,92.5C 24.8161,54.3524 50.6494,29.8524 89.5,19C 96.9054,17.1598 104.239,15.6598 111.5,14.5 Z M 69.5,79.5 C 106.168,79.3333 142.835,79.5 179.5,80C 183.295,81.0635 184.461,83.5635 183,87.5C 181.933,88.1905 180.766,88.6905 179.5,89C 142.833,89.6667 106.167,89.6667 69.5,89C 65.7054,87.9365 64.5388,85.4365 66,81.5C 67.3024,80.9152 68.469,80.2485 69.5,79.5 Z M 49.5,109.5 C 77.8353,109.333 106.169,109.5 134.5,110C 138.295,111.064 139.461,113.564 138,117.5C 136.933,118.191 135.766,118.691 134.5,119C 106.167,119.667 77.8333,119.667 49.5,119C 45.7054,117.936 44.5388,115.436 46,111.5C 47.3024,110.915 48.469,110.249 49.5,109.5 Z M 164.5,109.5 C 176.171,109.333 187.838,109.5 199.5,110C 203.295,111.064 204.461,113.564 203,117.5C 201.933,118.191 200.766,118.691 199.5,119C 187.833,119.667 176.167,119.667 164.5,119C 160.705,117.936 159.539,115.436 161,111.5C 162.302,110.915 163.469,110.249 164.5,109.5 Z M 69.5,139.5 C 106.168,139.333 142.835,139.5 179.5,140C 183.295,141.064 184.461,143.564 183,147.5C 181.933,148.191 180.766,148.691 179.5,149C 142.833,149.667 106.167,149.667 69.5,149C 65.7054,147.936 64.5388,145.436 66,141.5C 67.3024,140.915 68.469,140.249 69.5,139.5 Z" />
									</g>
									</svg>

									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First Comment
												</a>
											</h3>
											<div className="badge-summary">
												<span>Commented to a ideas</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="ember114" className="badge-card medium basic ember-view">
								<div className="badge-contents">
									<a className={`badge-icon badge-type-bronze ${UserBadges.reply?"granted":""}`}>
									<svg
									xmlns="http://www.w3.org/2000/svg"
									xmlnsXlink="http://www.w3.org/1999/xlink"
									width={45} height={45}
									viewBox="0 0 240 240"
									style={{
										shapeRendering: "geometricPrecision",
										textRendering: "geometricPrecision",
										imageRendering: "optimizeQuality",
										fillRule: "evenodd",
										clipRule: "evenodd"
									}}
									>
									<g>
										<path d="M 108.5,19.5 C 151.095,15.1938 187.261,28.1938 217,58.5C 239.229,85.5252 245.229,115.859 235,149.5C 221.693,182.081 198.193,203.581 164.5,214C 142.015,220.258 119.348,221.091 96.5,216.5C 79.7799,234.576 59.1132,242.076 34.5,239C 44.6276,227.249 50.7943,213.749 53,198.5C 8.44481,164.946 -1.88852,122.946 22,72.5C 42.7991,41.8947 71.6325,24.2281 108.5,19.5 Z M 84.5,84.5 C 94.5,84.5 104.5,84.5 114.5,84.5C 114.667,96.1714 114.5,107.838 114,119.5C 112.883,139.089 103.383,152.756 85.5,160.5C 84.1667,155.5 84.1667,150.5 85.5,145.5C 94.8725,139.425 99.5391,130.758 99.5,119.5C 94.5,119.5 89.5,119.5 84.5,119.5C 84.5,107.833 84.5,96.1667 84.5,84.5 Z M 134.5,84.5 C 144.5,84.5 154.5,84.5 164.5,84.5C 164.667,96.1714 164.5,107.838 164,119.5C 162.883,139.089 153.383,152.756 135.5,160.5C 134.167,155.5 134.167,150.5 135.5,145.5C 144.872,139.425 149.539,130.758 149.5,119.5C 144.5,119.5 139.5,119.5 134.5,119.5C 134.5,107.833 134.5,96.1667 134.5,84.5 Z" />
									</g>
									</svg>


									</a>
									<div className="badge-info">
										<div className="badge-info-item">
											<h3>
												<a href="#" className="badge-link">
													First reply
												</a>
											</h3>
											<div className="badge-summary">
												<span>Replyed to a message</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

			</div>

		</>
	)
}
