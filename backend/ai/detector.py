"""
Production AI Surveillance Detector and Tracker Engine.
Performs real YOLO inference (vehicle and person classes),
multi-object tracking (Kalman / velocity / direction),
real license plate OCR extraction,
appearance Re-ID feature embedding,
and temporal action behavior recognition.
Strictly ZERO synthetic / fake detections.
"""

import cv2
import numpy as np
import time
import os
from ai.tracker import RealMultiObjectTracker
from ai.ocr import plate_ocr
from ai.reid import reid_engine
from ai.action_recognition import action_analyzer

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
TRAINED_MODEL_PATH = os.path.join(BACKEND_ROOT, 'models', 'vehicle_person_detector.pt')
BASE_MODEL_PATH = os.path.join(BACKEND_ROOT, 'yolov8n.pt')

ALLOWED_CLASSES = {'car', 'motorcycle', 'bus', 'truck', 'auto_rickshaw', 'person', 'bicycle'}

class SurveillanceDetector:
    def __init__(self, model_path: str = None):
        if model_path is None:
            self.model_path = TRAINED_MODEL_PATH if os.path.exists(TRAINED_MODEL_PATH) else BASE_MODEL_PATH
        else:
            self.model_path = model_path
            
        self.model = None
        self.trackers = {}
        self.frame_counter = {}
        self._init_model()

    def _init_model(self):
        try:
            from ultralytics import YOLO
            actual_path = self.model_path if os.path.exists(self.model_path) else BASE_MODEL_PATH
            if os.path.exists(actual_path):
                self.model = YOLO(actual_path)
                print(f"[Detector] Loaded YOLO model from {actual_path}")
            else:
                self.model = YOLO('yolov8n.pt')
                print("[Detector] Loaded standard YOLOv8n model.")
        except Exception as e:
            print(f"[Detector] YOLO initialization error: {e}")
            self.model = None

    def reload_model_if_updated(self):
        """Reloads trained model if newly trained weights exist."""
        if os.path.exists(TRAINED_MODEL_PATH) and self.model_path != TRAINED_MODEL_PATH:
            self.model_path = TRAINED_MODEL_PATH
            self._init_model()

    def detect_and_track(self, camera_id: str, frame_bgr: np.ndarray, frame_skip: int = 1, conf_threshold: float = 0.30, timestamp: float = None) -> list:
        """
        Runs real inference, tracking, plate OCR, and action behavior sequence recognition.
        Returns list of true detections. Zero synthetic/fake detections.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        if camera_id not in self.trackers:
            self.trackers[camera_id] = RealMultiObjectTracker(max_lost=12, iou_threshold=0.25)
            self.frame_counter[camera_id] = 0

        self.frame_counter[camera_id] += 1
        curr_time = timestamp if timestamp is not None else time.time()

        h, w = frame_bgr.shape[:2]
        raw_detections = []

        if self.model is not None:
            try:
                results = self.model.predict(frame_bgr, verbose=False, conf=conf_threshold)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name = self.model.names.get(cls_id, 'object')
                        conf = float(box.conf[0].item())
                        
                        # Map standard COCO or custom classes to surveillance vocabulary
                        if cls_name in ALLOWED_CLASSES:
                            xyxy = box.xyxy[0].tolist()
                            x1 = max(0, min(w - 1, int(xyxy[0])))
                            y1 = max(0, min(h - 1, int(xyxy[1])))
                            x2 = max(0, min(w, int(xyxy[2])))
                            y2 = max(0, min(h, int(xyxy[3])))
                            
                            if (x2 - x1) > 10 and (y2 - y1) > 10:
                                crop = frame_bgr[y1:y2, x1:x2]
                                appearance = reid_engine.extract_features(crop, obj_type=cls_name)
                                
                                raw_detections.append({
                                    'bbox': [x1, y1, x2, y2],
                                    'class_name': cls_name,
                                    'confidence': round(conf, 3),
                                    'appearance': appearance
                                })
            except Exception as e:
                print(f"[Detector] Inference exception on camera {camera_id}: {e}")

        # Multi-Object Tracking update
        tracked = self.trackers[camera_id].update(raw_detections, timestamp=curr_time)

        # Run OCR on vehicles & extract action behaviors
        events = []
        for d in tracked:
            bbox = d['bbox']
            crop = frame_bgr[max(0, bbox[1]):min(h, bbox[3]), max(0, bbox[0]):min(w, bbox[2])]
            
            plate_info = {"plate": None, "confidence": 0.0, "quality": "N/A", "verified": False}
            if d['class_name'] in ['car', 'bus', 'truck', 'motorcycle', 'auto_rickshaw']:
                plate_info = plate_ocr.recognize_plate(crop, track_id=d.get('track_id'), camera_id=camera_id)

            events.append({
                "camera_id": camera_id,
                "event_type": "vehicle_detection" if d['class_name'] != 'person' else "person_detection",
                "track_id": d.get('track_id', 1),
                "vehicle_type": d['class_name'],
                "plate": plate_info.get('plate'),
                "ocr_confidence": plate_info.get('confidence', 0.0),
                "confidence": d['confidence'],
                "bbox": bbox,
                "direction": d.get('direction', 'STATIONARY'),
                "heading_deg": d.get('heading_deg', 0.0),
                "speed_estimate": d.get('speed_estimate', 0.0),
                "track_status": d.get('track_status', 'POSSIBLE_MATCH'),
                "appearance": d.get('appearance')
            })

        # Run Action Behavior Sequence Analysis
        action_events = action_analyzer.update_and_analyze(camera_id, tracked, curr_time)
        for act in action_events:
            events.append({
                "camera_id": camera_id,
                "event_type": act['event_type'],
                "track_id": act['track_id'],
                "associated_track_id": act.get('associated_track_id'),
                "vehicle_type": "vehicle" if "TRAFFIC" in act['event_type'] else "person",
                "plate": None,
                "ocr_confidence": 0.0,
                "confidence": act['confidence'],
                "bbox": [0, 0, 0, 0],
                "direction": "RAPID_DEVIATION",
                "speed_estimate": 0.0,
                "action_label": act['action_label'],
                "explanation": act['explanation'],
                "severity": act['severity']
            })

        return events

detector = SurveillanceDetector()
