import React from 'react';
import {RadioGroup, Radio} from 'react-radio-group';
import { Link, useLocation } from "react-router-dom";
import './ModeChooser.scss';

const ModeChooser = () => {
  const location = useLocation().pathname;
  const rollModeClass = ['/simple','/5e','/craft'].includes(location) ? 'minimized' : 'full'

  return (
    <div className={`ModeChooser ${rollModeClass}`}>
      <div className={`roll-mode ${rollModeClass}`}>

        <Link to='/simple' className={location === '/simple' ? 'selected' : ''}>
          <div className='mode-title'>
            <h2>Simple</h2>
          </div>
          <p className='mode-desc simple'>
            Just a bag of dice & a table to share.
          </p>
        </Link>

        <Link to='/5e' className={location === '/5e' ? 'selected' : ''}>
          <div className='mode-title'>
            <h2>D&D 5e</h2>
          </div>
          <p className='mode-desc'>
            Attack roller for D&D 5e characters & monsters.
          </p>
        </Link>

        <Link to='/craft' className={location === '/craft' ? 'selected' : ''}>
          <div className='mode-title'>
            <h2>Witch+Craft</h2>
          </div>
          <p className='mode-desc'>
            Crafting and domestic magic system for 5e.
          </p>
        </Link>

      </div>
    </div>
  );
}

export default ModeChooser ;
