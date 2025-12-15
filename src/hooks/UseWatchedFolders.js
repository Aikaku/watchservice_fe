// src/hooks/UseWatchedFolders.js
import { useCallback, useEffect, useState } from 'react';
import {
  fetchWatchedFolders,
  createWatchedFolder,
  deleteWatchedFolder,
  pickFolderPath, // ✅ 여기 중요 (네 SettingApi.js에 있는 이름)
} from '../api/SettingApi';

export function useWatchedFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchWatchedFolders();
      const list = Array.isArray(data) ? data : (data?.items ?? []);

      setFolders(
        list.map((it) => ({
          id: it.id ?? it.folderId ?? it.path,
          name: it.name ?? it.folderName ?? it.path ?? '폴더',
          path: it.path,
          createdAt: it.createdAt,
        }))
      );
    } catch (e) {
      setError(e);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const promptAndAddFolder = useCallback(async () => {
    try {
      // ✅ 클릭이 먹는지부터 확인용 (무반응이면 이 로그도 안 찍힘)
      console.log('[useWatchedFolders] add folder clicked');

      setLoading(true);
      setError(null);

      // 1) 백엔드에서 폴더 선택 다이얼로그 띄우고 path 받기
      const picked = await pickFolderPath(); // ✅ GET /settings/folders/pick
      const path = (typeof picked === 'string' ? picked : picked?.path) || '';

      if (!path.trim()) return; // 사용자가 취소한 케이스

      // 2) 등록 (name 비워도 백엔드가 path로 채움)
      await createWatchedFolder({ name: '', path: path.trim() });
      await refresh();
    } catch (e) {
      console.error('[useWatchedFolders] add folder failed', e);
      setError(e);
      alert(`폴더 추가 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const removeFolder = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);
        await deleteWatchedFolder(id);
        await refresh();
      } catch (e) {
        setError(e);
        alert(`폴더 삭제 실패: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  return { folders, loading, error, refresh, promptAndAddFolder, removeFolder };
}
