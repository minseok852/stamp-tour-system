import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import './index.css'
//import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // 라우터 추가
import App from './App.jsx' // Home 대신 App을 불러옵니다


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
