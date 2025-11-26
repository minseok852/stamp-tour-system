# app/api/v1/endpoints/stamps.py
# 스탬프 찍기(QR 스캔), 내 스탬프 조회

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.stamp import Stamp
from app.models.booth import Booth
from app.models.user import User
from app.schemas.stamp import StampCreate, StampResponse, StampScanRequest
from app.services.gps_service import calculate_distance, is_within_range

router = APIRouter()

# JWT 토큰에서 현재 사용자 가져오기 (간단 버전)
def get_current_user_id(token: str) -> str:
    """
    JWT 토큰에서 학번 추출 (실제로는 auth.py의 get_current_user 사용)
    """
    from app.core.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    return payload.get("sub")


# 1. QR 스캔 및 스탬프 적립
@router.post("/scan", response_model=StampResponse)
def scan_qr_and_collect_stamp(
    scan_data: StampScanRequest,
    db: Session = Depends(get_db),
    # token: str = Depends(oauth2_scheme)  # 실제 프로덕션에서는 이렇게
):
    """
    QR 코드 스캔 및 스탬프 적립
    
    1. QR 코드 확인
    2. GPS 위치 확인 (5m 이내)
    3. 중복 체크
    4. 스탬프 저장
    """
    
    # 현재 사용자 (테스트: student_id 직접 전달)
    # student_id = get_current_user_id(token)  # 실제 프로덕션
    student_id = scan_data.student_id  # 테스트용
    
    # 1. QR 코드로 부스 찾기
    booth = db.query(Booth).filter(Booth.qr_code == scan_data.qr_code).first()
    
    if not booth:
        raise HTTPException(
            status_code=404,
            detail="유효하지 않은 QR 코드입니다."
        )
    
    # 2. GPS 위치 검증 (5m 이내)
    if scan_data.latitude and scan_data.longitude:
        distance = calculate_distance(
            scan_data.latitude,
            scan_data.longitude,
            float(booth.latitude),
            float(booth.longitude)
        )
        
        if not is_within_range(distance, max_distance=5.0):
            raise HTTPException(
                status_code=400,
                detail=f"부스에서 너무 멀리 떨어져 있습니다. (현재 {distance:.1f}m)"
            )
    
    # 3. 중복 체크 (이미 찍은 스탬프인지)
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
        method='QR',
        acquired_at=datetime.now()
    )
    
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)
    
    # 5. 현재까지 모은 스탬프 개수 확인
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
    student_id: str,  # 테스트용 (실제로는 JWT에서 추출)
    db: Session = Depends(get_db)
):
    """
    PIN 번호로 스탬프 적립 (관리자가 QR 오류 시 사용)
    """
    
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
        method='PIN',
        acquired_at=datetime.now()
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
    student_id: str,  # 테스트용 (실제로는 JWT에서 추출)
    db: Session = Depends(get_db)
):
    """
    내가 획득한 스탬프 목록 조회
    """
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
    student_id: str,  # 테스트용
    db: Session = Depends(get_db)
):
    """
    완주 여부 확인
    """
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    required_stamps = 14  # 필요한 스탬프 개수
    
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
    student_id: str,  # 테스트용
    db: Session = Depends(get_db)
):
    """
    모든 부스 목록 + 내가 찍은 스탬프 표시
    """
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