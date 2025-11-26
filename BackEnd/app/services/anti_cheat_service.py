# BackEnd/app/services/anti_cheat_service.py

from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone # <--- 추가: datetime, timezone import
from app.services.gps_service import calculate_distance
from app.api.v1.endpoints.stamps import Stamp
from app.db.session import Session

# 부정행위 검증을 위한 최소 시간 간격 (예: 600초)
MIN_STAMP_INTERVAL_SECONDS = 600 
# 부정행위 검증을 위한 최대 허용 거리 (미터)
MAX_ALLOWED_DISTANCE = 10.0 

def check_location_fraud(user_lat: float, user_lon: float, booth_lat: float, booth_lon: float) -> bool:
    """
    위치 기반 부정행위를 검사합니다 (10m 이내).
    """
    distance = calculate_distance(user_lat, user_lon, booth_lat, booth_lon)
    return distance <= MAX_ALLOWED_DISTANCE

def check_time_fraud(student_id: str, db: Session) -> bool:
    """
    획득 시간 기반 부정행위를 검사합니다 (스탬프 간 최소 시간 간격).
    반환 값: True (부정행위 아님, 통과), False (부정행위로 의심, 차단 필요)
    """
    # 1. 최근 스탬프 획득 기록 조회
    last_stamp = db.query(Stamp).filter(Stamp.student_id == student_id).order_by(Stamp.acquired_at.desc()).first()
    
    if last_stamp:
        # 2. 현재 시간과 마지막 획득 시간 차이 계산
        # last_stamp.acquired_at이 timezone-aware 객체가 아닐 수 있으므로 utcnow 사용
        time_diff = datetime.now(timezone.utc) - last_stamp.acquired_at.replace(tzinfo=timezone.utc) 
        
        # 3. 최소 간격보다 짧으면 부정행위 (False 반환)
        if time_diff.total_seconds() < MIN_STAMP_INTERVAL_SECONDS:
            return False 
        
    return True # 스탬프가 없거나, 시간 간격이 충분하면 통과 (True)

def check_all_fraud(user_lat: float, user_lon: float, booth, student_id: str, db: Session) -> bool:
    """
    모든 부정행위 검사를 통합하여 실행합니다.
    """
    # 1. 위치 검증
    if not check_location_fraud(user_lat, user_lon, float(booth.latitude), float(booth.longitude)):
        raise HTTPException(status_code=403, detail="QR 코드 근처(5m 이내)에서 스캔해야 합니다.")
    
    # 2. 시간 간격 검증 (시간 간격이 짧으면 False를 반환하므로, False일 때 예외 발생)
    if not check_time_fraud(student_id, db):
        raise HTTPException(status_code=403, detail="스탬프 획득 간격이 너무 짧습니다. 잠시 후 다시 시도해 주세요.")
        
    return True