import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Body
from database import get_db

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("")
def list_zones(
    is_monitored: Optional[int] = Query(None, description="Filter by monitored status (1 for covered, 0 for gap)"),
    is_restricted: Optional[int] = Query(None, description="Filter by high-security restricted status")
):
    """
    Returns all geographic surveillance zones with real-time camera counts,
    active incident counts, camera health averages, and polygon geometry.
    """
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM coverage_zones WHERE 1=1"
    params = []
    if is_monitored is not None:
        query += " AND is_monitored = ?"
        params.append(is_monitored)
    if is_restricted is not None:
        query += " AND is_restricted = ?"
        params.append(is_restricted)
        
    query += " ORDER BY code ASC, is_monitored DESC"
    cursor.execute(query, tuple(params))
    zone_rows = cursor.fetchall()
    
    # Fetch all cameras mapped to zones
    cursor.execute("SELECT * FROM cameras")
    cameras_by_zone = {}
    for cam in cursor.fetchall():
        c_dict = dict(cam)
        zid = c_dict.get('zone_id')
        if zid:
            if zid not in cameras_by_zone:
                cameras_by_zone[zid] = []
            cameras_by_zone[zid].append(c_dict)
            
    # Fetch active incidents mapped to zones
    cursor.execute("SELECT * FROM incidents WHERE status != 'RESOLVED' ORDER BY timestamp DESC")
    incidents_by_zone = {}
    for inc in cursor.fetchall():
        i_dict = dict(inc)
        zid = i_dict.get('zone_id')
        if zid:
            if zid not in incidents_by_zone:
                incidents_by_zone[zid] = []
            incidents_by_zone[zid].append(i_dict)

    # Fetch active alerts mapped to zones
    cursor.execute("SELECT * FROM alerts WHERE resolved = 0")
    alerts_by_zone = {}
    for alt in cursor.fetchall():
        a_dict = dict(alt)
        zid = a_dict.get('zone_id')
        # If alert has camera_id, resolve zone_id if missing
        if not zid and a_dict.get('camera_id'):
            for czid, clist in cameras_by_zone.items():
                if any(c['camera_id'] == a_dict['camera_id'] for c in clist):
                    zid = czid
                    break
        if zid:
            if zid not in alerts_by_zone:
                alerts_by_zone[zid] = []
            alerts_by_zone[zid].append(a_dict)

    conn.close()
    
    result = []
    for r in zone_rows:
        z = dict(r)
        zid = z['zone_id']
        
        # Parse polygon geo
        if isinstance(z.get('polygon_geo'), str):
            try:
                z['polygon_geo'] = json.loads(z['polygon_geo'])
            except Exception:
                z['polygon_geo'] = []
                
        # Parse connecting zones
        if isinstance(z.get('connecting_zones'), str):
            try:
                z['connecting_zones'] = json.loads(z['connecting_zones'])
            except Exception:
                z['connecting_zones'] = []
                
        zone_cams = cameras_by_zone.get(zid, [])
        zone_incidents = incidents_by_zone.get(zid, [])
        zone_alerts = alerts_by_zone.get(zid, [])
        
        # Calculate zone health
        if zone_cams:
            avg_health = int(sum(c.get('health_score', 100) for c in zone_cams) / len(zone_cams))
        else:
            avg_health = 100 if z.get('is_monitored') == 0 else 0
            
        z['camera_count'] = len(zone_cams)
        z['cameras'] = zone_cams
        z['incident_count'] = len(zone_incidents)
        z['active_incidents'] = zone_incidents
        z['alert_count'] = len(zone_alerts)
        z['health_score'] = avg_health
        z['is_monitored'] = bool(z.get('is_monitored', 1))
        z['is_restricted'] = bool(z.get('is_restricted', 0))
        result.append(z)
        
    return result

