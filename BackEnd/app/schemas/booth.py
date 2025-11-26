from pydantic import BaseModel
from typing import Optional
#데이터의 유효성 검사 및 응답 형식을 정의합니다.
class BoothBase(BaseModel):
    # 등록/수정 시 필요한 기본 정보
    booth_name: str
    location_name: Optional[str] = None # 호실/건물명
    latitude: float
    longitude: float
    icon: Optional[str] = None
    
    # 관리자용 필드 (QR 코드 수동 등록 및 핀번호)
    qr_code: str
    qr_pin: Optional[str] = None

class BoothCreate(BoothBase):
    # 생성 시에는 event_id를 포함합니다 (현재는 1로 고정 가정)
    event_id: int = 1 

class BoothUpdate(BoothBase):
    # 수정 시에는 모든 필드가 선택적일 수 있습니다.
    booth_id: int 

class BoothResponse(BoothBase):
    # 응답 시에는 DB에서 받은 ID를 포함하고 필드를 정렬합니다.
    booth_id: int
    event_id: int
    
    class Config:
        from_attributes = True