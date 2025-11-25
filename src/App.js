
// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import MainBoardPage from './pages/mainboard/MainBoardPage';
// 나중에 알림/로그/설정 페이지 추가 예정

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<MainBoardPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
