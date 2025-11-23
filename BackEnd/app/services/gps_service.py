#복잡한 비즈니스 로직 분리
#위치 기반 부정행위 검증 로직

# BackEnd/app/services/gps_service.py

import math

# 지구 반지름 (단위: 미터)
R = 6371000

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine 공식으로 두 위도/경도 쌍 사이의 거리를 미터 단위로 계산합니다.
    """
    # 1. 라디안으로 변환
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # 2. 위도/경도 차이
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    # 3. Haversine 공식 적용
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # 4. 거리 계산 (미터)
    distance = R * c
    return distance