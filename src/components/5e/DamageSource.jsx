import React from 'react';
import './DamageSource.scss';
import { allTags, abilityTypes } from './data.js';
import {
  DamageEditDamageType,
  DamageEditMetadata,
  DamageEditNumbers,
  DamageEditDieType
} from './DamageEdit.jsx';

const DamageSource = ({
  damageID, attackID, damageData, damageFunctions,
  isEditing, onEdit, onDelete,
  setSavingThrowDC, setSavingThrowType, savingThrowDC, savingThrowType
}) => {

  const {
    // dieCount,
    dieType,
    // modifier,
    tags,
    damageType,
    // enabled,
    // name,
    // condition
  } = damageData;

  const {
    // setDieCount,
    setDieType,
    // setModifier,
    setTags,
    setDamageType,
    // setEnabled,
    // setName,
    // setCondition,
  } = damageFunctions;

  // const [hoveringOverCheckBox, setHoveringOverCheckBox] = useState(false);
  // const [isEditingDieType, setIsEditingDieType] = useState(true);
  // const [isEditingDamageType, setIsEditingDamageType] = useState(true);

  const handleContainerClick = () => {
    // if (hoveringOverCheckBox) { return }
    if (!isEditing) { onEdit(damageID) }
  }

  const handleAccept = () => {
    // setIsEditingDieType(false);
    // setIsEditingDamageType(false);
    onEdit(damageID);
  }

  // =============== ADD / REMOVE TAG CRAP =============


  let selectedTags = [];
  let selectedTagNames = [];
  tags.forEach((tagKey, i) => {
    selectedTags.push({name: allTags[tagKey], id: tagKey})
    selectedTagNames.push(allTags[tagKey])
  })

  const handleTagUpdate = (selectedTags) => {
    let newTags = []
    selectedTags.forEach((tag) => { newTags.push(tag.id) })
    setTags(newTags, attackID, damageID)
  }

  function handleSavingThrowDCClick(e, leftMouse) {
    let newDC = savingThrowDC;

    if (leftMouse && !e.shiftKey) {
      newDC += 1;
    } else {
      newDC -= 1;
      e.preventDefault()
    }

    newDC = Math.min(newDC, 40);
    newDC = Math.max(newDC, 0);
    setSavingThrowDC(newDC, attackID, damageID);
  }

  function handleSavingThrowTypeClick(e, leftMouse) {
    let newType = savingThrowType;

    if (leftMouse && !e.shiftKey) {
      newType += 1;
    } else {
      newType -= 1;
      e.preventDefault()
    }

    newType = newType % abilityTypes.length
    setSavingThrowType(newType, attackID, damageID);
  }

  // =================== RENDER ==================

  const editingClass = isEditing ? 'editing' : '';

  return (
    <div className={`DamageSource ${editingClass}`} onClick={handleContainerClick} >

      {/*
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled, attackID, damageID)}
        onMouseEnter={() => setHoveringOverCheckBox(true)}
        onMouseLeave={() => setHoveringOverCheckBox(false)}
      />
      */}

      {!isEditing ?
        <div className="summary-mode">
          <DamageNumbers damageData={damageData} />

          <DamageMetadata damageData={damageData} selectedTagNames={selectedTagNames} />

        </div>
      :
        <>
          <div className="edit-mode">
            <DamageEditNumbers
              damageID={damageID}
              attackID={attackID}
              damageData={damageData}
              damageFunctions={damageFunctions}
            />

            <DamageEditDieType
              attackID={attackID}
              die={dieType}
              setDie={(value) => setDieType(value, attackID, damageID)}
            />

            <DamageEditDamageType
              attackID={attackID}
              type={damageType}
              setType={(value) => setDamageType(value, attackID, damageID)}
            />

            <DamageEditMetadata
              damageID={damageID}
              attackID={attackID}
              damageData={damageData}
              damageFunctions={damageFunctions}
              selectedTags={selectedTags}
              handleTagUpdate={handleTagUpdate}
              handleSavingThrowDCClick={handleSavingThrowDCClick}
              handleSavingThrowTypeClick={handleSavingThrowTypeClick}
              savingThrowDC={savingThrowDC}
              savingThrowType={savingThrowType}
            />
          </div>

          <div className='accept-delete-damage-container'>
            <button className='accept' onClick={handleAccept}>
              <div className={'asset checkmark'} />
            </button>
            <button className='delete' onClick={() => onDelete()}>
              <div className={'asset trash'} />
            </button>
          </div>
        </>
      }
    </div>
  );
}

const DamageNumbers = ({
  damageData
}) => {

  const {
    dieCount,
    dieType,
    modifier,
    damageType,
  } = damageData;

  return (
    <>
      <div className="roll-numbers">
        { (dieType === 0) ?
          <>{modifier} flat</>
        :
          <>
            {dieCount}d{dieType}
            {modifier > 0 ? ` + ${modifier}` : ''}
          </>
        }
      </div>

      <div className={`asset ${damageType}`} />
    </>
  );
}

const DamageMetadata = ({
  damageData,
  selectedTagNames
}) => {
  const { name } = damageData;

  return (
    <>
      { (name.length > 0) &&
        <div className="name">{name}</div>
      }

      <div className="tags">{selectedTagNames.join(', ')}</div>
    </>
  );
}


export default DamageSource ;