import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [levelMeta, setLevelMeta] = useState(null);
  const [gameState, setGameState] = useState({
    selectedNodes: [],
    selectionPreview: '',
    currentWord: '',
    completedWords: [],
    isConnecting: false,
  });
  const [levelTransition, setLevelTransition] = useState(null);
  const [autoSolveResult, setAutoSolveResult] = useState(null);
  const previousLevelOrderRef = useRef(null);
  const pendingTransitionRef = useRef(null);
  const hasInitializedLevelRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    setCurrentLevel(null);
    setLevelMeta(null);
    setGameState({
      selectedNodes: [],
      selectionPreview: '',
      currentWord: '',
      completedWords: [],
      isConnecting: false,
    });
    previousLevelOrderRef.current = null;
    pendingTransitionRef.current = null;
    hasInitializedLevelRef.current = false;
    setLevelTransition(null);
    setAutoSolveResult(null);
  }, [isAuthenticated, authLoading]);

  // Fetch next level
  const { isLoading: levelLoading } = useQuery(
    ['nextLevel', user?.id],
    () => gameService.getNextLevel(),
    {
      enabled: !authLoading && isAuthenticated,
      onSuccess: (response) => {
        const payload = response?.data ?? null;
        const meta = response?.meta ?? null;
        const nextLevel = payload?.level ?? null;

        setLevelMeta(meta);

        // Handle null when no more levels are available
        if (!nextLevel) {
          setCurrentLevel(null);
          setGameState(prev => ({
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: [],
          }));
          previousLevelOrderRef.current = null;
          pendingTransitionRef.current = null;
          hasInitializedLevelRef.current = false;
          return;
        }

        const parseOrder = (value) => {
          if (value === null || value === undefined) {
            return null;
          }
          const numeric = Number(value);
          return Number.isNaN(numeric) ? null : numeric;
        };

        const newOrder = parseOrder(nextLevel.order);
        const previousOrder = parseOrder(previousLevelOrderRef.current);
        const hasPrevious = hasInitializedLevelRef.current && previousOrder !== null;

        if (
          hasPrevious &&
          newOrder !== null &&
          newOrder !== previousOrder
        ) {
          const pending = pendingTransitionRef.current;
          let transitionType = pending?.type;
          const difference = newOrder - previousOrder;

          if (!transitionType) {
            if (difference > 1) {
              transitionType = 'skipped';
            } else if (difference === 1) {
              transitionType = 'advanced';
            } else if (difference < 0) {
              transitionType = 'revisit';
            } else {
              transitionType = 'advanced';
            }
          }

          setLevelTransition({
            type: transitionType,
            from: previousOrder,
            to: newOrder,
            difference,
            userProgress: payload?.userProgress ?? null,
            meta,
            cause: pending ?? null,
            timestamp: Date.now(),
          });
        }

        previousLevelOrderRef.current = newOrder;
        hasInitializedLevelRef.current = true;
        pendingTransitionRef.current = null;

        setCurrentLevel(nextLevel);
        setGameState(prev => ({
          ...prev,
          selectedNodes: [],
          selectionPreview: '',
          currentWord: '',
          completedWords: Array.from(
            new Set((payload.completedWords ?? []).filter(Boolean))
          ),
        }));
      },
    }
  );

  const { isLoading: guestLevelLoading } = useQuery(
    ['guestLevel'],
    () => gameService.getFirstLevel(),
    {
      enabled: !authLoading && !isAuthenticated,
      onSuccess: (response) => {
        const level = response?.data ?? null;

        if (!level) {
          setCurrentLevel(null);
          setLevelMeta({
            status: 'guest_level_unavailable',
            guest: true,
          });
          setGameState(prev => ({
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: [],
          }));
          previousLevelOrderRef.current = null;
          pendingTransitionRef.current = null;
          hasInitializedLevelRef.current = false;
          return;
        }

        const parseOrder = (value) => {
          if (value === null || value === undefined) {
            return null;
          }
          const numeric = Number(value);
          return Number.isNaN(numeric) ? null : numeric;
        };

        const guestOrder = parseOrder(level.order);

        setCurrentLevel(level);
        setLevelMeta({
          status: 'guest_level',
          guest: true,
          guestCompleted: false,
        });
        setGameState(prev => ({
          ...prev,
          selectedNodes: [],
          selectionPreview: '',
          currentWord: '',
          completedWords: [],
        }));
        previousLevelOrderRef.current = guestOrder;
        hasInitializedLevelRef.current = true;
        pendingTransitionRef.current = null;
      },
      onError: () => {
        setCurrentLevel(null);
        setLevelMeta({
          status: 'guest_level_error',
          guest: true,
        });
        previousLevelOrderRef.current = null;
        pendingTransitionRef.current = null;
        hasInitializedLevelRef.current = false;
      },
    }
  );

  const combinedLevelLoading = authLoading || (isAuthenticated ? levelLoading : guestLevelLoading);

  // Complete word mutation
  const completeWordMutation = useMutation(
    ({ word, levelId }) => gameService.completeWord(word, levelId),
    {
      onSuccess: (data) => {
        const completedWord = data?.data?.word?.text;

        // Update user coins in auth context
        if (user) {
          updateUser({
            coins: data.data.totalCoins,
            totalScore: data.data.totalScore,
          });
        }

        // Clear current selection and update completed words locally
        setGameState(prev => {
          const normalizedWord = completedWord?.toUpperCase();
          const updatedCompletedWords = normalizedWord
            ? Array.from(new Set([...prev.completedWords, normalizedWord]))
            : prev.completedWords;

          return {
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: updatedCompletedWords,
          };
        });

        // Invalidate queries to refetch and get updated completed words
        queryClient.invalidateQueries(['nextLevel', user?.id]);
        queryClient.invalidateQueries(['leaderboard']);
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
          updateUser({
            coins: data.data.remainingCoins,
            totalScore: data.data.totalScore,
          });
        }

        let updatedCompletedWords = [];

        // Clear current selection and update completed words locally
        setGameState(prev => {
          const solvedWord = data?.data?.solvedWord?.text?.toUpperCase();
          const updated = solvedWord
            ? Array.from(new Set([...prev.completedWords, solvedWord]))
            : prev.completedWords;

          updatedCompletedWords = updated;

          return {
            ...prev,
            selectedNodes: [],
            selectionPreview: '',
            currentWord: '',
            completedWords: updated,
          };
        });

        const totalWords = currentLevel?.words?.length ?? 0;
        const completedAll = totalWords > 0 && updatedCompletedWords.length >= totalWords;

        if (completedAll) {
          const parseOrder = (value) => {
            if (value === null || value === undefined) {
              return null;
            }
            const numeric = Number(value);
            return Number.isNaN(numeric) ? null : numeric;
          };

          pendingTransitionRef.current = {
            type: 'completed',
            from: parseOrder(currentLevel?.order),
          };
        }

        setAutoSolveResult({
          word: data?.data?.solvedWord ?? null,
          coinsSpent: data?.data?.coinsSpent ?? null,
          remainingCoins: data?.data?.remainingCoins ?? null,
          levelCompleted: completedAll,
        });

        if (!completedAll) {
          // Invalidate queries to refetch and get updated completed words
          queryClient.invalidateQueries(['nextLevel', user?.id]);
        }
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

  const submitWord = async (word = null) => {
    const wordToSubmit = word || gameState.currentWord;
    if (!wordToSubmit || !currentLevel) return null;

    const normalizedWord = wordToSubmit.toUpperCase();

    if (!isAuthenticated) {
      const availableWords = (currentLevel.words || []).map(item =>
        (typeof item === 'string' ? item : item?.text || '').toUpperCase()
      );

      if (!availableWords.includes(normalizedWord)) {
        clearSelection();
        throw new Error('این کلمه توی این مرحله نیست');
      }

      let meaning;
      if (Array.isArray(currentLevel.words)) {
        const match = currentLevel.words.find(item => {
          if (typeof item === 'string') {
            return item.toUpperCase() === normalizedWord;
          }
          return (item?.text || '').toUpperCase() === normalizedWord;
        });

        if (match && typeof match !== 'string') {
          meaning = match.meaning;
        }
      }

      let updatedCompletedWords = [];

      setGameState(prev => {
        const updated = Array.from(new Set([...prev.completedWords, normalizedWord]));
        updatedCompletedWords = updated;

        return {
          ...prev,
          selectedNodes: [],
          selectionPreview: '',
          currentWord: '',
          completedWords: updated,
        };
      });

      const totalWords = currentLevel.words?.length ?? 0;
      const completedAll = totalWords > 0 && updatedCompletedWords.length >= totalWords;

      setLevelMeta(prev => {
        const baseMeta = prev && prev.guest
          ? prev
          : { status: 'guest_level', guest: true };

        return {
          ...baseMeta,
          guestCompleted: completedAll,
        };
      });

      return {
        success: true,
        data: {
          word: { text: normalizedWord, meaning },
          levelCompleted: completedAll,
        },
        meta: { guest: true },
      };
    }

    try {
      const result = await completeWordMutation.mutateAsync({
        word: wordToSubmit,
        levelId: currentLevel._id,
      });

      if (result?.data?.levelCompleted) {
        const parseOrder = (value) => {
          if (value === null || value === undefined) {
            return null;
          }
          const numeric = Number(value);
          return Number.isNaN(numeric) ? null : numeric;
        };

        pendingTransitionRef.current = {
          type: 'completed',
          from: parseOrder(currentLevel?.order),
        };
      }

      return result;
    } catch (error) {
      clearSelection();
      throw error;
    }
  };

  const autoSolve = async () => {
    if (!currentLevel) return;

    if (!isAuthenticated) {
      throw new Error('برای استفاده از پاور آپ‌ها باید وارد حساب کاربری شوی');
    }

    return autoSolveMutation.mutateAsync({
      levelId: currentLevel._id,
    });
  };

  const clearLevelTransition = useCallback(() => {
    setLevelTransition(null);
  }, []);

  const clearAutoSolveResult = useCallback(() => {
    setAutoSolveResult(null);
  }, []);

  const confirmAutoSolveCompletion = useCallback(async () => {
    if (!user) {
      setAutoSolveResult(null);
      return;
    }

    await queryClient.invalidateQueries(['nextLevel', user.id]);
    setAutoSolveResult(null);
  }, [queryClient, user]);

  const value = {
    currentLevel,
    gameState,
    levelMeta,
    levelLoading: combinedLevelLoading,
    isCompletingWord: completeWordMutation.isLoading,
    isAutoSolving: autoSolveMutation.isLoading,
    isGuestMode: !isAuthenticated,

    // Actions
    selectLetter,
    deselectLetter,
    clearSelection,
    setCurrentWord,
    finalizeWordSelection,
    submitWord,
    autoSolve,

    // Mutations
    completeWordMutation,
    autoSolveMutation,

    // Level transitions
    levelTransition,
    clearLevelTransition,

    // Auto-solve feedback
    autoSolveResult,
    clearAutoSolveResult,
    confirmAutoSolveCompletion,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};