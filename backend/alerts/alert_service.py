"""
Alert and Rule Evaluation Engine with False Positive Protection.
Evaluates:
1. Real Watchlist Matches (Stolen/Flagged vehicle license plates from database)
2. Polygon-based Restricted Security Zone breaches (Active hours & class filtering)
3. Action & Behavior Alerts (Snatching, Forced movement, Physical struggle)
4. Multi-stage False Positive Filtering and Audit Explanations
"""

import json
import os
from datetime import datetime
from database import get_db

def is_point_in_polygon(lat: float, lng: float, polygon: list) -> bool:
    """Standard ray-casting algorithm for geo-polygon geofencing."""
    if not polygon or len(polygon) < 3:
        return False
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if min(p1x, p2x) < lat <= max(p1x, p2x):
            if lng <= max(p1y, p2y):
                if p1x != p2x:
                    xinters = (lat - p1x) * (p2y - p1y) / (p2x - p1x) + p1y
                if p1y == p2y or lng <= xinters:
                    inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def load_active_watchlists() -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM watchlists WHERE active = 1')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def load_restricted_zones() -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM restricted_zones WHERE active = 1')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def check_for_alerts(event_data: dict) -> list:
    """
    Evaluates an incoming detection/action event against all security rules
    with multi-stage false-positive gating.
    """
    alerts = []
    camera_id = event_data.get('camera_id')
    timestamp = event_data.get('timestamp', datetime.utcnow().isoformat())
    event_type = event_data.get('event_type', '')
    confidence = event_data.get('confidence', 0.0)
    track_id = event_data.get('track_id')
    plate = event_data.get('plate')
    vehicle_type = event_data.get('vehicle_type', 'vehicle')
    
    # 1. Action Sequence Alerts
    if event_type in ['POSSIBLE_SNATCHING', 'POSSIBLE_FORCED_MOVEMENT', 'PHYSICAL_STRUGGLE', 'SUSPICIOUS_RUNNING']:
        # False Positive Gate: Require confidence >= 0.70
        if confidence >= 0.70:
            alert = {
                "type": event_type,
                "alert_type": event_type,
                "camera_id": camera_id,
                "track_id": track_id,
                "plate": plate,
                "timestamp": timestamp,
                "severity": event_data.get('severity', 'HIGH'),
                "confidence": confidence,
                "details": event_data.get('action_label', 'Suspicious activity detected — human verification required'),
                "explanation": event_data.get('explanation', 'Verified across multi-frame sequence window'),
                "status": "REVIEW_REQUIRED"
            }
            persisted = _persist_alert(alert)
            alerts.append(persisted)
        return alerts

    # 2. Watchlist License Plate Match
    if plate and len(str(plate).strip()) >= 4:
        clean_plate = str(plate).strip().upper()
        watch_entries = load_active_watchlists()
        for w in watch_entries:
            if w['item_type'] == 'PLATE' and w['value'].upper() == clean_plate:
                # False positive check: ensure OCR confidence was reasonable
                ocr_conf = event_data.get('ocr_confidence', 0.85)
                if ocr_conf >= 0.40:
                    alert = {
                        "type": "WATCHLIST_MATCH",
                        "alert_type": "WATCHLIST_MATCH",
                        "camera_id": camera_id,
                        "track_id": track_id,
                        "plate": clean_plate,
                        "timestamp": timestamp,
                        "severity": w.get('severity', 'CRITICAL'),
                        "confidence": ocr_conf,
                        "details": f"Flagged vehicle {clean_plate} detected ({w.get('category', 'WATCHLIST')}): {w.get('note', '')}",
                        "explanation": f"Matched active watchlist entry #{w['watchlist_id']} with OCR confidence {ocr_conf}",
                        "status": "NEW"
                    }
                    persisted = _persist_alert(alert)
                    alerts.append(persisted)
                    break

    # 3. Restricted Geofence Polygon Breaches
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT latitude, longitude, location FROM cameras WHERE camera_id = ?', (camera_id,))
        cam = cursor.fetchone()
        conn.close()
        
        if cam and cam['latitude'] and cam['longitude']:
            lat, lng = cam['latitude'], cam['longitude']
            zones = load_restricted_zones()
            current_hour = datetime.utcnow().hour
            
            for z in zones:
                # Check camera association or geo-polygon
                is_associated_cam = (z.get('camera_id') == camera_id)
                poly = json.loads(z['polygon_coords']) if isinstance(z['polygon_coords'], str) else z['polygon_coords']
                is_in_poly = is_point_in_polygon(lat, lng, poly)
                
                if is_associated_cam or is_in_poly:
                    # Check active hours
                    h_start = z.get('active_hours_start', 0)
                    h_end = z.get('active_hours_end', 24)
                    
                    time_match = False
                    if h_start <= h_end:
                        time_match = (h_start <= current_hour <= h_end)
                    else: # Overnight interval (e.g. 22:00 to 06:00)
                        time_match = (current_hour >= h_start or current_hour <= h_end)
                        
                    if time_match:
                        # Check target type filter
                        targets = json.loads(z.get('target_types', '[]')) if isinstance(z.get('target_types'), str) else z.get('target_types', [])
                        if not targets or vehicle_type in targets or 'all' in targets:
                            alert = {
                                "type": "RESTRICTED_ZONE_BREACH",
                                "alert_type": "RESTRICTED_ZONE_BREACH",
                                "camera_id": camera_id,
                                "track_id": track_id,
                                "plate": plate if plate else f"TRACK_{track_id}",
                                "timestamp": timestamp,
                                "severity": "CRITICAL" if vehicle_type in ['truck', 'bus'] else "HIGH",
                                "confidence": confidence,
                                "details": f"{vehicle_type.upper()} entered restricted perimeter: {z['name']} ({cam['location']})",
                                "explanation": f"Restricted zone rule #{z['zone_id']} active during {h_start}:00-{h_end}:00 UTC",
                                "status": "REVIEW_REQUIRED"
                            }
                            persisted = _persist_alert(alert)
                            alerts.append(persisted)
                            break
    except Exception as e:
        print(f"[Alerts] Restricted zone evaluation error: {e}")

    return alerts

def _persist_alert(alert: dict) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO alerts (
        alert_type, camera_id, track_id, plate, timestamp, severity,
        confidence, details, explanation, status, resolved, evidence_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    (
        alert['alert_type'], alert['camera_id'], alert.get('track_id'), alert.get('plate'),
        alert['timestamp'], alert['severity'], alert.get('confidence', 0.0),
        alert.get('details', ''), alert.get('explanation', ''), alert.get('status', 'REVIEW_REQUIRED'),
        0, alert.get('evidence_id')
    ))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    alert['alert_id'] = alert_id
    return alert

def get_recent_alerts(limit: int = 50) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alerts ORDER BY alert_id DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def resolve_alert(alert_id: int, resolution_note: str = "Verified by operator") -> dict:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE alerts SET resolved = 1, status = "RESOLVED", details = details || " [RESOLVED: " || ? || "]" WHERE alert_id = ?',
                   (resolution_note, alert_id))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "alert_id": alert_id}
