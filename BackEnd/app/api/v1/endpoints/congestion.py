# app/api/v1/endpoints/congestion.py
# 부스 혼잡도 API

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict

# ✅ 수정: 'from app.database import get_db' 대신 정확한 경로 사용
from app.db.session import get_db
# ✅ 수정: 'from app.models import Stamp, Booth' 대신 정확한 모델 경로 사용
from app.models.stamp import Stamp 
from app.models.booth import Booth 


router = APIRouter(
    # ✅ 수정: 이 파일을 main.py에서 직접 include하므로, prefix를 /api/v1/congestion으로 설정합니다.
    prefix="/congestion",
    tags=["congestion"]
)

# 혼잡도 계산 기준 시간 (분)
CONGESTION_TIME_WINDOW = 3  # 최근 3분


def get_congestion_level(count: int) -> dict:
    """방문자 수에 따른 혼잡도 레벨 계산"""
    if count <= 5:
        return {"level": "low", "label": "여유", "color": "#48BB78"}
    elif count <= 15:
        return {"level": "medium", "label": "보통", "color": "#F6AD55"}
    else:
        return {"level": "high", "label": "혼잡", "color": "#E53E3E"}


@router.get("")
async def get_all_congestion(db: Session = Depends(get_db)) -> Dict[int, int]:
    """
    전체 부스 혼잡도 조회
    최근 10분 내 QR 스캔(스탬프 수집) 수 기준
    
    Returns:
        { booth_id: visitor_count, ... }
    """
    # 기준 시간 계산
    time_threshold = datetime.now() - timedelta(minutes=CONGESTION_TIME_WINDOW)
    
    # 부스별 최근 스탬프 수 집계
    results = db.query(
        # ✅ 수정: Stamp.id -> Stamp.stamp_id
        Stamp.booth_id,
        func.count(Stamp.stamp_id).label('count')
    ).filter(
        # ✅ 수정: Stamp.collected_at -> Stamp.acquired_at
        Stamp.acquired_at >= time_threshold
    ).group_by(
        Stamp.booth_id
    ).all()
    
    # 결과를 딕셔너리로 변환
    congestion_data = {}
    
    # 모든 부스 ID 가져오기 (0으로 초기화)
    # ✅ 수정: Booth.id -> Booth.booth_id
    all_booths = db.query(Booth.booth_id).all()
    # ✅ 수정: booth.id -> booth[0] (튜플 접근)
    for booth in all_booths:
        congestion_data[booth[0]] = 0 
    
    # 실제 카운트 업데이트
    for booth_id, count in results:
        congestion_data[booth_id] = count
    
    return congestion_data


@router.get("/{booth_id}")
async def get_booth_congestion(booth_id: int, db: Session = Depends(get_db)):
    """
    특정 부스 혼잡도 조회
    """
    # 부스 존재 확인
    # ✅ 수정: Booth.id -> Booth.booth_id
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    # 기준 시간 계산
    time_threshold = datetime.now() - timedelta(minutes=CONGESTION_TIME_WINDOW)
    
    # 해당 부스의 최근 스탬프 수 조회
    # ✅ 수정: Stamp.id -> Stamp.stamp_id, Stamp.collected_at -> Stamp.acquired_at
    count = db.query(func.count(Stamp.stamp_id)).filter(
        Stamp.booth_id == booth_id,
        Stamp.acquired_at >= time_threshold
    ).scalar() or 0
    
    # 혼잡도 레벨 계산
    level_info = get_congestion_level(count)
    
    return {
        "booth_id": booth_id,
        "visitor_count": count,
        **level_info
    }


@router.get("/summary/all")
async def get_congestion_summary(db: Session = Depends(get_db)):
    """
    전체 부스 혼잡도 요약 (상세 정보 포함)
    """
    # 기준 시간 계산
    time_threshold = datetime.now() - timedelta(minutes=CONGESTION_TIME_WINDOW)
    
    # 부스별 스탬프 수 집계
    # ✅ 수정: Stamp.id -> Stamp.stamp_id, Stamp.collected_at -> Stamp.acquired_at
    stamp_counts = db.query(
        Stamp.booth_id,
        func.count(Stamp.stamp_id).label('count')
    ).filter(
        Stamp.acquired_at >= time_threshold
    ).group_by(
        Stamp.booth_id
    ).all()
    
    count_dict = {booth_id: count for booth_id, count in stamp_counts}
    
    # 모든 부스 정보 조회
    booths = db.query(Booth).all()
    
    result = []
    for booth in booths:
        # ✅ 수정: booth.id -> booth.booth_id
        count = count_dict.get(booth.booth_id, 0)
        level_info = get_congestion_level(count)
        
        result.append({
            # ✅ 수정: booth.id -> booth.booth_id
            "booth_id": booth.booth_id, 
            "booth_name": booth.booth_name, # ✅ 수정: booth.name -> booth.booth_name
            "building": booth.location_name, # ✅ 수정: booth.building -> booth.location_name
            "visitor_count": count,
            **level_info
        })
    
    # 혼잡도 높은 순으로 정렬
    result.sort(key=lambda x: x["visitor_count"], reverse=True)
    
    return result