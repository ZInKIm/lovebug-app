const KAKAO_API_KEY = 'e5375428bb5260828c6905725d6b5bf7';

// 좌표 → 주소 변환 (역지오코딩)
export async function coordsToAddress(latitude, longitude) {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
    );
    const json = await res.json();
    const doc = json.documents?.find(d => d.region_type === 'H');
    if (!doc) return null;
    return {
      sido: doc.region_1depth_name,
      sigungu: doc.region_2depth_name,
      dong: doc.region_3depth_name,
    };
  } catch (e) {
    console.log('Reverse geocoding error:', e.message);
    return null;
  }
}

// 주소 → 좌표 변환
export async function addressToCoords(address) {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
    );
    const json = await res.json();
    const doc = json.documents?.[0];
    if (!doc) return null;
    return {
      latitude: parseFloat(doc.y),
      longitude: parseFloat(doc.x),
    };
  } catch (e) {
    console.log('Geocoding error:', e.message);
    return null;
  }
}   