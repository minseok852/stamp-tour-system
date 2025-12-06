# BackEnd/app/models/event.py
# 이벤트 설정 모델

from sqlalchemy import Column, Integer, String, Date, Time, Boolean, Numeric
from sqlalchemy.sql import func
from app.db.session import Base


class Event(Base):
    __tablename__ = "events"
    
    event_id = Column(Integer, primary_key=True, autoincrement=True)
    event_name = Column(String(100), nullable=False)
    
    # 이벤트 기간
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # 운영 시간
    start_time = Column(Time, nullable=True)  # 예: 09:00
    end_time = Column(Time, nullable=True)    # 예: 18:00
    
    # 완주 조건
    required_stamps = Column(Integer, default=15)
    
    # 이벤트 상태
    is_active = Column(Boolean, default=True)
    
    # GPS 검증 설정
    gps_enabled = Column(Boolean, default=True)
    gps_max_distance = Column(Integer, default=100)  # 미터 단위
    gps_bypass_allowed = Column(Boolean, default=True)  # GPS 오류 시 PIN 허용 여부