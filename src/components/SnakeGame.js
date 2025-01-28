import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import '../styles/SnakeGame.css';

// コレクション名を取得する関数を追加
const getCollectionName = (mode, difficulty) => {
  if (mode === 'difficulty') {
    switch (difficulty) {
      case 'beginner':
        return 'scoreslow';
      case 'intermediate':
        return 'scoresmiddle';
      case 'advanced':
        return 'scoreshigh';
      default:
        return 'scores';
    }
  }
  return 'scores';
};

const SnakeGame = ({ mode = 'normal', difficulty = 'normal', settings = null, onGameOver = null }) => {
  const gridSize = 20;
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);
  
  // initialSnakeをuseMemoで最適化
  const initialSnake = React.useMemo(() => [
    [centerX, centerY],     // 頭
    [centerX - 1, centerY], // 胴体
    [centerX - 2, centerY]  // 尾
  ], [centerX, centerY]);

  const [snake, setSnake] = useState(initialSnake);
  const [food, setFood] = useState([0, 0]);
  const [specialFood, setSpecialFood] = useState(null); // { type: 'yellow' | 'blue' | 'black', position: [x, y] }
  const [direction, setDirection] = useState('RIGHT');
  const directionRef = useRef(direction);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [topScores, setTopScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(mode === 'time' ? settings.initialTime : null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // checkCollision関数を先に定義
  const checkCollision = useCallback((head) => {
    return (
      head[0] < 0 ||
      head[0] >= gridSize ||
      head[1] < 0 ||
      head[1] >= gridSize ||
      snake.some(segment => segment[0] === head[0] && segment[1] === head[1])
    );
  }, [snake, gridSize]);

  const calculateSpeed = useCallback((score) => {
    let speed = 200 - Math.floor(score / 5) * 10;
    
    return Math.max(60, speed);
  }, []);

  // generateFoodを先に定義
  const generateFood = useCallback(() => {
    const getRandomPosition = () => [
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize),
    ];

    const isPositionOccupied = (pos) => 
      snake.some(segment => segment[0] === pos[0] && segment[1] === pos[1]);

    let newFood;
    do {
      newFood = getRandomPosition();
    } while (isPositionOccupied(newFood));

    setFood(newFood);
  }, [snake, gridSize]);

  // 特殊エサの生成関数
  const generateSpecialFood = useCallback(() => {
    if (mode !== 'time' || !isPlaying) return;

    // 既に特殊エサがある場合は生成しない
    if (specialFood) return;

    const types = ['yellow', 'blue', 'black'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const getRandomPosition = () => [
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize),
    ];

    // 既存のヘビ、通常エサとの衝突チェック
    const isPositionOccupied = (pos) => 
      snake.some(segment => segment[0] === pos[0] && segment[1] === pos[1]) ||
      (food[0] === pos[0] && food[1] === pos[1]);

    let newFood;
    do {
      newFood = getRandomPosition();
    } while (isPositionOccupied(newFood));

    setSpecialFood({ type: randomType, position: newFood });

    // 5秒後に特殊エサを消す
    const timer = setTimeout(() => {
      setSpecialFood(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [snake, food, gridSize, mode, isPlaying, specialFood]);

  // 特殊エサの効果を処理
  const handleSpecialFoodEffect = useCallback((type) => {
    switch (type) {
      case 'yellow':
        setScore(s => s + 3); // 黄色は3点追加
        break;
      case 'blue':
        setTimeLeft(prev => prev + 5); // 青は時間5秒追加
        break;
      case 'black':
        setSnake(prev => { // 黒はヘビの長さを5増やす
          const tail = prev[prev.length - 1];
          const newSegments = Array(5).fill(tail);
          return [...prev, ...newSegments];
        });
        break;
      default:
        break;
    }
  }, []);

  // resetGameの定義
  const resetGame = useCallback(() => {
    setSnake(initialSnake);
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
    setFood([0, 0]); // エサを初期位置に戻す（次回開始時に新しい位置が生成される）
  }, [initialSnake]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const moveSnake = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setSnake(prevSnake => {
      const head = [...prevSnake[0]];
      
      switch (directionRef.current) {
        case 'UP':
          head[1] -= 1;
          break;
        case 'DOWN':
          head[1] += 1;
          break;
        case 'LEFT':
          head[0] -= 1;
          break;
        case 'RIGHT':
          head[0] += 1;
          break;
        default:
          break;
      }

      // 壁やヘビ自身との衝突判定
      if (checkCollision(head)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      const newSnake = [head];

      // 通常のエサとの衝突判定
      if (head[0] === food[0] && head[1] === food[1]) {
        setScore(s => s + 1);
        generateFood();
        newSnake.push(...prevSnake);
      } else {
        newSnake.push(...prevSnake.slice(0, -1));
      }

      // 特殊エサとの衝突判定を追加
      if (specialFood && head[0] === specialFood.position[0] && head[1] === specialFood.position[1]) {
        handleSpecialFoodEffect(specialFood.type);
        setSpecialFood(null);
      }

      return newSnake;
    });
  }, [isPlaying, gameOver, food, generateFood, gridSize, specialFood, handleSpecialFoodEffect, checkCollision]);

  // エサの生成を管理するuseEffect
  useEffect(() => {
    // エサが初期位置[0,0]の時のみ生成
    if (food[0] === 0 && food[1] === 0) {
      generateFood();
    }
  }, [generateFood, food]);

  // 特殊エサの生成タイマー
  useEffect(() => {
    if (mode !== 'time' || !isPlaying) {
      setSpecialFood(null); // プレイ中でない場合は特殊エサを消す
      return;
    }

    // 10秒ごとに特殊エサを生成
    const interval = setInterval(() => {
      generateSpecialFood();
    }, 10000); // 10秒間隔

    return () => {
      clearInterval(interval);
    };
  }, [mode, isPlaying, generateSpecialFood]);

  // キーボード入力の処理を修正
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp' || 
          e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || 
          e.key === 'ArrowRight' || 
          e.code === 'Space') {
        e.preventDefault();
      }

      if (!isPlaying) return;

      // スペースキーでの一時停止/再開
      if (e.code === 'Space') {
        if (gameOver) {
          resetGame();
        } else {
          setIsPlaying(prev => !prev);
        }
        return;
      }

      // 方向キーの処理
      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    const gameInterval = setInterval(moveSnake, calculateSpeed(score));

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [moveSnake, gameOver, isPlaying, score, calculateSpeed, resetGame]);

  const startGame = () => {
    if (!isPlaying && !gameOver) {
      if (food[0] === 0 && food[1] === 0) {
        generateFood(); // エサが初期位置の場合のみ生成
      }
      setIsPlaying(true);
    }
  };

  // スコアを保存する関数を修正
  const updateScores = useCallback(async (newScore) => {
    try {
      let collectionName;
      
      // モードに応じたコレクション名を設定
      if (mode === 'time') {
        if (timeLeft > 0) return; // 時間が残っている場合は記録しない
        collectionName = 'scorestime';
      } else if (mode === 'difficulty') {
        collectionName = getCollectionName(mode, difficulty);
      } else {
        collectionName = 'scores'; // 通常モード
      }

      const scoresRef = collection(db, collectionName);
      const scoreData = {
        score: newScore,
        date: new Date(),
      };

      await addDoc(scoresRef, scoreData);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }, [mode, difficulty, timeLeft]);

  // Firestoreのリアルタイムリスナーを設定
  useEffect(() => {
    let collectionName;
    
    // コレクション名の設定
    if (mode === 'time') {
      collectionName = 'scorestime';
    } else if (mode === 'difficulty') {
      collectionName = getCollectionName(mode, difficulty);
    } else {
      collectionName = 'scores';
    }

    const scoresRef = collection(db, collectionName);
    
    // クエリの設定
    const queryConstraints = [
      orderBy('score', 'desc'),
      limit(10)
    ];

    const q = query(scoresRef, ...queryConstraints);

    // リアルタイムリスナーを設定
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate().toLocaleString(),
      }));

      // 同点のスコアに同じ順位を付ける
      let currentRank = 1;
      let prevScore = null;

      const rankedScores = scores.map((score) => {
        if (prevScore !== null && score.score !== prevScore) {
          currentRank = scores.filter(s => s.score > score.score).length + 1;
        }
        prevScore = score.score;
        return {
          ...score,
          rank: currentRank
        };
      });

      const topScores = rankedScores.filter(score => score.rank <= 5);
      setTopScores(topScores);
    });

    return () => unsubscribe();
  }, [mode, difficulty]);

  // 制限時間の処理
  useEffect(() => {
    if (mode !== 'time' || !isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsTimeUp(true);
          setIsPlaying(false);
          // スコアの記録は別のuseEffectで行う
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, mode]);

  // 時間切れ時のスコア記録用のuseEffect
  useEffect(() => {
    if (mode === 'time' && timeLeft === 0 && !isPlaying && !gameOver) {
      updateScores(score);
    }
  }, [mode, timeLeft, isPlaying, gameOver, score, updateScores]);

  // ゲームオーバー時の処理を修正
  useEffect(() => {
    if (!gameOver) return;

    if (mode === 'time' && timeLeft > 0) {
      // 制限時間モードでは即座に再開
      setTimeLeft(prev => Math.max(0, prev - settings.penaltyTime));
      setGameOver(false);
      setSnake(initialSnake);
      setDirection('RIGHT');
      setIsPlaying(true);
      generateFood(); // 新しい餌を生成
    }
  }, [gameOver, mode, timeLeft, settings, initialSnake, generateFood]);

  // ゲームオーバー時のスコア更新を追加
  useEffect(() => {
    if (gameOver && score > 0 && mode !== 'time') {
      updateScores(score);
    }
  }, [gameOver, score, mode, updateScores]);

  // ハイスコアの更新処理を追加
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="snake-game">
      <h2>
        {mode === 'time' ? 'スネークゲーム - 制限時間モード' : 
         mode === 'difficulty' ? `スネークゲーム - ${settings.label}` : 
         'スネークゲーム'}
      </h2>
      {mode === 'time' && (
        <div className="time-left">残り時間: {timeLeft}秒</div>
      )}
      <div className="score-container">
        <div className="score">現在のスコア: {score}</div>
        <div className="high-score">ハイスコア: {highScore}</div>
      </div>
      <div className="game-board">
        {Array.from({ length: gridSize }, (_, row) => (
          <div key={row} className="row">
            {Array.from({ length: gridSize }, (_, col) => {
              const isSnake = snake.some(
                segment => segment[0] === col && segment[1] === row
              );
              const isFood = food[0] === col && food[1] === row;
              const isSpecialFood = specialFood && 
                specialFood.position[0] === col && 
                specialFood.position[1] === row;
              
              let cellClass = 'cell';
              if (isSnake) cellClass += ' snake';
              if (isFood) cellClass += ' food';
              if (isSpecialFood) cellClass += ` special-food-${specialFood.type}`;
              
              return (
                <div
                  key={`${row}-${col}`}
                  className={cellClass}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="controls">
        {!isPlaying && !gameOver && !isTimeUp && (
          <button onClick={startGame} className="start-button">
            スタート
          </button>
        )}
        {isPlaying && (
          <button onClick={() => setIsPlaying(false)} className="pause-button">
            一時停止
          </button>
        )}
        {(gameOver && mode !== 'time') && (
          <button onClick={resetGame} className="retry-button">
            もう一度プレイ
          </button>
        )}
      </div>
      <div className="ranking">
        <h3>歴代トップ5</h3>
        <div className="ranking-list">
          {topScores.map((score) => (
            <div key={score.id} className="ranking-item">
              <span className="rank">{score.rank}位</span>
              <span className="score-value">{score.score}点</span>
              <span className="score-date">{score.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame; 