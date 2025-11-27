#app/models/user.py
#사용자(학생), 관리자 모델
#실제 db에 저장될 사용자 테이블을 정의 하는 곳
from sqlalchemy import Column, String, Integer, Boolean, DateTime, func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"  # DB에 만든 테이블 이름과 정확히 같아야 함

    student_id = Column(String, primary_key=True, index=True) # 학번
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    dept_name = Column(String, nullable=False)
    grade = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    role = Column(String, nullable=False, default='user')  # user 또는 admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())