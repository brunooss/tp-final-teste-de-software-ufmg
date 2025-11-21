'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Decision } from '@/lib/types';

const HISTORY_KEY = 'datadiver-decision-history';

export function useDecisionHistory() {
  const [history, setHistory] = useState<Decision[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Falha ao carregar o histórico de decisões do localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const addDecision = useCallback((decision: Omit<Decision, 'id' | 'date'>) => {
    const newDecision: Decision = {
      ...decision,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    } as Decision;

    setHistory(prevHistory => {
      const updatedHistory = [newDecision, ...prevHistory];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Falha ao salvar a decisão no localStorage', error);
      }
      return updatedHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Falha ao limpar o histórico do localStorage', error);
    }
  }, []);

  const deleteDecision = useCallback((id: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(d => d.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Falha ao deletar a decisão do localStorage', error);
      }
      return updatedHistory;
    });
  }, []);

  return { history, addDecision, isLoaded, clearHistory, deleteDecision };
}
