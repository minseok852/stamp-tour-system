// src/components/KakaoMap.jsx
// 카카오맵 공통 컴포넌트 - 지도 초기화, 마커, 혼잡도 표시
import React, { useEffect, useRef, useState } from 'react';
import '../styles/Kakaomap.css';

const KakaoMap = ({
    markers = [],           // 마커 목록 [{ id, name, lat, lng, icon, congestion }]
    center = null,          // 지도 중심 좌표 { lat, lng } - null이면 대진대 중심
    level = 3,              // 지도 확대 레벨 (1~14, 작을수록 확대)
    onMarkerClick = null,   // 마커 클릭 콜백 (marker) => {}
    showCongestion = false, // 혼잡도 표시 여부
    height = '500px',       // 지도 높이
    showCurrentLocation = true, // 현재 위치 표시 여부
}) => {
    const mapRef = useRef(null);           // 지도 DOM 참조
    const mapInstanceRef = useRef(null);   // 카카오맵 인스턴스
    const markersRef = useRef([]);         // 마커 인스턴스들
    const currentMarkerRef = useRef(null); // 현재 위치 마커

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);

    // 대진대학교 중심 좌표 (기본값)
    const DAEJIN_CENTER = {
        lat: 37.8714,
        lng: 127.1558
    };

    // 혼잡도 레벨 계산 (방문자 수 기준)
    // 0~5명: 여유 (초록), 6~15명: 보통 (주황), 16명+: 혼잡 (빨강)
    const getCongestionInfo = (count) => {
        if (count <= 5) {
            return { level: 'low', label: '여유', color: '#48BB78' };
        } else if (count <= 15) {
            return { level: 'medium', label: '보통', color: '#F6AD55' };
        } else {
            return { level: 'high', label: '혼잡', color: '#E53E3E' };
        }
    };

    // 카카오맵 스크립트 로드
    useEffect(() => {
        const loadKakaoMap = () => {
            // 이미 로드되어 있는지 확인
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    setIsLoaded(true);
                });
                return;
            }

            // 스크립트 동적 로드
            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
            
            if (!apiKey) {
                setError('카카오맵 API 키가 설정되지 않았습니다.');
                return;
            }

            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
            script.async = true;
            
            script.onload = () => {
                window.kakao.maps.load(() => {
                    setIsLoaded(true);
                });
            };

            script.onerror = () => {
                setError('카카오맵 스크립트 로드에 실패했습니다.');
            };

            document.head.appendChild(script);
        };

        loadKakaoMap();
    }, []);

    // 지도 초기화
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        const kakao = window.kakao;
        const centerCoord = center || DAEJIN_CENTER;

        const options = {
            center: new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng),
            level: level
        };

        const map = new kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;

        // 지도 컨트롤 추가
        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

        // 현재 위치 가져오기 (실시간 추적)
        if (showCurrentLocation && navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentPosition(pos);
                },
                (err) => {
                    console.log('현재 위치를 가져올 수 없습니다:', err.message);
                },
                { enableHighAccuracy: true, maximumAge: 10000 }
            );
        }

        return () => {
            // 클린업
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
            if (currentMarkerRef.current) {
                currentMarkerRef.current.setMap(null);
            }
        };
    }, [isLoaded, center, level, showCurrentLocation]);

    // 현재 위치 마커 표시
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !currentPosition) return;

        const kakao = window.kakao;
        const map = mapInstanceRef.current;

        // 기존 현재 위치 마커 제거
        if (currentMarkerRef.current) {
            currentMarkerRef.current.setMap(null);
        }

        // 현재 위치 마커 생성 (파란 점 + pulse 애니메이션)
        const markerContent = document.createElement('div');
        markerContent.className = 'current-location-marker';
        markerContent.innerHTML = `
            <div class="pulse"></div>
            <div class="dot"></div>
        `;

        const customOverlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
            content: markerContent,
            yAnchor: 0.5,
            xAnchor: 0.5
        });

        customOverlay.setMap(map);
        currentMarkerRef.current = customOverlay;
    }, [isLoaded, currentPosition]);

    // 마커 표시
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || markers.length === 0) return;

        const kakao = window.kakao;
        const map = mapInstanceRef.current;

        // 기존 마커 제거
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // 새 마커 추가
        markers.forEach((markerData) => {
            const position = new kakao.maps.LatLng(markerData.lat, markerData.lng);

            // 혼잡도 정보 계산
            const congestionInfo = getCongestionInfo(markerData.congestion || 0);
            const markerColor = showCongestion ? congestionInfo.color : '#0D4E8C';

            // 커스텀 마커 콘텐츠 (DOM 요소로 생성)
            const content = document.createElement('div');
            content.className = `custom-marker congestion-${congestionInfo.level}`;
            content.style.setProperty('--marker-color', markerColor);
            content.innerHTML = `
                <div class="marker-icon">${markerData.icon || '📍'}</div>
                <div class="marker-label">${markerData.name}</div>
                ${showCongestion ? `
                    <div class="congestion-badge" style="background: ${markerColor}">
                        ${congestionInfo.label}
                    </div>
                ` : ''}
            `;

            // 클릭 이벤트 추가
            if (onMarkerClick) {
                content.addEventListener('click', () => {
                    onMarkerClick(markerData);
                });
                content.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    onMarkerClick(markerData);
                });
            }

            const customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1.2,
                clickable: true
            });

            customOverlay.setMap(map);
            markersRef.current.push(customOverlay);
        });

        // 마커들이 모두 보이도록 지도 범위 조정
        if (markers.length > 1) {
            const bounds = new kakao.maps.LatLngBounds();
            markers.forEach(m => {
                bounds.extend(new kakao.maps.LatLng(m.lat, m.lng));
            });
            map.setBounds(bounds);
        }
    }, [isLoaded, markers, showCongestion, onMarkerClick]);

    // 에러 상태
    if (error) {
        return (
            <div className="kakao-map-error" style={{ height }}>
                <div className="error-icon">⚠️</div>
                <div className="error-message">{error}</div>
                <div className="error-hint">
                    .env 파일에 VITE_KAKAO_MAP_KEY를 설정했는지 확인하세요.
                </div>
            </div>
        );
    }

    // 로딩 상태
    if (!isLoaded) {
        return (
            <div className="kakao-map-loading" style={{ height }}>
                <div className="loading-spinner"></div>
                <div className="loading-text">지도를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="kakao-map-container">
            <div 
                ref={mapRef} 
                className="kakao-map"
                style={{ height }}
            />

            {/* 현재 위치 버튼 */}
            {showCurrentLocation && (
                <button 
                    className="current-location-btn"
                    onClick={() => {
                        if (currentPosition && mapInstanceRef.current) {
                            const kakao = window.kakao;
                            mapInstanceRef.current.setCenter(
                                new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng)
                            );
                            mapInstanceRef.current.setLevel(3);
                        }
                    }}
                    title="현재 위치로 이동"
                >
                    📍
                </button>
            )}
        </div>
    );
};

export default KakaoMap;