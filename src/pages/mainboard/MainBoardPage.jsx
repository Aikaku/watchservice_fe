// src/pages/mainboard/MainBoardPage.jsx

import React, { useEffect, useState } from 'react';
import { startWatcher, stopWatcher } from '../../api/WatcherApi';
import { useWatchedFolders } from '../../hooks/UseWatchedFolders';
import { useLogs } from '../../hooks/UseLogs';
import { fetchDashboardSummary } from '../../api/DashboardApi';

function MainBoardPage() {
  // 🔹 대시보드 요약 상태
  const [protectionStatus, setProtectionStatus] = useState('안전'); // "안전" / "주의" / "위험"
  const [statusCode, setStatusCode] = useState('SAFE'); // "SAFE" / "WARNING" / "DANGER"
  const [lastEventTime, setLastEventTime] = useState('N/A');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // 🔹 검사 진행 상태 (지금은 더미, 나중에 Watcher 진행 상황 연동 가능)
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // 🔹 감시 대상 폴더: 공통 훅 (localStorage 연동)
  const {
    folders,
    promptAndAddFolder,
    removeFolder,
  } = useWatchedFolders();

  // 🔹 최근 탐지 이벤트: 백엔드 로그에서 최근 5건만 가져오기
  const {
    logs: recentLogs,
    loading: logsLoading,
    error: logsError,
  } = useLogs(5);

  // ================== 대시보드 요약 불러오기 ==================
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const data = await fetchDashboardSummary();
        if (!data) return;

        // statusLabel: "안전" / "주의" / "위험"
        setProtectionStatus(data.statusLabel || '안전');
        setStatusCode(data.status || 'SAFE');
        setLastEventTime(data.lastEventTime || 'N/A');
      } catch (e) {
        console.error('fetchDashboardSummary error:', e);
        setSummaryError(e);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, []);

  // ================== Logs → 최근 이벤트용 가공 ==================
  const mapLogToEventView = (log) => {
    // 위험도 레벨 매핑
    let level = 'info';
    if (log.aiLabel === 'DANGER') level = 'danger';
    else if (log.aiLabel === 'WARNING') level = 'warning';

    // 메시지 요약
    const message =
      log.aiDetail && log.aiDetail.length > 40
        ? log.aiDetail.slice(0, 40) + '...'
        : log.aiDetail || log.eventType || '파일 이벤트';

    return {
      id: log.id,
      time: log.collectedAt,
      path: log.path,
      level,
      message,
    };
  };

  const recentEvents =
    recentLogs && recentLogs.length > 0
      ? recentLogs.map(mapLogToEventView)
      : [];

  // ================== 검사 시작 ==================
  const handleScanNow = async () => {
    try {
      const target = folders[0]; // 일단 첫 번째 폴더를 대상으로 사용

      if (!target) {
        alert(
          '감시할 폴더가 없습니다.\n먼저 "폴더 추가"에서 경로를 등록해주세요.'
        );
        return;
      }

      if (!target.path) {
        alert('폴더 경로 정보가 없습니다.');
        return;
      }

      setIsScanning(true);
      setScanProgress(5); // UI용 임시값

      const result = await startWatcher(target.path);
      console.log('startWatcher result:', result);

      // TODO: 백엔드 응답/상태에 맞춰 진행률 갱신
      setScanProgress(30);
    } catch (e) {
      console.error(e);
      alert('검사 시작 중 오류가 발생했습니다.\n' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  // ================== 검사 중지 ==================
  const handlePause = async () => {
    try {
      const result = await stopWatcher();
      console.log('stopWatcher result:', result);
      // TODO: 진행률/상태 갱신
    } catch (e) {
      console.error(e);
      alert('검사 중지 중 오류가 발생했습니다.\n' + e.message);
    }
  };

  // ================== 폴더 추가/삭제 ==================
  const handleAddFolder = () => {
    promptAndAddFolder();
  };

  const handleRemoveFolder = (id) => {
    removeFolder(id);
  };

  // ================== 보호 상태 뱃지 색상 ==================
  const getStatusColor = () => {
    if (statusCode === 'DANGER') return '#ef4444'; // red
    if (statusCode === 'WARNING') return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <div className="mainboard-root">
      {/* 상단 헤더 영역 */}
      <header className="mainboard-header">
        <h1>WatchService Agent</h1>
        <div className="status-summary">
          <span className="status-label">보호 상태:</span>
          <span className="status-value">{protectionStatus}</span>
          <span className="status-last-scan">
            최근 이벤트 시각: {lastEventTime}
          </span>
          {summaryLoading && (
            <span className="status-loading">요약 불러오는 중...</span>
          )}
          {summaryError && (
            <span className="status-error">
              요약 불러오기 실패: {summaryError.message}
            </span>
          )}
        </div>
      </header>

      <div className="mainboard-body">
        {/* 좌측: 보호 상태 + 폴더 */}
        <section className="main-left">
          {/* 보호 상태 패널 */}
          <div className="status-panel">
            <div className="panel-header">
              <h2>실시간 보호 상태</h2>
            </div>

            <div className="status-body">
              <div className="status-left">
                <div
                  className="status-dot"
                  style={{
                    backgroundColor: getStatusColor(),
                  }}
                />
                <span className="status-text">{protectionStatus}</span>
              </div>
              <div className="status-right">
                <div className="scan-controls">
                  <button
                    className="btn"
                    onClick={handleScanNow}
                    disabled={isScanning}
                  >
                    {isScanning ? '검사 중...' : '지금 검사'}
                  </button>

                  <button className="btn" onClick={handlePause}>
                    일시 중지
                  </button>
                </div>

                <div className="scan-progress">
                  <div className="scan-progress-bar">
                    <div
                      className="scan-progress-fill"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="scan-progress-text">
                    진행률: {scanProgress}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 감시 대상 폴더 패널 */}
          <div className="folder-panel">
            <div className="panel-header">
              <h2>감시 대상 폴더</h2>
            </div>
            <div className="folder-list">
              {folders.map((f) => (
                <div key={f.id} className="folder-item">
                  <div className="folder-name">
                    {f.name}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '2px',
                      }}
                    >
                      {f.path}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => handleRemoveFolder(f.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}

              {folders.length === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>
                  아직 등록된 감시 폴더가 없습니다.
                  <br />
                  아래 버튼으로 먼저 폴더를 추가해 주세요.
                </p>
              )}
            </div>
            <button className="btn btn-outline" onClick={handleAddFolder}>
              폴더 추가
            </button>
          </div>
        </section>

        {/* 우측: 최근 이벤트 패널 */}
        <section className="main-right">
          <div className="recent-events-panel">
            <div className="panel-header">
              <h2>최근 탐지 이벤트</h2>
            </div>

            <div className="recent-events-list">
              {logsLoading && <p>최근 이벤트를 불러오는 중...</p>}
              {logsError && (
                <p style={{ color: 'red' }}>
                  최근 이벤트를 불러오는 중 오류가 발생했습니다:{' '}
                  {logsError.message}
                </p>
              )}

              {!logsLoading && !logsError && recentEvents.length === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>
                  아직 탐지된 이벤트가 없습니다.
                </p>
              )}

              {!logsLoading &&
                !logsError &&
                recentEvents.map((ev) => (
                  <div key={ev.id} className="event-item">
                    <div className="event-main">
                      <span className="event-time">{ev.time}</span>
                      <span className="event-message">{ev.message}</span>
                    </div>
                    <div className="event-sub">
                      <span className="event-path">{ev.path}</span>
                      <span
                        className={
                          'event-level ' +
                          (ev.level === 'danger'
                            ? 'event-level-danger'
                            : ev.level === 'warning'
                            ? 'event-level-warning'
                            : 'event-level-info')
                        }
                      >
                        {ev.level === 'danger'
                          ? '위험'
                          : ev.level === 'warning'
                          ? '주의'
                          : '정보'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MainBoardPage;
