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

import AttackSource from './AttackSource.jsx';
import ActiveAttackList from './ActiveAttackList.jsx';
import CharacterAndMonsterList from './CharacterAndMonsterList.jsx';
import Roller from './Roller.jsx';
import DiceBag from './DiceBag.jsx';
import TextInput from './TextInput.jsx';
import './Character.scss';


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
  for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    const key = localStorage.key(i);
    localStorage.removeItem(key)
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


const Character = () => {
  const [characterID, setCharacterID] = useState(null);
  const [characterName, setCharacterName] = useState('');

  const [allAttackData, setAllAttackData] = useState([]);
  const [rollData, setRollData] = useState([]);



  const setActiveCharacterData = (data) => {
    setCharacterID(data.id);
    setCharacterName(data.name);
    setAllAttackData(data.allAttackData);

    clearRolls();
  }

  useEffect(() => {

    if (
      characterID &&
      characterName &&
      characterName.length > 0
    ) {
      saveCharacterData(
        characterID,
        characterName,
        allAttackData
      )
    }
  }, [allAttackData, characterName]);


  // =============== UPDATE DATA ===================

  const updateAllAttackData = (key, value, attackID) => {
    // console.log('');
    // console.log('Current attack data:', JSON.stringify(allAttackData));
    // console.log('');
    // console.log('updating attack data id', attackID, '   key ', key)
    // console.log('  with value ', JSON.stringify(value));
    // console.log('old data : ', JSON.stringify(allAttackData[attackID][key]));

    let newData = deepCopy(allAttackData)
    newData[attackID][key] = value
    setAllAttackData(newData);
  }

  const updateRollData = (key, value, rollID) => {
    let newData = deepCopy(rollData)
    newData[rollID][key] = value
    setRollData(newData);
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

  const rollFunctions = {
    setHit: (value, id) => updateRollData('hit',value,id),
    setRollOne: (value, id) => updateRollData('rollOne',parseInt(value),id),
    setRollTwo: (value, id) => updateRollData('rollTwo',parseInt(value),id),
    setDamageRollData: (value, id) => updateRollData('damageRollData',value,id),
    setCritRollData: (value, id) => updateRollData('critRollData',value,id),
    setRollData: (newData) => setRollData(deepCopy(newData))
  }

  // =============== ROLLER FUNCTIONS ==================

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

  const clearRolls = () => {
    setRollData([]);
  }

  // =============== CREATE / EDIT / DELETE ATTACKS ==================

  const createAttack = () => {
    let newData = deepCopy(allAttackData);
    let newAttack = deepCopy(defaultAttackData);
    newData.push(newAttack);
    setAllAttackData(newData);

    clearRolls();
  }

  const deleteAttack = (attackID) => {
    let newData = deepCopy(allAttackData);
    newData.splice(attackID, 1);
    setAllAttackData(newData);

    clearRolls();
  }

  return (
    <>
      <CharacterAndMonsterList
        setActiveCharacterData={setActiveCharacterData}
      />

      {(characterName.length > 0) && <>
        {/*<div>(click to increase attack rolls, right-click to decrease)</div>*/}


        <div className="Character">
          <hr className="pumpkin-bar" />

          <div className="character-sheet">

            <h2 className="character-name">
              <TextInput
                textValue={characterName}
                setTextValue={setCharacterName}
                placeholder='Character name'
              />
            </h2>

            { allAttackData.map((data, i) => {
              return (
                <AttackSource
                  attackID={i}
                  attackData={allAttackData[i]}
                  attackFunctions={attackFunctions}
                  deleteAttack={(attackID) => deleteAttack(attackID)}
                  clearRollData={() => setRollData([])}
                  key={i}
                />
              )
            })}

            <div className='add-attack' onClick={createAttack}>
              <div className={`asset plus`} />
              Add Attack
            </div>
          </div>

          <hr className="pumpkin-bar" />
        </div>

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



      </>}

      <DiceBag />
    </>
  );
}


export default Character ;