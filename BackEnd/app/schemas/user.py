# app/schemas/user.py
# 로그인 및 회원가입 관련 스키마
from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    student_id: str
    name: str
    phone_number: str
    dept_name: str
    grade: int
    gender: str

# 로그인 요청 스키마
class UserLogin(BaseModel):
    student_id: str
    password: str

# 응답(Response) 모델: DB에서 데이터를 가져와 프론트에 보낼 때
class UserResponse(UserBase):
    created_at: str

    class Config:
        from_attributes = True

# 사용자 정보 (토큰 응답에 포함)
class UserInfo(BaseModel):
    student_id: str
    name: str
    dept_name: str
    grade: int