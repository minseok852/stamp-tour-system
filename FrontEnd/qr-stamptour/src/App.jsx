import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/user/Home';
import Signup from './pages/user/Signup';
import ForgotPasswordModal from './pages/user/Forgotpasswordmodal';
import Dashboard from './pages/admin/Dashboard';
import QRManage from './pages/admin/QRManage';
import Login from './pages/admin/Login';
import NotFound from './pages/Notfound';
import QRScan from './pages/user/QRScan';
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
      {/*관리자 dashboard와 qrmanage 쪽이다. 아직 링크만 입력하면 들어갈 수 있기에 조만간 조취할 
      예정*/}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/qrmanage" element={<QRManage />} />
      {/* 404 페이지 - 항상 마지막에 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;