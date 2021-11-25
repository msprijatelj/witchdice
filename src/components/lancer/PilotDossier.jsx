import React, { useState } from 'react';
import { findSkillData, findFrameData } from './data.js';

import './PilotDossier.scss';


const PilotDossier = ({
  activePilot
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="PilotDossier">
      <div className="dossier-container">

        <div className="watermark-container asset-lancer ssc">


          <div className="diamond">
            <img className='portrait' src={activePilot.cloud_portrait} />

            <div className="ll-tab">
              <div className="license-level">{activePilot.level}</div>
              <div className="label">License Level</div>
            </div>

            <div className="gene-tab">
              <div className="label">Geneline</div>
              <div className="gene">LC</div>
            </div>
          </div>

          <div className="name-and-callsign">

            <div className="callsign">{activePilot.callsign}</div>
            <div className="name">{activePilot.name}</div>
            <div className="background">
              {activePilot.background ? activePilot.background.toLowerCase() : 'Unknown Origin'}
            </div>

          </div>

          <div className="licenses-and-skills">

            <div className="skill-container">
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
        </div>
      </div>
    </div>
  )
}

export default PilotDossier;
