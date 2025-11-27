# app/schemas/user.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    student_id: str
    name: str
    phone_number: str
    dept_name: str
    grade: int
    gender: str
    role: str = 'user'

class UserLogin(BaseModel):
    student_id: str
    password: str

class UserResponse(UserBase):
    created_at: datetime  # 이 줄!
    
    class Config:
        from_attributes = True

class UserInfo(BaseModel):
    student_id: str
    name: str
    dept_name: str
    grade: int
    role: str