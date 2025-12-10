import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/user/Home';
import Signup from './pages/user/Signup';
import ForgotPasswordModal from './pages/user/Forgotpasswordmodal';
import Login from './pages/admin/Login';
import NotFound from './pages/NotFound';
import QRScan from './pages/user/QRScan';
import StampCollect from './pages/stamp/StampCollect';

// 관리자 페이지
import Dashboard from './pages/admin/Dashboard';
import QRManage from './pages/admin/QRManage';
import UserManage from './pages/admin/UserManage';
import Settings from './pages/admin/Settings';
import DataExport from './pages/admin/DataExport';

function App() {
  return (
    <Routes>
      {/* 사용자 페이지 */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/forgotpasswordmodal" element={<ForgotPasswordModal isOpen={true} onClose={() => window.history.back()} />} />
      <Route path="/qr-scan" element={<QRScan />} />
      <Route path='/stamp/collect' element={<StampCollect/>}/>
      
      {/* 관리자 페이지 */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/qr-manage" element={<QRManage />} />
      <Route path="/admin/users" element={<UserManage />} />
      <Route path="/admin/settings" element={<Settings />} />
      <Route path="/admin/export" element={<DataExport />} />
      
      {/* 404 페이지 - 항상 마지막에 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;