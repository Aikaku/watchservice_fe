import React from 'react';

function LogFilterBar({ keyword, setKeyword, riskFilter, setRiskFilter, onRefresh }) {
  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleRiskChange = (e) => {
    setRiskFilter(e.target.value);
  };

  return (
    <div className="log-filter-bar">
      <input
        type="text"
        placeholder="파일 경로 / 이벤트 / AI 상세 검색"
        value={keyword}
        onChange={handleKeywordChange}
        className="log-filter-input"
      />

      <select
        value={riskFilter}
        onChange={handleRiskChange}
        className="log-filter-select"
      >
        <option value="ALL">위험도 전체</option>
        <option value="DANGER">DANGER</option>
        <option value="WARNING">WARNING</option>
        <option value="SAFE">SAFE</option>
        <option value="UNKNOWN">UNKNOWN/기타</option>
      </select>

      <button className="btn" onClick={onRefresh}>
        새로고침
      </button>
    </div>
  );
}

export default LogFilterBar;
