import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/user/Home';
import Signup from './pages/user/Signup';
// import './App.css'; // 필요하면 유지

function App() {
  return (
    <Routes>
      {/* 주소가 '/' 일 때는 Home 컴포넌트를 보여줌 */}
      <Route path="/" element={<Home />} />
      {/* 주소가 '/signup' 일 때는 Signup 컴포넌트를 보여줌 */}
      <Route path="/signup" element={<Signup isOpen={true} onClose={() => window.history.back()} />} />
    </Routes>
  );
}

export default App;