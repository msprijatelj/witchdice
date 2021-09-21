import React from 'react';
import { deepCopy } from '../../../utils.js';
import {
  diceDataIntoToRollData,
  getRollDescription,
} from './DiceBagData.js';
import './Bookmark.scss';

const Bookmark = ({
  bookmarkData,
  setCurrentDice,
  setSummaryMode,
  setPercentileMode,
  handleDelete,
  isSelected,
}) => {

  const handleClick = (e, leftMouse) => {

    // load roll
    if (leftMouse && !e.shiftKey) {
      let diceData = deepCopy(bookmarkData)
      const summaryMode = diceData.summaryMode
      const percentileMode = diceData.percentileMode
      delete diceData.summaryMode
      delete diceData.percentileMode

      setSummaryMode(summaryMode)
      setPercentileMode(percentileMode)
      setCurrentDice(diceData)

    // delete bookmark
    } else {
      handleDelete()
      e.preventDefault()
    }
  }

  return (
    <button
      className={`Bookmark ${isSelected ? 'selected' : ''}`}
      onClick={(e) => handleClick(e, true)}
      onContextMenu={(e) => handleClick(e, false)}
      disabled={isSelected}
    >
      <div className='asset bookmark' />

      {getRollDescription(
        diceDataIntoToRollData(bookmarkData, bookmarkData.percentileMode),
        bookmarkData.summaryMode
      )}
    </button>
  );
}

export default Bookmark;