#부스 정보 모델
# app/models/booth.py
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from app.db.session import Base

class Booth(Base):
    __tablename__ = "booths"
    
    booth_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.event_id"), nullable=True)
    booth_name = Column(String(100), nullable=False)
    location_name = Column(String(100), nullable=True)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    qr_code = Column(String(50), unique=True, nullable=True)
    qr_pin = Column(String(10), nullable=True)
    icon = Column(String(10), nullable=True)