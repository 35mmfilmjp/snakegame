import React from 'react';
import './App.css';
import GameModes from './components/GameModes';
import './firebase';  // Firebaseの初期化をインポート

function App() {
  return (
    <div className="App">
      <GameModes />
    </div>
  );
}

export default App;
