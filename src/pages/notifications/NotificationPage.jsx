// src/pages/notifications/NotificationPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/UseNotifications';

function NotificationPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    limit,
    setLimit,
    refresh,
  } = useNotifications(100);

  const handleLimitChange = (e) => {
    const value = Number(e.target.value) || 20;
    setLimit(value);
  };

  const handleClickItem = (item) => {
    navigate(`/notifications/${item.id}`, {
      state: { notification: item },
    });
  };

  const getLevelBadge = (aiLabel) => {
    if (!aiLabel) return 'UNKNOWN';
    return aiLabel;
  };

  return (
    <div className="page-container">
      <h1>알림 히스토리</h1>

      <div style={{ marginBottom: '12px' }}>
        <label>
          최근 가져올 최대 개수:&nbsp;
          <select value={limit} onChange={handleLimitChange}>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <button
          className="btn"
          style={{ marginLeft: '8px' }}
          onClick={refresh}
        >
          새로고침
        </button>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && (
        <p style={{ color: 'red' }}>
          알림을 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p>표시할 알림이 없습니다.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="notification-list">
          {notifications.map((item) => (
            <li
              key={item.id}
              className="notification-item"
              onClick={() => handleClickItem(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="notification-item-main">
                <span className="notification-title">
                  [{getLevelBadge(item.aiLabel)}] {item.eventType}
                </span>
                <span className="notification-time">
                  {item.collectedAt}
                </span>
              </div>
              <div className="notification-item-sub">
                <span className="notification-path">{item.path}</span>
                {item.aiDetail && (
                  <span className="notification-detail-preview">
                    {item.aiDetail.length > 60
                      ? item.aiDetail.slice(0, 60) + '...'
                      : item.aiDetail}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationPage;
