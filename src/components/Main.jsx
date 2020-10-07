import React, { useState, useEffect } from 'react';
import { deepCopy, getRandomInt } from '../utils.js';
import {
  CURRENT_VERSION,
  getRandomFingerprint,
  defaultDamageData,
  defaultAttackData,
  defaultRollData,
  saveCharacterData
} from '../data.js';
import { getMonsterData } from '../stockdata/process_monster_srd.js';

import CharacterAndMonsterList from './CharacterAndMonsterList.jsx';
import Character from './Character.jsx';
import ActiveAttackList from './ActiveAttackList.jsx';
import Roller from './Roller.jsx';
import DiceBag from './DiceBag.jsx';


// whenever we make a change that breaks the old data, bump up the first number
console.log('Welcome to Roll-To-Hit version ', CURRENT_VERSION);

const loadedVersion = localStorage.getItem("version");
let brokeOldData = false;
if (loadedVersion) {
  const newMajorVersion = loadedVersion.slice(0,loadedVersion.indexOf("."))
  console.log('Loading data from version', loadedVersion, '--— major version: ', newMajorVersion);

  if (newMajorVersion !== CURRENT_VERSION.slice(0,CURRENT_VERSION.indexOf("."))) {
    brokeOldData = true;
    console.log('Detected breaking change of saved data. Resetting to defaults.');
  }
}

// should we initialize to defaults?
if (!loadedVersion || brokeOldData || true) {
  // clear out the old data
  console.log('Clearing out old data...');
  while (localStorage.length > 0) {
    const key = localStorage.key(0);
    localStorage.removeItem(key)
    console.log('Removed stored character', key);
  }

  // save the new data
  getMonsterData().map((data,i) => {
    const fingerprint = (100000 + i)
    saveCharacterData(
      fingerprint,
      data.name,
      data.allAttackData
    )
  })
}


