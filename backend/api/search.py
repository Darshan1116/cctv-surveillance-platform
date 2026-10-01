import json
from fastapi import APIRouter, Query, HTTPException, Body
from database import get_db
from ai.reid import reid_engine
from ai.incident_router import incident_router

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
def search_events(
    plate: str = Query(None, description="License plate query"),
    vehicle_type: str = Query(None),
    camera_id: str = Query(None),
    limit: int = 50
):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM events WHERE 1=1"
    params = []
    
    if plate:
        query += " AND plate LIKE ?"
        params.append(f"%{plate.strip().upper()}%")
    if vehicle_type:
        query += " AND vehicle_type = ?"
        params.append(vehicle_type)
    if camera_id:
        query += " AND camera_id = ?"
        params.append(camera_id)
        
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

@router.get("/plate-journey/{plate}")
def get_plate_journey(plate: str):
    """Reconstructs full multi-camera journey timeline for a license plate."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''SELECT e.*, c.name as camera_name, c.latitude, c.longitude, c.location
                      FROM events e
                      LEFT JOIN cameras c ON e.camera_id = c.camera_id
                      WHERE e.plate LIKE ?
                      ORDER BY e.timestamp ASC''', (f"%{plate.strip().upper()}%",))
    rows = cursor.fetchall()
    conn.close()
    
    timeline = []
    for r in rows:
        d = dict(r)
        if d.get('bbox') and isinstance(d['bbox'], str):
            try:
                d['bbox'] = json.loads(d['bbox'])
            except Exception:
                pass
        timeline.append(d)
        
    p_clean = plate.strip().upper()
    unique_cams = len(set(d['camera_id'] for d in timeline if d.get('camera_id')))
    return {
        "searched_plate": p_clean,
        "plate": p_clean,
        "total_sightings": len(timeline),
        "total_detections": len(timeline),
        "unique_cameras_count": unique_cams,
        "timeline": timeline
    }

@router.post("/reid")
def appearance_reid_search(target_descriptor: dict = Body(...)):
    """Searches past events across cameras for appearance-based matching."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE appearance_features IS NOT NULL ORDER BY event_id DESC LIMIT 200")
    rows = cursor.fetchall()
    conn.close()
    
    matches = []
    for r in rows:
        try:
            cand_desc = json.loads(r['appearance_features'])
            sim = reid_engine.compute_similarity(target_descriptor, cand_desc)
            if sim['similarity_score'] >= 0.60:
                d = dict(r)
                d['similarity'] = sim
                matches.append(d)
        except Exception:
            continue
            
    matches.sort(key=lambda x: x['similarity']['similarity_score'], reverse=True)
    return {
        "total_checked": len(rows),
        "candidate_matches": matches[:20]
    }

@router.get("/zones")
def list_coverage_zones():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coverage_zones")
    rows = cursor.fetchall()
    conn.close()
    
    zones = []
    for r in rows:
        d = dict(r)
        if d.get('polygon_geo') and isinstance(d['polygon_geo'], str):
            d['polygon_geo'] = json.loads(d['polygon_geo'])
        if d.get('connecting_zones') and isinstance(d['connecting_zones'], str):
            d['connecting_zones'] = json.loads(d['connecting_zones'])
        zones.append(d)
    return zones

@router.post("/incidents/sos")
def trigger_sos_incident(payload: dict = Body(...)):
    """Module 1: Creates an incident originating in a coverage gap / unmonitored zone."""
    return incident_router.create_no_camera_incident(payload)

@router.get("/incidents")
def list_incidents(status: str = None):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM incidents"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY timestamp DESC LIMIT 50"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        for key in ['last_known_observation', 'route_prediction', 'matched_observations']:
            if d.get(key) and isinstance(d[key], str):
                try:
                    d[key] = json.loads(d[key])
                except Exception:
                    pass
        results.append(d)
    return results
