// src/hooks/UseLogs.js
import { useEffect, useState } from 'react';
import { fetchRecentLogs } from '../api/LogsApi';

export function useLogs(initialLimit = 50) {
  const [limit, setLimit] = useState(initialLimit);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (overrideLimit) => {
    const effectiveLimit = overrideLimit ?? limit;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRecentLogs(effectiveLimit);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetchRecentLogs error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return {
    logs,
    loading,
    error,
    limit,
    setLimit,
    refresh: () => load(limit),
  };
}
