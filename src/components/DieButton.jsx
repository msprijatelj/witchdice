import React from 'react';

import './DieButton.scss';


const DieButton = ({
  dieType,
  setDieType,
  dieCount,
  setDieCount,
}) => {

  function handleClick(e, leftMouse) {
    let newDieCount = dieCount;

    if (leftMouse && !e.shiftKey) {
      newDieCount += 1;
    } else {
      newDieCount -= 1;
      e.preventDefault()
    }

    const min = (dieType === 'plus') ? -99 : 0;

    newDieCount = Math.min(newDieCount, 99);
    newDieCount = Math.max(newDieCount, min);
    setDieCount(newDieCount)
  }

  let dieClass = dieCount !== 0 ? 'will-roll' : '';
  let dieIcon = `d${dieType}`;
  if (dieType === 'plus') {
    dieIcon = 'plus';
    dieClass += ' last'
  }

  let isVariableDie = false;
  if (dieType.startsWith('x')) {
      isVariableDie = true;
      dieType = dieType.substring(1) // chop the 'x' off of e.g. 'x3'
      dieIcon = 'x'
      dieClass += ' variable'
  }

  const buttonDisabled = isVariableDie && dieType.length === 0; // hasn't entered a dX yet

  return (
    <button className={`DieButton ${dieClass}`}
      onClick={(e) => handleClick(e, true)}
      onContextMenu={(e) => handleClick(e, false)}
      onKeyDown={e => {
        if (dieType !== 'plus' && !isVariableDie) {
          if (parseInt(e.key)) setDieCount(parseInt(e.key))
          if (e.key === 'Backspace' || e.key === 'Delete') setDieCount(0)
        }
      }}
      disabled={buttonDisabled}
    >
      { (dieType === 'plus') ?
        <input className='plus'
          type="number"
          value={dieCount}
          onChange={e => setDieCount( Math.max(Math.min(e.target.value, 99), -99) )}
          onClick={e => e.stopPropagation()}
          onFocus={e => e.target.select()}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        />

      : (dieCount > 0) ?
        <div className='roll-count'>{dieCount}</div>

      : (isVariableDie) &&
        <div className='asset dx' />
      }

      { !isVariableDie && <div className={`asset ${dieIcon}`} /> }

      { (isVariableDie) ?
        <div className='die-type-label'>
          <span className='dee'>d</span>
          <input className='variable'
            type="number"
            value={dieType}
            onChange={e => setDieType( `x${Math.max(Math.min(e.target.value, 99), 1)}` )}
            onClick={e => e.stopPropagation()}
            onFocus={e => e.target.select()}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            placeholder="x"
          />
        </div>

      : (dieType !== 'plus' && dieCount === 0) &&
        <div className='die-type-label'>
          <span className='dee'>d</span>
          <span className='type'>{dieType}</span>
        </div>
      }


    </button>
  )
}

export default DieButton;
