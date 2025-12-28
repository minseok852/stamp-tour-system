# app/api/v1/endpoints/stamps.py
# 스탬프 찍기(QR 스캔), 내 스탬프 조회 (부정행위 방지 추가 버전)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.stamp import Stamp
from app.models.booth import Booth
from app.models.user import User
from app.models.event import Event
from app.schemas.stamp import StampScanRequest, StampResponse

router = APIRouter()


# ========================================
# 부정행위 방지 설정
# ========================================
ANTI_CHEAT_CONFIG = {
    "same_location_distance": 30,      # 30m 이내 = 같은 장소
    "same_location_interval": 10,      # 같은 장소 최소 간격 (초)
    "different_location_interval": 60, # 다른 장소 최소 간격 (초)
    "max_walking_speed": 3.0,          # 최대 걷는 속도 (m/s) ≈ 10.8km/h
    "enabled": True                    # 부정행위 검증 활성화
}


# ========================================
# 유틸리티 함수들
# ========================================
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


def get_event_settings(db: Session):
    """
    Event 테이블에서 GPS 설정 가져오기
    """
    event = db.query(Event).first()
    
    if event:
        return {
            "gps_enabled": event.gps_enabled if hasattr(event, 'gps_enabled') else True,
            "gps_max_distance": event.gps_max_distance if hasattr(event, 'gps_max_distance') else 50.0,
            "required_stamps": event.required_stamps if hasattr(event, 'required_stamps') else 15
        }
    
    # 기본값 (Event 테이블에 데이터 없을 경우)
    return {
        "gps_enabled": True,
        "gps_max_distance": 50.0,
        "required_stamps": 15
    }


def check_anti_cheat(student_id: str, current_booth: Booth, db: Session) -> dict:
    """
    부정행위 검증
    
    - 같은 장소 (30m 이내): 10초 이상 지나야 함
    - 다른 장소 (30m 이상): 이동 속도가 3m/s 이하여야 함
    
    Returns:
        {"passed": True/False, "reason": "사유"}
    """
    # 부정행위 검증 비활성화 시 통과
    if not ANTI_CHEAT_CONFIG["enabled"]:
        return {"passed": True, "reason": None}
    
    # 1. 마지막 스탬프 조회
    last_stamp = db.query(Stamp).filter(
        Stamp.student_id == student_id
    ).order_by(Stamp.acquired_at.desc()).first()
    
    # 첫 스탬프면 통과
    if not last_stamp:
        return {"passed": True, "reason": "첫 스탬프"}
    
    # 2. 이전 부스 정보 조회
    last_booth = db.query(Booth).filter(
        Booth.booth_id == last_stamp.booth_id
    ).first()
    
    if not last_booth:
        return {"passed": True, "reason": "이전 부스 정보 없음"}
    
    # 3. 시간 차이 계산
    now = datetime.now(timezone.utc)
    last_time = last_stamp.acquired_at
    
    # timezone 처리 (DB에서 가져온 시간이 timezone 없을 수 있음)
    if last_time.tzinfo is None:
        last_time = last_time.replace(tzinfo=timezone.utc)
    
    time_diff = (now - last_time).total_seconds()
    
    # 4. 부스 간 거리 계산
    booth_distance = calculate_distance(
        float(last_booth.latitude), float(last_booth.longitude),
        float(current_booth.latitude), float(current_booth.longitude)
    )
    
    # 5. 같은 장소인지 판단 (30m 이내)
    same_location_distance = ANTI_CHEAT_CONFIG["same_location_distance"]
    is_same_location = booth_distance < same_location_distance
    
    # 6. 검증 로직
    if is_same_location:
        # ===== 같은 장소: 10초 이상 지나야 함 =====
        min_interval = ANTI_CHEAT_CONFIG["same_location_interval"]
        
        if time_diff < min_interval:
            wait_time = int(min_interval - time_diff)
            return {
                "passed": False,
                "reason": f"너무 빠른 스캔입니다. {wait_time}초 후에 다시 시도해주세요."
            }
        else:
            return {"passed": True, "reason": "같은 장소, 시간 충분"}
    
    else:
        # ===== 다른 장소: 이동 속도 체크 =====
        # 시간이 0이면 비정상
        if time_diff <= 0:
            return {
                "passed": False,
                "reason": "이동 시간이 비정상적입니다."
            }
        
        # 이동 속도 계산 (m/s)
        speed = booth_distance / time_diff
        max_speed = ANTI_CHEAT_CONFIG["max_walking_speed"]
        
        if speed > max_speed:
            return {
                "passed": False,
                "reason": f"이동 속도가 비정상적입니다. ({booth_distance:.0f}m를 {time_diff:.0f}초에 이동)"
            }
        else:
            return {"passed": True, "reason": "다른 장소, 속도 정상"}


# ========================================
# API 엔드포인트
# ========================================

