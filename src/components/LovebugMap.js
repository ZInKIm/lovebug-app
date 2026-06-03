import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const LEVEL_INFO = {
  high: { color: '#E24B4A', label: '심함' },
  mid:  { color: '#EF9F27', label: '보통' },
  low:  { color: '#1D9E75', label: '낮음' },
};

export default function LovebugMap({ areas = [], onSelectArea, userLocation }) {
  const webViewRef = useRef(null);

  useEffect(() => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'moveToLocation',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      }));
    }
  }, [userLocation]);

  const markers = areas
    .filter(a => a.latitude && a.longitude)
    .map(a => ({
      lat: a.latitude, lng: a.longitude,
      location: a.location, total: a.total,
      color: LEVEL_INFO[a.level]?.color || '#888780',
      label: LEVEL_INFO[a.level]?.label || '',
    }));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .marker-label {
      color:white; padding:5px 10px; border-radius:16px;
      font-size:12px; font-weight:600;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      white-space:nowrap; cursor:pointer;
      font-family:-apple-system,sans-serif;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { center:[37.5665,126.9780], zoom:11 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', maxZoom:18
    }).addTo(map);

    var markers = ${JSON.stringify(markers)};
    var bounds = [];
    var userMarker = null;

    markers.forEach(function(m) {
      var shortName = m.location
        .replace('서울특별시 ','').replace('서울 ','')
        .replace('경기도 ','').replace('경기 ','');

      L.circle([m.lat, m.lng], {
        color:m.color, fillColor:m.color,
        fillOpacity:0.2, weight:2, radius:600,
      }).addTo(map).on('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'select', location:m.location}));
      });

      var icon = L.divIcon({
        className:'',
        html:'<div class="marker-label" style="background:' + m.color + ';">'
          + shortName + ' ' + m.label
          + ' <span style="opacity:0.85;font-size:10px;">' + m.total + '건</span>'
          + '</div>',
        iconAnchor:[0, 30],
      });

      L.marker([m.lat, m.lng], { icon }).addTo(map).on('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'select', location:m.location}));
      });

      bounds.push([m.lat, m.lng]);
    });

    if (bounds.length > 0) map.fitBounds(bounds, { padding:[40,40] });

    document.addEventListener('message', function(e) {
      handleMessage(e.data);
    });
    window.addEventListener('message', function(e) {
      handleMessage(e.data);
    });

    function handleMessage(data) {
      try {
        var msg = JSON.parse(data);
        if (msg.type === 'moveToLocation') {
          map.setView([msg.lat, msg.lng], 14);
          if (userMarker) map.removeLayer(userMarker);
          userMarker = L.circleMarker([msg.lat, msg.lng], {
            radius: 10, color: '#0F6E56', fillColor: '#0F6E56',
            fillOpacity: 0.8, weight: 3,
          }).addTo(map).bindPopup('내 위치').openPopup();
        }
      } catch(e) {}
    }
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.map}
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'select' && onSelectArea) {
              onSelectArea(data.location);
            }
          } catch(err) {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});