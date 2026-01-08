// src/components/GoogleMap.jsx
// 구글맵 공통 컴포넌트 - 지도 초기화, 마커, 혼잡도 표시
// ✅ mapId 추가 - AdvancedMarkerElement 정상 작동

import React, { useEffect, useRef, useState } from 'react';
import '../styles/GoogleMap.css';

const GoogleMap = ({
    markers = [],           // 마커 목록 [{ id, name, lat, lng, icon, congestion }]
    center = null,          // 지도 중심 좌표 { lat, lng } - null이면 대진대 중심
    zoom = 17,              // 지도 줌 레벨 (1~20)
    onMarkerClick = null,   // 마커 클릭 콜백 (marker) => {}
    showCongestion = false, // 혼잡도 표시 여부
    height = '500px',       // 지도 높이
    showCurrentLocation = true, // 현재 위치 표시 여부
}) => {
    const mapRef = useRef(null);           // 지도 DOM 참조
    const mapInstanceRef = useRef(null);   // 구글맵 인스턴스
    const markersRef = useRef([]);         // 마커 인스턴스들
    const currentMarkerRef = useRef(null); // 현재 위치 마커
    const infoWindowRef = useRef(null);    // 정보 윈도우

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);

    // 대진대학교 중심 좌표 (기본값)
    const DAEJIN_CENTER = {
        lat: 37.8714,
        lng: 127.1558
    };

    // 혼잡도 레벨 계산 (방문자 수 기준)
    const getCongestionInfo = (count) => {
        if (count <= 5) {
            return { level: 'low', label: '여유', color: '#48BB78' };
        } else if (count <= 15) {
            return { level: 'medium', label: '보통', color: '#F6AD55' };
        } else {
            return { level: 'high', label: '혼잡', color: '#E53E3E' };
        }
    };
    
    // ✅ 구글맵 스크립트 로드 (StrictMode 중복 로드 방지)
    useEffect(() => {
        const loadGoogleMap = () => {
            // ✅ 1단계: 이미 완전히 로드되었는지 확인
            if (window.google && window.google.maps) {
                console.log('✅ Google Maps 이미 로드됨');
                setIsLoaded(true);
                return;
            }

            // ✅ 2단계: 현재 로드 중인지 확인 (StrictMode 대비)
            if (window.googleMapsLoading) {
                console.log('⏳ Google Maps 로드 중... (다른 컴포넌트 대기 중)');
                // 로드 완료 대기
                const checkInterval = setInterval(() => {
                    if (window.google && window.google.maps) {
                        clearInterval(checkInterval);
                        console.log('✅ Google Maps 로드 완료 감지');
                        setIsLoaded(true);
                    }
                }, 100);
                // 최대 10초 대기
                setTimeout(() => clearInterval(checkInterval), 10000);
                return;
            }

            // ✅ 3단계: 기존 스크립트가 이미 DOM에 있는지 확인
            const existingScript = document.querySelector(
                'script[src*="maps.googleapis.com"]'
            );
            if (existingScript) {
                console.log('✅ Google Maps 스크립트 이미 DOM에 존재');
                // 스크립트가 로드되면 상태 업데이트
                if (existingScript.onload) {
                    existingScript.onload();
                } else {
                    setIsLoaded(true);
                }
                return;
            }

            // ✅ 4단계: 스크립트 로드 시작 플래그 설정
            window.googleMapsLoading = true;

            const apiKey = import.meta.env.VITE_GOOGLE_MAP_KEY;
            const mapsId = import.meta.env.VITE_GOOGLE_MAPS_ID;
            
            if (!apiKey) {
                setError('❌ 구글맵 API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
                window.googleMapsLoading = false;
                return;
            }

            if (!mapsId) {
                setError('❌ 구글맵 Maps ID가 설정되지 않았습니다. .env 파일을 확인하세요.');
                window.googleMapsLoading = false;
                return;
            }

            // 스크립트 동적 로드
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&maps_ids=${mapsId}`;

            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('✅ Google Maps 스크립트 로드 완료');
                window.googleMapsLoading = false;
                setIsLoaded(true);
            };

            script.onerror = () => {
                console.error('❌ 구글맵 스크립트 로드 실패');
                setError('❌ 구글맵 스크립트 로드에 실패했습니다. API 키와 Maps ID를 확인하세요.');
                window.googleMapsLoading = false;
            };

            document.head.appendChild(script);
        };

        loadGoogleMap();
    }, []);

    // ✅ 지도 초기화 (에러 처리 강화)
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        try {
            const google = window.google;
            if (!google || !google.maps) {
                setError('❌ Google Maps API가 제대로 로드되지 않았습니다.');
                return;
            }

            const centerCoord = center || DAEJIN_CENTER;
            const mapsId = import.meta.env.VITE_GOOGLE_MAPS_ID;

            // ✅ 기본 옵션
            const mapOptions = {
                zoom: zoom,
                center: {
                    lat: centerCoord.lat,
                    lng: centerCoord.lng
                },
                mapId: mapsId,  // ✅ Maps ID 추가! (AdvancedMarkerElement 필수)
                mapTypeControl: true,
                zoomControl: true,
                fullscreenControl: true,
            };

            // ✅ ControlPosition 안전하게 추가 (undefined 체크)
            if (google.maps.ControlPosition) {
                mapOptions.mapTypeControlOptions = {
                    style: google.maps.MapTypeControlStyle?.DROPDOWN_MENU || google.maps.MapTypeControlStyle?.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_LEFT
                };
                mapOptions.zoomControlOptions = {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                };
                mapOptions.fullscreenControlOptions = {
                    position: google.maps.ControlPosition.TOP_RIGHT
                };
            }

            const map = new google.maps.Map(mapRef.current, mapOptions);
            mapInstanceRef.current = map;

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
                if (infoWindowRef.current) {
                    infoWindowRef.current.close();
                }
            };
        } catch (err) {
            setError(`❌ 지도 초기화 오류: ${err.message}`);
        }
    }, [isLoaded, center, zoom, showCurrentLocation]);

    // ✅ 현재 위치 마커 표시
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !currentPosition) return;

        try {
            const google = window.google;
            const map = mapInstanceRef.current;

            // 기존 현재 위치 마커 제거
            if (currentMarkerRef.current) {
                currentMarkerRef.current.setMap(null);
            }

            // ✅ 구글맵 AdvancedMarkerElement 사용 (현재 위치)
            const currentLocationContent = document.createElement('div');
            currentLocationContent.className = 'current-location-marker';
            currentLocationContent.innerHTML = `
                <div class="pulse"></div>
                <div class="dot"></div>
            `;

            const currentMarker = new google.maps.marker.AdvancedMarkerElement({
                position: {
                    lat: currentPosition.lat,
                    lng: currentPosition.lng
                },
                map: map,
                content: currentLocationContent,
                title: '현재 위치'
            });

            currentMarkerRef.current = currentMarker;
        } catch (err) {
            console.error('현재 위치 마커 오류:', err.message);
        }
    }, [isLoaded, currentPosition]);

    // ✅ 마커 표시
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || markers.length === 0) return;

        try {
            const google = window.google;
            const map = mapInstanceRef.current;

            // 기존 마커 제거
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            // 새 마커 추가
            markers.forEach((markerData) => {
                const congestionInfo = getCongestionInfo(markerData.congestion || 0);
                const markerColor = showCongestion ? congestionInfo.color : '#0D4E8C';

                // ✅ 커스텀 마커 콘텐츠 생성
                const markerContent = document.createElement('div');
                markerContent.className = `custom-marker congestion-${congestionInfo.level}`;
                markerContent.style.setProperty('--marker-color', markerColor);
                markerContent.innerHTML = `
                    <div class="marker-icon">${markerData.icon || '📍'}</div>
                    <div class="marker-label">${markerData.name}</div>
                    ${showCongestion ? `
                        <div class="congestion-badge" style="background: ${markerColor}">
                            ${congestionInfo.label}
                        </div>
                    ` : ''}
                `;

                // ✅ AdvancedMarkerElement 사용
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: {
                        lat: markerData.lat,
                        lng: markerData.lng
                    },
                    map: map,
                    content: markerContent,
                    title: markerData.name
                });

                // 마커 클릭 이벤트
                marker.addListener('click', () => {
                    if (onMarkerClick) {
                        onMarkerClick(markerData);
                    }
                });

                markersRef.current.push(marker);
            });

            // 모든 마커가 보이도록 지도 범위 조정
            if (markers.length > 1) {
                const bounds = new google.maps.LatLngBounds();
                markers.forEach(m => {
                    bounds.extend({
                        lat: m.lat,
                        lng: m.lng
                    });
                });
                map.fitBounds(bounds);
            } else if (markers.length === 1) {
                map.setCenter({
                    lat: markers[0].lat,
                    lng: markers[0].lng
                });
            }
        } catch (err) {
            console.error('마커 표시 오류:', err.message);
        }
    }, [isLoaded, markers, showCongestion, onMarkerClick]);

    // ✅ 에러 상태
    if (error) {
        return (
            <div className="google-map-error" style={{ height }}>
                <div className="error-icon">⚠️</div>
                <div className="error-message">{error}</div>
                <div className="error-hint">
                    <strong>.env 파일에 다음을 추가하세요:</strong>
                    <br />
                    <code>VITE_GOOGLE_MAP_KEY=your_api_key</code>
                    <br />
                    <code>VITE_GOOGLE_MAPS_ID=your_maps_id</code>
                </div>
            </div>
        );
    }

    // ✅ 로딩 상태
    if (!isLoaded) {
        return (
            <div className="google-map-loading" style={{ height }}>
                <div className="loading-spinner"></div>
                <div className="loading-text">지도를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="google-map-container">
            <div 
                ref={mapRef} 
                className="google-map"
                style={{ height }}
            />

            {/* 현재 위치 버튼 */}
            {showCurrentLocation && (
                <button 
                    className="current-location-btn"
                    onClick={() => {
                        if (currentPosition && mapInstanceRef.current) {
                            mapInstanceRef.current.setCenter({
                                lat: currentPosition.lat,
                                lng: currentPosition.lng
                            });
                            mapInstanceRef.current.setZoom(17);
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

export default GoogleMap;