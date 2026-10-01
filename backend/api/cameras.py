import cv2
import time
from fastapi import APIRouter, Response, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from database import get_db
from ingestion.camera_service import camera_service
from ai.thermal_processor import thermal_processor
from ingestion.onvif_client import ONVIFCameraClient

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

@router.get("")
def list_cameras(zone_id: str = Query(None, description="Filter cameras by zone ID (e.g. ZONE_A, ZONE_B)")):
    conn = get_db()
    cursor = conn.cursor()
    if zone_id:
        cursor.execute("SELECT * FROM cameras WHERE zone_id = ?", (zone_id,))
    else:
        cursor.execute("SELECT * FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/onvif/discover")
def discover_onvif_devices():
    client = ONVIFCameraClient()
    return client.discover_cameras()

@router.get("/{camera_id}")
def get_camera(camera_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE camera_id = ?", (camera_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")
    return dict(row)

@router.get("/{camera_id}/capabilities")
def get_camera_capabilities(camera_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE camera_id = ?", (camera_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")
    data = dict(row)
    return {
        "camera_id": camera_id,
        "name": data["name"],
        "rtsp_available": bool(data.get("rtsp_available", 1)),
        "onvif_available": bool(data.get("onvif_available", 0)),
        "ptz_available": bool(data.get("ptz_available", 0)),
        "microphone_available": bool(data.get("microphone_available", 0)),
        "night_ir_capability": bool(data.get("night_ir_capability", 1)),
        "resolution": data.get("resolution", "1920x1080"),
        "fps": data.get("fps", 15.0),
        "plate_recognition_suitability": data.get("plate_recognition_suitability", 0.95),
        "edge_node_id": data.get("edge_node_id", "edge-node-west-01"),
        "status": data.get("status", "ONLINE")
    }

def generate_mjpeg_stream(camera_id: str, mode: str = "optical"):
    cam = camera_service.get_camera(camera_id)
    if not cam:
        return
    while True:
        frame = cam.get_latest_frame(annotated=True, mode=mode)
        ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ret:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(0.066)

@router.get("/{camera_id}/stream")
def stream_camera(camera_id: str, mode: str = Query("optical", regex="^(optical|thermal)$")):
    return StreamingResponse(generate_mjpeg_stream(camera_id, mode=mode), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/{camera_id}/thermal")
def get_camera_thermal_telemetry(camera_id: str):
    telemetry = thermal_processor.get_latest_telemetry(camera_id)
    return telemetry

@router.get("/{camera_id}/snapshot")
def get_snapshot(camera_id: str, mode: str = "optical"):
    cam = camera_service.get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    frame = cam.get_latest_frame(annotated=True, mode=mode)
    ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return Response(content=jpeg.tobytes(), media_type="image/jpeg")

@router.get("/{camera_id}/health")
def get_camera_health_history(camera_id: str, limit: int = 20):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM camera_health WHERE camera_id = ? ORDER BY id DESC LIMIT ?", (camera_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
