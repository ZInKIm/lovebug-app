# 러브버그 퇴치기 앱

React Native (Expo) 기반 러브버그 대응 앱 MVP

## 시작하기

### 1. Node.js 설치 확인
```bash
node -v  # 18 이상 권장
```

### 2. Expo CLI 설치
```bash
npm install -g expo-cli
```

### 3. 패키지 설치
```bash
cd lovebug-app
npm install
```

### 4. Slider 패키지 추가 설치
```bash
npx expo install @react-native-community/slider
```

### 5. 실행

**Android 에뮬레이터 (Android Studio 열어둔 상태에서)**
```bash
npx expo start --android
```

**iOS 시뮬레이터 (Mac 전용)**
```bash
npx expo start --ios
```

**실제 폰 테스트 (iOS/Android 둘 다)**
1. 폰에 Expo Go 앱 설치
2. `npx expo start` 실행
3. QR코드 스캔

---

## 프로젝트 구조

```
lovebug-app/
├── App.js                    ← 진입점, 탭 네비게이션
├── src/
│   ├── screens/
│   │   ├── GuideScreen.js    ← 대응 가이드 (메인)
│   │   ├── RepelScreen.js    ← 퇴치 도구
│   │   └── ForecastScreen.js ← 예보
│   ├── components/
│   │   └── ActionCard.js     ← 접이식 가이드 카드
│   └── data/
│       └── guide.js          ← 가이드 콘텐츠 + 예보 데이터
```

---

## 다음 단계

### 오디오 실제 출력 붙이기
```bash
npx expo install expo-av
```
RepelScreen.js에서 `expo-av`의 `Audio` API로 oscillator 구현

### 네이버 카페 URL 교체
`src/data/guide.js`의 `NAVER_CAFE_URL` 값을 실제 카페 URL로 변경

### 예보 데이터 실제 연동
`ForecastScreen.js`에서 `FORECAST_DATA`를 API 호출로 교체
- 기상청 공공데이터포털: https://www.data.go.kr
- 단기예보 API로 기온·습도·풍속 가져와서 출몰지수 계산
