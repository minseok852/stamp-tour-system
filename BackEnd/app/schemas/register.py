#회원가입 요청 및 응답 스키마
from pydantic import BaseModel
from .user import UserBase # UserBase 상속

class UserRegister(UserBase):
    password: str # 비밀번호는 등록 요청 시에만 필요