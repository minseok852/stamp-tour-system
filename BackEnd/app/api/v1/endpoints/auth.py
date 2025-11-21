#로그인/인증 (관리자, 사용자)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db # DB 세션 가져오기
from app.schemas.register import UserRegister
from app.schemas.user import UserResponse
from app.models.user import User # DB 모델
from app.core.security import get_password_hash # 비밀번호 해시 함수

router = APIRouter()

# DB 연결을 확인하고 데이터를 삽입하는 첫 번째 API
@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db) # DB 세션 주입
):
    # 1. 학번 중복 확인
    db_user = db.query(User).filter(User.student_id == user_data.student_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 학번입니다.")

    # 2. 비밀번호 해싱
    hashed_password = get_password_hash(user_data.password)

    # 3. User 모델 객체 생성
    new_user = User(
        student_id=user_data.student_id,
        password_hash=hashed_password,
        name=user_data.name,
        phone_number=user_data.phone_number,
        dept_name=user_data.dept_name,
        grade=user_data.grade,
        gender=user_data.gender
    )

    # 4. DB에 저장 및 커밋
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # DB에서 생성된 created_at 시간 등을 가져옴

    return new_user