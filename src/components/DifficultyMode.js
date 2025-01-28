import React, { useState } from 'react';
import SnakeGame from './SnakeGame';
import '../styles/DifficultyMode.css';

const DifficultyMode = () => {
  const [difficulty, setDifficulty] = useState('beginner');
  const [gameKey, setGameKey] = useState(0);

  const difficultySettings = {
    beginner: {
      speed: 200,
      speedIncrease: 5,
      minSpeed: 100,
      label: '初級'
    },
    intermediate: {
      speed: 150,
      speedIncrease: 8,
      minSpeed: 80,
      label: '中級'
    },
    advanced: {
      speed: 100,
      speedIncrease: 10,
      minSpeed: 60,
      label: '上級'
    }
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1);
  };

  return (
    <div className="difficulty-mode">
      <div className="difficulty-tabs">
        <button
          className={`difficulty-tab ${difficulty === 'beginner' ? 'active' : ''}`}
          onClick={() => handleDifficultyChange('beginner')}
        >
          初級
        </button>
        <button
          className={`difficulty-tab ${difficulty === 'intermediate' ? 'active' : ''}`}
          onClick={() => handleDifficultyChange('intermediate')}
        >
          中級
        </button>
        <button
          className={`difficulty-tab ${difficulty === 'advanced' ? 'active' : ''}`}
          onClick={() => handleDifficultyChange('advanced')}
        >
          上級
        </button>
      </div>
      <SnakeGame 
        key={gameKey}
        mode="difficulty"
        difficulty={difficulty}
        settings={difficultySettings[difficulty]}
      />
    </div>
  );
};

export default DifficultyMode; 