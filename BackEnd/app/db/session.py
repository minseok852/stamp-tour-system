#DB 세션 연결 설정
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. DB 연결 엔진 생성
engine = create_engine(settings.DATABASE_URL)

# 2. 세션 생성기 (실제 DB와 대화하는 객체)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. ORM 모델들이 상속받을 기본 클래스
Base = declarative_base()

# 4. DB 세션을 얻기 위한 의존성 함수 (API에서 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()