# BackEnd/app/api/v1/endpoints/booths.py
# 부스 관련 API (QR 코드 조회 추가)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.booth import Booth
from app.schemas.booth import BoothCreate, BoothResponse, BoothUpdate
from app.api.v1.dependencies import get_current_admin

router = APIRouter()


# 1. 전체 부스 목록 조회 (공개)
@router.get("/", response_model=List[BoothResponse])
def get_all_booths(db: Session = Depends(get_db)):
    """전체 부스 목록 조회"""
    booths = db.query(Booth).all()
    return booths


# 2. 특정 부스 조회 (ID)
@router.get("/{booth_id}", response_model=BoothResponse)
def get_booth(booth_id: int, db: Session = Depends(get_db)):
    """특정 부스 조회"""
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    return booth


# ⭐ 3. QR 코드로 부스 조회 (스탬프 수집용)
@router.get("/by-qr/{qr_code}")
def get_booth_by_qr(qr_code: str, db: Session = Depends(get_db)):
    """QR 코드로 부스 조회"""
    booth = db.query(Booth).filter(Booth.qr_code == qr_code).first()
    if not booth:
        raise HTTPException(status_code=404, detail="유효하지 않은 QR 코드입니다.")
    
    return {
        "booth_id": booth.booth_id,
        "booth_name": booth.booth_name,
        "location_name": booth.location_name,
        "latitude": float(booth.latitude) if booth.latitude else None,
        "longitude": float(booth.longitude) if booth.longitude else None,
        "qr_code": booth.qr_code,
        "qr_pin": booth.qr_pin,  # PIN도 반환 (프론트에서 사용)
        "icon": booth.icon
    }


# 4. 부스 생성 (관리자 전용)
@router.post("/", response_model=BoothResponse)
def create_booth(
    booth_data: BoothCreate, 
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """부스 생성"""
    # QR 코드 중복 체크
    existing = db.query(Booth).filter(Booth.qr_code == booth_data.qr_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 QR 코드입니다.")
    
    new_booth = Booth(
        booth_name=booth_data.booth_name,
        location_name=booth_data.location_name,
        latitude=booth_data.latitude,
        longitude=booth_data.longitude,
        qr_code=booth_data.qr_code,
        qr_pin=booth_data.qr_pin,
        icon=booth_data.icon,
        event_id=booth_data.event_id
    )
    
    db.add(new_booth)
    db.commit()
    db.refresh(new_booth)
    
    return new_booth


# 5. 부스 수정 (관리자 전용)
@router.put("/{booth_id}", response_model=BoothResponse)
def update_booth(
    booth_id: int,
    booth_data: BoothUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """부스 수정"""
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    # QR 코드 중복 체크 (다른 부스와 중복)
    if booth_data.qr_code:
        existing = db.query(Booth).filter(
            Booth.qr_code == booth_data.qr_code,
            Booth.booth_id != booth_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 사용 중인 QR 코드입니다.")
    
    # 업데이트
    if booth_data.booth_name is not None:
        booth.booth_name = booth_data.booth_name
    if booth_data.location_name is not None:
        booth.location_name = booth_data.location_name
    if booth_data.latitude is not None:
        booth.latitude = booth_data.latitude
    if booth_data.longitude is not None:
        booth.longitude = booth_data.longitude
    if booth_data.qr_code is not None:
        booth.qr_code = booth_data.qr_code
    if booth_data.qr_pin is not None:
        booth.qr_pin = booth_data.qr_pin
    if booth_data.icon is not None:
        booth.icon = booth_data.icon
    
    db.commit()
    db.refresh(booth)
    
    return booth


# 6. 부스 삭제 (관리자 전용)
@router.delete("/{booth_id}")
def delete_booth(
    booth_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    """부스 삭제"""
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    db.delete(booth)
    db.commit()
    
    return {"message": f"'{booth.booth_name}' 부스가 삭제되었습니다."}