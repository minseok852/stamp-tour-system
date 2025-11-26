#스탬프 획득 기록 모델
# app/models/stamp.py
# 스탬프 DB 모델

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class Stamp(Base):
    __tablename__ = "stamps"
    
    stamp_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(20), ForeignKey('users.student_id'), nullable=False)
    booth_id = Column(Integer, ForeignKey('booths.booth_id'), nullable=False)
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())
    method = Column(String(10), default='QR')  # QR 또는 PIN
    
    # 중복 방지: 같은 학생이 같은 부스에서 두 번 스탬프 찍기 불가
    __table_args__ = (
        {'schema': None},
    )