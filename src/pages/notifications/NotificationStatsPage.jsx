// src/pages/notifications/NotificationStatsPage.jsx
import React, { useMemo } from 'react';
import { useNotifications } from '../../hooks/UseNotifications';

function NotificationStatsPage() {
  const { notifications, loading, error, refresh } = useNotifications(200);

  const stats = useMemo(() => {
    const counter = {
      total: 0,
      DANGER: 0,
      WARNING: 0,
      SAFE: 0,
      UNKNOWN: 0,
    };

    notifications.forEach((n) => {
      counter.total += 1;
      const label = n.aiLabel || 'UNKNOWN';
      if (counter[label] !== undefined) {
        counter[label] += 1;
      } else {
        counter.UNKNOWN += 1;
      }
    });

    return counter;
  }, [notifications]);

  return (
    <div className="page-container">
      <h1>알림 통계</h1>

      <button className="btn" onClick={refresh} style={{ marginBottom: 12 }}>
        새로고침
      </button>

      {loading && <p>불러오는 중...</p>}
      {error && (
        <p style={{ color: 'red' }}>
          통계를 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      )}

      {!loading && !error && (
        <div className="notification-stats">
          <p>
            <strong>총 알림 수:</strong> {stats.total}
          </p>
          <p>
            <strong>DANGER:</strong> {stats.DANGER}
          </p>
          <p>
            <strong>WARNING:</strong> {stats.WARNING}
          </p>
          <p>
            <strong>SAFE:</strong> {stats.SAFE}
          </p>
          <p>
            <strong>UNKNOWN:</strong> {stats.UNKNOWN}
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationStatsPage;
