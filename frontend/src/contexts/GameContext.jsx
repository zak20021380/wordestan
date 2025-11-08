import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { gameService } from '../services/gameService';
import { useAuth } from './AuthContext';

const GameContext = createContext({});

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [gameState, setGameState] = useState({
    selectedNodes: [],
    selectionPreview: '',
    currentWord: '',
    completedWords: [],
    isConnecting: false,
    showHint: false,
    hintLetter: null,
  });

  // Fetch next level
  const { data: levelData, isLoading: levelLoading } = useQuery(
    ['nextLevel', user?.id],
    () => gameService.getNextLevel(),
    {
      enabled: isAuthenticated,
      onSuccess: (data) => {
        // Handle null when no more levels are available
        if (data === null) {
          setCurrentLevel(null);
          setGameState(prev => ({
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: [],
          }));
        } else {
          setCurrentLevel(data.level);
          setGameState(prev => ({
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: Array.from(
              new Set((data.completedWords ?? []).filter(Boolean))
            ),
          }));
        }
      },
    }
  );

  // Complete word mutation
  const completeWordMutation = useMutation(
    ({ word, levelId }) => gameService.completeWord(word, levelId),
    {
      onSuccess: (data) => {
        // Update user coins in auth context
        if (user) {
          user.coins = data.data.totalCoins;
          user.totalScore = data.data.totalScore;
        }

        // Clear current selection
        setGameState(prev => ({
          ...prev,
          selectedNodes: [],
          selectionPreview: '',
          currentWord: '',
        }));

        // Invalidate queries to refetch and get updated completed words
        queryClient.invalidateQueries(['nextLevel', user?.id]);
        queryClient.invalidateQueries(['leaderboard']);
      },
    }
  );

  // Get hint mutation
  const getHintMutation = useMutation(
    ({ levelId }) => gameService.getHint(levelId),
    {
      onSuccess: (data) => {
        // Update user coins
        if (user) {
          user.coins = data.data.remainingCoins;
        }
        
        setGameState(prev => ({
          ...prev,
          showHint: true,
          hintLetter: data.data.hintLetter,
        }));

        // Hide hint after 3 seconds
        setTimeout(() => {
          setGameState(prev => ({ ...prev, showHint: false, hintLetter: null }));
        }, 3000);
      },
    }
  );

  // Auto solve mutation
  const autoSolveMutation = useMutation(
    ({ levelId }) => gameService.autoSolve(levelId),
    {
      onSuccess: (data) => {
        // Update user coins
        if (user) {
          user.coins = data.data.remainingCoins;
          user.totalScore = data.data.totalScore;
        }

        // Clear current selection
        setGameState(prev => ({
          ...prev,
          selectedNodes: [],
          selectionPreview: '',
          currentWord: '',
        }));

        // Invalidate queries to refetch and get updated completed words
        queryClient.invalidateQueries(['nextLevel', user?.id]);
        queryClient.invalidateQueries(['leaderboard']);
      },
    }
  );

  // Letter selection handlers
  const selectLetter = (node) => {
    setGameState(prev => {
      if (prev.selectedNodes.some(selected => selected.id === node.id)) {
        return prev;
      }

      const updatedNodes = [...prev.selectedNodes, node];
      const preview = updatedNodes.map(item => item.letter).join('');

      return {
        ...prev,
        selectedNodes: updatedNodes,
        selectionPreview: preview,
      };
    });
  };

  const deselectLetter = () => {
    setGameState(prev => {
      if (prev.selectedNodes.length === 0) {
        return prev;
      }

      const updatedNodes = prev.selectedNodes.slice(0, -1);
      const preview = updatedNodes.map(item => item.letter).join('');

      return {
        ...prev,
        selectedNodes: updatedNodes,
        selectionPreview: preview,
      };
    });
  };

  const clearSelection = () => {
    setGameState(prev => ({
      ...prev,
      selectedNodes: [],
      selectionPreview: '',
      currentWord: '',
    }));
  };

  const setCurrentWord = (word) => {
    setGameState(prev => ({
      ...prev,
      currentWord: word,
    }));
  };

  const finalizeWordSelection = (word) => {
    setGameState(prev => ({
      ...prev,
      selectedNodes: [],
      selectionPreview: '',
      currentWord: word,
    }));
  };

  const submitWord = async () => {
    if (!gameState.currentWord || !currentLevel) return null;

    try {
      const result = await completeWordMutation.mutateAsync({
        word: gameState.currentWord,
        levelId: currentLevel._id,
      });

      return result;
    } catch (error) {
      clearSelection();
      throw error;
    }
  };

  const getHint = async () => {
    if (!currentLevel) return;
    
    await getHintMutation.mutateAsync({
      levelId: currentLevel._id,
    });
  };

  const autoSolve = async () => {
    if (!currentLevel) return;
    
    await autoSolveMutation.mutateAsync({
      levelId: currentLevel._id,
    });
  };

  const value = {
    currentLevel,
    gameState,
    levelLoading,
    isCompletingWord: completeWordMutation.isLoading,
    isGettingHint: getHintMutation.isLoading,
    isAutoSolving: autoSolveMutation.isLoading,

    // Actions
    selectLetter,
    deselectLetter,
    clearSelection,
    setCurrentWord,
    finalizeWordSelection,
    submitWord,
    getHint,
    autoSolve,

    // Mutations
    completeWordMutation,
    getHintMutation,
    autoSolveMutation,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};