import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/user/Home';
import Signup from './pages/user/Signup';
import ForgotPasswordModal from './pages/user/Forgotpasswordmodal';
import Dashboard from './pages/admin/Dashboard';
import QRManage from './pages/admin/QRManage';
// import './App.css'; // 필요하면 유지

function App() {
  return (
    <Routes>
      {/* 주소가 '/' 일 때는 Home 컴포넌트를 보여줌 */}
      <Route path="/" element={<Home />} />
      {/* 주소가 '/signup' 일 때는 Signup 컴포넌트를 보여줌 */}
      <Route path="/signup" element={<Signup isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/forgotpasswordmodal" element={<ForgotPasswordModal isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/qrmanage" element={<QRManage />} />
    </Routes>
  );
}

export default App;