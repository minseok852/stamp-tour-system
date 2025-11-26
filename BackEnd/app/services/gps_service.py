# app/services/gps_service.py
# GPS 좌표 거리 계산 (Haversine 공식)

import math

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    두 GPS 좌표 간의 거리를 계산합니다. (단위: 미터)
    
    Haversine 공식 사용
    
    Args:
        lat1: 사용자 위도
        lon1: 사용자 경도
        lat2: 부스 위도
        lon2: 부스 경도
        
    Returns:
        거리 (미터)
    """
    # 지구 반지름 (미터)
    R = 6371000
    
    # 라디안 변환
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine 공식
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * \
        math.sin(delta_lon / 2) ** 2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    
    return round(distance, 2)


def is_within_range(distance: float, max_distance: float = 5.0) -> bool:
    """
    거리가 허용 범위 내에 있는지 확인합니다.
    
    Args:
        distance: 계산된 거리 (미터)
        max_distance: 최대 허용 거리 (미터, 기본값: 5m)
        
    Returns:
        범위 내 여부
    """
    return distance <= max_distance


# 테스트 코드
if __name__ == "__main__":
    # 대진대 좌표 예시
    # 교육관: 37.6313, 127.2533
    # 대학원: 37.6318, 127.2538
    
    # 사용자가 교육관 근처에 있다고 가정
    user_lat = 37.6313
    user_lon = 127.2533
    
    # 교육관 부스 좌표
    booth_lat = 37.6313
    booth_lon = 127.2533
    
    distance = calculate_distance(user_lat, user_lon, booth_lat, booth_lon)
    print(f"거리: {distance}m")
    print(f"5m 이내: {is_within_range(distance, 5.0)}")
    
    # 멀리 떨어진 경우
    far_lat = 37.6318
    far_lon = 127.2538
    distance2 = calculate_distance(user_lat, user_lon, far_lat, far_lon)
    print(f"\n다른 부스까지 거리: {distance2}m")
    print(f"5m 이내: {is_within_range(distance2, 5.0)}")