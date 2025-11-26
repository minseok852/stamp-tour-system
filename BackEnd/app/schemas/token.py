# app/schemas/token.py
# JWT 토큰 관련 스키마
from pydantic import BaseModel
from typing import Optional
from .user import UserInfo

# 토큰 응답 스키마
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo

# 토큰 데이터 (디코딩된 페이로드)
class TokenData(BaseModel):
    student_id: Optional[str] = None
    name: Optional[str] = None
    dept_name: Optional[str] = None