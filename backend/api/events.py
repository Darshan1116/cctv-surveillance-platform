import json
from fastapi import APIRouter, Query
from database import get_db

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("")
def list_events(
    limit: int = Query(50, ge=1, le=500),
    camera_id: str = None,
    zone_id: str = None,
    event_type: str = None,
    vehicle_type: str = None,
    plate: str = None
):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT e.*, c.zone_id as cam_zone_id
        FROM events e
        LEFT JOIN cameras c ON e.camera_id = c.camera_id
        WHERE 1=1
    """
    params = []
    
    if camera_id:
        query += " AND e.camera_id = ?"
        params.append(camera_id)
    if zone_id:
        query += " AND (e.zone_id = ? OR c.zone_id = ?)"
        params.append(zone_id)
        params.append(zone_id)
    if event_type:
        query += " AND e.event_type = ?"
        params.append(event_type)
    if vehicle_type:
        query += " AND e.vehicle_type = ?"
        params.append(vehicle_type)
    if plate:
        query += " AND e.plate LIKE ?"
        params.append(f"%{plate.strip().upper()}%")
        
    query += " ORDER BY event_id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        if d.get('bbox') and isinstance(d['bbox'], str):
            try:
                d['bbox'] = json.loads(d['bbox'])
            except Exception:
                pass
        results.append(d)
    return results

@router.get("/stats")
def get_event_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM events")
    total_events = cursor.fetchone()[0]
    
    cursor.execute("SELECT vehicle_type, COUNT(*) as count FROM events WHERE vehicle_type IS NOT NULL GROUP BY vehicle_type")
    vehicle_breakdown = {r['vehicle_type']: r['count'] for r in cursor.fetchall()}
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE resolved = 0")
    active_alerts = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM evidence")
    total_evidence = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "total_events": total_events,
        "active_alerts": active_alerts,
        "total_evidence_hashes": total_evidence,
        "vehicle_breakdown": vehicle_breakdown
    }
