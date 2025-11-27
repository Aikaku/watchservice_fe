// src/pages/notifications/NotificationDetailPage.jsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function NotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const notification = location.state?.notification;

  if (!notification) {
    // 목록에서 state 없이 직접 URL로 들어온 경우
    return (
      <div className="page-container">
        <h1>알림 상세</h1>
        <p>알림 데이터를 찾을 수 없습니다. 목록에서 다시 진입해 주세요.</p>
        <button className="btn" onClick={() => navigate('/notifications')}>
          알림 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>알림 상세 (ID: {id})</h1>

      <div className="notification-detail-card">
        <p>
          <strong>위험도:</strong> {notification.aiLabel || 'UNKNOWN'}
        </p>
        <p>
          <strong>이벤트 타입:</strong> {notification.eventType}
        </p>
        <p>
          <strong>수집 시각:</strong> {notification.collectedAt}
        </p>
        <p>
          <strong>파일 경로:</strong> {notification.path}
        </p>
        <p>
          <strong>파일 크기:</strong> {notification.size} bytes
        </p>
        <p>
          <strong>엔트로피:</strong>{' '}
          {notification.entropy != null ? notification.entropy : '-'}
        </p>
        <p>
          <strong>SHA-256 해시:</strong> {notification.hash || '-'}
        </p>
        <p>
          <strong>AI 점수:</strong>{' '}
          {notification.aiScore != null ? notification.aiScore : '-'}
        </p>
        <p>
          <strong>AI 상세 분석:</strong>
        </p>
        <pre className="notification-detail-text">
          {notification.aiDetail || '(상세 내용 없음)'}
        </pre>
      </div>

      <button className="btn" onClick={() => navigate('/notifications')}>
        알림 목록으로 돌아가기
      </button>
    </div>
  );
}

export default NotificationDetailPage;
