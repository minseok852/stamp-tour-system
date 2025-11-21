#로그인
#회원가입 시 받아야 할 데이터 형식 (아이디 필수, 비밀번호 최소 길이 등)정의
from pydantic import BaseModel

class UserBase(BaseModel):
    student_id: str
    name: str
    phone_number: str
    dept_name: str
    grade: int
    gender: str

# 응답(Response) 모델: DB에서 데이터를 가져와 프론트에 보낼 때
class UserResponse(UserBase):
    created_at: str

    class Config:
        from_attributes = True