# BackEnd/app/models/booths.py

from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Booth(Base):
    __tablename__ = "booths"

    booth_id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.event_id")) # events 테이블은 나중에 구현
    booth_name = Column(String, nullable=False)
    location_name = Column(String)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    qr_code = Column(String, unique=True)
    qr_pin = Column(String)
    icon = Column(String)
    
    # 릴레이션 정의 (선택사항이지만 ORM 사용 시 편리)
    stamps = relationship("Stamp", back_populates="booth")