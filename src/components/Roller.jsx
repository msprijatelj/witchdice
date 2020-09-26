import React, { useState, useEffect } from 'react';
import { deepCopy } from '../utils.js';
import { abilityTypes } from '../data.js';
import Roll from './Roll.jsx';
import './Roller.scss';


const Roller = ({
  rollData,
  rollFunctions,
  attackSourceData,
  handleNewRoll
}) => {

  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [toHitAC, setToHitAC] = useState(0);
  const [saveMod, setSaveMod] = useState(0);
  const [evasion, setEvasion] = useState(false); // build the UI for this later

  // when ToHitAC or the roll data changes, figure out what's a hit
  useEffect(() => {
    autoCalculateHits();
  }, [toHitAC, rollData, advantage, disadvantage]);

  // figure out what's a hit
  function autoCalculateHits() {
    let newRollData = deepCopy(rollData);// so we can update the whole thing in one go
    let madeChange = false;

    // most of this is DISABLED because I couldn't get it to flow nicely
    for (let rollID = 0; rollID < newRollData.length; rollID++) {
      const roll = newRollData[rollID];
      const {rollUse, rollDiscard} = getRollUseDiscard(roll);
      const attackSource = attackSourceData[roll.attackID];
      const hitDC = attackSource.isSavingThrow ? (attackSource.savingThrowDC+saveMod) : toHitAC

      // // if we're given a to-hit AC, set all the hits automatically
      // if (hitDC > 0) {
      //   const didhit = attackSource.isSavingThrow ? (rollUse <= hitDC) : (rollUse >= hitDC)
      //   if (roll.hit !== didhit) {
      //     newRollData[rollID].hit = didhit
      //     madeChange = true;
      //   }
      //
      //
      // }

      // only attacks can crit
      if (!attackSource.isSavingThrow) {
        // all critical hits are hits
        const isCrit = isRollCrit(roll);
        if (isCrit && !roll.hit) {
          newRollData[rollID].hit = true
          madeChange = true;
        }
      }
    }

    if (madeChange) {rollFunctions.setRollData(newRollData)}
  }

  function getRollUseDiscard(attackRoll) {
    let {rollUse, rollDiscard} = 0;
    const rollSorted = [attackRoll.rollOne, attackRoll.rollTwo].sort((a,b)=>a-b);

    if (advantage && !disadvantage) {
      rollUse = rollSorted[1];
      rollDiscard = rollSorted[0];
    } else if (disadvantage && !advantage) {
      rollUse = rollSorted[0];
      rollDiscard = rollSorted[1];
    } else {
      rollUse = attackRoll.rollOne;
      rollDiscard = -100;
    }

    return { rollUse: rollUse, rollDiscard: rollDiscard }
  }

  // calculate damage total & breakdown by type
  let damageTotal = 0;
  let damageBreakdown = {};
  let firstHitRollID = -1;

  for (let rollID = 0; rollID < rollData.length; rollID++) {
    const roll = rollData[rollID];
    const attackSource = attackSourceData[roll.attackID]
    const damageSourceData = attackSource.damageData
    const isCrit = isRollCrit(roll);

    let isFirstHit = (rollID === firstHitRollID);;

    // get both CRIT and REGULAR dice
    [roll.damageRollData, roll.critRollData].forEach((dicePool, dicePoolIndex) => {
      // abort the crit dice pool unless this was a critical hit
      if (dicePoolIndex === 0 || isCrit) {

        const damageRollData = dicePool;
        for (let damageRollID = 0; damageRollID < damageRollData.length; damageRollID++) {
          const type = damageRollData[damageRollID][0];
          let amount = damageRollData[damageRollID][1];
          const rerolled = damageRollData[damageRollID][2];
          const sourceID = damageRollData[damageRollID][3];
          const damageSource = damageSourceData[sourceID];

          let applyDamage = false;
          if (roll.hit || isCrit) { applyDamage = true; }

          if (damageSource.tags.includes("savehalf")) {
            // has evasion
            if (evasion && attackSource.savingThrowType === 0) {
              if (roll.hit) {
                applyDamage = true;
                amount = amount * .5;
              } else {
                applyDamage = false;
              }
            } else {            // no evasion
              if (!roll.hit) {
                applyDamage = true;
                amount = amount * .5;
              }
            }
          }

          if (!damageSource.enabled) { applyDamage = false; }

          // are we the first to make it this far with a hit?
          if (applyDamage && firstHitRollID === -1) {
            firstHitRollID = rollID;
            isFirstHit = true;
          }
          if (damageSource.tags.includes("first") && !isFirstHit) { applyDamage = false; }

          if (applyDamage) {
            damageTotal = damageTotal + amount;

            if (type in damageBreakdown) {
              damageBreakdown[type] = damageBreakdown[type] + amount
            } else {
              damageBreakdown[type] = amount
            }
          }
        }
      }
    })
  }
  // round down the damage total after summing it all up
  damageTotal = Math.floor(damageTotal);

  // figure out what conditions to show
  let hasActiveAttack = false;
  let hasActiveSavingThrow = false;
  attackSourceData.map((attackSource) => {
    if (attackSource.dieCount > 0) {
      if (attackSource.isSavingThrow) {
        hasActiveSavingThrow = true;
      } else {
        hasActiveAttack = true;
      }
    }
  });

  function isRollCrit(roll) {
    let isCrit = false;

    // saving throws can't crit
    if (attackSourceData[roll.attackID].isSavingThrow) { return false; }


    const rollSorted = [roll.rollOne, roll.rollTwo].sort((a,b)=>a-b);

    // ADVANTAGE: use the higher roll's crit
    if (advantage && !disadvantage) {
      if (roll.rollOne === rollSorted[1]) {
        isCrit = roll.critOne
      } else {
        isCrit = roll.critTwo
      }

    // DISADVANTAGE: use the lower roll's crit
    } else if (disadvantage && !advantage) {
      if (roll.rollOne === rollSorted[1]) {
        isCrit = roll.critTwo
      } else {
        isCrit = roll.critOne
      }

    // NEUTRAL: use the first roll's crit
    } else {
      isCrit = roll.critOne
    }

    return isCrit;
  }

  let currentAttackName = '';//used in the render attack title loop, dunno why I can't declare there
  return (
    <div className="Roller">
      <div className="controls-and-results">

        <div className="controls">
          <div className="roll-container">
            <button className="new-roll" onClick={() => handleNewRoll()}>
                <div className='asset d20' />
            </button>
          </div>

          <div className="conditions">
            <label>
              <input
                name="advantage"
                type="checkbox"
                checked={advantage}
                onChange={() => setAdvantage(!advantage)}
              />
              Advantage
            </label>

            <label>
              <input
                name="disadvantage"
                type="checkbox"
                checked={disadvantage}
                onChange={() => setDisadvantage(!disadvantage)}
              />
              Disadvantage
            </label>

            {hasActiveSavingThrow &&
              <label className="has-evasion">
                <input
                  name="evasion"
                  type="checkbox"
                  checked={evasion}
                  onChange={() => setEvasion(!evasion)}
                />
                Evasion?
              </label>
            }

            {/* hasActiveSavingThrow &&
              <label className="save-mod">
                <input
                  type="number"
                  value={saveMod}
                  onChange={e => setSaveMod(parseInt(e.target.value))}
                />
                Save Mod (optional)
              </label>
            }

            { hasActiveAttack &&
              <label className="armor-class">
                <input
                  type="number"
                  value={toHitAC}
                  onChange={e => setToHitAC(parseInt(e.target.value))}
                />
                AC (optional)
              </label>
            */}
          </div>
        </div>

        <div className="results">
          <div className="type-breakdown">
            { Object.keys(damageBreakdown).map((type, i) => {
              return (
                <div className="damage-type" key={i}>
                  <div className='amount'>{damageBreakdown[type]}</div>
                  <div className={`asset ${type}`} />
                </div>
              )
            })}

          </div>
          <div className="total">
            <div className="label">Total Damage:</div>
            <div className="count">{damageTotal}</div>
          </div>
        </div>
      </div>

      <hr />

      <div className="rolls">
        {/* <div className="hit-label">Hit?</div>*/}

        {
          rollData.map((attackRoll, rollID) => {
            let {rollUse, rollDiscard} = getRollUseDiscard(attackRoll);

            const attackSource = attackSourceData[attackRoll.attackID];
            let renderAttackName = false;
            if (currentAttackName !== attackSource.name) {
              currentAttackName = attackSource.name;
              renderAttackName = true;
            }

            // add save mods to saving throws
            if (attackSource.isSavingThrow) {
              rollUse = rollUse + saveMod;
              rollDiscard = rollDiscard + saveMod;
            }

            return (
              <div className='roll-container'>
                { renderAttackName &&
                  <>
                    <h4>
                      {currentAttackName}
                      {attackSource.isSavingThrow && ` — DC ${attackSource.savingThrowDC} ${abilityTypes[attackSource.savingThrowType]}`}
                    </h4>
                    <div className='roll-type-hint'>
                      {attackSource.isSavingThrow ? 'Saved?' : 'Hit?'}
                    </div>
                  </>
                }
                <Roll
                  rollID={rollID}
                  rollUse={rollUse}
                  rollDiscard={rollDiscard}
                  isCrit={isRollCrit(attackRoll)}
                  evasion={evasion && attackSource.savingThrowType === 0}
                  toHitAC={toHitAC}
                  isFirstHit={rollID === firstHitRollID}
                  isSavingThrow={attackSource.isSavingThrow}
                  damageSourceData={attackSourceData[attackRoll.attackID].damageData}
                  attackRollData={attackRoll}
                  rollFunctions={rollFunctions}
                  key={rollID}
                />
              </div>
            )
          })
        }

      </div>
    </div>
  );
}
export default Roller ;
