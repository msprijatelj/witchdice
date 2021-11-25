import React, { useState } from 'react';
import { findSkillData, findFrameData, findTalentData, findCoreBonusData } from './data.js';
import './PilotDossier.scss';


function truncateString(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}

function hashCode(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

function pilotIDToGeneStatus(pilotID) {
  const idHash = hashCode(pilotID)
  const modded = Math.abs(idHash) % 101;    //  0 - 100
  const squared = modded * modded;          // 0 — 10,000 parabolic
  const reduced = squared * .0006;          // 0 - 6
  const listIndex = Math.floor(reduced+.1); // reduced max is actually only 5.99999 for some reason

  const redList = ['LC','NT','VU','EN','CR','EW','EX']
  return redList[listIndex];
}

const PilotDossier = ({
  activePilot
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const MAX_CALLSIGN = 22;

  const slicedCallsign = activePilot.callsign.slice(0, MAX_CALLSIGN)

  const geneStatus = pilotIDToGeneStatus(activePilot.id);

  return (
    <div className="PilotDossier">
      <div className="dossier-container">

        <div className="watermark-container asset-lancer ssc-watermark">


          <div className="diamond">
            <img className='portrait asset-lancer ssc-watermark' src={activePilot.cloud_portrait} />

            <div className="ll-tab">
              <div className="license-level">{activePilot.level}</div>
              <div className="label">License Level</div>
            </div>

            <div className="gene-tab">
              <div className="label">Geneline</div>
              <div className={`gene ${geneStatus}`}>{geneStatus}</div>
            </div>
          </div>

          <div className="name-and-callsign">

            <div className={`callsign ${activePilot.callsign.length > MAX_CALLSIGN ? 'sliced' : ''}`}>
                {slicedCallsign}
            </div>
            <div className="name">{activePilot.name}</div>
            <div className="background">
              {activePilot.background ? activePilot.background.toLowerCase() : 'Unknown Origin'}
            </div>

          </div>

          <div className="lists-of-things">

            <div className="core-bonus-container">
              <div className="label">Core Bonuses</div>
              <div className="list">
                { activePilot.core_bonuses.map((coreBonusID, i) => {
                  const coreBonusData = findCoreBonusData(coreBonusID)
                  return (
                    <span className="entry" key={coreBonusID}>
                      <span className="bracket">[</span>
                      <span className="name">{coreBonusData.name.toLowerCase()}</span>
                      <span className="bracket">]</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="licenses-container">
              <div className="label">Licenses</div>
              <div className="list">
                { activePilot.licenses.map((licenseData, i) => {
                  const frameData = findFrameData(licenseData.id)
                  return (
                    <span className="entry" key={licenseData.id}>
                      <span className="bracket">[</span>
                      <span className="name">{frameData.name.toLowerCase()}</span>
                      <span className="number">{licenseData.rank}</span>
                      <span className="bracket">]</span>
                    </span>
                  )
                })}
              </div>
            </div>

          </div>

          <div className="lists-of-things secondary">

          <div className="talents-container">
            <div className="label">Talents</div>
            <div className="list">
              { activePilot.talents.map((talentRankAndID, i) => {
                const talentData = findTalentData(talentRankAndID.id)
                return (
                  <span className="entry" key={talentRankAndID.id}>
                    <span className="bracket">[</span>
                    <span className="name">{talentData.name.toLowerCase()}</span>
                    <span className="number">{talentRankAndID.rank}</span>
                    <span className="bracket">]</span>
                  </span>
                )
              })}
            </div>
          </div>

            <div className="skills-container">
              <div className="label">Skills</div>
              <div className="list">
                { activePilot.skills.map((skill, i) => {
                  const skillData = findSkillData(skill.id);
                  return (
                    <span className="entry" key={skill.id}>
                      <span className="bracket">[</span>
                      <span className="name">{skillData.name.toLowerCase()}</span>
                      <span className="number">+{skill.rank * 2}</span>
                      <span className="bracket">]</span>
                    </span>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PilotDossier;