# 1. QR 스캔 및 스탬프 적립
@router.post("/scan", response_model=StampResponse)
def scan_qr_and_collect_stamp(
    scan_data: StampScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    QR 코드 스캔 및 스탬프 적립
    
    검증 순서:
    1. QR 코드 유효성
    2. QR PIN 검증
    3. GPS 거리 검증
    4. 부정행위 검증 (시간/속도)
    5. 중복 수집 방지
    """
    # Settings에서 GPS 설정 가져오기
    settings = get_event_settings(db)
    gps_enabled = settings["gps_enabled"]
    max_distance = settings["gps_max_distance"]
    required_stamps = settings["required_stamps"]
    
    student_id = current_user.student_id
    
    # 1. QR 코드로 부스 찾기
    booth = db.query(Booth).filter(Booth.qr_code == scan_data.qr_code).first()
    
    if not booth:
        raise HTTPException(
            status_code=404,
            detail="유효하지 않은 QR 코드입니다."
        )
    
    # 2. QR PIN 검증
    if booth.qr_pin != scan_data.qr_pin:
        raise HTTPException(
            status_code=400,
            detail="QR 핀번호가 일치하지 않습니다."
        )
    
    # 3. GPS 위치 검증
    if gps_enabled:
        distance = calculate_distance(
            scan_data.user_latitude,
            scan_data.user_longitude,
            float(booth.latitude),
            float(booth.longitude)
        )
        
        if distance > max_distance:
            raise HTTPException(
                status_code=400,
                detail=f"부스로부터 {distance:.1f}m 떨어져 있습니다. {max_distance:.0f}m 이내에서 스캔해주세요."
            )
    
    # 4. 부정행위 검증 ⭐
    anti_cheat_result = check_anti_cheat(student_id, booth, db)
    
    if not anti_cheat_result["passed"]:
        raise HTTPException(
            status_code=400,
            detail=anti_cheat_result["reason"]
        )
    
    # 5. 중복 체크
    existing_stamp = db.query(Stamp).filter(
        Stamp.student_id == student_id,
        Stamp.booth_id == booth.booth_id
    ).first()
    
    if existing_stamp:
        raise HTTPException(
            status_code=400,
            detail=f"이미 [{booth.booth_name}] 부스의 스탬프를 획득했습니다."
        )
    
    # 6. 스탬프 저장
    new_stamp = Stamp(
        student_id=student_id,
        booth_id=booth.booth_id,
        method='QR'
    )
    
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)
    
    # 7. 현재까지 모은 스탬프 개수 확인
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    
    return {
        "stamp_id": new_stamp.stamp_id,
        "student_id": new_stamp.student_id,
        "booth_id": new_stamp.booth_id,
        "booth_name": booth.booth_name,
        "acquired_at": new_stamp.acquired_at,
        "method": new_stamp.method,
        "total_stamps": total_stamps,
        "message": f"🎉 [{booth.booth_name}] 스탬프 획득! (총 {total_stamps}/{required_stamps})"
    }


# 2. PIN 번호로 스탬프 적립 (QR 오류 시 사용)
@router.post("/pin", response_model=StampResponse)
def collect_stamp_by_pin(
    booth_id: int,
    pin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    PIN 번호로 스탬프 적립 (GPS 오류 시 사용)
    """
    settings = get_event_settings(db)
    required_stamps = settings["required_stamps"]
    
    student_id = current_user.student_id
    
    # 1. 부스 찾기
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    # 2. PIN 확인
    if booth.qr_pin != pin:
        raise HTTPException(status_code=400, detail="PIN 번호가 올바르지 않습니다.")
    
    # 3. 부정행위 검증 ⭐
    anti_cheat_result = check_anti_cheat(student_id, booth, db)
    
    if not anti_cheat_result["passed"]:
        raise HTTPException(
            status_code=400,
            detail=anti_cheat_result["reason"]
        )
    
    # 4. 중복 체크
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
        "message": f"🎉 [{booth.booth_name}] 스탬프 획득! (총 {total_stamps}/{required_stamps})"
    }


# 3. 내 스탬프 조회
@router.get("/my-stamps", response_model=List[StampResponse])
def get_my_stamps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    내가 획득한 스탬프 목록 조회
    """
    student_id = current_user.student_id
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
    current_user: User = Depends(get_current_user)
):
    """
    완주 여부 확인
    """
    settings = get_event_settings(db)
    required_stamps = settings["required_stamps"]
    
    student_id = current_user.student_id
    total_stamps = db.query(Stamp).filter(Stamp.student_id == student_id).count()
    
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
    current_user: User = Depends(get_current_user)
):
    """
    모든 부스 목록 + 내가 찍은 스탬프 표시
    """
    student_id = current_user.student_id
    
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


# 6. 공개 이벤트 설정 조회 (GPS 설정 등)
@router.get("/event-settings")
def get_public_event_settings(db: Session = Depends(get_db)):
    """
    공개 이벤트 설정 조회 (로그인 불필요)
    """
    event = db.query(Event).first()
    
    if event:
        return {
            "gps_enabled": event.gps_enabled if hasattr(event, 'gps_enabled') else True,
            "gps_max_distance": event.gps_max_distance if hasattr(event, 'gps_max_distance') else 50.0,
            "required_stamps": event.required_stamps if hasattr(event, 'required_stamps') else 15,
            "is_active": event.is_active if hasattr(event, 'is_active') else True,
            "event_name": event.event_name if hasattr(event, 'event_name') else "스탬프 투어"
        }
    
    return {
        "gps_enabled": True,
        "gps_max_distance": 50.0,
        "required_stamps": 15,
        "is_active": True,
        "event_name": "스탬프 투어"
    }