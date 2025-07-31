'use client';

import { useState, useEffect, useCallback } from 'react';

export function useInterruptData(apiUrl = '/api/interrupts', refreshInterval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar dados das interrupções:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Buscar dados imediatamente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefresh || !refreshInterval) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, fetchData]);

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(prev => !prev);
  };

  const manualRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return {
    data,
    loading,
    error,
    isAutoRefresh,
    toggleAutoRefresh,
    manualRefresh
  };
}
