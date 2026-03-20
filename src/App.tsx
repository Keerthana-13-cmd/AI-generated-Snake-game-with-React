import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEED = 70;

const TRACKS = [
  {
    id: 1,
    title: "NEON_CITY_LIGHTS.WAV",
    artist: "AI_SYNTHWAVE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "CYBERNETIC_PULSE.WAV",
    artist: "AI_CYBERPUNK",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "DIGITAL_HORIZON.WAV",
    artist: "AI_CHILLWAVE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// --- Helper Functions ---
const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  
  // Use a ref for direction to avoid dependency issues in the game loop
  const directionRef = useRef(direction);
  
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGamePaused(false);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default scrolling for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === ' ' && !gameOver) {
      setIsGamePaused(prev => !prev);
      return;
    }

    if (isGamePaused || gameOver) return;

    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
        break;
    }
  }, [isGamePaused, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver || isGamePaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameLoop);
  }, [gameOver, isGamePaused, food, highScore]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-[#0ff] font-digital flex flex-col items-center justify-center p-4 uppercase screen-tear">
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Header & Stats */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="border-2 border-[#0ff] bg-black p-4 shadow-[4px_4px_0px_#f0f]">
            <h1 data-text="SNAKE.EXE" className="text-5xl font-bold text-[#0ff] glitch-text mb-2 tracking-widest">
              SNAKE.EXE
            </h1>
            <p className="text-[#f0f] text-sm mb-6 leading-tight">INITIALIZING KINETIC ROUTINE...<br/>AWAITING_INPUT.</p>
            
            <div className="space-y-3">
              <div className="border border-[#0ff] p-3 flex items-center justify-between bg-black">
                <span className="text-[#f0f] tracking-widest">DATA_YIELD</span>
                <span className="text-4xl text-[#0ff]">{score.toString().padStart(4, '0')}</span>
              </div>
              
              <div className="border border-[#f0f] p-3 flex items-center justify-between bg-black">
                <span className="text-[#0ff] tracking-widest">MAX_CAPACITY</span>
                <span className="text-4xl text-[#f0f]">{highScore.toString().padStart(4, '0')}</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-[#0ff] space-y-1 border-t border-dashed border-[#0ff] pt-4">
              <p>INPUT_VECTORS: [W,A,S,D] | [ARROWS]</p>
              <p>INTERRUPT: [SPACE]</p>
            </div>
          </div>
        </div>

        {/* Center Column: Game Board */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="border-4 border-[#f0f] bg-black p-2 shadow-[-6px_6px_0px_#0ff] relative">
            <div 
              className="bg-black border border-[#0ff] relative overflow-hidden"
              style={{
                width: `${GRID_SIZE * 20}px`,
                height: `${GRID_SIZE * 20}px`
              }}
            >
              {/* Food */}
              <div
                className="absolute bg-[#f0f]"
                style={{
                  width: '20px',
                  height: '20px',
                  left: `${food.x * 20}px`,
                  top: `${food.y * 20}px`,
                }}
              />

              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute ${isHead ? 'bg-[#fff]' : 'bg-[#0ff]'}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      border: '1px solid #000'
                    }}
                  />
                );
              })}

              {/* Overlays */}
              {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-2 border-[#f0f]">
                  <h2 data-text="FATAL_EXCEPTION" className="text-5xl font-bold text-[#f0f] glitch-text mb-2">FATAL_EXCEPTION</h2>
                  <p className="text-[#0ff] mb-8 text-2xl">ERR_CODE: {score}</p>
                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-black border-2 border-[#0ff] text-[#0ff] text-xl hover:bg-[#0ff] hover:text-black transition-none cursor-pointer"
                  >
                    [ INITIATE_REBOOT ]
                  </button>
                </div>
              )}

              {isGamePaused && !gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                  <h2 data-text="THREAD_SUSPENDED" className="text-4xl font-bold text-[#0ff] glitch-text">THREAD_SUSPENDED</h2>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Music Player */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="border-2 border-[#f0f] bg-black p-4 shadow-[4px_-4px_0px_#0ff]">
            <h2 data-text="AUDIO_SUBSYSTEM" className="text-3xl font-bold text-[#f0f] glitch-text mb-6">
              AUDIO_SUBSYSTEM
            </h2>

            {/* Track Info */}
            <div className="mb-6 border border-[#0ff] p-3 bg-black">
              <h3 className="text-2xl text-[#0ff] truncate">{currentTrack.title}</h3>
              <p className="text-[#f0f] text-sm">SRC: {currentTrack.artist}</p>
              {isPlaying && <div className="mt-3 h-2 w-full bg-[#f0f] animate-pulse"></div>}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6 border-b border-dashed border-[#f0f] pb-6">
              <button 
                onClick={prevTrack}
                className="p-2 border border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-black transition-none cursor-pointer"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="p-3 border-2 border-[#f0f] text-[#f0f] hover:bg-[#f0f] hover:text-black transition-none cursor-pointer"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-2 border border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-black transition-none cursor-pointer"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMuted(!isMuted)} className="text-[#f0f] hover:text-[#0ff] transition-none cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full"
              />
            </div>

            {/* Hidden Audio Element */}
            <audio 
              ref={audioRef}
              src={currentTrack.url}
              onEnded={handleTrackEnded}
              preload="auto"
            />
          </div>
          
          {/* Playlist Preview */}
          <div className="border-2 border-[#0ff] bg-black p-4">
            <h4 className="text-[#f0f] mb-3 border-b border-[#0ff] pb-2 text-xl">AVAILABLE_FREQUENCIES</h4>
            <div className="space-y-2">
              {TRACKS.map((track, idx) => (
                <div 
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-2 cursor-pointer flex justify-between items-center border ${
                    idx === currentTrackIndex 
                      ? 'bg-[#0ff] text-black border-[#0ff]' 
                      : 'bg-black text-[#0ff] border-transparent hover:border-[#f0f] hover:text-[#f0f]'
                  }`}
                >
                  <span className="truncate text-lg">{track.title}</span>
                  {idx === currentTrackIndex && isPlaying && (
                    <span className="animate-pulse font-bold">_PLAYING</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
