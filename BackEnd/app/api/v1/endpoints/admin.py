# BackEnd/app/api/v1/endpoints/admin.py
# 관리자 전용 API (설정 기능 추가)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date, time
from app.db.session import get_db
from app.api.v1.dependencies import get_current_admin
from app.models.user import User
from app.models.booth import Booth
from app.models.stamp import Stamp
from app.models.event import Event
from app.schemas.event import SettingsUpdate, BoothPinUpdate

router = APIRouter()


# ========================================
# 1. 관리자 대시보드 - 기본 통계
# ========================================
@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """대시보드 통계 데이터"""
    total_users = db.query(User).filter(User.role == 'user').count()
    total_booths = db.query(Booth).count()
    total_stamps = db.query(Stamp).count()
    
    event = db.query(Event).first()
    required_stamps = event.required_stamps if event else 15
    
    completed_users = db.query(Stamp.student_id).group_by(Stamp.student_id).having(
        func.count(Stamp.stamp_id) >= required_stamps
    ).count()
    
    thirty_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
    active_users = db.query(Stamp.student_id).filter(
        Stamp.acquired_at >= thirty_minutes_ago
    ).distinct().count()
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_users = db.query(User).filter(
        User.role == 'user',
        User.created_at >= today_start
    ).count()
    
    return {
        "total_users": total_users,
        "completed_users": completed_users,
        "total_stamps": total_stamps,
        "active_users": active_users,
        "total_booths": total_booths,
        "today_users": today_users,
        "today_completers": 0,
        "completion_rate": round((completed_users / total_users * 100) if total_users > 0 else 0, 1),
        "avg_stamps": round(total_stamps / total_users, 1) if total_users > 0 else 0
    }


# ========================================
# 2. QR/PIN/ADMIN 수집 비율
# ========================================
@router.get("/collection-stats")
def get_collection_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """스탬프 수집 방법별 비율"""
    total = db.query(Stamp).count()
    
    if total == 0:
        return {"qr": 0, "pin": 0, "admin": 0, "total": 0}
    
    qr_count = db.query(Stamp).filter(Stamp.method == 'QR').count()
    pin_count = db.query(Stamp).filter(Stamp.method == 'PIN').count()
    admin_count = db.query(Stamp).filter(Stamp.method == 'ADMIN').count()
    
    return {
        "qr": round(qr_count / total * 100, 1),
        "pin": round(pin_count / total * 100, 1),
        "admin": round(admin_count / total * 100, 1),
        "qr_count": qr_count,
        "pin_count": pin_count,
        "admin_count": admin_count,
        "total": total
    }


# ========================================
# 3. 의심 기록 조회
# ========================================
@router.get("/suspicious")
def get_suspicious_records(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    limit: int = Query(default=20, le=100)
):
    """의심 기록 조회"""
    suspicious_records = []
    recent_stamps = db.query(Stamp).order_by(Stamp.acquired_at.desc()).limit(500).all()
    
    student_stamps = {}
    for stamp in recent_stamps:
        if stamp.student_id not in student_stamps:
            student_stamps[stamp.student_id] = []
        student_stamps[stamp.student_id].append(stamp)
    
    for student_id, stamps in student_stamps.items():
        stamps_sorted = sorted(stamps, key=lambda x: x.acquired_at)
        
        for i in range(1, len(stamps_sorted)):
            time_diff = (stamps_sorted[i].acquired_at - stamps_sorted[i-1].acquired_at).total_seconds()
            
            if time_diff < 120:
                user = db.query(User).filter(User.student_id == student_id).first()
                booth = db.query(Booth).filter(Booth.booth_id == stamps_sorted[i].booth_id).first()
                
                suspicious_records.append({
                    "id": len(suspicious_records) + 1,
                    "student_id": student_id,
                    "name": user.name if user else "알 수 없음",
                    "booth": booth.booth_name if booth else "알 수 없음",
                    "time": stamps_sorted[i].acquired_at.isoformat(),
                    "reason": f"{int(time_diff)}초 내 연속 스캔",
                    "status": "미처리"
                })
    
    return suspicious_records[:limit]


