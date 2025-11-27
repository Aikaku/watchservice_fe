import React, { useMemo, useState } from 'react';
import { useLogs } from '../../hooks/UseLogs';
import LogFilterBar from '../../components/logs/LogFilterBar';
import LogTable from '../../components/logs/LogTable';
import LogDetailModal from '../../components/logs/LogDetailModal';

function LogsPage() {
  const { logs, loading, error, limit, setLimit, refresh } = useLogs(50);

  const [keyword, setKeyword] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  // 표시 개수 변경 (선택)
  const handleLimitChange = (e) => {
    const value = Number(e.target.value) || 10;
    setLimit(value);
  };

  // 프론트 단에서 간단 필터링
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 키워드 필터: path, eventType, aiDetail, aiLabel 등에서 찾기
      const lowerKeyword = keyword.toLowerCase();

      const matchesKeyword =
        !lowerKeyword ||
        (log.path && log.path.toLowerCase().includes(lowerKeyword)) ||
        (log.eventType && log.eventType.toLowerCase().includes(lowerKeyword)) ||
        (log.aiDetail && log.aiDetail.toLowerCase().includes(lowerKeyword)) ||
        (log.aiLabel && log.aiLabel.toLowerCase().includes(lowerKeyword));

      // 위험도 필터
      let matchesRisk = true;
      if (riskFilter !== 'ALL') {
        if (riskFilter === 'UNKNOWN') {
          matchesRisk = !log.aiLabel;
        } else {
          matchesRisk = log.aiLabel === riskFilter;
        }
      }

      return matchesKeyword && matchesRisk;
    });
  }, [logs, keyword, riskFilter]);

  return (
    <div className="page-container">
      <h1>탐지 로그</h1>

      <div style={{ marginBottom: '8px' }}>
        <label>
          서버에서 가져올 최대 개수:&nbsp;
          <select value={limit} onChange={handleLimitChange}>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <LogFilterBar
        keyword={keyword}
        setKeyword={setKeyword}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
        onRefresh={refresh}
      />

      {loading && <p>불러오는 중...</p>}
      {error && (
        <p style={{ color: 'red' }}>
          로그를 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      )}

      {!loading && !error && (
        <LogTable
          logs={filteredLogs}
          onRowClick={(log) => setSelectedLog(log)}
        />
      )}

      {/* 상세 모달 */}
      <LogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

export default LogsPage;
