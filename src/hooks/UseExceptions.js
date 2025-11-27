// src/hooks/UseExceptions.js
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'watchservice.exceptions';

/**
 * 예외(화이트리스트) 목록 관리 훅.
 * - 구조: { id, type, pattern, memo }
 *   - type: 'PATH' | 'EXT' 등
 *   - pattern: 전체 경로 또는 확장자 패턴
 */
export function useExceptions() {
  const [exceptions, setExceptions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('failed to load exceptions from localStorage:', e);
      return [];
    }
  });

  // 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exceptions));
    } catch (e) {
      console.warn('failed to save exceptions to localStorage:', e);
    }
  }, [exceptions]);

  const addException = (type, pattern, memo = '') => {
    if (!pattern) return;

    setExceptions((prev) => {
      // 동일 type+pattern 중복 방지
      if (prev.some((ex) => ex.type === type && ex.pattern === pattern)) {
        return prev;
      }

      const nextId =
        prev.length === 0 ? 1 : Math.max(...prev.map((ex) => ex.id)) + 1;

      return [
        ...prev,
        {
          id: nextId,
          type,
          pattern,
          memo,
        },
      ];
    });
  };

  const removeException = (id) => {
    setExceptions((prev) => prev.filter((ex) => ex.id !== id));
  };

  return {
    exceptions,
    setExceptions,
    addException,
    removeException,
  };
}
