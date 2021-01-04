import React, { useState, useEffect } from 'react';
import {RadioGroup, Radio} from 'react-radio-group';
import DiceBookmarks from './DiceBookmarks';
import { deepCopy, getRandomInt } from '../utils.js';
import {
  blankDice,
  getToRollString,
  getResultsSummary,
  sortedDice,
} from './DiceBagData.js';
import './DiceBag.scss';


const DiceBag = ({addNewDicebagPartyRoll}) => {
  const [lastDieRolled, setLastDieRolled] = useState('');   // for the rolled icon up top
  const [previousDiceData, setPreviousDiceData] = useState({}); // for re-rolling the last set

  const [diceData, setDiceData] = useState({...blankDice}); // dice-to-roll
  const [rollData, setRollData] = useState([]);             // roll results

  const [summaryMode, setSummaryMode] = useState('total');  // 'total' / 'low' / 'high'
  const [percentileMode, setPercentileMode] = useState(false);

  const percentileAvailable = (diceData['10'] === 2);

  const updateDiceData = (dieType, dieCount) => {
    let newData = {...diceData}
    newData[dieType] = dieCount
    setDiceData(newData);
  }

  const handleRoll = () => {
    let results = [];

    let rollDice = deepCopy(diceData);

    // hijack d10s in percentile mode
    if (percentileAvailable && percentileMode) {
      rollDice['10'] = 0;
      rollDice['100'] = 1;
    }

    sortedDice(rollDice).forEach((dieType, i) => {
      for (let rollID = 0; rollID < rollDice[dieType]; rollID++) {
        if (dieType !== 'plus') {
          const result = getRandomInt(parseInt(dieType));
          const dieIcon = `d${dieType}`;
          results.push( {dieType: dieIcon, result: result} )
          setLastDieRolled(dieIcon);
        }
      }
    });

    if (rollDice['plus'] !== 0) {
      results.push( {dieType: 'plus', result: parseInt(rollDice['plus'])} )
    }

    // store the results that we rolled
    setRollData(results)
    // store the dice that **were** rolled, in case we want to reroll
    setPreviousDiceData({...diceData})
    // reset current to-roll dice
    setDiceData({...blankDice});
  }

  // add it to the party roll panel
  useEffect(() => {
    addNewDicebagPartyRoll(rollData, summaryMode, true);
  }, [rollData]); // eslint-disable-line react-hooks/exhaustive-deps

  // update it on the party roll panel — IF we're not busy queueing up a new roll
  useEffect(() => {
    if (rollDieType.length === 0) {
      addNewDicebagPartyRoll(rollData, summaryMode, false);
    }
  }, [summaryMode]); // eslint-disable-line react-hooks/exhaustive-deps


  // what is the highest type of die we're queueing up to roll?
  let rollDieType = '';
  Object.keys(diceData).forEach((dieType) => {
    if (diceData[dieType] > 0 && dieType !== 'plus') { rollDieType = dieType;}
  });

  // summarize what we're going to roll
  const toRollString = getToRollString(diceData, summaryMode, percentileMode)

  // summarize the results
  const result = getResultsSummary(rollData, summaryMode)

  // have we queued up something complicated?
  const isComplexRoll = toRollString.length > 14

  return (
    <div className="bookmarks-and-bag">

      <DiceBookmarks
        currentDice={diceData}
        summaryMode={summaryMode}
        percentileMode={percentileMode}
        setCurrentDice={setDiceData}
        setSummaryMode={setSummaryMode}
        setPercentileMode={setPercentileMode}
      />

      <div className="DiceBag">

        <div className='bag-container'>
          <div className='rolling-surface'>

            { (rollDieType.length > 0) ?
              <div className='pre-roll'>
                <button
                  className='reset'
                  aria-label='Clear queued dice.'
                  onClick={() => setDiceData({...blankDice})}
                  key='reset'
                >
                  <div className='asset x' />
                </button>
                <button
                  className='roll'
                  onClick={handleRoll}
                  aria-labelledby='roll-action'
                >
                  <div className={`asset d${rollDieType}`} />
                </button>
                <div className='action' id='roll-action'>
                  {percentileAvailable ?
                    <div className='percentile-option'>
                      Roll d100?
                      <input
                        type="checkbox"
                        checked={percentileMode}
                        onChange={() => setPercentileMode(!percentileMode)}
                      />
                    </div>
                  :
                    <div className={`to-roll-summary ${isComplexRoll ? 'complex' : ''}`}>
                      {!isComplexRoll &&
                        <span className='verb'>
                          {summaryMode === 'high' ?
                            'Max of '
                          : summaryMode === 'low' ?
                            'Min of '
                          :
                            'Roll '
                          }
                        </span>
                      }
                      {toRollString}
                    </div>
                  }
                </div>
              </div>
            : lastDieRolled ?
              <div className='post-roll'>
                <button className='result-total' onClick={() => setDiceData(previousDiceData)} key='reroll'>
                  <div className={`asset ${lastDieRolled}`} />
                  {result.total}
                </button>
                { result.summary.length > 3 &&
                  <div className='result-summary'> {result.summary} </div>
                }
              </div>
            :
              <div className='starting-roll'>
                <div className={`asset d6`} />
              </div>
            }
          </div>

          <div className='die-button-container'>
            { sortedDice(diceData).map((dieType, i) => {

              return (
                <DieButton
                  dieType={dieType}
                  dieCount={diceData[dieType]}
                  setDieCount={(newCount) => updateDiceData(dieType, newCount)}
                  key={`diebutton-${i}`}
                />
              )
            })}
          </div>

          <RadioGroup
            name='summary-mode'
            className='summary-mode'
            selectedValue={summaryMode}
            onChange={(value) => { setSummaryMode(value) }}
          >
            <label className={`mode-container ${summaryMode === 'total' ? 'selected' : ''}`} key='mode-total'>
              <Radio value='total' id='mode-total' />
              Total
            </label>

            <label className={`mode-container ${summaryMode === 'high' ? 'selected' : ''}`} key='mode-high'>
              <Radio value='high' id='mode-high' />
              High
            </label>

            <label className={`mode-container ${summaryMode === 'low' ? 'selected' : ''}`} key='mode-low'>
              <Radio value='low' id='mode-low' />
              Low
            </label>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}


const DieButton = ({
  dieType,
  dieCount,
  setDieCount
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

  return (
    <button className={`DieButton ${dieClass}`}
      onClick={(e) => handleClick(e, true)}
      onContextMenu={(e) => handleClick(e, false)}
      onKeyDown={e => {
        if (dieType !== 'plus') {
          if (parseInt(e.key)) setDieCount(parseInt(e.key))
          if (e.key === 'Backspace' || e.key === 'Delete') setDieCount(0)
        }
      }}
    >
      {(dieType === 'plus') ?
        <input
          type="number"
          value={dieCount}
          onChange={e => setDieCount( Math.max(Math.min(e.target.value, 99), -99) )}
          onClick={e => e.stopPropagation()}
          onFocus={e => e.target.select()}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        />
      : (dieCount > 0) &&
        <div className='roll-count'>{dieCount}</div>
      }
      <div className={`asset ${dieIcon}`} />
      {(dieType !== 'plus' && dieCount === 0) &&
        <div className='die-type-label'>
          <span className='dee'>d</span>
          <span className='type'>{dieType}</span>
        </div>
      }
    </button>
  )
}

export default DiceBag;
