from fastapi import APIRouter
from . import auth, users, stamps, booths, admin, congestion#라우터 통합 파일 생성
api_router = APIRouter()

# v1 API 엔드포인트들을 여기에 등록합니다.
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(users.router, prefix="/users", tags=["users"]) # 아직은 auth에 통합
api_router.include_router(stamps.router, prefix="/stamps", tags=["stamps"])
api_router.include_router(booths.router, prefix="/booths", tags=["booths"])
# api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

api_router.include_router(congestion.router)