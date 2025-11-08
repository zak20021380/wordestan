import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';

const GameCanvas = () => {
  const { currentLevel, gameState, selectLetter, deselectLetter, clearSelection } = useGame();
  const canvasRef = useRef(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [letterPositions, setLetterPositions] = useState({});
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  // Calculate letter positions in a circle
  useEffect(() => {
    if (!currentLevel?.letters) return;

    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const radius = Math.min(canvasSize.width, canvasSize.height) * 0.35;

    const positions = {};
    // Convert letters string to array
    const letters = currentLevel.letters.split('');
    const angleStep = (2 * Math.PI) / letters.length;

    letters.forEach((letter, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      positions[letter] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    setLetterPositions(positions);
  }, [currentLevel?.letters, canvasSize]);

  // Handle mouse/touch events
  const getEventPosition = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX =
      'touches' in event && event.touches?.length
        ? event.touches[0].clientX
        : event.clientX;
    const clientY =
      'touches' in event && event.touches?.length
        ? event.touches[0].clientY
        : event.clientY;

    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [canvasSize.height, canvasSize.width]);

  const getLetterAtPosition = useCallback((pos) => {
    const threshold = 30; // Distance threshold
    
    for (const [letter, position] of Object.entries(letterPositions)) {
      const distance = Math.sqrt(
        Math.pow(pos.x - position.x, 2) + Math.pow(pos.y - position.y, 2)
      );
      
      if (distance < threshold) {
        return letter;
      }
    }
    return null;
  }, [letterPositions]);

  const handleStart = useCallback((event) => {
    event.preventDefault();
    const pos = getEventPosition(event);
    const letter = getLetterAtPosition(pos);

    if (letter) {
      const svg = canvasRef.current;
      if (svg && 'pointerId' in event) {
        try {
          svg.setPointerCapture(event.pointerId);
        } catch (err) {
          // Safari can throw if capture is unavailable; ignore silently
        }
      }
      setIsConnecting(true);
      selectLetter(letter);
      setMousePos(pos);
    }
  }, [getEventPosition, getLetterAtPosition, selectLetter]);

  const handleMove = useCallback((event) => {
    if (!isConnecting) return;
    event.preventDefault();

    const pos = getEventPosition(event);
    setMousePos(pos);

    const letter = getLetterAtPosition(pos);
    if (letter && !gameState.selectedLetters.includes(letter)) {
      selectLetter(letter);
    }
  }, [isConnecting, getEventPosition, getLetterAtPosition, selectLetter, gameState.selectedLetters]);

  const handleEnd = useCallback((event) => {
    event.preventDefault();
    const svg = canvasRef.current;
    if (svg && 'pointerId' in event) {
      try {
        svg.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Ignore release errors when pointer wasn't captured
      }
    }
    setIsConnecting(false);

    if (gameState.selectedLetters.length > 0) {
      if (gameState.currentWord.length < 3) {
        clearSelection();
      }
    }
  }, [gameState.selectedLetters.length, gameState.currentWord.length, clearSelection]);

  const handleCancel = useCallback((event) => {
    if (!isConnecting) return;
    handleEnd(event);
  }, [handleEnd, isConnecting]);

  // Generate SVG path for connection line
  const connectionPoints = useMemo(() => {
    const points = gameState.selectedLetters
      .map(letter => letterPositions[letter])
      .filter(Boolean);

    if (isConnecting && points.length > 0) {
      return [...points, mousePos];
    }

    return points;
  }, [gameState.selectedLetters, letterPositions, isConnecting, mousePos]);

  const generatePath = useCallback(() => {
    if (connectionPoints.length === 0) return '';

    const [first, ...rest] = connectionPoints;
    let path = `M ${first.x} ${first.y}`;

    rest.forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });

    return path;
  }, [connectionPoints]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, 500);
        setCanvasSize({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentLevel) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/60">Loading level...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Game Canvas */}
      <div className="relative rounded-3xl border border-purple-500/30 bg-[radial-gradient(circle_at_top,#2e1065_0%,#1a1033_55%,#130a23_100%)] shadow-[0_30px_60px_rgba(17,12,28,0.45)] p-5">
        <svg
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
          className="w-full h-auto select-none touch-none"
          onPointerDown={handleStart}
          onPointerMove={handleMove}
          onPointerUp={handleEnd}
          onPointerLeave={handleCancel}
          onPointerCancel={handleCancel}
          style={{ touchAction: 'none' }}
        >
          {/* Connection line */}
          <AnimatePresence>
            {isConnecting && connectionPoints.length > 0 && (
              <motion.path
                key="connection-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                d={generatePath()}
                fill="none"
                stroke="url(#connectionGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
                className="pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="connectionGradient" x1="0" y1="0" x2={canvasSize.width} y2={canvasSize.height} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="selectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feColorMatrix
                in="coloredBlur"
                type="matrix"
                values="0 0 0 0 0.66  0 0 0 0 0.33  0 0 0 0 0.93  0 0 0 0.6 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Letters */}
          {currentLevel.letters.split('').map((letter, index) => {
            const position = letterPositions[letter];
            if (!position) return null;

            const isSelected = gameState.selectedLetters.includes(letter);
            const isHint = gameState.showHint && gameState.hintLetter === letter;

            return (
              <g key={`${letter}-${index}`}>
                {/* Letter circle */}
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r="24"
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'fill-purple-500 stroke-pink-400'
                      : isHint
                      ? 'fill-pink-500 stroke-pink-400 animate-pulse-glow'
                      : 'fill-glass-hover stroke-glass-border hover:fill-glass'
                  }`}
                  strokeWidth="2"
                  style={
                    isSelected || isHint
                      ? {
                          filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.8))',
                        }
                      : {}
                  }
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />

                {/* Letter text */}
                <text
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`pointer-events-none font-bold text-lg ${
                    isSelected || isHint ? 'fill-white' : 'fill-white/80'
                  }`}
                >
                  {letter}
                </text>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r="32"
                    fill="none"
                    stroke="url(#selectionGradient)"
                    strokeWidth="3"
                    className="drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Current word display */}
        <AnimatePresence>
          {gameState.currentWord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <span className="font-mono text-lg tracking-wider bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent font-bold">
                {gameState.currentWord}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={clearSelection}
          disabled={gameState.selectedLetters.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;