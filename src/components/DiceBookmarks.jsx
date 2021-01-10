import React, { useState, useEffect } from 'react';
import { deepCopy } from '../utils.js';
import {
  blankDice,
  getToRollString,
} from './DiceBagData.js';
import './DiceBookmarks.scss';

function getToRollStringWithPrefix (bookmarkData, summaryMode, percentileMode) {
  let string =
    summaryMode === 'high' ?
      'Max '
    : summaryMode === 'low' ?
      'Min '
    :
      ''
  string += getToRollString(bookmarkData, summaryMode, percentileMode)
  return string
}

const DiceBookmarks = ({
  currentDice,
  summaryMode,
  percentileMode,
  setCurrentDice,
  setSummaryMode,
  setPercentileMode,
}) => {
  const [allBookmarkData, setAllBookmarkData] = useState([]);

  // load up all the bookmarks from localstorage
  useEffect(() => {
    const loadedBookmarks = localStorage.getItem("dice-bookmarks");
    if (loadedBookmarks) {
      setAllBookmarkData(JSON.parse(loadedBookmarks))
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const addNewBookmark = () => {
    let bookmarkData = deepCopy(currentDice)
    bookmarkData.summaryMode = summaryMode
    bookmarkData.percentileMode = percentileMode

    let newData = deepCopy(allBookmarkData)
    newData.push(bookmarkData)
    setAllBookmarkData(newData)

    localStorage.setItem('dice-bookmarks', JSON.stringify(newData))
  }

  const deleteBookmark = (index) => {
    const bookmarkData = allBookmarkData[index]

    let newData = deepCopy(allBookmarkData)
    newData.splice(index, 1)
    setAllBookmarkData(newData)

    localStorage.setItem('dice-bookmarks', JSON.stringify(newData))
  }

  // what is the highest type of die we're queueing up to roll?
  let hasSomethingQueued = false;
  Object.keys(currentDice).forEach((dieType) => {
    if (currentDice[dieType] > 0 && dieType !== 'plus') hasSomethingQueued = true
  });

  return (
    <div className="DiceBookmarks">

      { allBookmarkData.map((bookmarkData, i) => {
        return (
          <Bookmark
            bookmarkData={bookmarkData}
            setCurrentDice={setCurrentDice}
            setSummaryMode={setSummaryMode}
            setPercentileMode={setPercentileMode}
            handleDelete={() => deleteBookmark(i)}
            key={`bookmark-${i}-${allBookmarkData.length}`}
          />
        )
      })}

      { allBookmarkData.length < 8 &&
        <button
          className='Bookmark new'
          onClick={addNewBookmark}
          disabled={!hasSomethingQueued}
        >
          <span className='hover-string'>
            { hasSomethingQueued ?
              <>
                <div>Save</div>
                <div>{getToRollStringWithPrefix(currentDice, summaryMode, percentileMode)}</div>
              </>
            :
              'Save dice'
            }
          </span>
          <span className='tucked-string'>
            +
          </span>
        </button>
      }
    </div>
  );
}

const Bookmark = ({
  bookmarkData,
  setCurrentDice,
  setSummaryMode,
  setPercentileMode,
  handleDelete,
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
      className="Bookmark"
      onClick={(e) => handleClick(e, true)}
      onContextMenu={(e) => handleClick(e, false)}
    >
      {getToRollStringWithPrefix(
        bookmarkData,
        bookmarkData.summaryMode,
        bookmarkData.percentileMode
      )}
    </button>
  );
}



export default DiceBookmarks;
