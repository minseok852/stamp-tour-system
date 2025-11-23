from pydantic import BaseModel

# 로그인 요청 시 필요한 스키마
class TokenRequest(BaseModel):
    student_id: str
    password: str

# 로그인 성공 시 반환할 JWT 토큰 응답 스키마
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"