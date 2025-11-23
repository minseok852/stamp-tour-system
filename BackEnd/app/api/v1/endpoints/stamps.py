# BackEnd/app/api/v1/endpoints/stamps.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func # Stamp 모델용
from sqlalchemy.orm import Session, relationship # Stamp 모델용
from pydantic import BaseModel # StampAcquireRequest용

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User # User 모델 import
from app.api.v1.endpoints.booths import Booth # Booth 모델 import (사용자 요청 구조 유지)

# --- 1. Stamp 모델 정의 (사용자 요청 구조 유지) ---
from app.db.session import Base 

class Stamp(Base):
    __tablename__ = "stamps"

    stamp_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.student_id"), nullable=False)
    booth_id = Column(Integer, ForeignKey("booths.booth_id"), nullable=False)
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())
    method = Column(String, default='QR')
    
    # 릴레이션 정의
    # user = relationship("User", back_populates="stamps") # User 모델에서 정의 예정
    # booth = relationship("Booth", back_populates="stamps") # Booth 모델에서 정의 예정

# --- 2. 스탬프 획득 요청 스키마 ---
class StampAcquireRequest(BaseModel):
    qr_code_value: str          # 스캔한 QR 코드 값
    user_latitude: float        # 현재 사용자 위치 (위도)
    user_longitude: float       # 현재 사용자 위치 (경도)

# --- 3. 라우터 및 API 로직 ---
router = APIRouter()

# 이 API는 토큰을 가진 사람만 접근 가능합니다!
# @router.post("/acquire") 함수는 아래의 최종 로직으로 통합됩니다.

# --- 4. 최종 스탬프 획득 API ---
# from app.services.anti_cheat_service import check_all_fraud # 5m 거리 검증 서비스를 먼저 구현해야 합니다.

@router.post("/acquire", status_code=status.HTTP_201_CREATED)
def acquire_stamp(
    request_data: StampAcquireRequest,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # ! 중요: check_all_fraud 함수가 없으므로 임시로 주석 처리합니다.
    # from app.services.anti_cheat_service import check_all_fraud 
    
    # 1. QR 코드로 부스 정보 조회
    booth = db.query(Booth).filter(Booth.qr_code == request_data.qr_code_value).first()
    if not booth:
        raise HTTPException(status_code=404, detail="유효하지 않은 QR 코드입니다.")

    # 2. 통합 부정행위 검증 (AntiCheatService 구현 후 사용)
    # check_all_fraud(
    #     request_data.user_latitude, 
    #     request_data.user_longitude, 
    #     booth, 
    #     current_user.student_id, 
    #     db
    # )
    
    # 3. 중복 스탬프 획득 여부 확인
    existing_stamp = db.query(Stamp).filter(
        Stamp.student_id == current_user.student_id,
        Stamp.booth_id == booth.booth_id
    ).first()
    
    if existing_stamp:
        raise HTTPException(status_code=400, detail="이미 이 부스의 스탬프를 획득했습니다.")

    # 4. 스탬프 기록 저장
    new_stamp = Stamp(
        student_id=current_user.student_id,
        booth_id=booth.booth_id,
        method="QR"
    )
    
    db.add(new_stamp)
    db.commit()

    # NOTE: distance 변수가 현재 calculate_distance를 사용하지 않아 정의되어 있지 않습니다.
    #       Anti-Cheat 서비스 구현 후 복구 예정입니다.
    return {"message": f"'{booth.booth_name}' 스탬프 획득 성공!"}