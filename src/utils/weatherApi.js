const API_KEY = '%2FrLF4TXx1T2rdoljWvE9pjuI2X3SPd2DXcDds7wZEBiF%2FLBOlYCTk6z7mWyZnRawP7iRMzXqDtun1k1cvYtWHQ%3D%3D';

export const GRID = {
  '서울 은평구':  { nx: 58, ny: 127 },
  '서울 마포구':  { nx: 59, ny: 126 },
  '서울 강남구':  { nx: 61, ny: 125 },
  '서울 송파구':  { nx: 62, ny: 124 },
  '서울 용산구':  { nx: 60, ny: 126 },
  '경기 광명시':  { nx: 58, ny: 123 },
  '경기 고양시':  { nx: 57, ny: 128 },
};

function getForecastTime() {
  const now = new Date();
  const hour = now.getHours();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const times = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseTime = '2300';
  let baseDate = date;

  for (let i = times.length - 1; i >= 0; i--) {
    if (hour >= times[i]) {
      baseTime = String(times[i]).padStart(2, '0') + '00';
      break;
    }
  }
  if (hour < 2) {
    const yesterday = new Date(now - 86400000);
    baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
    baseTime = '2300';
  }
  return { baseDate, baseTime };
}

export async function fetchWeather(region = '서울 은평구') {
  const grid = GRID[region] || GRID['서울 은평구'];
  const { baseDate, baseTime } = getForecastTime();

  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${API_KEY}&numOfRows=300&pageNo=1&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${grid.nx}&ny=${grid.ny}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    const items = json.response?.body?.items?.item || [];

    const now = new Date();
    const targetHour = String(now.getHours()).padStart(2, '0') + '00';

    console.log('API 응답 items 개수:', items.length);
    console.log('targetHour:', targetHour);
    console.log('TMP 샘플:', items.find(i => i.category === 'TMP'));

    const get = (category) => {
      const exact = items.find(
        i => i.category === category && i.fcstTime === targetHour
      );

      if (exact) return parseFloat(exact.fcstValue);

      const next = items.find(
        i => i.category === category && i.fcstTime > targetHour
      );

      return next ? parseFloat(next.fcstValue) : null;
    };

    return {
      tmp: get('TMP'),
      reh: get('REH'),
      wsd: get('WSD'),
      pty: get('PTY'),
    };
  } catch (e) {
    console.log('Weather API error:', e.message);
    return null;
  }
}

export function calcLovebugSignal(weather) {
  if (!weather || weather.tmp === null) return { level: 'mid', basis: '날씨 정보 없음' };
  const { tmp, reh, wsd, pty } = weather;

  if (pty && pty > 0) return { level: 'low', basis: '현재 강수 중 — 활동 줄어듦' };

  let score = 0;
  if (tmp >= 30) score += 3;
  else if (tmp >= 25) score += 2;
  else if (tmp >= 20) score += 1;
  else score -= 1;

  if (reh >= 80) score += 2;
  else if (reh >= 70) score += 1;
  else if (reh < 50) score -= 1;

  if (wsd >= 5) score -= 2;
  else if (wsd >= 3) score -= 1;

  const basis = `기온 ${tmp}°C · 습도 ${reh}% · 풍속 ${wsd}m/s`;
  if (score >= 4) return { level: 'high', basis };
  if (score >= 2) return { level: 'mid', basis };
  return { level: 'low', basis };
}