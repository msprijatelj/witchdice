import React, { useState } from 'react';
import Tooltip from '../../shared/Tooltip';

import './MechNumberIcon.scss';

const MechNumberIcon = ({
  maxNumber,
  currentNumber,
  setCurrentNumber,
  icon = '',
  onIconClick = () => {},
  iconTooltipData = {},
  extraClass = '',
  leftToRight = true,
  buttonOnly = false,
}) => {
  const maxNumberForInput = maxNumber ? maxNumber : 20

  return (
    <div className={`MechNumberIcon ${extraClass} ${leftToRight ? 'left-to-right' : 'right-to-left'}`}>

      <button className={buttonOnly ? 'contains-number' : ''} onClick={onIconClick}>
        <div className='icon-container'>
          <div className={`asset ${icon}`} />
          <div className='power-bars-coverup' />
        </div>

        {buttonOnly && currentNumber &&
          <div className='display-number'>{currentNumber}</div>
        }

        <Tooltip
          title={iconTooltipData.title}
          content={iconTooltipData.content}
          flavor={iconTooltipData.hint}
          skipCloseButton={true}
        />
      </button>

      { !buttonOnly &&
        <input type='number'
          min={0}
          max={maxNumberForInput}
          value={currentNumber}
          onChange={e => setCurrentNumber(e.target.value)}
        />
      }
    </div>
  );
}




export default MechNumberIcon;
