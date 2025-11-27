// src/api/NotificationsApi.js
import { get } from './HttpClient';

// 일단은 로그 API를 재사용해서 알림처럼 사용
export async function fetchNotifications(limit = 100) {
  // TODO: 나중에 /notifications로 분리
  return get(`/logs/recent?limit=${limit}`);
}
