#관리자 용 대시보드 데이터, QR 관리
# app/api/v1/endpoints/admin.py
# 관리자 전용 API

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.session import get_db
from app.api.v1.dependencies import get_current_admin
from app.models.user import User
from app.models.booth import Booth
from app.models.stamp import Stamp

router = APIRouter()

# ========================================
# 관리자 대시보드 - 통계
# ========================================

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)  # 관리자만 접근 가능!
):
    """
    대시보드 통계 데이터
    - 관리자 권한 필요
    """
    # 전체 사용자 수
    total_users = db.query(User).filter(User.role == 'user').count()
    
    # 전체 부스 수
    total_booths = db.query(Booth).count()
    
    # 전체 스탬프 수
    total_stamps = db.query(Stamp).count()
    
    # 완주자 수 (14개 다 모은 사람)
    completers = db.query(Stamp.student_id).group_by(Stamp.student_id).having(
        func.count(Stamp.stamp_id) >= 14
    ).count()
    
    # 평균 스탬프 개수
    avg_stamps = db.query(func.avg(func.count(Stamp.stamp_id))).select_from(Stamp).group_by(Stamp.student_id).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_booths": total_booths,
        "total_stamps": total_stamps,
        "completers": completers,
        "avg_stamps": round(float(avg_stamps), 2),
        "completion_rate": round((completers / total_users * 100) if total_users > 0 else 0, 2)
    }


# ========================================
# 관리자 - 전체 사용자 목록
# ========================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    전체 사용자 목록 조회
    - 관리자 권한 필요
    """
    users = db.query(User).filter(User.role == 'user').all()
    
    result = []
    for user in users:
        stamp_count = db.query(Stamp).filter(Stamp.student_id == user.student_id).count()
        result.append({
            "student_id": user.student_id,
            "name": user.name,
            "dept_name": user.dept_name,
            "grade": user.grade,
            "stamp_count": stamp_count,
            "is_completed": stamp_count >= 14,
            "created_at": user.created_at
        })
    
    return result


# ========================================
# 관리자 - 완주자 목록
# ========================================

@router.get("/completers")
def get_completers(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    완주자 목록 조회 (14개 다 모은 사람)
    - 관리자 권한 필요
    """
    # 14개 이상 모은 학생 찾기
    completer_ids = db.query(Stamp.student_id).group_by(Stamp.student_id).having(
        func.count(Stamp.stamp_id) >= 14
    ).all()
    
    completer_ids = [sid[0] for sid in completer_ids]
    
    completers = db.query(User).filter(User.student_id.in_(completer_ids)).all()
    
    result = []
    for user in completers:
        stamps = db.query(Stamp).filter(Stamp.student_id == user.student_id).all()
        result.append({
            "student_id": user.student_id,
            "name": user.name,
            "dept_name": user.dept_name,
            "grade": user.grade,
            "stamp_count": len(stamps),
            "completion_date": max([s.acquired_at for s in stamps])
        })
    
    return result


# ========================================
# 관리자 - 부스별 방문 통계
# ========================================

@router.get("/booths/stats")
def get_booth_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    부스별 방문 통계
    - 관리자 권한 필요
    """
    booths = db.query(Booth).all()
    
    result = []
    for booth in booths:
        visit_count = db.query(Stamp).filter(Stamp.booth_id == booth.booth_id).count()
        result.append({
            "booth_id": booth.booth_id,
            "booth_name": booth.booth_name,
            "location_name": booth.location_name,
            "visit_count": visit_count,
            "visit_rate": round((visit_count / db.query(User).filter(User.role == 'user').count() * 100) if db.query(User).filter(User.role == 'user').count() > 0 else 0, 2)
        })
    
    # 방문 횟수 많은 순으로 정렬
    result.sort(key=lambda x: x['visit_count'], reverse=True)
    
    return result


# ========================================
# 관리자 - 특정 사용자 상세 정보
# ========================================

@router.get("/users/{student_id}")
def get_user_detail(
    student_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    특정 사용자의 상세 정보 및 스탬프 현황
    - 관리자 권한 필요
    """
    user = db.query(User).filter(User.student_id == student_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    stamps = db.query(Stamp).filter(Stamp.student_id == student_id).all()
    
    stamp_list = []
    for stamp in stamps:
        booth = db.query(Booth).filter(Booth.booth_id == stamp.booth_id).first()
        stamp_list.append({
            "booth_name": booth.booth_name if booth else "알 수 없음",
            "acquired_at": stamp.acquired_at,
            "method": stamp.method
        })
    
    return {
        "student_id": user.student_id,
        "name": user.name,
        "dept_name": user.dept_name,
        "grade": user.grade,
        "phone_number": user.phone_number,
        "created_at": user.created_at,
        "stamp_count": len(stamps),
        "is_completed": len(stamps) >= 14,
        "stamps": stamp_list
    }