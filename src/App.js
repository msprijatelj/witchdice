import React from 'react';
import './App.scss';
import Main from './components/Main.jsx';
import { CURRENT_VERSION } from './data.js';

function App() {
  return (
    <div className="App">
      <h1>🌺💀 ~ Roll To Hit ~ 💀🌺</h1>
      <div className='beta-label'>
        beta test — v{CURRENT_VERSION}
      </div>

      <Main />

    </div>
  );
}

export default App;
