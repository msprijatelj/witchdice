import React, { useState } from 'react';
import Roll from './Roll.jsx';
import './Roller.scss';


const Roller = ({
  rollData,
  handleNewRoll,
  attackSourceData,
  rollFunctions //this will get passed down to the RollMods
}) => {

  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [toHitAC, setToHitAC] = useState(0);


  // calculate damage total & breakdown by type
  let damageTotal = 0;
  let damageBreakdown = {};
  let firstHitRollID = -1;

  for (let rollID = 0; rollID < rollData.length; rollID++) {
    const attackRoll = rollData[rollID];

    if (attackRoll.hit) {
      if (firstHitRollID === -1) { firstHitRollID = rollID; }

      const damageRollData = attackRoll.damageRollData;
      for (let damageRollID = 0; damageRollID < damageRollData.length; damageRollID++) {
        const type = damageRollData[damageRollID][0];
        const amount = damageRollData[damageRollID][1];
        const sourceID = damageRollData[damageRollID][2];

        let applyDamage = true;
        // if (!damageSourceData[sourceID].enabled) { applyDamage = false; }
        // if (damageSourceData[sourceID].timing === 'first' && rollID !== firstHitRollID) { applyDamage = false; }

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
  }


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

            <label className="armor-class">
              <input
                type="number"
                value={toHitAC}
                onChange={e => setToHitAC(e.target.value)}
              />
              AC (optional)
            </label>
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
        <div className="hit-label">Hit?</div>

        { rollData.map((attackRoll, i) => {

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
            rollDiscard = 0;
          }

          return (
            <Roll
              rollID={i}
              rollUse={rollUse}
              rollDiscard={rollDiscard}
              toHitAC={toHitAC}
              isFirstHit={i === firstHitRollID}
              damageSourceData={attackSourceData[attackRoll.attackID].damageData}
              attackRollData={attackRoll}
              rollFunctions={rollFunctions}
              key={i}
            />
          )
        })}

      </div>
    </div>
  );
}
export default Roller ;
