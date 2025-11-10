import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { gameService } from '../services/gameService';
import { useAuth } from './AuthContext';

const parseLevelOrder = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const createPowerUpUsageState = () => ({
  shuffle: false,
  autoSolve: false,
});

const createCompletionStatus = () => ({
  completed: false,
  source: null,
  stars: null,
  powerUpsUsed: createPowerUpUsageState(),
});

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
  const [levelCompletionStatus, setLevelCompletionStatus] = useState(() => createCompletionStatus());
  const [powerUpUsage, setPowerUpUsage] = useState(() => createPowerUpUsageState());
  const powerUpUsageRef = useRef(powerUpUsage);
  const [autoSolveResult, setAutoSolveResult] = useState(null);
  const [isLevelSwitching, setIsLevelSwitching] = useState(false);
  const previousLevelOrderRef = useRef(null);
  const pendingTransitionRef = useRef(null);
  const hasInitializedLevelRef = useRef(false);

  useEffect(() => {
    powerUpUsageRef.current = powerUpUsage;
  }, [powerUpUsage]);

  const resetPowerUpUsage = useCallback(() => {
    const next = createPowerUpUsageState();
    powerUpUsageRef.current = next;
    setPowerUpUsage(next);
  }, []);

  const mergePowerUpUsage = useCallback((usage = {}) => {
    setPowerUpUsage(prev => {
      const next = {
        shuffle: prev.shuffle || Boolean(usage.shuffle),
        autoSolve: prev.autoSolve || Boolean(usage.autoSolve),
      };

      if (next.shuffle === prev.shuffle && next.autoSolve === prev.autoSolve) {
        return prev;
      }

      powerUpUsageRef.current = next;
      return next;
    });
  }, []);

  const markPowerUpUsed = useCallback((type) => {
    if (!type) {
      return;
    }

    setPowerUpUsage(prev => {
      if (prev[type]) {
        return prev;
      }

      const next = { ...prev, [type]: true };
      powerUpUsageRef.current = next;
      return next;
    });
  }, []);

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
    setLevelCompletionStatus(createCompletionStatus());
    setPowerUpUsage(createPowerUpUsageState());
    setIsLevelSwitching(false);
  }, [isAuthenticated, authLoading]);

  const handleLevelSync = useCallback((response, options = {}) => {
    const payload = response?.data ?? null;
    const meta = options.metaOverride ?? response?.meta ?? null;
    const nextLevel = payload?.level ?? null;
    const currentLevelId = currentLevel?._id ? String(currentLevel._id) : null;
    const nextLevelId = nextLevel?._id ? String(nextLevel._id) : null;

    if (payload?.powerUpsUsed) {
      mergePowerUpUsage(payload.powerUpsUsed);
    }

    setLevelMeta(meta);

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
      setLevelTransition(null);
      setLevelCompletionStatus(createCompletionStatus());
      resetPowerUpUsage();
      return { level: null, meta, payload };
    }

    if (nextLevelId && nextLevelId !== currentLevelId) {
      resetPowerUpUsage();
    }

    const newOrder = parseLevelOrder(nextLevel.order);
    const previousOrder = parseLevelOrder(previousLevelOrderRef.current);
    const hasPrevious = hasInitializedLevelRef.current && previousOrder !== null;

    const transitionOverride = options.transitionOverride ?? null;
    const pending = transitionOverride ?? pendingTransitionRef.current ?? null;

    let transitionType = pending?.type ?? null;
    let difference = null;

    if (hasPrevious && newOrder !== null && previousOrder !== null) {
      difference = newOrder - previousOrder;
    }

    if (hasPrevious && newOrder !== null && newOrder !== previousOrder) {
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

    const completedWords = Array.from(
      new Set((payload?.completedWords ?? []).filter(Boolean).map(word => word.toUpperCase()))
    );
    const totalWords = Array.isArray(nextLevel?.words)
      ? nextLevel.words.filter(Boolean).length
      : 0;
    const completedAll = totalWords > 0 && completedWords.length >= totalWords;

    setCurrentLevel(nextLevel);
    setGameState(prev => ({
      ...prev,
      selectedNodes: [],
      selectionPreview: '',
      currentWord: '',
      completedWords,
    }));

    if (completedAll) {
      const completionSource = options.completionSource ?? 'synced';
      setLevelCompletionStatus({
        completed: true,
        source: completionSource,
        stars: null,
        powerUpsUsed: { ...powerUpUsageRef.current },
      });
    } else {
      setLevelCompletionStatus(createCompletionStatus());
    }

    return { level: nextLevel, meta, payload, completedWords };
  }, [
    currentLevel?._id,
    mergePowerUpUsage,
    resetPowerUpUsage,
    setGameState,
    setLevelCompletionStatus,
    setLevelMeta,
    setLevelTransition,
  ]);

  // Fetch next level
  const { isLoading: levelLoading, refetch: refetchNextLevel } = useQuery(
    ['nextLevel', user?.id],
    () => gameService.getNextLevel(),
    {
      enabled: !authLoading && isAuthenticated,
      onSuccess: (response) => {
        handleLevelSync(response);
      },
    }
  );

  const loadLevelById = useCallback(async (levelId, options = {}) => {
    if (!levelId) {
      return null;
    }

    if (!isAuthenticated) {
      throw new Error('برای انتخاب مرحله باید وارد حساب کاربری شوی');
    }

    setIsLevelSwitching(true);
    try {
      const response = await gameService.getNextLevel(levelId);
      queryClient.setQueryData(['nextLevel', user?.id], response);

      const targetOrder = parseLevelOrder(response?.data?.level?.order);
      const transitionOverride = {
        type: options.transitionType || 'changed',
        from: parseLevelOrder(currentLevel?.order),
        to: targetOrder,
        target: targetOrder,
        requestedLevelId: levelId,
      };

      handleLevelSync(response, {
        transitionOverride,
        metaOverride: {
          ...(response?.meta ?? {}),
          status: response?.meta?.status ?? 'level_selected',
          requestedLevelId: levelId,
        },
        completionSource: options.completionSource || 'manual',
      });

      return response;
    } finally {
      setIsLevelSwitching(false);
    }
  }, [currentLevel?.order, handleLevelSync, isAuthenticated, queryClient, user?.id]);

  const { isLoading: guestLevelLoading, refetch: refetchGuestLevel } = useQuery(
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

        const guestOrder = parseLevelOrder(level.order);

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
        setLevelCompletionStatus(createCompletionStatus());
        resetPowerUpUsage();
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

  const combinedLevelLoading = authLoading
    || isLevelSwitching
    || (isAuthenticated ? levelLoading : guestLevelLoading);

  // Complete word mutation
  const completeWordMutation = useMutation(
    ({ word, levelId, powerUpsUsed }) => gameService.completeWord(word, levelId, powerUpsUsed),
    {
      onSuccess: (data) => {
        const completedWord = data?.data?.word?.text;
        const serverUsage = data?.data?.powerUpsUsed ?? {};
        const mergedUsage = {
          shuffle: powerUpUsageRef.current.shuffle || Boolean(serverUsage.shuffle),
          autoSolve: powerUpUsageRef.current.autoSolve || Boolean(serverUsage.autoSolve),
        };

        mergePowerUpUsage(serverUsage);

        // Update user coins in auth context
        if (user) {
          updateUser({
            coins: data.data.totalCoins,
            totalScore: data.data.totalScore,
          });
        }

        // Clear current selection and update completed words locally
        let updatedCompletedWords = [];
        setGameState(prev => {
          const normalizedWord = completedWord?.toUpperCase();
          const updated = normalizedWord
            ? Array.from(new Set([...prev.completedWords, normalizedWord]))
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

        const totalWords = Array.isArray(currentLevel?.words)
          ? currentLevel.words.filter(Boolean).length
          : 0;
        const completedAll = totalWords > 0 && updatedCompletedWords.length >= totalWords;

        if (completedAll) {
          pendingTransitionRef.current = {
            type: 'completed',
            from: parseLevelOrder(currentLevel?.order),
          };
        }

        const starsEarned = data?.data?.starsEarned ?? null;

        setLevelCompletionStatus(
          completedAll
            ? {
              completed: true,
              source: 'manual',
              stars: starsEarned,
              powerUpsUsed: mergedUsage,
            }
            : createCompletionStatus()
        );

        // Invalidate queries to refetch and get updated completed words
        queryClient.invalidateQueries(['nextLevel', user?.id]);
        queryClient.invalidateQueries(['leaderboard']);
        queryClient.invalidateQueries(['gameLevels']);
      },
    }
  );

  // Auto solve mutation
  const autoSolveMutation = useMutation(
    ({ levelId, powerUpsUsed }) => gameService.autoSolve(levelId, powerUpsUsed),
    {
      onSuccess: (data) => {
        const serverUsage = data?.data?.powerUpsUsed ?? {};
        const mergedUsage = {
          shuffle: powerUpUsageRef.current.shuffle || Boolean(serverUsage.shuffle),
          autoSolve: true,
        };

        mergePowerUpUsage({ ...serverUsage, autoSolve: true });

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

        const totalWords = Array.isArray(currentLevel?.words)
          ? currentLevel.words.filter(Boolean).length
          : 0;
        const completedAll = totalWords > 0 && updatedCompletedWords.length >= totalWords;

        if (completedAll) {
          pendingTransitionRef.current = {
            type: 'completed',
            from: parseLevelOrder(currentLevel?.order),
          };
        }

        setAutoSolveResult({
          word: data?.data?.solvedWord ?? null,
          coinsSpent: data?.data?.coinsSpent ?? null,
          remainingCoins: data?.data?.remainingCoins ?? null,
          levelCompleted: completedAll,
          levelBonus: data?.data?.levelBonus ?? 0,
          starsEarned: data?.data?.starsEarned ?? null,
          powerUpsUsed: mergedUsage,
        });

        const starsEarned = data?.data?.starsEarned ?? null;

        setLevelCompletionStatus(
          completedAll
            ? {
              completed: true,
              source: 'auto',
              stars: starsEarned,
              powerUpsUsed: mergedUsage,
            }
            : createCompletionStatus()
        );

        if (!completedAll) {
          // Invalidate queries to refetch and get updated completed words
          queryClient.invalidateQueries(['nextLevel', user?.id]);
        }
        queryClient.invalidateQueries(['leaderboard']);
        queryClient.invalidateQueries(['gameLevels']);
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
        powerUpsUsed: powerUpUsageRef.current,
      });

      if (result?.data?.levelCompleted) {
        pendingTransitionRef.current = {
          type: 'completed',
          from: parseLevelOrder(currentLevel?.order),
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
      powerUpsUsed: powerUpUsageRef.current,
    });
  };

  const clearLevelTransition = useCallback(() => {
    setLevelTransition(null);
  }, []);

  const clearAutoSolveResult = useCallback(() => {
    setAutoSolveResult(null);
    setLevelCompletionStatus(prev =>
      prev.source === 'auto' ? createCompletionStatus() : prev
    );
  }, []);

  const resetGameState = useCallback(() => {
    setGameState({
      selectedNodes: [],
      selectionPreview: '',
      currentWord: '',
      completedWords: [],
      isConnecting: false,
    });
    setLevelCompletionStatus(createCompletionStatus());
    resetPowerUpUsage();
  }, [resetPowerUpUsage]);

  const loadNextLevel = useCallback(async () => {
    resetGameState();

    if (isAuthenticated) {
      await refetchNextLevel({ cancelRefetch: false, throwOnError: true });
      return;
    }

    await refetchGuestLevel({ cancelRefetch: false, throwOnError: true });
  }, [isAuthenticated, refetchGuestLevel, refetchNextLevel, resetGameState]);

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
    loadLevelById,
    powerUpUsage,
    markPowerUpUsed,
    resetPowerUpUsage,

    // Mutations
    completeWordMutation,
    autoSolveMutation,

    // Level transitions
    levelTransition,
    clearLevelTransition,

    // Auto-solve feedback
    autoSolveResult,
    clearAutoSolveResult,
    levelCompletionStatus,
    loadNextLevel,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};