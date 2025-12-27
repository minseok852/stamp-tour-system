from fastapi import FastAPI
from app.api.v1.endpoints.api import api_router

from fastapi.middleware.cors import CORSMiddleware
import os
app = FastAPI(
    title="QR Stamp Tour API",
    openapi_url="/api/v1/openapi.json"
)

origins = [
    "https://stamp-tour-system.vercel.app",  # Vercel 주소
    "https://djustamp.com",
    "https://www.djustamp.com",
    # React 개발 서버 주소
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # (추후 프로덕션 서버 주소도 추가할 수 있습니다)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             # 허용할 출처 목록
    allow_credentials=True,            # 쿠키 허용
    allow_methods=["*"],               # 모든 HTTP 메서드 (GET, POST, DELETE 등) 허용
    allow_headers=["*"],               # 모든 헤더 허용 (Authorization 헤더 포함)
)
# ------------------------------------------------------------------

# 2. 메인 앱에 API 라우터를 연결 (기본 경로: /api/v1)
app.include_router(api_router, prefix="/api/v1") 

# [선택 사항] 루트 경로('/')에 간단한 메시지 추가 (404 방지)
@app.get("/")
def read_root():
    return {"message": "Welcome to the QR Stamp Tour API - Go to /docs for Swagger UI"}
