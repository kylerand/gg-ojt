import { createContext, useContext, useState, useEffect } from 'react';
import { getProgress, createProgress as createProgressAPI } from '../services/api';

const TrainingContext = createContext();

// Session storage keys
const SESSION_KEY = 'gg-training-session';
const POSITION_KEY = 'gg-training-position';

export function TrainingProvider({ children }) {
  const [trainee, setTrainee] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const savedPosition = localStorage.getItem(POSITION_KEY);
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session.traineeId) {
            // Reload progress from server to ensure it's current
            await loadProgress(session.traineeId);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      
      if (savedPosition) {
        try {
          setCurrentPosition(JSON.parse(savedPosition));
        } catch (err) {
          localStorage.removeItem(POSITION_KEY);
        }
      }
      
      setIsInitialized(true);
    };

    restoreSession();
  }, []);

  // Save session when trainee changes
  useEffect(() => {
    if (trainee) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        traineeId: trainee.id,
        traineeName: trainee.name,
        timestamp: Date.now(),
      }));
    }
  }, [trainee]);

  // Save position when it changes
  useEffect(() => {
    if (currentPosition) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(currentPosition));
    }
  }, [currentPosition]);

  // Track current training position
  const savePosition = (moduleId, stepId, stepIndex, totalSteps) => {
    const position = {
      moduleId,
      stepId,
      stepIndex,
      totalSteps,
      timestamp: Date.now(),
    };
    setCurrentPosition(position);
  };

  // Clear position (e.g., when completing a module)
  const clearPosition = () => {
    setCurrentPosition(null);
    localStorage.removeItem(POSITION_KEY);
  };

  // Load trainee progress
  const loadProgress = async (traineeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProgress(traineeId);
      setProgress(response.data);
      setTrainee({
        id: response.data.traineeId,
        name: response.data.traineeName,
      });
      return response.data; // Return the progress data
    } catch (err) {
      if (err.response?.status === 404) {
        setProgress(null);
        return null; // User not found
      } else {
        setError(err.message);
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new trainee progress
  const createProgress = async (traineeId, traineeName, cartType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createProgressAPI({ traineeId, traineeName, cartType });
      setProgress(response.data);
      setTrainee({ id: traineeId, name: traineeName });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update progress in state
  const updateProgress = (newProgress) => {
    setProgress(newProgress);
  };

  // Logout
  const logout = () => {
    setTrainee(null);
    setProgress(null);
    setCurrentPosition(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(POSITION_KEY);
  };

  const value = {
    trainee,
    progress,
    loading,
    error,
    isInitialized,
    currentPosition,
    loadProgress,
    createProgress,
    updateProgress,
    savePosition,
    clearPosition,
    logout,
  };

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within TrainingProvider');
  }
  return context;
}
