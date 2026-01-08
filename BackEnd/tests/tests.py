def dms_to_decimal(degree, minute, second, direction):
    """DMS(도분초) 형식을 소수점 형식으로 변환"""
    decimal = degree + minute/60 + second/3600
    if direction in ['S', 'W']:
        decimal *= -1
    return decimal

def parse_coordinate(coord_str):
    """
    '37°52.2600'N' 형식의 문자열을 파싱하여 degree, minute, second 추출
    """
    # 도(°) 기준으로 나누기
    parts = coord_str.replace('°', ' ').replace("'", ' ').split()
    
    degree = int(parts[0])
    minute_second = float(parts[1])
    direction = parts[2]
    
    # 분.초 형식에서 분과 초 분리
    minute = int(minute_second)
    second = (minute_second - minute) * 60
    
    return degree, minute, second, direction

def main():
    print("=" * 50)
    print("GPS 좌표 변환기 (DMS → Decimal)")
    print("=" * 50)
    print("\n입력 형식: 37°52.2600'N (도°분.초'방향)")
    print("방향: N(북), S(남), E(동), W(서)\n")
    
    while True:
        # 위도 입력
        latitude_input = input("위도를 입력하세요 (예: 37°52.2600'N): ").strip()
        if not latitude_input:
            print("입력이 비어있습니다. 다시 시도하세요.\n")
            continue
            
        try:
            lat_degree, lat_minute, lat_second, lat_direction = parse_coordinate(latitude_input)
            latitude = dms_to_decimal(lat_degree, lat_minute, lat_second, lat_direction)
            print(f"✓ 위도 변환 완료: {latitude:.4f}\n")
            break
        except (ValueError, IndexError):
            print("❌ 입력 형식이 잘못되었습니다. 다시 시도하세요.\n")
    
    while True:
        # 경도 입력
        longitude_input = input("경도를 입력하세요 (예: 127°9.3060'E): ").strip()
        if not longitude_input:
            print("입력이 비어있습니다. 다시 시도하세요.\n")
            continue
            
        try:
            lon_degree, lon_minute, lon_second, lon_direction = parse_coordinate(longitude_input)
            longitude = dms_to_decimal(lon_degree, lon_minute, lon_second, lon_direction)
            print(f"✓ 경도 변환 완료: {longitude:.4f}\n")
            break
        except (ValueError, IndexError):
            print("❌ 입력 형식이 잘못되었습니다. 다시 시도하세요.\n")
    
    # 결과 출력
    print("=" * 50)
    print("📍 변환 결과")
    print("=" * 50)
    print(f"위도: {latitude:.4f}")
    print(f"경도: {longitude:.4f}")
    print(f"\n한 줄 형식: {latitude:.4f}, {longitude:.4f}")
    print("=" * 50)
    
    # 추가 변환 여부
    while True:
        again = input("\n다시 변환하시겠습니까? (y/n): ").strip().lower()
        if again == 'y':
            print("\n")
            main()
            break
        elif again == 'n':
            print("프로그램을 종료합니다.")
            break
        else:
            print("y 또는 n을 입력하세요.")

if __name__ == "__main__":
    main()