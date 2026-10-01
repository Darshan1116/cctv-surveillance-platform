import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from api.websocket import ws_manager
from api.cameras import router as cameras_router
from api.events import router as events_router
from api.alerts import router as alerts_router
from api.search import router as search_router
from api.zones import router as zones_router
from api.ingest import router as ingest_router
from api.upload import router as upload_router
from api.government import router as government_router
from evidence.hashing import verify_evidence, get_all_evidence, record_evidence
from ingestion.camera_service import camera_service

init_db()

app = FastAPI(
    title="Gujarat CCTV AI Surveillance Platform",
    description="Scalable Multi-Camera CCTV Surveillance with YOLO Detection, ByteTrack, EasyOCR, Action Recognition, Zone Separation, Sentinel Ingestion, and SHA-256 Evidence Vault",
    version="2.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import RedirectResponse

app.include_router(cameras_router)
app.include_router(events_router)
app.include_router(alerts_router)
app.include_router(search_router)
app.include_router(zones_router)
app.include_router(ingest_router)
app.include_router(upload_router)
app.include_router(government_router)

@app.get("/")
def root():
    return RedirectResponse(url="http://localhost:3000")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/api/evidence")
def list_evidence():
    return get_all_evidence(50)

@app.post("/api/evidence/{evidence_id}/verify")
def verify_evidence_endpoint(evidence_id: int):
    return verify_evidence(evidence_id)

@app.post("/api/iot/trigger")
def trigger_iot_endpoint(payload: dict = Body(...)):
    sensor_id = payload.get("sensor_id", "SENSOR_01")
    camera_id = payload.get("camera_id", "cam1")
    trigger_type = payload.get("trigger_type", "MOTION")
    return camera_service.trigger_iot_sensor(sensor_id, camera_id, trigger_type)

@app.get("/api/model/metrics")
def get_model_metrics():
    meta_path = os.path.join(os.path.dirname(__file__), 'models', 'training_metadata.json')
    val_path = os.path.join(os.path.dirname(__file__), 'models', 'validation_report.json')
    test_path = os.path.join(os.path.dirname(__file__), 'models', 'unseen_test_report.json')
    
    meta = {}
    val = {}
    test = {}
    
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta = json.load(f)
    if os.path.exists(val_path):
        with open(val_path, 'r') as f:
            val = json.load(f)
    if os.path.exists(test_path):
        with open(test_path, 'r') as f:
            test = json.load(f)
            
    return {
        "status": "OPERATIONAL",
        "training": meta,
        "validation": val,
        "unseen_test": test
    }

@app.post("/api/simulate/{scenario}")
def trigger_simulation(scenario: str, camera_id: str = "cam1"):
    cam = camera_service.get_camera(camera_id)
    if not cam:
        return {"status": "ERROR", "message": "Camera not found"}
        
    if scenario == "freeze":
        cam.health_monitor.set_forced_status("FROZEN")
        return {"status": "SUCCESS", "message": f"Camera {camera_id} set to FROZEN status"}
    elif scenario == "block":
        cam.health_monitor.set_forced_status("BLOCKED")
        return {"status": "SUCCESS", "message": f"Camera {camera_id} set to BLOCKED lens status"}
    elif scenario == "view_change":
        cam.health_monitor.set_forced_status("VIEW_CHANGED")
        return {"status": "SUCCESS", "message": f"Camera {camera_id} set to VIEW_CHANGED status"}
    elif scenario == "reset":
        cam.health_monitor.clear_forced_status()
        return {"status": "SUCCESS", "message": f"Camera {camera_id} restored to HEALTHY status"}
    elif scenario == "watchlist":
        from ai.event_processor import process_and_publish_event
        event = {
            "camera_id": camera_id,
            "event_type": "vehicle_detection",
            "track_id": 47,
            "vehicle_type": "car",
            "plate": "GJ01AB1234",
            "confidence": 0.96,
            "ocr_confidence": 0.94,
            "bbox": [150, 200, 350, 320]
        }
        process_and_publish_event(event, frame_bgr=cam.get_latest_frame(annotated=False))
        return {"status": "SUCCESS", "message": "Watchlist vehicle GJ01AB1234 detected and recorded"}
    elif scenario == "restricted":
        from ai.event_processor import process_and_publish_event
        event = {
            "camera_id": "cam2",
            "event_type": "vehicle_detection",
            "track_id": 88,
            "vehicle_type": "truck",
            "plate": "GJ18EF9012",
            "confidence": 0.94,
            "ocr_confidence": 0.92,
            "bbox": [100, 180, 400, 360]
        }
        process_and_publish_event(event, frame_bgr=cam.get_latest_frame(annotated=False))
        return {"status": "SUCCESS", "message": "Restricted zone breach injected on cam2"}
    elif scenario == "action_snatch":
        from ai.event_processor import process_and_publish_event
        event = {
            "camera_id": camera_id,
            "event_type": "POSSIBLE_SNATCHING",
            "track_id": 12,
            "vehicle_type": "person",
            "plate": None,
            "confidence": 0.88,
            "action_label": "Possible snatching detected — human verification required",
            "explanation": "Sudden proximity followed by high acceleration departure over 12 frames",
            "severity": "HIGH",
            "bbox": [200, 220, 260, 320]
        }
        process_and_publish_event(event, frame_bgr=cam.get_latest_frame(annotated=False))
        return {"status": "SUCCESS", "message": "Possible snatching action alert injected"}
    else:
        return {"status": "ERROR", "message": f"Unknown scenario {scenario}"}

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "platform": "Gujarat AI CCTV Surveillance Platform",
        "version": "2.0.0",
        "active_cameras": len(camera_service.cameras),
        "ai_engine": "Ultralytics YOLO + Real ByteTrack + EasyOCR + Sequence Action Recognition"
    }

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
