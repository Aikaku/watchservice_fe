// src/hooks/UseNotifications.js
import { useEffect, useState } from 'react';
import { fetchNotifications } from '../api/NotificationsApi';

export function useNotifications(initialLimit = 100) {
  const [notifications, setNotifications] = useState([]);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (overrideLimit) => {
    const effectiveLimit = overrideLimit ?? limit;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications(effectiveLimit);

      // 🔹 일단 aiLabel이 있는 것만 “알림”으로 취급
      const filtered = (Array.isArray(data) ? data : []).filter(
        (log) => log.aiLabel && log.aiLabel !== ''
      );

      setNotifications(filtered);
    } catch (e) {
      console.error('fetchNotifications error:', e);
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
    notifications,
    loading,
    error,
    limit,
    setLimit,
    refresh: () => load(limit),
  };
}
