import React from 'react';
import { findFrameData } from '../../lancerData.js';
import './SquadMech.scss';

function renderMechPortrait(squadMech) {
	if (squadMech.portraitMech.startsWith('mf_')) {
		return <div className={`mech-portrait asset ${squadMech.portraitMech}`} />
	} else {
		// TODO: SANITIZE THIS INSTEAD OF PUTTING USER-DEFINED TEXT INTO SRC
		return <img className='mech-portrait' src={squadMech.portraitMech} alt={'mech portrait'} />
	}
}

function renderPilotPortrait(squadMech) {
	if (squadMech.portraitPilot) {
		// TODO: SANITIZE THIS INSTEAD OF PUTTING USER-DEFINED TEXT INTO SRC
		return <img className="pilot-portrait" src={squadMech.portraitPilot} alt={'pilot portrait'} />
	} else {
		// TODO: BETTER DEFAULT PILOT PORTRAIT
		// return <div className='pilot-portrait asset default_pilot' />
		return <div className='empty-portrait asset ssc-watermark' />
	}
}

// Gives all statuses internal non-breaking spaces && adds a space after each comma
function statusesWithNonbreakingSpaces(statusString) {
	return statusString.replace(/ /g, String.fromCharCode(160)).replace(/,/g, ', ')
}

const SquadMech = ({
	squadMech,
	onRemove,
}) => {
  return (
    <div className='SquadMech' >

			<div className='diamond-and-statuses'>
				<div className='summary-diamond'>
					<div className='portrait-container'>
						{ renderMechPortrait(squadMech) }
					</div>


					<SmallStatDiamond
						label='Heat'
						icon='reactor'
						iconCountCurrent={squadMech.stress}
						mainNumberCurrent={squadMech.heatCurrent}
						mainNumberMax={squadMech.heatMax}
						extraClass='heat'
					/>

					<SmallStatDiamond
						label='HP'
						icon='structure'
						iconCountCurrent={squadMech.structure}
					  mainNumberCurrent={squadMech.hpCurrent}
					  mainNumberMax={squadMech.hpMax}
						extraClass='hp'
					/>


					<div className='portrait-container'>
						{ renderPilotPortrait(squadMech) }
					</div>
				</div>


				<div className='statuses internal'>
					{statusesWithNonbreakingSpaces(squadMech.statusInternal)}
				</div>

				<div className='statuses external'>
					{statusesWithNonbreakingSpaces(squadMech.statusExternal)}
				</div>

				<button className='remove-mech asset x' onClick={onRemove} />
			</div>
    </div>
  );
}


const SmallStatDiamond = ({
  label = '',
	icon,	// "structure" || "reactor"
	iconCountCurrent, // iconCountMax is 4 : stress/structure
  mainNumberCurrent,
  mainNumberMax,
	extraClass,
}) => {

  return (
    <div className={`SmallStatDiamond ${extraClass}`}>
			<div className='stats-container'>
				<div className='label'>
					{label}
				</div>

	      <div className='numerical-count'>
	        {mainNumberCurrent}/{mainNumberMax}
	      </div>

				<div className='icon-container'>
					{[...Array(4)].map((undef, i) =>
						<div className={`asset ${icon} ${iconCountCurrent+i >= 4 ? '' : 'spent'}`} key={i} />
					)}
				</div>
			</div>
    </div>
  );
}

const AddSquadMechButton = ({
  squadMech,
	handleClick,
}) => {

  return (
		<button className='AddSquadMechButton' onClick={handleClick}>
			<div className='add-mech-container'>
				<div className='portrait-container'>
					{ renderMechPortrait(squadMech) }
				</div>

				<div className='name-container'>
					<div className='name'>{squadMech.name.toUpperCase()}</div>
				</div>

				<div className='icon-container'>
					<div className='asset plus' />
				</div>
			</div>
		</button>
  );
}


export { SquadMech, AddSquadMechButton };
