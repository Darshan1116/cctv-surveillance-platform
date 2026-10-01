"""
Inference Script for CCTV Vehicle and Person Detector.
Accepts an image or video path, performs real YOLO inference,
and outputs detection JSON metadata and annotated visual media.
"""

import os
import sys
import argparse
import json
import cv2
import numpy as np
from ultralytics import YOLO

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
MODELS_DIR = os.path.join(BACKEND_ROOT, 'models')
DEFAULT_MODEL = os.path.join(MODELS_DIR, 'vehicle_person_detector.pt')
if not os.path.exists(DEFAULT_MODEL):
    DEFAULT_MODEL = os.path.join(BACKEND_ROOT, 'yolov8n.pt')

def predict_media(source_path: str, model_path: str = DEFAULT_MODEL, conf_thresh: float = 0.35, output_path: str = None) -> dict:
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source media not found at: {source_path}")
        
    model = YOLO(model_path)
    
    # Check if video or image
    is_video = source_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv'))
    
    if not is_video:
        frame = cv2.imread(source_path)
        if frame is None:
            raise ValueError(f"Could not decode image at {source_path}")
            
        results = model.predict(frame, conf=conf_thresh, verbose=False)
        detections = []
        annotated_frame = frame.copy()
        
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = model.names.get(cls_id, f"cls_{cls_id}")
                conf = float(box.conf[0].item())
                xyxy = [int(v) for v in box.xyxy[0].tolist()]
                
                detections.append({
                    "class": cls_name,
                    "confidence": round(conf, 3),
                    "bbox": xyxy
                })
                
                # Annotate
                color = (0, 255, 0) if cls_name != 'person' else (255, 140, 0)
                cv2.rectangle(annotated_frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), color, 2)
                cv2.putText(annotated_frame, f"{cls_name} {conf:.2f}", (xyxy[0], max(20, xyxy[1] - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                            
        if output_path:
            cv2.imwrite(output_path, annotated_frame)
            
        return {
            "source": source_path,
            "type": "image",
            "model": model_path,
            "detections_count": len(detections),
            "detections": detections,
            "annotated_output": output_path
        }
    else:
        cap = cv2.VideoCapture(source_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        
        writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
            
        frame_idx = 0
        total_detections = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret or frame is None:
                break
                
            results = model.predict(frame, conf=conf_thresh, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = model.names.get(cls_id, f"cls_{cls_id}")
                    conf = float(box.conf[0].item())
                    xyxy = [int(v) for v in box.xyxy[0].tolist()]
                    total_detections += 1
                    
                    color = (0, 255, 0) if cls_name != 'person' else (255, 140, 0)
                    cv2.rectangle(frame, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), color, 2)
                    cv2.putText(frame, f"{cls_name} {conf:.2f}", (xyxy[0], max(20, xyxy[1] - 6)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                                
            if writer:
                writer.write(frame)
            frame_idx += 1
            
        cap.release()
        if writer:
            writer.release()
            
        return {
            "source": source_path,
            "type": "video",
            "frames_processed": frame_idx,
            "total_detections": total_detections,
            "annotated_output": output_path
        }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=str, required=True, help='Path to image or video')
    parser.add_argument('--model', type=str, default=DEFAULT_MODEL, help='Path to model weights')
    parser.add_argument('--output', type=str, default=None, help='Output path')
    args = parser.parse_args()
    
    out = predict_media(args.source, args.model, output_path=args.output)
    print(json.dumps(out, indent=2))
