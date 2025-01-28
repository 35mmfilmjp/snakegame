import React, { useState } from 'react';
import NormalMode from './NormalMode';
import DifficultyMode from './DifficultyMode';
import TimeMode from './TimeMode';
import ItemMode from './ItemMode';
import '../styles/GameModes.css';

const GameModes = () => {
  const [activeMode, setActiveMode] = useState('normal');

  const renderMode = () => {
    switch (activeMode) {
      case 'normal':
        return <NormalMode />;
      case 'difficulty':
        return <DifficultyMode />;
      case 'time':
        return <TimeMode />;
      case 'item':
        return <ItemMode />;
      default:
        return <NormalMode />;
    }
  };

  return (
    <div className="game-modes">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${activeMode === 'normal' ? 'active' : ''}`}
          onClick={() => setActiveMode('normal')}
        >
          通常モード
        </button>
        <button
          className={`mode-tab ${activeMode === 'difficulty' ? 'active' : ''}`}
          onClick={() => setActiveMode('difficulty')}
        >
          難易度選択
        </button>
        <button
          className={`mode-tab ${activeMode === 'time' ? 'active' : ''}`}
          onClick={() => setActiveMode('time')}
        >
          制限時間
        </button>
        <button
          className={`mode-tab ${activeMode === 'item' ? 'active' : ''}`}
          onClick={() => setActiveMode('item')}
        >
          アイテム選択
        </button>
      </div>
      {renderMode()}
    </div>
  );
};

export default GameModes; 