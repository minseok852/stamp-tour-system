# BackEnd/app/api/v1/endpoints/users.py
# 사용자 정보 관리 API (마이페이지용)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.stamp import Stamp
from app.core.security import get_password_hash, verify_password

router = APIRouter()


# ========================================
# 스키마 정의
# ========================================
class PhoneUpdateRequest(BaseModel):
    """전화번호 변경 요청"""
    phone_number: str


class PasswordUpdateRequest(BaseModel):
    """비밀번호 변경 요청 (새 비밀번호만)"""
    new_password: str
    confirm_password: str


class UserProfileResponse(BaseModel):
    """사용자 프로필 응답"""
    student_id: str
    name: str
    phone_number: str
    dept_name: str
    grade: int
    gender: str
    role: str
    stamp_count: int
    is_completed: bool
    
    class Config:
        from_attributes = True


# ========================================
# 1. 내 프로필 조회 (상세 정보 + 스탬프 현황)
# ========================================
@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    현재 로그인한 사용자의 상세 정보 조회
    스탬프 현황 포함
    """
    # 스탬프 개수 조회
    stamp_count = db.query(Stamp).filter(
        Stamp.student_id == current_user.student_id
    ).count()
    
    # 완주 여부 (15개 기준)
    is_completed = stamp_count >= 15
    
    return {
        "student_id": current_user.student_id,
        "name": current_user.name,
        "phone_number": current_user.phone_number,
        "dept_name": current_user.dept_name,
        "grade": current_user.grade,
        "gender": current_user.gender,
        "role": current_user.role,
        "stamp_count": stamp_count,
        "is_completed": is_completed
    }


# ========================================
# 2. 전화번호 변경
# ========================================
@router.put("/me/phone")
def update_phone_number(
    request: PhoneUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    전화번호 변경
    """
    new_phone = request.phone_number.strip()
    
    # 유효성 검사 (간단한 형식 체크)
    if len(new_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="올바른 전화번호 형식이 아닙니다."
        )
    
    # 중복 검사 (다른 사용자가 사용 중인지)
    existing_user = db.query(User).filter(
        User.phone_number == new_phone,
        User.student_id != current_user.student_id
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 전화번호입니다."
        )
    
    # 전화번호 업데이트
    current_user.phone_number = new_phone
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True,
        "message": "전화번호가 변경되었습니다.",
        "phone_number": current_user.phone_number
    }


# ========================================
# 3. 비밀번호 변경 (새 비밀번호만 입력)
# ========================================
@router.put("/me/password")
def update_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    비밀번호 변경 (새 비밀번호만 입력하는 간단한 방식)
    이미 로그인한 상태이므로 현재 비밀번호 검증 생략
    """
    new_password = request.new_password
    confirm_password = request.confirm_password
    
    # 유효성 검사
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 6자 이상이어야 합니다."
        )
    
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다."
        )
    
    # 비밀번호 해싱 후 저장
    hashed_password = get_password_hash(new_password)
    current_user.password_hash = hashed_password
    
    db.commit()
    
    return {
        "success": True,
        "message": "비밀번호가 변경되었습니다."
    }


# ========================================
# 4. 내 스탬프 요약 정보
# ========================================
@router.get("/me/stamps-summary")
def get_my_stamps_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    내 스탬프 요약 정보 (마이페이지용)
    """
    stamp_count = db.query(Stamp).filter(
        Stamp.student_id == current_user.student_id
    ).count()
    
    total_booths = 15  # 전체 부스 수
    remaining = max(0, total_booths - stamp_count)
    is_completed = stamp_count >= total_booths
    
    return {
        "student_id": current_user.student_id,
        "stamp_count": stamp_count,
        "total_booths": total_booths,
        "remaining": remaining,
        "is_completed": is_completed,
        "completion_rate": round((stamp_count / total_booths) * 100, 1)
    }