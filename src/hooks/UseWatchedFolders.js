// src/hooks/UseWatchedFolders.js
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'watchservice.watchedFolders';

/**
 * 감시 대상 폴더 목록을 관리하는 공통 훅.
 * - 구조: { id, name, path }
 * - localStorage 에 저장해서 페이지 이동/새로고침 후에도 유지.
 */
export function useWatchedFolders() {
  const [folders, setFolders] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('failed to load watched folders from localStorage:', e);
      return [];
    }
  });

  // 변경 시 localStorage에 반영
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    } catch (e) {
      console.warn('failed to save watched folders to localStorage:', e);
    }
  }, [folders]);

  // 🔹 내부용: path로 폴더 추가
  const addFolderByPath = (path) => {
    if (!path) return;

    setFolders((prev) => {
      // 이미 같은 path가 있으면 중복 추가 방지
      if (prev.some((f) => f.path === path)) return prev;

      const segments = path.split(/[\\/]/).filter(Boolean);
      const name = segments[segments.length - 1] || path;

      const nextId =
        prev.length === 0 ? 1 : Math.max(...prev.map((f) => f.id)) + 1;

      return [
        ...prev,
        {
          id: nextId,
          name,
          path,
        },
      ];
    });
  };

  // 🔹 UI용: prompt 띄워서 바로 추가
  const promptAndAddFolder = () => {
    const path = window.prompt(
      '감시할 폴더의 전체 경로를 입력하세요.\n예: /Users/sanghyeok/Desktop/testwatch'
    );
    if (!path) return;
    addFolderByPath(path);
  };

  const removeFolder = (id) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    folders,
    setFolders,       // 필요하면 직접 세팅도 가능
    addFolderByPath,  // 코드에서 경로 이미 알고 있을 때
    promptAndAddFolder, // 버튼에서 바로 사용
    removeFolder,
  };
}
