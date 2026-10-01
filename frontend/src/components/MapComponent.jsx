import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Eye, ShieldAlert, Crosshair, ZoomIn, ZoomOut, AlertTriangle, Radio, Car } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAP_LAYERS = {
  gmap_hybrid: {
    name: 'Google Satellite Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  gmap_streets: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  gmap_terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  carto_dark: {
    name: 'Tactical Dark Matrix',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    subdomains: 'abcd',
  },
};

export default function MapComponent({ 
  cameras = [], 
  onSelectCamera, 
  activeCameraId,
  zones = [],
  selectedZone = 'ALL',
  onSelectZone,
  activeLayer = 'ALL',
  events = [],
  alerts = [],
  onSelectPlate,
  onSelectIncident
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const zonePolygonsRef = useRef({});
  const incidentMarkersRef = useRef({});
  const vehicleMarkersRef = useRef({});
  
  const [currentLayerKey, setCurrentLayerKey] = useState('gmap_hybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [fetchedZones, setFetchedZones] = useState([]);
  const [fetchedIncidents, setFetchedIncidents] = useState([]);

  // Fetch zones from API if not provided in props
  useEffect(() => {
    if (zones && zones.length > 0) {
      setFetchedZones(zones);
    } else {
      fetch('/api/zones')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFetchedZones(data);
        })
        .catch(err => console.error("Error loading zones for map:", err));
    }
  }, [zones]);

  // Fetch incidents for map markers if not provided
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setFetchedIncidents(alerts);
    } else {
      fetch('/api/alerts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFetchedIncidents(data);
        })
        .catch(err => console.error("Error loading alerts/incidents for map:", err));
    }
  }, [alerts]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Center map on Gujarat
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([22.4500, 72.2000], 7);

      // Add default tile layer
      const defaultLayer = MAP_LAYERS[currentLayerKey];
      const tileLayer = L.tileLayer(defaultLayer.url, {
        maxZoom: defaultLayer.maxZoom,
        subdomains: defaultLayer.subdomains,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      mapInstanceRef.current = map;
    }
  }, []);

  // Switch Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const selected = MAP_LAYERS[currentLayerKey];
    if (!selected) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(selected.url, {
      maxZoom: selected.maxZoom,
      subdomains: selected.subdomains,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [currentLayerKey]);

  // Render Zone Boundaries (Polygons & Labels)
  useEffect(() => {
    if (!mapInstanceRef.current || fetchedZones.length === 0) return;
    const map = mapInstanceRef.current;

    // Remove existing zone polygons
    Object.values(zonePolygonsRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    zonePolygonsRef.current = {};

    const showZonesLayer = activeLayer === 'ALL' || activeLayer === 'ZONES' || activeLayer === 'GAPS';
    if (!showZonesLayer) return;

    fetchedZones.forEach(zone => {
      let coords = zone.polygon_geo;
      if (typeof coords === 'string') {
        try { coords = JSON.parse(coords); } catch(e) { coords = []; }
      }
      if (!Array.isArray(coords) || coords.length < 3) return;

      const isGap = zone.is_monitored === 0 || zone.coverage_status === 'CAMERA_FREE_GAP';
      const isRestricted = zone.is_restricted === 1;
      const isSelected = selectedZone !== 'ALL' && (selectedZone === zone.zone_id || selectedZone === zone.code);

      if (activeLayer === 'GAPS' && !isGap) return;
      if (activeLayer === 'ZONES' && isGap) return;

      const color = zone.color || (isGap ? '#64748b' : (isRestricted ? '#ef4444' : '#06b6d4'));
      const fillColor = isGap ? '#475569' : color;
      const fillOpacity = isSelected ? 0.45 : (isGap ? 0.18 : (isRestricted ? 0.32 : 0.22));
      const weight = isSelected ? 3.5 : (isGap ? 2.5 : 2.5);
      const dashArray = isGap ? '8, 8' : (isRestricted ? '6, 6' : null);

      const polygon = L.polygon(coords, {
        color: isSelected ? '#ffffff' : color,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        weight: weight,
        dashArray: dashArray,
      }).addTo(map);

      // Permanent Tactical Label
      const labelText = isGap
        ? `⚠️ ${zone.code}: UNMONITORED GAP (NO CCTV)`
        : `${zone.code}: ${zone.name.toUpperCase()} ${isRestricted ? '🚨 [RESTRICTED VIP]' : ''}`;

      const tooltipStyle = isGap
        ? "background: rgba(15,23,42,0.85); color: #94a3b8; font-family: monospace; font-size: 10px; font-weight: 700; border: 1px dashed #64748b; padding: 2px 6px; border-radius: 4px;"
        : `background: rgba(15,23,42,0.92); color: ${color}; font-family: monospace; font-size: 10px; font-weight: 800; border: 1px solid ${color}; padding: 2px 8px; border-radius: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.5);`;

      polygon.bindTooltip(
        `<div style="${tooltipStyle}">${labelText}</div>`,
        { permanent: true, direction: 'center', className: 'bg-transparent border-0' }
      );

      // Click to select zone
      polygon.on('click', () => {
        if (onSelectZone) onSelectZone(zone.zone_id);
      });

      // Popup with zone information
      polygon.bindPopup(`
        <div style="font-family: sans-serif; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size: 11px; color: ${color}; font-weight: 800; font-family: monospace;">${zone.code}</span>
            <span style="font-size: 9px; padding: 1px 6px; border-radius: 4px; background: ${isGap ? 'rgba(100,116,139,0.2)' : 'rgba(6,182,212,0.2)'}; color: ${isGap ? '#94a3b8' : '#38bdf8'}; font-weight: 700;">
              ${zone.coverage_status || (isGap ? 'CAMERA_FREE_GAP' : 'COVERED')}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">${zone.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">City: ${zone.city || 'Gujarat'}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #0f172a; padding: 6px; border-radius: 6px; border: 1px solid #1e293b; margin-bottom: 8px; font-size: 10px;">
            <div>Cameras: <strong style="color: #38bdf8;">${zone.camera_count || 0} Nodes</strong></div>
            <div>Incidents: <strong style="color: ${zone.incident_count > 0 ? '#ef4444' : '#10b981'};">${zone.incident_count || 0} Active</strong></div>
            <div>Health: <strong style="color: #10b981;">${zone.health_score || 98}%</strong></div>
            <div>Risk Level: <strong style="color: ${zone.risk_level === 'HIGH' ? '#ef4444' : '#38bdf8'};">${zone.risk_level || 'LOW'}</strong></div>
          </div>

          ${isRestricted ? '<div style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 6px;">🚨 HIGH-SECURITY RESTRICTED GEOFENCE</div>' : ''}
          ${isGap ? '<div style="background: rgba(100,116,139,0.15); color: #cbd5e1; border: 1px dashed rgba(100,116,139,0.4); padding: 4px 6px; border-radius: 4px; font-size: 10px; margin-bottom: 6px;">⚠️ Zero CCTV camera coverage. Route prediction enabled.</div>' : ''}
        </div>
      `);

      zonePolygonsRef.current[zone.zone_id] = polygon;
    });

    // Auto-fit bounds if a specific zone is selected
    if (selectedZone !== 'ALL' && zonePolygonsRef.current[selectedZone]) {
      try {
        const poly = zonePolygonsRef.current[selectedZone];
        map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 12 });
      } catch (e) {}
    }
  }, [fetchedZones, selectedZone, onSelectZone, activeLayer]);

  // Update / render camera markers
  useEffect(() => {
    if (!mapInstanceRef.current || !cameras) return;
    const map = mapInstanceRef.current;

    // Remove obsolete camera markers
    Object.keys(markersRef.current).forEach(camId => {
      map.removeLayer(markersRef.current[camId]);
    });
    markersRef.current = {};

    const showCameraLayer = activeLayer === 'ALL' || activeLayer === 'CAMERAS';
    if (!showCameraLayer) return;

    // Filter cameras if zone is selected
    const filteredCameras = selectedZone === 'ALL' 
      ? cameras 
      : cameras.filter(c => c.zone_id === selectedZone || c.zone_id === `ZONE_${selectedZone.replace('ZONE ', '')}`);

    filteredCameras.forEach(cam => {
      let statusClass = 'cam-marker-healthy';
      if (cam.status === 'WARNING' || cam.status === 'VIEW_CHANGED') {
        statusClass = 'cam-marker-warning';
      } else if (cam.status === 'FROZEN' || cam.status === 'BLOCKED' || cam.status === 'OFFLINE') {
        statusClass = 'cam-marker-critical';
      }

      const isSelected = activeCameraId === cam.camera_id;
      const customIcon = L.divIcon({
        className: 'custom-cam-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div class="${statusClass}" style="${isSelected ? 'transform: scale(1.4); box-shadow: 0 0 16px #06b6d4; border-color: #06b6d4;' : ''}"></div>
            <div style="position: absolute; top: -18px; white-space: nowrap; background: rgba(15,23,42,0.9); color: #38bdf8; font-family: monospace; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.4);">${cam.camera_id} (${cam.zone_id || 'Z-A'})</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([cam.latitude, cam.longitude], { icon: customIcon }).addTo(map);
      
      marker.on('click', () => {
        onSelectCamera && onSelectCamera(cam);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size: 10px; color: #38bdf8; font-weight: 800; font-family: monospace; text-transform: uppercase;">${cam.camera_id}</span>
            <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: rgba(16,185,129,0.2); color: #34d399; font-weight: 700;">${cam.zone_id || 'ZONE_A'}</span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">${cam.name}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">${cam.location}</div>
          
          <div style="margin-bottom: 8px; border-radius: 6px; overflow: hidden; border: 1px solid #334155; height: 90px; background: #000; position: relative;">
            <img src="/api/cameras/${cam.camera_id}/stream?mode=optical" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=400'" />
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #cbd5e1; border-top: 1px solid #1e293b; padding-top: 6px;">
            <span>Status: <strong style="color: ${cam.status === 'HEALTHY' || cam.status === 'ONLINE' ? '#10b981' : '#ef4444'}">${cam.status || 'ONLINE'}</strong></span>
            <span>Health: <strong style="color: #38bdf8;">${cam.health_score || 98}%</strong></span>
          </div>
        </div>
      `);

      markersRef.current[cam.camera_id] = marker;
    });
  }, [cameras, onSelectCamera, activeCameraId, selectedZone, activeLayer]);

  // Render Incident / Alert markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    Object.values(incidentMarkersRef.current).forEach(m => map.removeLayer(m));
    incidentMarkersRef.current = {};

    const showIncidents = activeLayer === 'ALL' || activeLayer === 'INCIDENTS';
    if (!showIncidents || !fetchedIncidents || fetchedIncidents.length === 0) return;

    fetchedIncidents.slice(0, 10).forEach((alert, idx) => {
      // Find camera coords
      const cam = cameras.find(c => c.camera_id === alert.camera_id);
      const lat = cam ? cam.latitude + (idx * 0.002 - 0.005) : 23.0225 + (idx * 0.01);
      const lng = cam ? cam.longitude + (idx * 0.002 - 0.005) : 72.5714 + (idx * 0.01);

      const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
      const pinColor = isCritical ? '#ef4444' : '#f59e0b';

      const alertIcon = L.divIcon({
        className: 'custom-alert-pin',
        html: `
          <div style="position: relative; display: flex; items-center; justify-content: center; cursor: pointer;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: ${pinColor}; border: 2px solid #ffffff; box-shadow: 0 0 12px ${pinColor}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 11px;">!</div>
            <div style="position: absolute; top: -16px; white-space: nowrap; background: rgba(239,68,68,0.95); color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">${alert.alert_type || 'INCIDENT'}</div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon: alertIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="font-size: 10px; color: #ef4444; font-weight: 800; font-family: monospace;">🚨 ACTIVE SECURITY ALERT</div>
          <div style="font-size: 12px; font-weight: 700; color: #ffffff; margin-top: 2px;">${alert.message || alert.alert_type}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Camera: ${alert.camera_id} • ${alert.zone_id || 'Gujarat'}</div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 6px;">Severity: <strong style="color: ${pinColor}">${alert.severity || 'HIGH'}</strong></div>
        </div>
      `);

      incidentMarkersRef.current[`alert_${idx}`] = marker;
    });
  }, [fetchedIncidents, cameras, activeLayer]);

  // Render Vehicle Sightings
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    Object.values(vehicleMarkersRef.current).forEach(m => map.removeLayer(m));
    vehicleMarkersRef.current = {};

    const showVehicles = activeLayer === 'ALL' || activeLayer === 'VEHICLES';
    if (!showVehicles || !events || events.length === 0) return;

    const vehicleEvents = events.filter(e => e.plate && e.plate !== 'NO_PLATE').slice(0, 8);
    vehicleEvents.forEach((ev, idx) => {
      const cam = cameras.find(c => c.camera_id === ev.camera_id);
      const lat = cam ? cam.latitude + (idx * 0.001 - 0.003) : 23.03 + (idx * 0.005);
      const lng = cam ? cam.longitude + (idx * 0.001 - 0.003) : 72.58 + (idx * 0.005);

      const carIcon = L.divIcon({
        className: 'custom-car-pin',
        html: `
          <div style="position: relative; display: flex; items-center; justify-content: center; cursor: pointer;">
            <div style="background: #0284c7; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: 800; border: 1.5px solid #ffffff; box-shadow: 0 0 8px rgba(2,132,199,0.8); white-space: nowrap;">
              🚗 ${ev.plate}
            </div>
          </div>
        `,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      });

      const marker = L.marker([lat, lng], { icon: carIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-size: 10px; color: #38bdf8; font-weight: 800; font-family: monospace;">🚗 ANPR SIGHTING</div>
          <div style="font-size: 13px; font-weight: 800; color: #ffffff; font-family: monospace; margin-top: 2px;">${ev.plate}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Type: ${ev.vehicle_type || 'Car'} • Speed: ~${ev.speed_estimate || 42} km/h</div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Node: ${ev.camera_id}</div>
        </div>
      `);

      vehicleMarkersRef.current[`veh_${idx}`] = marker;
    });
  }, [events, cameras, activeLayer]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.4500, 72.2000], 7);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleSelectZoneQuick = (zoneId) => {
    if (onSelectZone) onSelectZone(zoneId);
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-2xl">
      {/* Map DOM Element */}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '520px' }} />

      {/* Top Right: Layer Switcher Button & Menu + Zoom Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{MAP_LAYERS[currentLayerKey]?.name || 'Layers'}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-1.5 shadow-2xl space-y-1 z-[1010]">
              {Object.entries(MAP_LAYERS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCurrentLayerKey(key);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                    currentLayerKey === key
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{item.name}</span>
                  {currentLayerKey === key && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="flex flex-col rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition border-b border-slate-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white transition border-b border-slate-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
            title="Recenter Gujarat Grid"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend Overlay with Zone Separation & Gap Indicators */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0f172a]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs flex flex-wrap items-center gap-2.5 shadow-2xl max-w-[95%] pointer-events-auto">
        <button 
          type="button"
          onClick={() => handleSelectZoneQuick('ZONE_A')}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
          <span className="text-cyan-300 font-bold text-[11px]">Zone A (Ahmedabad)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleSelectZoneQuick('ZONE_B')}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse"></span>
          <span className="text-red-400 font-bold text-[11px]">Zone B (Gandhinagar VIP)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleSelectZoneQuick('ZONE_C')}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
          <span className="text-emerald-300 font-bold text-[11px]">Zone C (Surat)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleSelectZoneQuick('ZONE_D')}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></span>
          <span className="text-purple-300 font-bold text-[11px]">Zone D (Vadodara)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleSelectZoneQuick('ZONE_E')}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
          <span className="text-amber-300 font-bold text-[11px]">Zone E (Rajkot)</span>
        </button>
        <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
          <span className="w-3.5 h-2 border border-dashed border-slate-400 bg-slate-600/30 rounded-xs"></span>
          <span className="text-slate-400 font-semibold text-[11px]">Gap Corridor</span>
        </div>
      </div>
    </div>
  );
}
