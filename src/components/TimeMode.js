import React, { useState } from 'react';
import SnakeGame from './SnakeGame';

const TimeMode = () => {
  // ゲームの状態をリセットするためのキー
  const [gameKey, setGameKey] = useState(0);

  const timeSettings = {
    initialTime: 90,
    penaltyTime: 10,
    label: '制限時間'
  };

  // ゲームオーバー時に自動的に再開する処理
  const handleGameOver = () => {
    setGameKey(prev => prev + 1);
  };

  return (
    <div className="time-mode">
      <SnakeGame 
        key={gameKey}
        mode="time"
        settings={timeSettings}
        onGameOver={handleGameOver}
      />
    </div>
  );
};

export default TimeMode; 