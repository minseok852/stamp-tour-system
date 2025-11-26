from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.booth import Booth # 모델이 있는 위치에서 import (사용자 요청 구조 유지)
# schemas.booth에서 Pydantic 스키마 import
from app.schemas.booth import BoothCreate, BoothResponse, BoothUpdate, BoothBase

router = APIRouter()

# ----------------------------------------------------------------------
# 1. READ: 모든 부스 목록 조회 (프론트엔드 QRManage.jsx에 데이터 제공)
# ----------------------------------------------------------------------
@router.get("/", response_model=List[BoothResponse])
def get_all_booths(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # JWT 인증 필요
):
    # 관리자 여부 확인 로직이 필요하지만, 현재는 JWT 인증만으로 통과
    booths = db.query(Booth).all()
    return booths

# ----------------------------------------------------------------------
# 2. CREATE: 새 부스 등록 (관리자 기능)
# ----------------------------------------------------------------------
@router.post("/", response_model=BoothResponse, status_code=status.HTTP_201_CREATED)
def create_booth(
    booth_data: BoothCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # QR 코드 중복 확인
    if db.query(Booth).filter(Booth.qr_code == booth_data.qr_code).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 QR 코드 값입니다.")
        
    # 부스 객체 생성
    new_booth = Booth(**booth_data.model_dump())
    
    db.add(new_booth)
    db.commit()
    db.refresh(new_booth)
    
    return new_booth

# ----------------------------------------------------------------------
# 3. UPDATE: 부스 정보 수정 (관리자 기능)
# ----------------------------------------------------------------------
@router.put("/{booth_id}", response_model=BoothResponse)
def update_booth(
    booth_id: int,
    booth_update_data: BoothBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")

    # 데이터 업데이트
    for key, value in booth_update_data.model_dump(exclude_unset=True).items():
        setattr(booth, key, value)
        
    db.commit()
    db.refresh(booth)
    return booth

# ----------------------------------------------------------------------
# 4. DELETE: 부스 삭제 (관리자 기능)
# ----------------------------------------------------------------------
@router.delete("/{booth_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booth(
    booth_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        # 삭제 대상이 없어도 204 No Content 반환 (멱등성 유지)
        return

    db.delete(booth)
    db.commit()
    return