# ========================================
# 4. 전체 사용자 목록
# ========================================
@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """전체 사용자 목록 조회"""
    query = db.query(User).filter(User.role == 'user')
    
    if search:
        query = query.filter(
            (User.student_id.contains(search)) | 
            (User.name.contains(search))
        )
    
    users = query.all()
    
    result = []
    for user in users:
        stamps = db.query(Stamp).filter(Stamp.student_id == user.student_id).all()
        stamp_count = len(stamps)
        stamp_ids = [s.booth_id for s in stamps]
        
        is_completed = stamp_count >= 15
        if status == 'completed' and not is_completed:
            continue
        if status == 'inProgress' and is_completed:
            continue
        
        result.append({
            "student_id": user.student_id,
            "name": user.name,
            "dept_name": user.dept_name,
            "grade": user.grade,
            "phone_number": user.phone_number,
            "stamp_count": stamp_count,
            "stamps": stamp_ids,
            "is_completed": is_completed,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return result


# ========================================
# 5. 완주자 목록
# ========================================
@router.get("/completers")
def get_completers(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """완주자 목록 조회"""
    event = db.query(Event).first()
    required_stamps = event.required_stamps if event else 15
    
    completer_ids = db.query(Stamp.student_id).group_by(Stamp.student_id).having(
        func.count(Stamp.stamp_id) >= required_stamps
    ).all()
    
    completer_ids = [sid[0] for sid in completer_ids]
    completers = db.query(User).filter(User.student_id.in_(completer_ids)).all()
    
    result = []
    for user in completers:
        stamps = db.query(Stamp).filter(Stamp.student_id == user.student_id).all()
        completion_time = max([s.acquired_at for s in stamps]) if stamps else None
        
        result.append({
            "student_id": user.student_id,
            "name": user.name,
            "dept_name": user.dept_name,
            "grade": user.grade,
            "phone_number": user.phone_number,
            "stamp_count": len(stamps),
            "completion_time": completion_time.isoformat() if completion_time else None
        })
    
    return result


# ========================================
# 6. 부스별 방문 통계
# ========================================
@router.get("/booths/stats")
def get_booth_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """부스별 방문 통계"""
    booths = db.query(Booth).all()
    total_users = db.query(User).filter(User.role == 'user').count()
    
    result = []
    for booth in booths:
        visit_count = db.query(Stamp).filter(Stamp.booth_id == booth.booth_id).count()
        qr_count = db.query(Stamp).filter(Stamp.booth_id == booth.booth_id, Stamp.method == 'QR').count()
        pin_count = db.query(Stamp).filter(Stamp.booth_id == booth.booth_id, Stamp.method == 'PIN').count()
        admin_count = db.query(Stamp).filter(Stamp.booth_id == booth.booth_id, Stamp.method == 'ADMIN').count()
        
        result.append({
            "booth_id": booth.booth_id,
            "booth_name": booth.booth_name,
            "location_name": booth.location_name,
            "icon": booth.icon,
            "visit_count": visit_count,
            "qr_count": qr_count,
            "pin_count": pin_count,
            "admin_count": admin_count,
            "visit_rate": round((visit_count / total_users * 100) if total_users > 0 else 0, 1)
        })
    
    result.sort(key=lambda x: x['visit_count'], reverse=True)
    return result


# ========================================
# 7. 특정 사용자 상세 정보
# ========================================
@router.get("/users/{student_id}")
def get_user_detail(
    student_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """특정 사용자의 상세 정보"""
    user = db.query(User).filter(User.student_id == student_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    stamps = db.query(Stamp).filter(Stamp.student_id == student_id).all()
    
    stamp_list = []
    for stamp in stamps:
        booth = db.query(Booth).filter(Booth.booth_id == stamp.booth_id).first()
        stamp_list.append({
            "stamp_id": stamp.stamp_id,
            "booth_id": stamp.booth_id,
            "booth_name": booth.booth_name if booth else "알 수 없음",
            "icon": booth.icon if booth else None,
            "acquired_at": stamp.acquired_at.isoformat() if stamp.acquired_at else None,
            "method": stamp.method
        })
    
    return {
        "student_id": user.student_id,
        "name": user.name,
        "dept_name": user.dept_name,
        "grade": user.grade,
        "phone_number": user.phone_number,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "stamp_count": len(stamps),
        "is_completed": len(stamps) >= 15,
        "stamps": stamp_list
    }


# ========================================
# 8. 관리자 스탬프 부여
# ========================================
@router.post("/grant-stamp")
def grant_stamp(
    student_id: str,
    booth_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """관리자가 직접 스탬프 부여"""
    user = db.query(User).filter(User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    existing = db.query(Stamp).filter(
        Stamp.student_id == student_id,
        Stamp.booth_id == booth_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 해당 부스의 스탬프를 획득했습니다.")
    
    new_stamp = Stamp(
        student_id=student_id,
        booth_id=booth_id,
        method='ADMIN'
    )
    
    db.add(new_stamp)
    db.commit()
    db.refresh(new_stamp)
    
    return {
        "success": True,
        "message": f"{user.name}님에게 [{booth.booth_name}] 스탬프가 부여되었습니다.",
        "stamp_id": new_stamp.stamp_id,
        "reason": reason
    }


# ========================================
# 9. 시간대별 통계
# ========================================
@router.get("/time-stats")
def get_time_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    date_str: Optional[str] = None
):
    """시간대별 스탬프 획득 통계"""
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            target_date = datetime.now(timezone.utc)
    else:
        target_date = datetime.now(timezone.utc)
    
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    time_stats = []
    for hour in range(9, 19):
        hour_start = start_of_day.replace(hour=hour)
        hour_end = start_of_day.replace(hour=hour, minute=59, second=59)
        
        count = db.query(Stamp).filter(
            Stamp.acquired_at >= hour_start,
            Stamp.acquired_at <= hour_end
        ).count()
        
        time_stats.append({
            "time": f"{hour:02d}:00",
            "count": count
        })
    
    return time_stats


# ========================================
# 10. 이벤트 설정 조회
# ========================================
@router.get("/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """이벤트 설정 조회"""
    event = db.query(Event).first()
    total_booths = db.query(Booth).count()
    
    if not event:
        return {
            "event_id": 0,
            "event_name": "스탬프 투어",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "start_time": "09:00",
            "end_time": "18:00",
            "required_stamps": 15,
            "total_booths": total_booths,
            "is_active": True,
            "gps_enabled": True,
            "gps_max_distance": 100,
            "gps_bypass_allowed": True
        }
    
    return {
        "event_id": event.event_id,
        "event_name": event.event_name,
        "start_date": event.start_date.strftime("%Y-%m-%d") if event.start_date else "",
        "end_date": event.end_date.strftime("%Y-%m-%d") if event.end_date else "",
        "start_time": event.start_time.strftime("%H:%M") if event.start_time else "09:00",
        "end_time": event.end_time.strftime("%H:%M") if event.end_time else "18:00",
        "required_stamps": event.required_stamps,
        "total_booths": total_booths,
        "is_active": event.is_active,
        "gps_enabled": event.gps_enabled,
        "gps_max_distance": event.gps_max_distance,
        "gps_bypass_allowed": event.gps_bypass_allowed
    }


# ========================================
# 11. 이벤트 설정 수정
# ========================================
@router.put("/settings")
def update_settings(
    settings: SettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """이벤트 설정 수정"""
    event = db.query(Event).first()
    
    if not event:
        event = Event(
            event_name=settings.event_name or "스탬프 투어",
            start_date=datetime.strptime(settings.start_date, "%Y-%m-%d").date() if settings.start_date else datetime.now().date(),
            end_date=datetime.strptime(settings.end_date, "%Y-%m-%d").date() if settings.end_date else (datetime.now() + timedelta(days=30)).date(),
            required_stamps=settings.required_stamps or 15,
            is_active=settings.is_active if settings.is_active is not None else True,
            gps_enabled=settings.gps_enabled if settings.gps_enabled is not None else True,
            gps_max_distance=settings.gps_max_distance or 100,
            gps_bypass_allowed=settings.gps_bypass_allowed if settings.gps_bypass_allowed is not None else True
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return {"success": True, "message": "설정이 생성되었습니다.", "event_id": event.event_id}
    
    if settings.event_name is not None:
        event.event_name = settings.event_name
    if settings.start_date is not None:
        event.start_date = datetime.strptime(settings.start_date, "%Y-%m-%d").date()
    if settings.end_date is not None:
        event.end_date = datetime.strptime(settings.end_date, "%Y-%m-%d").date()
    if settings.start_time is not None:
        event.start_time = datetime.strptime(settings.start_time, "%H:%M").time()
    if settings.end_time is not None:
        event.end_time = datetime.strptime(settings.end_time, "%H:%M").time()
    if settings.required_stamps is not None:
        event.required_stamps = settings.required_stamps
    if settings.is_active is not None:
        event.is_active = settings.is_active
    if settings.gps_enabled is not None:
        event.gps_enabled = settings.gps_enabled
    if settings.gps_max_distance is not None:
        event.gps_max_distance = settings.gps_max_distance
    if settings.gps_bypass_allowed is not None:
        event.gps_bypass_allowed = settings.gps_bypass_allowed
    
    db.commit()
    db.refresh(event)
    
    return {"success": True, "message": "설정이 저장되었습니다.", "event_id": event.event_id}


# ========================================
# 12. 부스 PIN 수정
# ========================================
@router.put("/booths/{booth_id}/pin")
def update_booth_pin(
    booth_id: int,
    pin_data: BoothPinUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """부스 PIN 수정"""
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    
    if not booth:
        raise HTTPException(status_code=404, detail="부스를 찾을 수 없습니다.")
    
    if len(pin_data.qr_pin) < 4:
        raise HTTPException(status_code=400, detail="PIN은 최소 4자리 이상이어야 합니다.")
    
    booth.qr_pin = pin_data.qr_pin
    db.commit()
    
    return {
        "success": True,
        "message": f"{booth.booth_name} 부스의 PIN이 수정되었습니다.",
        "booth_id": booth_id
    }


# ========================================
# 13. 전체 부스 PIN 목록 조회
# ========================================
@router.get("/booths/pins")
def get_all_booth_pins(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """전체 부스 PIN 목록 조회"""
    booths = db.query(Booth).all()
    
    return [
        {
            "booth_id": booth.booth_id,
            "booth_name": booth.booth_name,
            "location_name": booth.location_name,
            "icon": booth.icon,
            "qr_pin": booth.qr_pin
        }
        for booth in booths
    ]