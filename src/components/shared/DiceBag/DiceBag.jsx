import React, { useState, useEffect } from 'react';
import DiceBookmarks from './DiceBookmarks';
import DieButton from './DieButton';
import SummaryModeSwitcher from './SummaryModeSwitcher';
import PercentileOption from './PercentileOption';
import { deepCopy, getRandomInt } from '../../../utils.js';
import {
  blankDice,
  diceDataIntoToRollData,
  getRollDescription,
  sortedDice,
  parseDieType,
  processRollData,
} from './DiceBagData.js';
import './DiceBag.scss';

const DiceBag = ({addNewDicebagPartyRoll}) => {
  const [firstDieRolled, setFirstDieRolled] = useState('');     // for the rolled icon up top
  const [previousDiceData, setPreviousDiceData] = useState({}); // for re-rolling the last set

  const [diceData, setDiceData] = useState({...blankDice});     // dice-to-roll
  const [rollData, setRollData] = useState([]);                 // roll results

  const [summaryMode, setSummaryMode] = useState('total');      // 'total' / 'low' / 'high'
  const [percentileMode, setPercentileMode] = useState(false);
  const [defaultVariableDieType, setDefaultVariableDieType] = useState('x')

  const percentileAvailable = (diceData['10'] === 2);

  const clearCurrentDiceData = () => {
    let clearedData = {...blankDice};
    delete clearedData['x'] // remove the default x
    clearedData[defaultVariableDieType] = 0; // 'x' : 0, for use by the variable die types
    setDiceData(clearedData);
  }

  const clearCurrentRoll = () => {
    setFirstDieRolled('')
    setRollData([])
    setPreviousDiceData({})
  }

  const updateDiceDataCount = (dieType, newCount) => {
    let newData = {...diceData}
    newData[dieType] = newCount
    setDiceData(newData)
  }

  const updateDiceDataType = (dieType, newType) => {
    if (dieType !== newType) {
      let newData = {...diceData}

      let oldCount = diceData[dieType]   // preserve the old type's count
      if (newType === 'x') oldCount = 0
      newData[newType] = oldCount

      delete newData[dieType]             // remove the old type
      setDiceData(newData)                // update the dice data with the new type
      setDefaultVariableDieType(newType)  // cache our dX so they don't have to re-enter it each roll

    }
  }

  const handleRoll = () => {
    let results = [];

    let rollDice = deepCopy(diceData);

    // hijack d10s in percentile mode
    if (percentileAvailable && percentileMode) {
      rollDice['10'] = 0;
      rollDice['100'] = 1;
    }

    let rolledAtLeastOneDie = false;

    sortedDice(rollDice).forEach(dieType => {
      const rollCount = Math.abs(rollDice[dieType])
      const rollSign = Math.sign(rollDice[dieType])

      for (let rollID = 0; rollID < rollCount; rollID++) {
        const dieTypeNumber = parseDieType(dieType);

        // roll em!
        if (dieType !== 'plus' && dieType.length > 0) {
          const result = getRandomInt(dieTypeNumber);
          const dieIcon = dieType.startsWith('x') ? 'dx' : `d${dieTypeNumber}`;

          results.push({dieType: dieIcon, result: result, sign: rollSign})

          if (!rolledAtLeastOneDie) {
            rolledAtLeastOneDie = true;
            setFirstDieRolled(dieIcon);
          }
        }
      }
    });

    if (rollDice['plus'] !== 0) {
      results.push( {dieType: 'plus', result: parseInt(rollDice['plus']), sign: 1} )
    }

    // store the results that we rolled
    setRollData(results)
    // store the dice that **were** rolled, in case we want to reroll
    setPreviousDiceData({...diceData})
    // reset current to-roll dice
    clearCurrentDiceData()
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
  sortedDice(diceData).forEach(dieType => {
    if (rollDieType === '' && diceData[dieType] > 0) {
      if (dieType.startsWith('x')) {
        rollDieType = 'x'
      } else if (dieType !== 'plus') {
        rollDieType = dieType
      }
    }
  });

  // summarize what we're going to roll
  const toRollString = getRollDescription(diceDataIntoToRollData(diceData), summaryMode)

  // summarize the results
  const resultTotal = processRollData(rollData, summaryMode)
  const resultSummary = getRollDescription(rollData, summaryMode)

  // have we queued up something complicated?
  const isComplexRoll = toRollString.length > 14

  return (
    <div className="bookmarks-and-bag">

      <DiceBookmarks
        currentDice={(rollDieType.length > 0) ? diceData : previousDiceData}
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
                  onClick={clearCurrentDiceData}
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
                    <PercentileOption
                      percentileMode={percentileMode}
                      setPercentileMode={setPercentileMode}
                    />
                  :
                    <div className={`to-roll-summary ${isComplexRoll ? 'complex' : ''}`}>
                      {!isComplexRoll &&
                        <span className='verb'>{'Roll '}</span>
                      }
                      {toRollString}
                    </div>
                  }
                </div>
              </div>

            : firstDieRolled ?
              <div className='post-roll'>
                <button
                  className='reset'
                  aria-label='Clear current roll.'
                  onClick={clearCurrentRoll}
                  key='reset'
                >
                  <div className='asset x' />
                </button>

                <button className='result-total' onClick={() => setDiceData(previousDiceData)} key='reroll'>
                  <div className={`asset ${firstDieRolled}`} />
                  {resultTotal}
                </button>

                { (resultSummary.length > 3) &&
                  <div className='result-summary'> {resultSummary} </div>
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
                  setDieCount={(newCount) => updateDiceDataCount(dieType, newCount)}
                  setDieType={(newType) => updateDiceDataType(dieType, newType)}
                  key={`diebutton-${i}`}
                />
              )
            })}
          </div>

          <SummaryModeSwitcher
            summaryMode={summaryMode}
            setSummaryMode={setSummaryMode}
          />
        </div>
      </div>
    </div>
  );
}

export default DiceBag;