const Main = () => {
  const [allCharacterEntries, setAllCharacterEntries] = useState([]);
  const [allMonsterEntries, setAllMonsterEntries] = useState([]);

  const [characterID, setCharacterID] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [characterAttackData, setCharacterAttackData] = useState([]);

  const [rollData, setRollData] = useState([]);


  // =============== INITIALIZE CHARACTER DATA ==================

  useEffect(() => {
    for ( var i = 0, len = localStorage.length; i < len; ++i ) {
      const key = localStorage.key(i);
      // console.log('localStorage key : ', key);
      // console.log('                item : ', localStorage.getItem(key));
      if (key.startsWith('character-')) {
        const characterName = getCharacterNameFromStorageName(key);
        const characterID = getCharacterIDFromStorageName(key);

        // first chunk of IDs are monsters
        if (characterID < 200000) {
          allMonsterEntries.push({id: characterID, name: characterName})

        } else {
          allCharacterEntries.push({id: characterID, name: characterName})
        }
      }
    }
  }, []);


  // =============== ADD/EDIT/DELETE CHARACTER FUNCTIONS ==================

  const createNewCharacter = () => {
    const fingerprint = getRandomFingerprint()
    console.log('making new character with fingerprint', fingerprint);
    saveCharacterData(
      fingerprint,
      'Character',
      [deepCopy(defaultAttackData)]
    )
    const newCharacter = loadCharacterData(fingerprint);
    setActiveCharacterData(newCharacter)
    setActiveCharacterID(fingerprint);
  }

  const deleteActiveCharacter = () => {
    console.log('deleteActiveCharacter', characterID);
    const storageName = getCharacterStorageName(characterID, characterName);
    // remove from localstorage
    localStorage.removeItem(storageName)
    // remove from the current list of character entries
    let newData = deepCopy(allCharacterEntries)
    let characterIndex = -1;
    allCharacterEntries.forEach((entry, i) => {
      if (entry.id === characterID) {characterIndex = i;}
    });
    if (characterIndex >= 0) {
      newData.splice(attackID, 1)
      setAllCharacterEntries(newData);
    }
    clearCharacterSelection()
  }

  const setActiveCharacter = (id) => {
    const loadedCharacter = loadCharacterData(id);
    console.log('setActiveCharacter', id);

    if (loadedCharacter) {
      setCharacterID(id);
      setCharacterName(loadedCharacter.name);
      setAllAttackData(loadedCharacter.allAttackData);
    }
    clearRolls();
  }

  const clearCharacterSelection = () => {
    setCharacterID(null);
    setCharacterName('');
    setCharacterAttackData([]);
    clearRolls();
  }

  // =============== UPDATE ATTACK DATA ===================

  const updateAllAttackData = (key, value, attackID) => {
    // console.log('');
    // console.log('Current attack data:', JSON.stringify(allAttackData));
    // console.log('');
    // console.log('updating attack data id', attackID, '   key ', key)
    // console.log('  with value ', JSON.stringify(value));
    // console.log('old data : ', JSON.stringify(allAttackData[attackID][key]));

    let newData = deepCopy(allAttackData)
    newData[attackID][key] = value
    // save new attack data to the current character object
    setAllAttackData(newData);
    // save new attack data to localStorage
    saveCharacterData(id, name, newData)

    clearRolls();
  }

  const attackFunctions = {
    setIsActive: (value, attackID) => updateAllAttackData('isActive',value,attackID),
    setDieCount: (value, attackID) => updateAllAttackData('dieCount',parseInt(value),attackID),
    setModifier: (value, attackID) => updateAllAttackData('modifier',parseInt(value),attackID),
    setIsSavingThrow: (value, attackID) => updateAllAttackData('isSavingThrow',value,attackID),
    setSavingThrowDC: (value, attackID) => updateAllAttackData('savingThrowDC',parseInt(value),attackID),
    setSavingThrowType: (value, attackID) => updateAllAttackData('savingThrowType',parseInt(value),attackID),
    setName: (value, attackID) => updateAllAttackData('name',value,attackID),
    setDesc: (value, attackID) => updateAllAttackData('desc',value,attackID),
    setDamageData: (value, attackID) => updateAllAttackData('damageData',value,attackID),
  }

  const createAttack = () => {
    let newData = deepCopy(allAttackData);
    let newAttack = deepCopy(defaultAttackData);
    newData.push(newAttack);
    setAllAttackData(newData);
  }

  const deleteAttack = (attackID) => {
    let newData = deepCopy(allAttackData);
    newData.splice(attackID, 1);
    setAllAttackData(newData);
  }

  // =============== ROLLER FUNCTIONS ==================
  const updateRollData = (key, value, rollID) => {
    let newData = deepCopy(rollData)
    newData[rollID][key] = value
    setRollData(newData);
  }

  const clearRolls = () => {
    setRollData([]);
  }

  const rollFunctions = {
    setHit: (value, id) => updateRollData('hit',value,id),
    setRollOne: (value, id) => updateRollData('rollOne',parseInt(value),id),
    setRollTwo: (value, id) => updateRollData('rollTwo',parseInt(value),id),
    setDamageRollData: (value, id) => updateRollData('damageRollData',value,id),
    setCritRollData: (value, id) => updateRollData('critRollData',value,id),
    setRollData: (newData) => setRollData(deepCopy(newData))
  }

  // returns [TYPE, AMOUNT, REROLLED, DAMAGE_ID]
  function getDamageRoll(source, damageSourceID) {
    let damageAmount = getRandomInt(source.dieType)
    let rerolled = false;

    // maximized?
    if (source.tags.includes('maximized')) { damageAmount = source.dieType }

    // reroll damage?
    if (
      (source.tags.includes('reroll1') && damageAmount <= 1) ||
      (source.tags.includes('reroll2') && damageAmount <= 2)
    ) {
      rerolled = true;
      damageAmount = getRandomInt(source.dieType);
    }

    // minimum 2s?
    if (
      (source.tags.includes('min2') && damageAmount <= 1)
    ) {
      rerolled = true;
      damageAmount = 2;
    }

    return [
      source.damageType,
      damageAmount,
      rerolled,
      damageSourceID
    ]
  }

  const generateNewRoll = () => {
    let data = []
    let triggeredRollData = [];

    // console.log('');
    // console.log('~~~~~ NEW ROLL ~~~~~');

    // EACH ATTACK (that is active)
    for (let attackID = 0; attackID < allAttackData.length; attackID++) {
      const attackData = allAttackData[attackID]
      if (attackData.isActive && attackData.damageData.length > 0) {

        // EACH TO-HIT D20
        for (let rollID = 0; rollID < attackData.dieCount; rollID++) {
          const defaultHit = attackData.isSavingThrow ? true : false;
          let roll = deepCopy(defaultRollData);
          roll.attackID = attackID;
          roll.hit = defaultHit;
          roll.attackBonus = attackData.modifier;

          // roll some d20s
          roll.rollOne = getRandomInt(20)
          roll.rollTwo = getRandomInt(20)

          // did we crit? (check if ANY of the damage sources have expanded crit ranges)
          let critRange = 20;
          for (let damageSourceID = 0; damageSourceID < attackData.damageData.length; damageSourceID++) {
            const source = attackData.damageData[damageSourceID]
            if (source.tags.includes('expandedcrit1')) {critRange = 19}
            if (source.tags.includes('expandedcrit2')) {critRange = 18}
          }

          // EACH DAMAGE SOURCE
          const damageData = attackData.damageData
          let damageRollData = []
          let critRollData = []
          for (let damageSourceID = 0; damageSourceID < damageData.length; damageSourceID++) {
            const source = damageData[damageSourceID]

            // triggered damage gets added later
            if (!source.tags.includes('triggeredsave')) {

              // get both CRIT and REGULAR dice
              const dicePools = [damageRollData,critRollData]
              dicePools.forEach((dicePool) => {

                // EACH DIE IN THAT SOURCE
                for (let damageDieID = 0; damageDieID < source.dieCount; damageDieID++) {
                  const damage = getDamageRoll(source, damageSourceID);
                  const amount = damage[1];
                  if (amount > 0 || source.condition.length > 0) { dicePool.push(damage) }
                }
              })

              // PLUS MODIFIER
              if (source.modifier > 0) {
                let damage = [
                  source.damageType,
                  source.modifier,
                  false,
                  damageSourceID
                ]
                damageRollData.push(damage)
              }
            }
          }

          roll.damageRollData = damageRollData
          roll.critRollData = critRollData
          data.push(roll)

          // TRIGGERED-SAVING THROW ROLLS (for each damage source, again) (ignores crits)
          for (let damageSourceID = 0; damageSourceID < damageData.length; damageSourceID++) {
            const source = damageData[damageSourceID]

            if (source.tags.includes('triggeredsave')) {
              let triggeredroll = deepCopy(defaultRollData);
              triggeredroll.attackID = attackID;
              triggeredroll.hit = true;
              triggeredroll.attackBonus = 0;
              triggeredroll.rollOne = 0;
              triggeredroll.rollTwo = 0;
              triggeredroll.gatedByRollID = rollID;

              for (let damageDieID = 0; damageDieID < source.dieCount; damageDieID++) {
                const damage = getDamageRoll(source, damageSourceID);
                const amount = damage[1];
                if (amount > 0 || source.condition.length > 0) { triggeredroll.damageRollData.push(damage) }
              }

              // plus modifier
              if (source.modifier > 0) {
                let damage = [source.damageType, source.modifier, false, damageSourceID]
                triggeredroll.damageRollData.push(damage)
              }

              triggeredRollData.push(triggeredroll)
            }
          }
        }

        // add all the triggered rolls to the end of the normal roll data
        triggeredRollData.forEach((triggeredroll) => {
          data.push(triggeredroll);
        });

        // console.log('New Roll Data for ', attackData.name, JSON.stringify(data));
        setRollData(data);
      }
    }
  }



  return (
    <>
      <CharacterAndMonsterList
        setActiveCharacterData={setActiveCharacterData}
        activeCharacterID={characterID}
      />

      {(characterName.length > 0) &&
        <>
          {/*<div>(click to increase attack rolls, right-click to decrease)</div>*/}
          <Character
            characterName={characterName}
            setCharacterName={setCharacterName}
            characterID={characterID}
            updateAllAttackData={updateAllAttackData}
            allAttackData={characterAttackData}
            createAttack={createAttack}
            deleteAttack={deleteAttack}
            attackFunctions={attackFunctions}
            deleteCharacter={deleteActiveCharacter}
            clearRollData={clearRollData}
          />

          <ActiveAttackList
            attackSourceData={allAttackData}
            attackFunctions={attackFunctions}
          />

          <Roller
            rollData={rollData}
            attackSourceData={allAttackData}
            handleNewRoll={generateNewRoll}
            handleClear={clearRolls}
            rollFunctions={rollFunctions}
          />
        </>
      }

      <DiceBag />
    </>
  )
}
