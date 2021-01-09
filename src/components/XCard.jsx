import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import FocusTrap from 'focus-trap-react'
import './XCard.scss';

let restoreFocusOnElement = null;


const XCard = ({
  handleXCardRaise,
}) => {

	return (
    <div className='XCard'>
      <button
        className='touch'
        onClick={() => {
          restoreFocusOnElement = document.activeElement
          handleXCardRaise()
        }}
      >
        Raise
      </button>

      <a
        href='http://tinyurl.com/x-card-rpg'
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        ?
      </a>

      <div className='x-card'>
        x-card
      </div>
    </div>
	);
}

const XCardModal = ({
  raisedBy,
  handleClose,
}) => {


  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'unset'
      if (restoreFocusOnElement) {
        restoreFocusOnElement.focus()
        restoreFocusOnElement = null
      }
    }
  }, []);

	return ReactDOM.createPortal(
    <FocusTrap>
      <aside
        className='XCardModal'
        aria-modal='true'
        aria-labelledby='whodunnit'
        role='alertdialogue'
        tabIndex='-1'
        onClick={handleClose}
        onKeyDown={e => { if (e.keyCode === 27) handleClose() }}
      >
        <div className='popup' onClick={e => e.stopPropagation()}>
          <div className='whodunnit' id='whodunnit'>X card raised by {raisedBy}</div>

          <button aria-label="Close" onClick={handleClose} autoFocus>
            OK
          </button>
        </div>
      </aside>
    </FocusTrap>,
    document.body
  );
}



export { XCard, XCardModal };
