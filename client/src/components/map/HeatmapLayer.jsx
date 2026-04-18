import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/*
  HeatmapLayer — wraps leaflet.heat as a proper React-Leaflet component.
  Points shape: [{ lat, lng, intensity }]   intensity: 0.0 – 1.0
*/
export default function HeatmapLayer({ points = [], visible = true }) {
  const map     = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points.length) return;

    // Build [[lat, lng, intensity], ...] format
    const data = points.map(p => [
      parseFloat(p.lat),
      parseFloat(p.lng),
      parseFloat(p.intensity) || 0.3,
    ]);

    layerRef.current = L.heatLayer(data, {
      radius:  38,
      blur:    28,
      maxZoom: 17,
      max:     1.0,
      minOpacity: 0.35,
      gradient: {
        0.00: '#1e3a8a',   // deep blue  → very low activity
        0.20: '#3b82f6',   // blue       → low
        0.40: '#06b6d4',   // cyan       → moderate-low
        0.55: '#10b981',   // green      → moderate
        0.70: '#f59e0b',   // amber      → high
        0.85: '#f97316',   // orange     → very high
        1.00: '#ef4444',   // red        → hotspot
      },
    });

    if (visible) layerRef.current.addTo(map);

    return () => {
      layerRef.current?.remove();
      layerRef.current = null;
    };
  }, [map, points]); // eslint-disable-line

  // Toggle visibility without recreating the layer
  useEffect(() => {
    if (!layerRef.current) return;
    if (visible) {
      layerRef.current.addTo(map);
    } else {
      layerRef.current.remove();
    }
  }, [visible, map]);

  return null;
}
