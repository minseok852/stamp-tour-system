# BackEnd/app/schemas/event.py
# 이벤트 설정 스키마

from pydantic import BaseModel
from typing import Optional
from datetime import date, time


class EventBase(BaseModel):
    """이벤트 기본 정보"""
    event_name: str
    start_date: date
    end_date: date
    start_time: Optional[str] = "09:00"  # HH:MM 형식
    end_time: Optional[str] = "18:00"
    required_stamps: int = 15
    is_active: bool = True
    gps_enabled: bool = True
    gps_max_distance: int = 100  # 미터
    gps_bypass_allowed: bool = True


class EventCreate(EventBase):
    """이벤트 생성 요청"""
    pass


class EventUpdate(BaseModel):
    """이벤트 수정 요청 (모든 필드 선택적)"""
    event_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    required_stamps: Optional[int] = None
    is_active: Optional[bool] = None
    gps_enabled: Optional[bool] = None
    gps_max_distance: Optional[int] = None
    gps_bypass_allowed: Optional[bool] = None


class EventResponse(EventBase):
    """이벤트 응답"""
    event_id: int
    
    class Config:
        from_attributes = True


class SettingsResponse(BaseModel):
    """설정 페이지 응답 (이벤트 + 부스 정보)"""
    event_id: int
    event_name: str
    start_date: str
    end_date: str
    start_time: str
    end_time: str
    required_stamps: int
    total_booths: int
    is_active: bool
    gps_enabled: bool
    gps_max_distance: int
    gps_bypass_allowed: bool


class SettingsUpdate(BaseModel):
    """설정 수정 요청"""
    event_name: Optional[str] = None
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None
    required_stamps: Optional[int] = None
    is_active: Optional[bool] = None
    gps_enabled: Optional[bool] = None
    gps_max_distance: Optional[int] = None
    gps_bypass_allowed: Optional[bool] = None


class BoothPinUpdate(BaseModel):
    """부스 PIN 수정 요청"""
    qr_pin: str