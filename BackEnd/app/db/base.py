#모든 모델을 import하는 파일
# BackEnd/app/db/base.py

from app.db.session import Base # 여기서 Base 클래스를 가져옵니다

# 모든 모델을 여기서 import하여 ORM이 DB 마이그레이션을 인식하게 합니다.
from app.models.user import User
from app.api.v1.endpoints.booths import Booth 
from app.api.v1.endpoints.stamps import Stamp
# from app.models.event import Event (나중에 추가)