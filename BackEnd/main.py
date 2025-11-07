from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# React가 실행되는 주소 (보통 localhost:3000)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # <-- 이 react 서버
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # 허용할 출처 목록
    allow_credentials=True,
    allow_methods=["*"],      # 허용할 HTTP 메서드 (GET, POST 등 전체 허용)
    allow_headers=["*"],      # 허용할 헤더 (전체 허용)
)

@app.get("/api/hello")
def read_root():
    return {"message": "FastAPI에서 보낸 데이터입니다! 🚀"}