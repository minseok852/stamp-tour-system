# app/schemas/stamp.py
# 스탬프 관련 스키마

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class StampBase(BaseModel):
    """스탬프 기본 스키마"""
    student_id: str
    booth_id: int
    method: str = "QR"  # QR 또는 PIN


class StampCreate(StampBase):
    """스탬프 생성 요청"""
    pass


class StampScanRequest(BaseModel):
    """
    QR 스캔 요청
    """
    student_id: str = Field(..., description="학번")
    qr_code: str = Field(..., description="QR 코드 값 (예: BOOTH_01)")
    latitude: Optional[float] = Field(None, description="사용자 위도")
    longitude: Optional[float] = Field(None, description="사용자 경도")


class StampResponse(BaseModel):
    """
    스탬프 응답
    """
    stamp_id: int
    student_id: str
    booth_id: int
    booth_name: str
    acquired_at: datetime
    method: str
    total_stamps: int
    message: Optional[str] = None
    
    class Config:
        from_attributes = True


class StampListResponse(BaseModel):
    """
    스탬프 목록 응답
    """
    total_stamps: int
    required_stamps: int
    is_completed: bool
    stamps: list[StampResponse]