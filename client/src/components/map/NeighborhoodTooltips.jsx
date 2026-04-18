import { CircleMarker, Tooltip } from 'react-leaflet';

/*
  Invisible CircleMarkers over each neighborhood center.
  On hover → shows stats tooltip.
  Used in Heatmap mode only.
*/
export default function NeighborhoodTooltips({ neighborhoods = [] }) {
  if (!neighborhoods.length) return null;

  return neighborhoods.map((n, i) => {
    if (!n.lat || !n.lng) return null;

    const label = n.name || `حي ${i + 1}`;
    const regs  = parseInt(n.total_registrations) || 0;
    const uniq  = parseInt(n.unique_participants)  || 0;
    const hrs   = parseFloat(n.total_hours)?.toFixed(1) || 0;

    return (
      <CircleMarker
        key={i}
        center={[parseFloat(n.lat), parseFloat(n.lng)]}
        radius={28}
        pathOptions={{ color: 'transparent', fillColor: 'transparent', fillOpacity: 0 }}
      >
        <Tooltip
          direction="top"
          offset={[0, -8]}
          opacity={1}
          className="neighborhood-tooltip"
        >
          {/* Custom styled content — rendered inside Leaflet Tooltip DOM */}
          <div style={{
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
            minWidth: '160px',
            padding: '4px 2px',
          }}>
            <p style={{ fontWeight: 700, fontSize: '13px', margin: '0 0 6px', color: '#344F1F' }}>
              📍 {label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', color: '#344F1F' }}>
                👥 {uniq} مشارك فريد
              </span>
              <span style={{ fontSize: '11px', color: '#344F1F' }}>
                📋 {regs} تسجيل
              </span>
              <span style={{ fontSize: '11px', color: '#F4991A', fontWeight: 600 }}>
                ⏰ {hrs} ساعة تطوع
              </span>
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  });
}
