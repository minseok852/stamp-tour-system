# app/api/v1/endpoints/stamps.py
# 스탬프 찍기(QR 스캔), 내 스탬프 조회 (보안 강화 버전)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.stamp import Stamp
from app.models.booth import Booth
from app.models.user import User
from app.schemas.stamp import StampScanRequest, StampResponse

router = APIRouter()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    두 GPS 좌표 간의 거리를 미터 단위로 계산 (Haversine Formula)
    """
    R = 6371.0  # 지구 반지름 (km)
    
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c * 1000
    return distance


# 1. QR 스캔 및 스탬프 적립 (보안 강화)
@router.post("/scan", response_model=StampResponse)
def scan_qr_and_collect_stamp(
    scan_data: StampScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT 인증 필수!
):
    """
    QR 코드 스캔 및 스탬프 적립
    
    검증:
    1. JWT 토큰 인증 (자동)
    2. QR 코드 유효성
    3. QR PIN 검증
    4. GPS 5m 이내
    5. 중복 수집 방지
    """
    
    # JWT에서 student_id 자동 추출 (보안!)
    student_id = current_user.student_id
    
    # 1. QR 코드로 부스 찾기
    booth = db.query(Booth).filter(Booth.qr_code == scan_data.qr_code).first()
    
    if not booth:
        raise HTTPException(
            status_code=404,
            detail="유효하지 않은 QR 코드입니다."
        )
    
    # 2. QR PIN 검증 (보안 강화!)
    if booth.qr_pin != scan_data.qr_pin:
        raise HTTPException(
            status_code=400,
            detail="QR 핀번호가 일치하지 않습니다."
        )
    
    # 3. GPS 위치 검증 (5m 이내)
    distance = calculate_distance(
        scan_data.user_latitude,
        scan_data.user_longitude,
        float(booth.latitude),
        float(booth.longitude)
    )
    
    if distance > 5.0:
        raise HTTPException(
            status_code=400,
            detail=f"부스로부터 {distance:.1f}m 떨어져 있습니다. 5m 이내에서 스캔해주세요."
        )
    
    # 4. 중복 체크 (이미 찍은 스탬프인지)
    existing_stamp = db.query(Stamp).filter(
        Stamp.student_id == student_id,
        Stamp.booth_id == booth.booth_id
    ).first()
    
    if existing_stamp:
        raise HTTPException(
            status_code=400,
            detail=f"이미 [{booth.booth_name}] 부스의 스탬프를 획득했습니다."
        )
    
    # 5. 스탬프 저장
    new_stamp = Stamp(
        student_id=student_id,
        booth_id=booth.booth_id,
        method='QR'
    )
    
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)
    
    # 6. 현재까지 모은 스탬프 개수 확인
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    
    return {
        "stamp_id": new_stamp.stamp_id,
        "student_id": new_stamp.student_id,
        "booth_id": new_stamp.booth_id,
        "booth_name": booth.booth_name,
        "acquired_at": new_stamp.acquired_at,
        "method": new_stamp.method,
        "total_stamps": total_stamps,
        "message": f"🎉 [{booth.booth_name}] 스탬프 획득! (총 {total_stamps}/14)"
    }


# 2. PIN 번호로 스탬프 적립 (QR 오류 시 사용)
@router.post("/pin", response_model=StampResponse)
def collect_stamp_by_pin(
    booth_id: int,
    pin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT 인증!
):
    """
    PIN 번호로 스탬프 적립 (관리자가 QR 오류 시 사용)
    """
    
    student_id = current_user.student_id  # JWT에서 추출
    
    # 1. 부스 찾기
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    # 2. PIN 확인
    if booth.qr_pin != pin:
        raise HTTPException(status_code=400, detail="PIN 번호가 올바르지 않습니다.")
    
    # 3. 중복 체크
    existing_stamp = db.query(Stamp).filter(
        Stamp.student_id == student_id,
        Stamp.booth_id == booth.booth_id
    ).first()
    
    if existing_stamp:
        raise HTTPException(
            status_code=400,
            detail=f"이미 [{booth.booth_name}] 부스의 스탬프를 획득했습니다."
        )
    
    # 4. 스탬프 저장
    new_stamp = Stamp(
        student_id=student_id,
        booth_id=booth.booth_id,
        method='PIN'
    )
    
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)
    
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    
    return {
        "stamp_id": new_stamp.stamp_id,
        "student_id": new_stamp.student_id,
        "booth_id": new_stamp.booth_id,
        "booth_name": booth.booth_name,
        "acquired_at": new_stamp.acquired_at,
        "method": new_stamp.method,
        "total_stamps": total_stamps,
        "message": f"🎉 [{booth.booth_name}] 스탬프 획득! (총 {total_stamps}/14)"
    }


# 3. 내 스탬프 조회
@router.get("/my-stamps", response_model=List[StampResponse])
def get_my_stamps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT 인증!
):
    """
    내가 획득한 스탬프 목록 조회
    """
    student_id = current_user.student_id  # JWT에서 추출
    
    stamps = db.query(Stamp).filter(Stamp.student_id == student_id).all()
    
    result = []
    for stamp in stamps:
        booth = db.query(Booth).filter(Booth.booth_id == stamp.booth_id).first()
        result.append({
            "stamp_id": stamp.stamp_id,
            "student_id": stamp.student_id,
            "booth_id": stamp.booth_id,
            "booth_name": booth.booth_name if booth else "알 수 없음",
            "acquired_at": stamp.acquired_at,
            "method": stamp.method,
            "total_stamps": len(stamps)
        })
    
    return result


# 4. 완주 확인
@router.get("/completion-status")
def check_completion_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT 인증!
):
    """
    완주 여부 확인
    """
    student_id = current_user.student_id  # JWT에서 추출
    
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    required_stamps = 15  # 필요한 스탬프 개수
    
    is_completed = total_stamps >= required_stamps
    
    return {
        "student_id": student_id,
        "total_stamps": total_stamps,
        "required_stamps": required_stamps,
        "is_completed": is_completed,
        "remaining": max(0, required_stamps - total_stamps),
        "message": "🎉 완주 축하합니다!" if is_completed else f"스탬프 {required_stamps - total_stamps}개 남았습니다!"
    }


# 5. 모든 부스 목록 조회 (사용자용)
@router.get("/booths-status")
def get_booths_with_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT 인증!
):
    """
    모든 부스 목록 + 내가 찍은 스탬프 표시
    """
    student_id = current_user.student_id  # JWT에서 추출
    
    booths = db.query(Booth).all()
    my_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).all()
    my_booth_ids = [s.booth_id for s in my_stamps]
    
    result = []
    for booth in booths:
        result.append({
            "booth_id": booth.booth_id,
            "booth_name": booth.booth_name,
            "location_name": booth.location_name,
            "latitude": float(booth.latitude),
            "longitude": float(booth.longitude),
            "icon": booth.icon,
            "collected": booth.booth_id in my_booth_ids
        })
    
    return {
        "total_booths": len(booths),
        "collected_count": len(my_stamps),
        "booths": result
    }