#core는 핵심 설정 폴더입니다
#환경 변수(DB URL, 시크릿 키 등) 설정
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # .env 파일에서 읽어올 변수들 정의
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120 #2시간으로 수정 --> 30분 너무 짧음

    class Config:
        # .env 파일 위치 지정
        env_file = ".env"

settings = Settings()