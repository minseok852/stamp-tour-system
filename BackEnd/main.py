from fastapi import FastAPI
from app.api.v1.endpoints.api import api_router

app = FastAPI(
    title="QR Stamp Tour API",
    openapi_url="/api/v1/openapi.json"
)

# 2. 메인 앱에 API 라우터를 연결 (기본 경로: /api/v1)
app.include_router(api_router, prefix="/api/v1") 

# [선택 사항] 루트 경로('/')에 간단한 메시지 추가 (404 방지)
@app.get("/")
def read_root():
    return {"message": "Welcome to the QR Stamp Tour API - Go to /docs for Swagger UI"}