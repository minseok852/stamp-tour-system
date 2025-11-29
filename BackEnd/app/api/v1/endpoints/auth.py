# app/api/v1/endpoints/auth.py
# 로그인/인증 (관리자, 사용자)
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.session import get_db
from app.schemas.register import UserRegister
from app.schemas.user import UserResponse, UserLogin
from app.schemas.token import Token
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

# OAuth2 설정 (JWT 토큰 인증)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# 학번 중복 확인 API
@router.get("/check-student-id/{student_id}")
def check_student_id(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    학번 중복 여부를 확인합니다.
    사용 가능하면 {"available": true}, 중복이면 {"available": false} 반환
    """
    db_user = db.query(User).filter(User.student_id == student_id).first()
    
    if db_user:
        return {"available": False, "message": "이미 사용 중인 학번입니다."}
    
    return {"available": True, "message": "사용 가능한 학번입니다."}

# 회원가입 API
@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    새로운 사용자를 등록합니다.
    """
    # 1. 학번 중복 확인
    db_user = db.query(User).filter(User.student_id == user_data.student_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 학번입니다.")

    # 2. 전화번호 중복 확인
    db_phone = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if db_phone:
        raise HTTPException(status_code=400, detail="이미 등록된 전화번호입니다.")

    # 3. 비밀번호 해싱
    hashed_password = get_password_hash(user_data.password)

    # 4. User 모델 객체 생성
    new_user = User(
        student_id=user_data.student_id,
        password_hash=hashed_password,
        name=user_data.name,
        phone_number=user_data.phone_number,
        dept_name=user_data.dept_name,
        grade=user_data.grade,
        gender=user_data.gender
    )

    # 5. DB에 저장 및 커밋
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# 로그인 API
@router.post("/login", response_model=Token)
def login_user(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    학번과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.
    """
    # 1. 학번으로 사용자 조회
    user = db.query(User).filter(User.student_id == user_credentials.student_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="학번 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. 비밀번호 검증
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="학번 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. JWT 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.student_id,  # subject (주체)
            "name": user.name,
            "dept_name": user.dept_name
        },
        expires_delta=access_token_expires
    )

    # 4. 토큰 반환
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "student_id": user.student_id,
            "name": user.name,
            "dept_name": user.dept_name,
            "grade": user.grade,
            "role": user.role
        }
    }


# 현재 로그인한 사용자 정보 조회 (JWT 토큰 검증)
@router.get("/me", response_model=UserResponse)
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    JWT 토큰을 검증하고 현재 로그인한 사용자 정보를 반환합니다.
    """
    from app.core.security import decode_access_token
    
    # 1. 토큰 디코딩
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    student_id: str = payload.get("sub")
    if student_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에서 사용자 정보를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. DB에서 사용자 조회
    user = db.query(User).filter(User.student_id == student_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user