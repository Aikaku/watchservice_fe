// src/api/HttpClient.js

const BASE_URL = 'http://localhost:8080'; // Spring Boot 서버 주소

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  // 🔹 기본 옵션: 굳이 Content-Type을 강제로 넣지 않는다
  const defaultOptions = {
    // headers: {}  // 필요하면 여기서 확장
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    // headers는 options 쪽이 우선
    headers: {
      ...(defaultOptions.headers || {}),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} - ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

// GET은 단순 요청이므로 헤더 안 붙임
export function get(path) {
  return request(path, { method: 'GET' });
}

// POST: body가 있을 때만 JSON 헤더를 붙인다
export function post(path, body) {
  if (body === undefined) {
    // 🔹 쿼리스트링만 사용하는 POST (우리 /watcher/start, /stop 케이스)
    return request(path, { method: 'POST' });
  }

  // 🔹 실제 JSON body를 보낼 때
  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
