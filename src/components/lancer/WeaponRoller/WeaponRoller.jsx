import React, { useState, useEffect } from 'react';
import WeaponAttack from './WeaponAttack/WeaponAttack.jsx';
import WeaponRollerSetup from './WeaponRollerSetup.jsx';
import BonusDamageBar from './BonusDamageBar.jsx';
import BaseDamageBar from './BaseDamageBar.jsx';
import { deepCopy } from '../../../utils.js';

import {
  getTagName,
  findTagOnWeapon,
  defaultWeaponDamageType,
  GENERIC_BONUS_SOURCE,
  DAMAGE_MODIFIERS,
  BONUS_TO_BURN_TAGS,
} from '../lancerData.js';

import {
  rollToHit,
  rollDamage,
  rollBonusDamage,
  produceRollPools,
  makeDamageRoll,
  getActiveBonusDamageData,
  createNewAttack,
} from './weaponRollerUtils.js';

import './WeaponRoller.scss';


const WeaponRoller = ({
  weaponData,
  gritBonus,
  availableBonusSources = [],
  isPrimaryWeaponOnMount,
}) => {
  const [allAttackRolls, setAllAttackRolls] = useState([]);
  const [isSettingUpAttack, setIsSettingUpAttack] = useState(true);

  const [bonusDamageData, setBonusDamageData] = useState(null);
  const [activeBonusSources, setActiveBonusSources] = useState([]);

  const [damageModifiers, setDamageModifiers] = useState({...DAMAGE_MODIFIERS});

  const [genericBonusDieCount, setGenericBonusDieCount] = useState(0);
  const [genericBonusPlus, setGenericBonusPlus] = useState(0);

  // =============== CHANGE WEAPON ==================
  useEffect(() => {
    clearAttacks()
  }, [weaponData]);

  const clearAttacks = () => {
    setAllAttackRolls([]);
    setIsSettingUpAttack(true);
    setBonusDamageData(null);
    setActiveBonusSources([]);
    setDamageModifiers({...DAMAGE_MODIFIERS})
    setGenericBonusDieCount(0);
    setGenericBonusPlus(0);
  }

  // Add or remove the name of a bonus damage to the active list
  const toggleBonusDamage = (sourceID) => {
    let newBonusDamages = [...activeBonusSources];

    const bonusIndex = newBonusDamages.indexOf(sourceID);
    if (bonusIndex >= 0) {
      newBonusDamages.splice(bonusIndex, 1) // REMOVE source
    } else {
      newBonusDamages.push(sourceID);          // ADD source
    }

    // Special case: tokugawa bonus-to-burn
    if (BONUS_TO_BURN_TAGS.includes(sourceID)) toggleDamageModifier('bonusToBurn')

    setActiveBonusSources(newBonusDamages);
  }

  const toggleDamageModifier = (modifier) => {
    let newModifiers = {...damageModifiers};

    // toggle the given key
    newModifiers[modifier] = !damageModifiers[modifier]

    // half & double are mutually exclusive
    if (modifier === 'half' && newModifiers.half) {
      newModifiers.double = false;
    } else if (modifier === 'double' && newModifiers.double) {
      newModifiers.half = false;
    }

    setDamageModifiers(newModifiers);
  }

  let weaponTags = []
  if (weaponData.tags) {
    weaponData.tags.map(tag => {
      weaponTags.push( getTagName(tag) )
    })
  }

  // Create a new attack roll, including to-hit and damage.
  const createNewAttackRoll = (flatBonus, accuracyMod) => {

    const previousAttackDamage = allAttackRolls.length > 0 ? allAttackRolls[0].damage : null;
    const newAttack = createNewAttack(weaponData, flatBonus, accuracyMod, previousAttackDamage)

    console.log('New Attack:', newAttack);

    let newData = deepCopy(allAttackRolls);
    newData.push(newAttack);
    setAllAttackRolls(newData);
    setIsSettingUpAttack(false);

    // do we need to roll bonus damage?
    if (bonusDamageData === null) {
      const bonusDamage = rollBonusDamage(
        [...availableBonusSources, GENERIC_BONUS_SOURCE],
        defaultWeaponDamageType(weaponData),
        newAttack.isOverkill
      );

      console.log('New Bonus Damage:', bonusDamage);

      setBonusDamageData(bonusDamage);
    }
  }

  // the actual data for all the currently active bonus damages
  const isOverkill = !!findTagOnWeapon(weaponData, 'tg_overkill');
  var activeBonusDamageData = getActiveBonusDamageData(
    bonusDamageData,
    activeBonusSources,
    genericBonusDieCount,
    genericBonusPlus,
    isOverkill
  );

  const genericBonusIsActive = genericBonusPlus || genericBonusDieCount;

  return (
    <div className='WeaponRoller'>
      <div className="top-bar">
        <h3 className='name'>{weaponData.name}</h3>

        <div className="base-damage-and-tags">
          <BaseDamageBar
            weaponData={weaponData}
          />

          <div className="tags">
            {weaponTags.join(', ').toLowerCase()}
            <span className='size'>{weaponData.mount}</span>
          </div>


        </div>

        {weaponData.effect &&
          <div className='effect-row'>
            {weaponData.effect}
          </div>
        }

        <BonusDamageBar
          genericBonusDieCount={genericBonusDieCount}
          setGenericBonusDieCount={setGenericBonusDieCount}
          genericBonusPlus={genericBonusPlus}
          setGenericBonusPlus={setGenericBonusPlus}
          genericBonusIsActive={genericBonusIsActive}

          availableBonusSources={availableBonusSources}
          activeBonusSources={activeBonusSources}
          toggleBonusDamage={toggleBonusDamage}

          damageModifiers={damageModifiers}
          toggleDamageModifier={toggleDamageModifier}
        />
      </div>

      <div className="attacks-bar">


        { allAttackRolls.map((attackData, i) =>
          <WeaponAttack
            attackData={attackData}
            bonusDamageData={activeBonusDamageData}
            halveBonusDamage={allAttackRolls.length >= 2}
            damageModifiers={damageModifiers}
            isFirstRoll={i === 0}
            key={i}
          />
        )}


        { isSettingUpAttack &&
          <WeaponRollerSetup
            weaponData={weaponData}
            gritBonus={gritBonus}
            createNewAttackRoll={createNewAttackRoll}
          />
        }
      </div>


      <div className='status-bar'>

        { !isPrimaryWeaponOnMount && allAttackRolls.length === 0 && isSettingUpAttack &&
          <div className='tip'>
            In addition to your primary attack, you may also attack with a different Auxiliary weapon on the same mount. That weapon doesn’t deal bonus damage.
          </div>
        }

        { (allAttackRolls.length >= 1) &&
          <>
            {(allAttackRolls.length >= 2 && activeBonusDamageData.rolls.length > 0) && !isSettingUpAttack &&
              <div className='tip'>
                If an attack that targets more than one character deals bonus damage, the bonus damage is halved.
              </div>
            }

            <div className='action-buttons-container'>
              <button className='add-target' onClick={() => setIsSettingUpAttack(true)} disabled={isSettingUpAttack}>
                <div className='asset plus' />
                Add target
              </button>

              <button className='clear-attacks' onClick={clearAttacks} >
                <div className='asset x' />
                Clear
              </button>
            </div>
          </>
        }
      </div>
    </div>
  )
}


export default WeaponRoller;