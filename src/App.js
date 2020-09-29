import React from 'react';
import './App.scss';
import Character from './components/Character.jsx';

function App() {
  return (
    <div className="App">
      <h1>🌺💀 ~ Roll To Hit ~ 💀🌺</h1>
      <div>(click to increase attack rolls, right-click to decrease)</div>

      <Character />

      <div className="footer">
        <p>Made by Olive Perry</p>
        <a href="https://twitter.com/wickglyph">@wickglyph</a>
        —
        <a href="https://wick.works/">www.wick.works</a>
      </div>
    </div>
  );
}

export default App;
