import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Switch, Route, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

import { deepCopy, capitalize } from '../utils.js';
import { randomWords } from '../random_words.js';

import LoadinDots from './shared/LoadinDots.jsx';
import DiceBag from './DiceBag.jsx';
import PartyPanel from './PartyPanel.jsx';

import './Main.scss';

// import MainSimple from './simple/MainSimple.jsx';
// import Main5E from './5e/Main5E.jsx';
// import MainWitchCraft from './witchcraft/MainWitchCraft.jsx';

const MainSimple = lazy(() => import('./simple/MainSimple.jsx'));
const Main5E = lazy(() => import('./5e/Main5E.jsx'));
const MainWitchCraft = lazy(() => import('./witchcraft/MainWitchCraft.jsx'));

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Main = () => {
  const [rollSummaryData, setRollSummaryData] = useState({});

  const [allPartyActionData, setAllPartyActionData] = useState([]);
  const [latestAction, setLatestAction] = useState(null);

  const [partyRoom, setPartyRoom] = useState('');
  const [partyConnected, setPartyConnected] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyAutoconnect, setPartyAutoconnect] = useState(false); //set to TRUE to attempt to join a room immediately
  const [partyLastAttackKey, setPartyLastAttackKey] = useState('');
  const [partyLastAttackTimestamp, setPartyLastAttackTimestamp] = useState(0);

  const [partyLastDicebagKey, setPartyLastDicebagKey] = useState('');
  const [partyLastDicebagTimestamp, setPartyLastDicebagTimestamp] = useState(0);

  // =============== INITIALIZE ==================
  const { rollmode } = useParams();
  const queryParams = useQuery();
  useEffect(() => {
    const urlRoom = queryParams.get('r');
    const loadedRoom = localStorage.getItem("party_room");
    const loadedName = localStorage.getItem("party_name");

    if (loadedName) setPartyName(loadedName);

    // join the room from the URL
    if (urlRoom && urlRoom.length > 6) {
      console.log('we are joining from a link, connecting...');
      if (!loadedName) generatePartyName();
      setPartyRoom(urlRoom);
      setPartyAutoconnect(true);
    } else {
      // prefill the room name from local storage
      if (loadedRoom) {
        setPartyRoom(loadedRoom);
      // new here? get a random name
      } else {
        generateRoomName()
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // automatically try to connect to a room if we flag it to do so
  useEffect(() => {
    if (partyAutoconnect) connectToRoom(partyRoom)
  }, [partyAutoconnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // =============== PARTY ROLL FUNCTIONS ==================

  const addNewAttackPartyRoll = (actionData) => {
    if (partyConnected) {
      const dbRef = window.firebase.database().ref().child('rooms').child(partyRoom);

      // ~~ new attack roll ~~ //
      if (partyLastAttackTimestamp === 0) {
        const newKey = dbRef.push(actionData).key
        setPartyLastAttackKey(newKey);
        // console.log('       pushed  new attack to firebase', actionData);

      // ~~ update attack roll ~~ //
      } else {
        dbRef.child(partyLastAttackKey).set(actionData);
        // console.log('       set updated attack in firebase', actionData);
      }
    } else {
      // add it to the single-player roll history
      // console.log('setting single-player attack history latest action');
      setLatestAction(actionData)
    }
  }

  const addNewDicebagPartyRoll = (rolls, summaryMode, isNew) => {
    if (rolls.length > 0) {
      let actionData = {};
      actionData.name = partyName || 'Me';
      actionData.type = 'dicebag';
      actionData.conditions = rolls.length > 1 ? summaryMode : '';

      // rolls = [ {die: 'd6', result: 4}, ... ]
      rolls.forEach((roll, i) => {
        actionData[`roll-${i}`] = {
          die: roll.dieType,
          result: roll.result
        }
      });

      if (isNew) {
        actionData.createdAt = Date.now();
        actionData.updatedAt = actionData.createdAt;
        setPartyLastDicebagTimestamp(actionData.createdAt)
      } else {
        actionData.createdAt = partyLastDicebagTimestamp
        actionData.updatedAt = Date.now();
      }

      if (partyConnected) {
        const dbRef = window.firebase.database().ref().child('rooms').child(partyRoom);
        // ~~ new dicebag roll ~~ //
        if (isNew) {
          // console.log('       pushing  new dicebag roll to room',partyRoom,' : ', actionData);
          const newKey = dbRef.push(actionData).key;
          setPartyLastDicebagKey(newKey);
        // ~~ update dicebag roll ~~ //
        } else {
          // console.log('       set updated dicebag roll in firebase', actionData);
          dbRef.child(partyLastDicebagKey).set(actionData);
        }

      } else {
        // add it to the single-player roll history
        // console.log('setting single-player dicebag history latest action');
        setLatestAction(actionData)
      }
    }
  }

  // ~ NEW/UPDATE LOCAL 5e ATTACK ~ //
  useEffect(() => {
    const conditions = rollSummaryData.conditions;
    const characterName = rollSummaryData.characterName;
    const rolls = rollSummaryData.rolls;

    if (rolls && rolls.length > 0) {
      // traverse rollData to pull it out in a format that we want.
      let actionData = {};
      actionData.name = partyName;
      actionData.char = characterName;
      actionData.type = 'attack';
      actionData.conditions = conditions.join(', ')

      // ~~ new attack roll ~~ //
      if (partyLastAttackTimestamp === 0) {
        actionData.createdAt = Date.now();
        actionData.updatedAt = actionData.createdAt;
        setPartyLastAttackTimestamp(actionData.createdAt);

      // ~~ update attack roll ~~ //
      } else {
        actionData.createdAt = partyLastAttackTimestamp
        actionData.updatedAt = Date.now();
      }


      // rollSummaryData = [ {attack: 20, name: 'Longsword', 'slashing': 13, 'necrotic': 4}, ... ]
      // (replaces "attack" with "save" for saving throws)
      rolls.forEach((roll, i) => {
        actionData[`roll-${i}`] = { ...roll }
      });

      addNewAttackPartyRoll(actionData);

    }
  }, [rollSummaryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ~ NEW FIREBASE ACTION DETECTED ~ //
  // since we can't read (only write) state variables from inside firebase triggers, have to do a handoff like this
  useEffect(() => {
    if (latestAction) {
      let newData = deepCopy(allPartyActionData);

      // console.log('       new action created at :', latestAction.createdAt);

      // is this an update or a new one?
      let isUpdate = false;
      allPartyActionData.forEach((action, i) => {
        if (action !== null && action.createdAt === latestAction.createdAt) {
          isUpdate = true;
          newData[i] = deepCopy(latestAction);
        }
      });
      if (!isUpdate) newData.push(latestAction)

      setAllPartyActionData(newData);
    }

  }, [latestAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectToRoom = (roomName) => {
    try {
      console.log('Connecting to room : ', roomName);
      if (roomName === null || roomName.length === 0) { throw new Error('Invalid room name!') }

      const dbRef = window.firebase.database().ref().child('rooms').child(roomName)

      // get the current list of data >> don't need to do this, it'll call child_added for all ones initially
      // dbRef.once('value',
      //   (snapshot) => {
      //     const rawActionData = snapshot.val();
      //     if (rawActionData !== null) {
      //       let newActionData = []; // turn a buncha { "action-1": {data} } into just an array e.g. [ {data}, ... ]
      //       Object.keys(rawActionData).forEach((actionKey) => { newActionData.push(rawActionData[actionKey]) });
      //       setAllPartyActionData( newActionData );
      //     }
      //   }
      // );


      dbRef.on('child_changed', (snapshot) => {
        if (snapshot) { setLatestAction(snapshot.val()) }
      });
      dbRef.on('child_added', (snapshot) => {
        if (snapshot) {
          // clean out old rolls
          var now = Date.now();
          var cutoff = now - 72 * 60 * 60 * 1000; // 72 hours ago
          if (snapshot.val().createdAt < cutoff) {
            snapshot.ref.remove();
          } else {
            setLatestAction(snapshot.val())
          }
        }
      });

      setPartyConnected(true);
      localStorage.setItem("party_name", partyName);
      localStorage.setItem("party_room", roomName);

      // change the url
      // if (window.history.replaceState) {
      //   window.history.replaceState({'room': roomName}, 'Witch Dice', `/${roomName}`);
      // }

    } catch (error) {
      console.log('ERROR: ',error.message);
      setPartyConnected(false);
    }
  }

  const generateRoomName = () => {
    setPartyRoom( `${randomWords(1)}-${randomWords({exactly: 1, maxLength: 6})}-${randomWords({exactly: 1, maxLength: 4})}` )
  }

  const generatePartyName = () => {
    setPartyName( capitalize(`${randomWords(1)}`) )
  }

  function renderDicebag() {
    return (
      <div className="dicebag-and-history">
        <DiceBag
          addNewDicebagPartyRoll={addNewDicebagPartyRoll}
        />

        <PartyPanel
          allPartyActionData={allPartyActionData}
          partyName={partyName}
          setPartyName={setPartyName}
          partyRoom={partyRoom}
          setPartyRoom={setPartyRoom}
          generateRoomName={generateRoomName}
          partyConnected={partyConnected}
          connectToRoom={connectToRoom}
          rollMode={rollmode}
        />
      </div>
    )
  }

  return (
    <div className='Main'>
      <Switch>
        <Route path="/5e">
          <Helmet>
              <title>Witch Dice ~ D&D 5e damage roller</title>
              <meta
                name="description"
                content="Dice roller for D&D 5e that takes the math out of combat. Press a button and get instant results."
              />
          </Helmet>
          <Suspense fallback={<LoadinDots />}>
            <Main5E
             setPartyLastAttackKey={setPartyLastAttackKey}
             setPartyLastAttackTimestamp={setPartyLastAttackTimestamp}
             setRollSummaryData={setRollSummaryData}
            />
            {renderDicebag()}
          </Suspense>
        </Route>

        <Route path="/craft">
          <Helmet>
              <title>Witch Dice ~ Witch+Craft character sheet</title>
              <meta
                name="description"
                content="Character sheet and crafting roller for the Witch+Dice 5e crafting and domestic magic supplemental."
              />
          </Helmet>
          <Suspense fallback={<LoadinDots />}>
            <MainWitchCraft />
            {renderDicebag()}
          </Suspense>
        </Route>

        <Route path="/simple">
          <Helmet>
              <title>Witch Dice ~ cute dice roller</title>
              <meta
                name="description"
                content="A cute & elegant dice roller for playing tabletop games online with friends."
              />
          </Helmet>
          <Suspense fallback={<LoadinDots />}>
            <MainSimple />
            {renderDicebag()}
          </Suspense>
        </Route>
      </Switch>
    </div>
  )
}


export default Main ;
