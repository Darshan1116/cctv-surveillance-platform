"""
Multi-Camera Stream Management & Regional Processing Engine.
Architected to scale from dozens to thousands of distributed CCTV streams.
Manages:
- RTSP / Video ingestion threads
- Camera capability models (ONVIF, PTZ, IR Night, Microphone, Resolution)
- Camera health monitoring state machines
- Optical annotation, thermal rendering, real AI detection, tracking, OCR, action recognition
- Event dispatch to MQTT bus and WebSocket bridge
"""

import cv2
import numpy as np
import threading
import time
import os
import glob
from datetime import datetime

from database import get_db
from trust.camera_health import CameraHealthMonitor
from ai.detector import detector
from ai.event_processor import process_and_publish_event
from ai.thermal_processor import thermal_processor
from ingestion.rtsp_reader import RTSPReader
from ingestion.mqtt_publisher import mqtt_bus

VIDEO_DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'dataset', 'videos')

DATASET_DIRS = [
    VIDEO_DATASET_DIR,
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ai', 'training', 'dataset', 'images', 'train'),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ai', 'training', 'dataset', 'images', 'val'),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ai', 'training', 'dataset', 'images', 'test'),
]

class CameraStreamManager:
    def __init__(self, camera_id: str, camera_info: dict):
        self.camera_id = camera_id
        self.info = camera_info
        self.name = camera_info.get('name', camera_id)
        self.location = camera_info.get('location', 'Gujarat Surveillance')
        self.rtsp_url = camera_info.get('rtsp_url', f"rtsp://localhost:8554/{camera_id}")
        self.target_fps = camera_info.get('fps', 15.0)
        
        self.running = True
        self.health_monitor = CameraHealthMonitor(camera_id)
        self.reader = RTSPReader(camera_id, self.rtsp_url, target_fps=self.target_fps)
        
        self.current_raw_frame = None
        self.current_annotated_frame = None
        self.current_thermal_frame = None
        self.lock = threading.Lock()
        
        # Load real dataset video file directly for this camera
        cam_num = int(self.camera_id[-1]) if self.camera_id[-1].isdigit() else 1
        video_file = os.path.join(VIDEO_DATASET_DIR, f"Video{cam_num}.mp4")
        if not os.path.exists(video_file):
            video_file = os.path.join(VIDEO_DATASET_DIR, f"Video{((cam_num - 1) % 18) + 1}.mp4")
            
        self.video_cap = None
        if os.path.exists(video_file):
            self.video_cap = cv2.VideoCapture(video_file)
            
        # Also load dataset images across all available dataset directories
        self.dataset_images = []
        for d in DATASET_DIRS:
            if os.path.exists(d):
                imgs = sorted(glob.glob(os.path.join(d, '*.[jJ][pP][gG]')) + glob.glob(os.path.join(d, '*.[pP][nN][gG]')))
                self.dataset_images.extend(imgs)
                
        # Offset dataset frames per camera
        self.dataset_index = (cam_num * 25) % max(1, len(self.dataset_images)) if self.dataset_images else 0
        self.frame_hold_counter = 0

        # Pre-warm initial optical and thermal frame immediately from dataset video/image
        init_frame = self._read_source_frame()
        if init_frame is None:
            init_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self.current_raw_frame = init_frame.copy()
        self.current_annotated_frame = init_frame.copy()
        init_thermal, _ = thermal_processor.generate_thermal_frame(init_frame, camera_id=self.camera_id)
        self.current_thermal_frame = init_thermal
        
        # Start capture and processing loops
        self.reader.start()
        self.thread = threading.Thread(target=self._processing_loop, daemon=True, name=f"Worker-{camera_id}")
        self.thread.start()

    def _read_source_frame(self) -> np.ndarray:
        """Reads next frame from real dataset video file or dataset image pool."""
        if self.video_cap is not None and self.video_cap.isOpened():
            ret, frame = self.video_cap.read()
            if not ret or frame is None or frame.size == 0:
                self.video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.video_cap.read()
            if ret and frame is not None and frame.size > 0:
                return cv2.resize(frame, (640, 480))
                
        return self._get_next_dataset_frame()

    def _get_next_dataset_frame(self) -> np.ndarray:
        """Fetches next image from the dataset for live stream rendering with smooth cycling."""
        if not self.dataset_images:
            return None
            
        img_path = self.dataset_images[self.dataset_index % len(self.dataset_images)]
        self.frame_hold_counter += 1
        if self.frame_hold_counter >= 5:
            self.frame_hold_counter = 0
            self.dataset_index += 1
            
        frame = cv2.imread(img_path)
        if frame is not None and frame.size > 0:
            return cv2.resize(frame, (640, 480))
        return None

    def _processing_loop(self):
        h, w = 480, 640
        delay = 1.0 / self.target_fps
        
        while self.running:
            t_start = time.time()
            
            # Fetch frame: RTSP Reader (if active) -> Real Dataset Video / Dataset Images
            frame = self.reader.read_frame()
            if frame is None:
                frame = self._read_source_frame()
            if frame is None:
                frame = np.zeros((h, w, 3), dtype=np.uint8)
            else:
                frame = cv2.resize(frame, (w, h))

            # 1. Health Monitor Evaluation
            health = self.health_monitor.evaluate_frame(frame)

            # 2. AI Inference Pipeline (YOLO + Tracker + OCR + Re-ID + Action Sequences)
            detections = detector.detect_and_track(self.camera_id, frame)

            # 3. Create Optical Annotated Frame
            annotated = frame.copy()
            # Top Banner
            cv2.rectangle(annotated, (0, 0), (w, 32), (12, 14, 18), -1)
            cv2.putText(annotated, f"[NETRASURAKSHA] {self.name}", (10, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (0, 240, 255), 1)
            time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(annotated, time_str, (w - 180, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (200, 200, 200), 1)
            
            # Status tag
            status_color = (0, 255, 0) if health['health_status'] == 'HEALTHY' or health['health_status'] == 'ONLINE' else (0, 0, 255)
            cv2.putText(annotated, f"FEED: {health['health_status']} ({health['fps']:.1f} FPS)", (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.38, status_color, 1)

            # Render Detections
            for d in detections:
                bbox = d.get('bbox', [0, 0, 0, 0])
                if bbox == [0, 0, 0, 0]:
                    continue
                vtype = d.get('vehicle_type', 'object')
                tid = d.get('track_id', 1)
                plate = d.get('plate')
                direction = d.get('direction', '')
                speed = d.get('speed_estimate', 0.0)
                
                color = (0, 255, 0) if vtype != 'person' else (255, 140, 0)
                cv2.rectangle(annotated, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
                
                label = f"{vtype} #{tid}"
                if plate:
                    label += f" [{plate}]"
                if direction and direction != "STATIONARY":
                    label += f" {direction}"
                    
                cv2.putText(annotated, label, (bbox[0], max(18, bbox[1] - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1)

                # Process & publish real event
                process_and_publish_event(d, frame_bgr=frame)

            # 4. Thermal FLIR Heatmap Frame
            thermal_frame, _ = thermal_processor.generate_thermal_frame(frame, detections=detections, camera_id=self.camera_id)

            with self.lock:
                self.current_raw_frame = frame
                self.current_annotated_frame = annotated
                self.current_thermal_frame = thermal_frame

            elapsed = time.time() - t_start
            time.sleep(max(0.01, delay - elapsed))

    def get_latest_frame(self, annotated: bool = True, mode: str = 'optical') -> np.ndarray:
        with self.lock:
            if mode == 'thermal' and self.current_thermal_frame is not None:
                return self.current_thermal_frame.copy()
            elif annotated and self.current_annotated_frame is not None:
                return self.current_annotated_frame.copy()
            elif self.current_raw_frame is not None:
                return self.current_raw_frame.copy()
            return np.zeros((480, 640, 3), dtype=np.uint8)

    def stop(self):
        self.running = False
        self.reader.stop()

class CameraService:
    def __init__(self):
        self.cameras = {}
        self._load_and_initialize_cameras()

    def _load_and_initialize_cameras(self):
        from database import init_db
        init_db()
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM cameras')
        rows = cursor.fetchall()
        conn.close()
        
        for r in rows:
            cam_data = dict(r)
            cam_id = cam_data['camera_id']
            self.cameras[cam_id] = CameraStreamManager(cam_id, cam_data)

    def get_camera(self, camera_id: str) -> CameraStreamManager:
        return self.cameras.get(camera_id)

    def get_all_cameras_info(self) -> list:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM cameras')
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def register_dynamic_stream(self, camera_id: str, camera_info: dict):
        """
        Dynamically spins up a new isolated worker thread for an onboarded stream.
        """
        if camera_id in self.cameras:
            self.cameras[camera_id].stop()
        self.cameras[camera_id] = CameraStreamManager(camera_id, camera_info)
        return self.cameras[camera_id]

    def sync_all_cameras(self) -> int:
        """
        Refreshes and syncs all cameras from the database catalogue.
        """
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM cameras')
        rows = cursor.fetchall()
        conn.close()
        
        current_ids = set()
        for r in rows:
            cam_data = dict(r)
            cam_id = cam_data['camera_id']
            current_ids.add(cam_id)
            if cam_id not in self.cameras:
                self.cameras[cam_id] = CameraStreamManager(cam_id, cam_data)
                
        return len(self.cameras)

    def trigger_iot_sensor(self, sensor_id: str, camera_id: str, trigger_type: str = "MOTION") -> dict:
        cam = self.get_camera(camera_id)
        if not cam:
            return {"status": "ERROR", "message": f"Camera {camera_id} not found"}
            
        frame = cam.get_latest_frame(annotated=False)
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        from evidence.hashing import record_evidence
        ev = record_evidence(camera_id, buffer.tobytes(), filename=f"IOT_{sensor_id}_{int(time.time())}.jpg")
        
        event_payload = {
            "camera_id": camera_id,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "IOT_SENSOR_TRIGGER",
            "sensor_id": sensor_id,
            "trigger_type": trigger_type,
            "evidence_id": ev['evidence_id'],
            "sha256": ev['sha256'],
            "details": f"IoT sensor {sensor_id} ({trigger_type}) triggered frame capture and integrity record"
        }
        mqtt_bus.publish(f"camera/trigger/{camera_id}", event_payload)
        return event_payload

camera_service = CameraService()
