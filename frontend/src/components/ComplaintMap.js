import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { detectHotspots } from '../utils/aiEngine';
import { STATUS_COLORS, CATEGORY_COLORS } from '../utils/dummyData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper — get lat/lng from either data format
const getLat = (c) => parseFloat(c.latitude  || c.location?.lat  || 0);
const getLng = (c) => parseFloat(c.longitude || c.location?.lng  || 0);
const hasLocation = (c) => !!(getLat(c) && getLng(c));

const createColoredIcon = (color) =>
  L.divIcon({
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
    className: '', iconSize: [14, 14], iconAnchor: [7, 7],
  });

// Heatmap overlay using circles
const HeatmapLayer = ({ complaints }) => {
  const map = useMap();
  useEffect(() => {
    if (!complaints.length) return;
    const layers = complaints.filter(hasLocation).map((c) =>
      L.circle([getLat(c), getLng(c)], {
        radius: 400, color: 'transparent',
        fillColor: '#ef4444', fillOpacity: 0.1,
      }).addTo(map)
    );
    return () => layers.forEach((l) => map.removeLayer(l));
  }, [complaints, map]);
  return null;
};

export default function ComplaintMap({ complaints, showHeatmap = false }) {
  const validComplaints = complaints.filter(hasLocation);
  const hotspots        = detectHotspots(complaints);

  const center = validComplaints.length > 0
    ? [getLat(validComplaints[0]), getLng(validComplaints[0])]
    : [13.0604, 80.2496]; // Chennai default

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {showHeatmap && <HeatmapLayer complaints={validComplaints} />}

        {/* Hotspot zones */}
        {hotspots.map((h, i) => (
          <Circle key={i} center={[h.lat, h.lng]} radius={700}
            color={h.isHighPriority ? '#ef4444' : '#f97316'}
            fillColor={h.isHighPriority ? '#ef4444' : '#f97316'}
            fillOpacity={0.15} weight={2}>
            <Popup>
              <div style={{ background: '#1e293b', color: '#f1f5f9', padding: 8, borderRadius: 6, minWidth: 160 }}>
                <strong style={{ color: h.isHighPriority ? '#ef4444' : '#f97316' }}>
                  {h.isHighPriority ? '🚨 High Priority Zone' : '⚠️ Hotspot'}
                </strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>{h.count} complaints</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{h.categories.join(', ')}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Individual markers */}
        {validComplaints.map((c) => (
          <Marker key={c.id} position={[getLat(c), getLng(c)]}
            icon={createColoredIcon(STATUS_COLORS[c.status] || '#3b82f6')}>
            <Popup>
              <div style={{ background: '#1e293b', color: '#f1f5f9', padding: 8, borderRadius: 6, minWidth: 180 }}>
                <strong style={{ fontSize: 13 }}>{c.title}</strong>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: (CATEGORY_COLORS[c.category] || '#6b7280') + '33', color: CATEGORY_COLORS[c.category] || '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                    {c.category}
                  </span>
                  <span style={{ background: STATUS_COLORS[c.status] + '33', color: STATUS_COLORS[c.status], padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                    {c.status}
                  </span>
                </div>
                {c.ward && <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>{c.ward}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
