// src/api/LogsApi.js
import { get } from './HttpClient';

// 백엔드: GET /logs/recent?limit=50
export function fetchRecentLogs(limit = 50) {
  return get(`/logs/recent?limit=${limit}`);
}
