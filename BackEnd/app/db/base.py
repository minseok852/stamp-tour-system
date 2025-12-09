#모든 모델을 import하는 파일
# BackEnd/app/db/base.py

from app.db.session import Base # 여기서 Base 클래스를 가져옵니다

# 이제 모든 모델을 models 폴더에서 가져와서 ORM이 DB 마이그레이션을 인식하게 합니다.
from app.models.user import User
from app.models.booth import Booth # <--- 이제 models 폴더에서 가져옵니다!
from app.models.stamp import Stamp # <--- 이제 models 폴더에서 가져옵니다!
from app.models.event import Event 