@router.get("/{zone_id}")
def get_zone_details(zone_id: str):
    """Returns complete details of a specific surveillance zone."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coverage_zones WHERE zone_id = ?", (zone_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
        
    z = dict(row)
    if isinstance(z.get('polygon_geo'), str):
        try:
            z['polygon_geo'] = json.loads(z['polygon_geo'])
        except Exception:
            z['polygon_geo'] = []
            
    if isinstance(z.get('connecting_zones'), str):
        try:
            z['connecting_zones'] = json.loads(z['connecting_zones'])
        except Exception:
            z['connecting_zones'] = []

    # Get cameras in zone
    cursor.execute("SELECT * FROM cameras WHERE zone_id = ?", (zone_id,))
    cams = [dict(c) for c in cursor.fetchall()]
    
    # Get active incidents in zone
    cursor.execute("SELECT * FROM incidents WHERE zone_id = ? ORDER BY timestamp DESC", (zone_id,))
    incidents = [dict(i) for i in cursor.fetchall()]

    conn.close()

    z['cameras'] = cams
    z['camera_count'] = len(cams)
    z['incidents'] = incidents
    z['incident_count'] = len(incidents)
    z['is_monitored'] = bool(z.get('is_monitored', 1))
    z['is_restricted'] = bool(z.get('is_restricted', 0))
    return z

@router.get("/{zone_id}/cameras")
def get_zone_cameras(zone_id: str):
    """Returns all cameras mapped to a specific zone."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE zone_id = ?", (zone_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{zone_id}/incidents")
def get_zone_incidents(zone_id: str):
    """Returns all security incidents recorded in a specific zone."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE zone_id = ? ORDER BY timestamp DESC", (zone_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/{zone_id}/incidents")
def create_zone_incident(zone_id: str, payload: dict = Body(...)):
    """Creates / logs an incident inside a specific zone."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Validate zone exists
    cursor.execute("SELECT * FROM coverage_zones WHERE zone_id = ?", (zone_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
        
    incident_id = payload.get("incident_id", f"INC-{int(datetime.now().timestamp())}")
    camera_id = payload.get("camera_id")
    location = payload.get("location", f"Surveillance Zone {zone_id}")
    incident_type = payload.get("incident_type", "SECURITY_ALERT")
    confidence = payload.get("confidence", 0.95)
    severity = payload.get("severity", "HIGH")
    status = payload.get("status", "ACTIVE")
    details = payload.get("details", "Operator logged security incident")
    source = payload.get("source", "SOC_OPERATOR")
    evidence_id = payload.get("evidence_id")
    ts = payload.get("timestamp", datetime.utcnow().isoformat())
    
    cursor.execute('''INSERT INTO incidents (
        incident_id, zone_id, camera_id, timestamp, location, incident_type,
        confidence, evidence_id, severity, status, details, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
        incident_id, zone_id, camera_id, ts, location, incident_type,
        confidence, evidence_id, severity, status, details, source
    ))
    conn.commit()
    conn.close()
    
    return {
        "status": "CREATED",
        "incident_id": incident_id,
        "zone_id": zone_id,
        "timestamp": ts,
        "message": f"Incident {incident_id} successfully logged in {zone_id}"
    }

@router.get("/cross-zone-tracking/{target_identifier}")
def track_cross_zone_movement(target_identifier: str):
    """
    Computes rigorous cross-zone transit reconstruction across Gujarat nodes.
    Records movement timeline by zone, clearly labeling:
    - LAST OBSERVED (inside camera-covered zone)
    - COVERAGE GAP (unmonitored inter-zone corridor with no CCTV)
    - POSSIBLE MATCH (subsequent sightings in next zone)
    Never invents or fakes tracking data inside camera-free gap areas.
    """
    clean_id = target_identifier.strip().upper()
    conn = get_db()
    cursor = conn.cursor()
    
    # Query events by plate or target
    cursor.execute('''
        SELECT e.*, c.name as camera_name, c.latitude, c.longitude, c.location, c.zone_id as cam_zone_id,
               z.code as zone_code, z.name as zone_name, z.city as zone_city, z.is_monitored
        FROM events e
        LEFT JOIN cameras c ON e.camera_id = c.camera_id
        LEFT JOIN coverage_zones z ON c.zone_id = z.zone_id
        WHERE e.plate LIKE ?
        ORDER BY e.timestamp ASC
    ''', (f"%{clean_id}%",))
    
    rows = cursor.fetchall()
    conn.close()
    
    sightings = []
    for r in rows:
        d = dict(r)
        if d.get('bbox') and isinstance(d['bbox'], str):
            try:
                d['bbox'] = json.loads(d['bbox'])
            except Exception:
                pass
        sightings.append(d)
        
    if not sightings:
        return {
            "target": clean_id,
            "status": "NOT_FOUND",
            "total_observations": 0,
            "zones_traversed_count": 0,
            "timeline": []
        }
        
    timeline = []
    prev_zone = None
    prev_time = None
    
    for idx, s in enumerate(sightings):
        curr_zone = s.get('cam_zone_id') or s.get('zone_id') or 'ZONE_A'
        curr_zone_code = s.get('zone_code') or ('ZONE A' if curr_zone == 'ZONE_A' else ('ZONE B' if curr_zone == 'ZONE_B' else ('ZONE C' if curr_zone == 'ZONE_C' else ('ZONE D' if curr_zone == 'ZONE_D' else 'ZONE E'))))
        curr_zone_name = s.get('zone_name') or f"Surveillance Zone {curr_zone_code}"
        curr_time = datetime.fromisoformat(s['timestamp']) if 'T' in s['timestamp'] else datetime.strptime(s['timestamp'], "%Y-%m-%d %H:%M:%S.%f")
        
        # Check if we crossed into a new zone from a previous zone
        if prev_zone and prev_zone != curr_zone:
            gap_duration_min = max(1, int((curr_time - prev_time).total_seconds() / 60))
            gap_id = f"GAP_{prev_zone}_{curr_zone}"
            
            # Insert explicit unmonitored coverage gap segment
            timeline.append({
                "type": "COVERAGE_GAP",
                "status_badge": "COVERAGE GAP",
                "label": f"{prev_zone_code} -> {curr_zone_code} Unmonitored Corridor",
                "from_zone": prev_zone,
                "from_zone_code": prev_zone_code,
                "to_zone": curr_zone,
                "to_zone_code": curr_zone_code,
                "timestamp": (prev_time + timedelta(minutes=int(gap_duration_min / 2))).isoformat(),
                "duration_minutes": gap_duration_min,
                "is_monitored": False,
                "details": f"Camera-free gap between {prev_zone_code} and {curr_zone_code}. Zero CCTV observation during transit ({gap_duration_min} min unmonitored window).",
                "camera_id": None
            })
            
        # Determine tracking status label
        if idx == 0 and len(sightings) > 1:
            status_badge = "ORIGIN POINT"
        elif idx == len(sightings) - 1:
            status_badge = "LAST OBSERVED"
        else:
            status_badge = "POSSIBLE MATCH"
            
        timeline.append({
            "type": "CAMERA_OBSERVATION",
            "status_badge": status_badge,
            "label": f"{s.get('vehicle_type', 'Vehicle').capitalize()} observed at {s.get('camera_name', s.get('camera_id'))}",
            "zone_id": curr_zone,
            "zone_code": curr_zone_code,
            "zone_name": curr_zone_name,
            "zone_city": s.get('zone_city', 'Gujarat'),
            "camera_id": s.get('camera_id'),
            "camera_name": s.get('camera_name'),
            "location": s.get('location'),
            "timestamp": s['timestamp'],
            "speed_estimate": s.get('speed_estimate', 0.0),
            "direction": s.get('direction', 'STATIONARY'),
            "confidence": s.get('confidence', 0.95),
            "plate": s.get('plate', clean_id),
            "is_monitored": True,
            "details": f"Target detected on {s.get('camera_id')} with {int(s.get('confidence', 0.95)*100)}% AI confidence."
        })
        
        prev_zone = curr_zone
        prev_zone_code = curr_zone_code
        prev_time = curr_time

    unique_zones = list(set([t['zone_code'] for t in timeline if t.get('zone_code')]))

    return {
        "target": clean_id,
        "status": "TRACKING_ACTIVE",
        "total_observations": len(sightings),
        "zones_traversed_count": len(unique_zones),
        "zones_traversed": unique_zones,
        "timeline": timeline
    }
