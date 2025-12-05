import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/user/Home';
import Signup from './pages/user/Signup';
import ForgotPasswordModal from './pages/user/Forgotpasswordmodal';
// 🌟 수정: Dashboard를 AdminDashboard로 이름을 변경하여 Route에서 사용 가능하게 함
import AdminDashboard from './pages/admin/Dashboard'; 
import QRManage from './pages/admin/QRManage';
import Login from './pages/admin/Login'; 
import NotFound from './pages/Notfound';
import QRScan from './pages/user/QRScan';
import UserManage from './pages/admin/UserManage';
import Settings from './pages/admin/Settings';

// import './App.css'; // 필요하면 유지

function App() {
  return (
    <Routes>
      {/* 주소가 '/' 일 때는 Home 컴포넌트를 보여줌 */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      {/* 주소가 '/signup' 일 때는 Signup 컴포넌트를 보여줌 */}
      <Route path="/signup" element={<Signup isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/forgotpasswordmodal" element={<ForgotPasswordModal isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/qr-scan" element={<QRScan />} />  
      
      {/* 🌟 관리자 페이지 라우트 추가 🌟 */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/qr-manage" element={<QRManage />} />
      <Route path="/admin/users" element={<UserManage />} />
      <Route path="/admin/settings" element={<Settings />} />

      
      {/* 404 페이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;