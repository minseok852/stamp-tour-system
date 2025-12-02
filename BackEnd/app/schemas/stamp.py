# app/schemas/stamp.py
# 스탬프 관련 스키마 (보안 강화 버전)

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class StampBase(BaseModel):
    """스탬프 기본 스키마"""
    student_id: str
    booth_id: int
    method: str = "QR"  # QR 또는 PIN


class StampCreate(StampBase):
    """스탬프 생성 요청"""
    pass


# ===== 새로운 스캔 요청 (보안 강화) =====
class StampScanRequest(BaseModel):
    """
    QR 스캔 요청 (JWT 토큰에서 student_id 자동 추출)
    """
    qr_code: str = Field(..., description="QR 코드 값 (예: BOOTH_001)")
    qr_pin: str = Field(..., description="QR 핀번호 (4자리)")
    user_latitude: float = Field(..., description="사용자 위도")
    user_longitude: float = Field(..., description="사용자 경도")
    
    class Config:
        schema_extra = {
            "example": {
                "qr_code": "BOOTH_001",
                "qr_pin": "1234",
                "user_latitude": 37.6313,
                "user_longitude": 127.2533
            }
        }


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
    stamps: List[StampResponse]


# ===== 내 스탬프 조회용 =====
class MyStampItem(BaseModel):
    """내 스탬프 아이템"""
    stamp_id: int
    booth_id: int
    booth_name: str
    location_name: Optional[str]
    icon: Optional[str]
    acquired_at: datetime
    method: str


class MyStampsResponse(BaseModel):
    """내 스탬프 목록 응답"""
    total_stamps: int
    total_booths: int
    completion_rate: float
    stamps: List[MyStampItem]