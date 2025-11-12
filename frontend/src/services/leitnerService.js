import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Log detailed error information for debugging
    if (error.response) {
      console.error('Leitner API Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        message: error.response.data?.message || error.message,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Leitner API Network Error:', {
        url: error.config?.url,
        message: 'No response received from server'
      });
    } else {
      console.error('Leitner API Error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Add a word to Leitner box
 */
export const addWordToLeitner = async (wordId, levelId = null, notes = '') => {
  try {
    if (!wordId) {
      throw new Error('شناسه کلمه الزامی است');
    }

    console.log('Adding word to Leitner:', { wordId, levelId, notes });

    const response = await api.post('/leitner/add', {
      wordId,
      levelId,
      notes,
    });

    console.log('Word added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to add word to Leitner:', error);
    throw error;
  }
};

/**
 * Batch add words to Leitner box
 */
export const batchAddWordsToLeitner = async (wordIds, levelId = null) => {
  const response = await api.post('/leitner/batch-add', {
    wordIds,
    levelId,
  });
  return response.data;
};

/**
 * Get all words in Leitner box
 */
export const getLeitnerWords = async (params = {}) => {
  const response = await api.get('/leitner/words', { params });
  return response.data;
};

/**
 * Get words due for review
 */
export const getDueWords = async (limit = 20) => {
  const response = await api.get('/leitner/review', {
    params: { limit },
  });
  return response.data;
};

/**
 * Review a word (correct/incorrect/skipped)
 */
export const reviewWord = async (cardId, result) => {
  const response = await api.post(`/leitner/review/${cardId}`, {
    result, // 'correct', 'incorrect', 'skipped'
  });
  return response.data;
};

/**
 * Get Leitner box statistics
 */
export const getLeitnerStats = async () => {
  const response = await api.get('/leitner/stats');
  return response.data;
};

/**
 * Get words by box number
 */
export const getWordsByBox = async (boxNumber) => {
  const response = await api.get(`/leitner/box/${boxNumber}`);
  return response.data;
};

/**
 * Update card notes
 */
export const updateCardNotes = async (cardId, notes) => {
  const response = await api.put(`/leitner/${cardId}/notes`, { notes });
  return response.data;
};

/**
 * Archive a card
 */
export const archiveCard = async (cardId) => {
  const response = await api.post(`/leitner/${cardId}/archive`);
  return response.data;
};

/**
 * Unarchive a card
 */
export const unarchiveCard = async (cardId) => {
  const response = await api.post(`/leitner/${cardId}/unarchive`);
  return response.data;
};

/**
 * Reset a card to box 1
 */
export const resetCard = async (cardId) => {
  const response = await api.post(`/leitner/${cardId}/reset`);
  return response.data;
};

/**
 * Delete a card from Leitner box
 */
export const deleteCard = async (cardId) => {
  const response = await api.delete(`/leitner/${cardId}`);
  return response.data;
};

export default {
  addWordToLeitner,
  batchAddWordsToLeitner,
  getLeitnerWords,
  getDueWords,
  reviewWord,
  getLeitnerStats,
  getWordsByBox,
  updateCardNotes,
  archiveCard,
  unarchiveCard,
  resetCard,
  deleteCard,
};
