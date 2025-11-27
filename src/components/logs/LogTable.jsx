import React from 'react';

function LogTable({ logs, onRowClick }) {
  if (!logs || logs.length === 0) {
    return <p>표시할 로그가 없습니다.</p>;
  }

  return (
    <div className="log-table-wrapper">
      <table className="log-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>수집 시각</th>
            <th>이벤트</th>
            <th>경로</th>
            <th>크기</th>
            <th>위험도</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick && onRowClick(log)}
              className="log-row"
            >
              <td>{log.id}</td>
              <td>{log.collectedAt}</td>
              <td>{log.eventType}</td>
              <td>{log.path}</td>
              <td>{log.size}</td>
              <td>{log.aiLabel || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogTable;
