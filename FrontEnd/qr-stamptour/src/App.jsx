import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 비동기 함수로 데이터 요청
    const fetchData = async () => {
      try {
        // FastAPI 서버 주소로 GET 요청
        const response = await axios.get("http://127.0.0.1:8000/api/hello");
        // axios는 .data에 응답 본문이 자동으로 담깁니다.
        setMessage(response.data.message);
      } catch (error) {
        console.error("에러 발생:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>React + FastAPI 연동 테스트</h1>
      <p>서버 응답: {message}</p>
    </div>
  );
}

export default App;