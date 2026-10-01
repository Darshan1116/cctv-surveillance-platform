from fastapi import APIRouter, HTTPException, Query, Body
from database import get_db
from alerts.alert_service import get_recent_alerts, resolve_alert, load_active_watchlists, load_restricted_zones
from datetime import datetime
import json

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("")
def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    status: str = None,
    severity: str = None,
    zone_id: str = None,
    camera_id: str = None
):
    conn = get_db()
    cursor = conn.cursor()
    query = """
        SELECT a.*, c.zone_id as cam_zone_id
        FROM alerts a
        LEFT JOIN cameras c ON a.camera_id = c.camera_id
        WHERE 1=1
    """
    params = []
    if status:
        query += " AND a.status = ?"
        params.append(status)
    if severity:
        query += " AND a.severity = ?"
        params.append(severity)
    if camera_id:
        query += " AND a.camera_id = ?"
        params.append(camera_id)
    if zone_id:
        query += " AND (a.zone_id = ? OR c.zone_id = ?)"
        params.append(zone_id)
        params.append(zone_id)
        
    query += " ORDER BY a.alert_id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/{alert_id}/resolve")
def resolve_alert_endpoint(alert_id: int, note: dict = Body(default={"note": "Verified by Operator"})):
    resolution_note = note.get("note", "Verified by Operator")
    result = resolve_alert(alert_id, resolution_note)
    return result

@router.get("/watchlists")
def get_watchlists():
    return load_active_watchlists()

@router.post("/watchlists")
def add_watchlist_item(payload: dict = Body(...)):
    item_type = payload.get("item_type", "PLATE")
    value = payload.get("value", "").strip().upper()
    category = payload.get("category", "FLAGGED_VEHICLE")
    note = payload.get("note", "")
    severity = payload.get("severity", "HIGH")
    
    if not value:
        raise HTTPException(status_code=400, detail="Value is required")
        
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''INSERT INTO watchlists (item_type, value, category, note, severity, active, created_at)
                          VALUES (?, ?, ?, ?, ?, 1, ?)''',
                       (item_type, value, category, note, severity, datetime.utcnow().isoformat()))
        w_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {"status": "SUCCESS", "watchlist_id": w_id, "value": value}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error adding watchlist item: {str(e)}")

@router.delete("/watchlists/{watchlist_id}")
def delete_watchlist_item(watchlist_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM watchlists WHERE watchlist_id = ?', (watchlist_id,))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "deleted_id": watchlist_id}

@router.get("/restricted-zones")
def get_restricted_zones():
    return load_restricted_zones()

@router.post("/restricted-zones")
def create_restricted_zone(payload: dict = Body(...)):
    zone_id = payload.get("zone_id", f"rz_{int(datetime.utcnow().timestamp())}")
    name = payload.get("name", "Custom Security Geofence")
    camera_id = payload.get("camera_id")
    coords = payload.get("polygon_coords", [])
    h_start = payload.get("active_hours_start", 0)
    h_end = payload.get("active_hours_end", 24)
    target_types = payload.get("target_types", ["vehicle", "person"])
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO restricted_zones (zone_id, name, camera_id, polygon_coords, active_hours_start, active_hours_end, target_types, active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 1)''',
                   (zone_id, name, camera_id, json.dumps(coords), h_start, h_end, json.dumps(target_types)))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "zone_id": zone_id, "name": name}
