import { useState, useRef, useEffect, useCallback } from 'react';
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
  const getEventPosition = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    // For SVG, we need to use the viewBox or the canvasSize state
    // since canvas.width doesn't work the same as HTML canvas
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [canvasSize.width, canvasSize.height]);

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

  const handleStart = useCallback((e) => {
    e.preventDefault();
    const pos = getEventPosition(e);
    const letter = getLetterAtPosition(pos);
    
    if (letter) {
      setIsConnecting(true);
      selectLetter(letter);
      setMousePos(pos);
    }
  }, [getEventPosition, getLetterAtPosition, selectLetter]);

  const handleMove = useCallback((e) => {
    if (!isConnecting) return;

    // Prevent default for touch events to avoid scrolling
    if (e.type.startsWith('touch')) {
      e.preventDefault();
    }

    const pos = getEventPosition(e);
    setMousePos(pos);

    const letter = getLetterAtPosition(pos);
    if (letter && !gameState.selectedLetters.includes(letter)) {
      selectLetter(letter);
    }
  }, [isConnecting, getEventPosition, getLetterAtPosition, selectLetter, gameState.selectedLetters]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    setIsConnecting(false);
    
    if (gameState.selectedLetters.length > 0) {
      // Submit the word if it's valid length
      if (gameState.currentWord.length >= 3) {
        // Word will be submitted by parent component
      } else {
        clearSelection();
      }
    }
  }, [gameState.selectedLetters.length, gameState.currentWord.length, clearSelection]);

  // Generate SVG path for connection line
  const generatePath = () => {
    if (gameState.selectedLetters.length === 0) return '';

    const points = gameState.selectedLetters.map(letter => {
      const pos = letterPositions[letter];
      return pos ? `${pos.x},${pos.y}` : '';
    }).filter(Boolean);

    if (isConnecting && points.length > 0) {
      points.push(`${mousePos.x},${mousePos.y}`);
    }

    return points.join(' ');
  };

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
      <div className="relative bg-glass/20 backdrop-blur-sm rounded-2xl border border-glass-border p-4">
        <svg
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-auto select-none touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Connection line */}
          <AnimatePresence>
            {gameState.selectedLetters.length > 0 && (
              <>
                <motion.polyline
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  points={generatePath()}
                  fill="none"
                  stroke="url(#connectionGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neonGlow)"
                  className="drop-shadow-[0_0_20px_rgba(168,85,247,0.9)]"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Touch position indicator */}
                {isConnecting && (
                  <motion.circle
                    cx={mousePos.x}
                    cy={mousePos.y}
                    r="8"
                    fill="url(#connectionGradient)"
                    filter="url(#neonGlow)"
                    className="drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                    style={{ pointerEvents: 'none' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </>
            )}
          </AnimatePresence>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="selectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
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