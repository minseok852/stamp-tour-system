import re

def dms_to_decimal(dms_str):
    # 정규표현식으로 숫자와 방향 문자 추출
    # 숫자(정수 또는 소수점 포함)를 찾고 마지막에 N, S, E, W 중 하나를 찾음
    parts = re.findall(r"(\d+(?:\.\d+)?|[NSEW])", dms_str)
    
    degrees = float(parts[0])
    minutes = float(parts[1])
    seconds = float(parts[2])
    direction = parts[3]
    
    # 공식 적용
    decimal = degrees + (minutes / 60) + (seconds / 3600)
    
    # 남위(S)나 서경(W)일 경우 음수로 변환
    if direction in ['S', 'W']:
        decimal *= -1
        
    return round(decimal, 6) # 소수점 6자리까지 반올림

# 테스트 데이터
lat_input = '37°52\'26.00"N'
lon_input = '127°9\'30.60"E'

lat_decimal = dms_to_decimal(lat_input)
lon_decimal = dms_to_decimal(lon_input)

print(f"입력 위도: {lat_input} -> 변환: {lat_decimal}")
print(f"입력 경도: {lon_input} -> 변환: {lon_decimal}")