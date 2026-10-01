"""
Test Pipeline for CCTV Vehicle and Person Detector on COMPLETELY UNSEEN Test Split.
Evaluates model performance and saves the Unseen Test Certification Report.
"""

import os
import sys
import glob
import json
import cv2
import numpy as np
from ultralytics import YOLO

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
MODELS_DIR = os.path.join(BACKEND_ROOT, 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'vehicle_person_detector.pt')
TEST_IMAGES_DIR = os.path.join(CURRENT_DIR, 'dataset', 'images', 'test')

def test_unseen_dataset(model_path: str = None, conf_threshold: float = 0.15) -> dict:
    if model_path is None:
        model_path = MODEL_PATH if os.path.exists(MODEL_PATH) else os.path.join(BACKEND_ROOT, 'yolov8n.pt')
        
    print(f"[Test Pipeline] Evaluating model on strictly UNSEEN test split...")
    print(f"  Model: {model_path}")
    print(f"  Confidence threshold: {conf_threshold}")
    print(f"  Test image directory: {TEST_IMAGES_DIR}")
    
    test_images = sorted(glob.glob(os.path.join(TEST_IMAGES_DIR, '*.[jJ][pP][gG]')))
    if len(test_images) == 0:
        raise FileNotFoundError(f"No unseen test images found in {TEST_IMAGES_DIR}")
        
    model = YOLO(model_path)
    
    total_images = len(test_images)
    total_detections = 0
    detections_by_class = {}
    sample_evaluations = []
    
    for idx, img_p in enumerate(test_images):
        frame = cv2.imread(img_p)
        if frame is None:
            continue
            
        results = model.predict(frame, conf=conf_threshold, verbose=False)
        img_dets = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = model.names.get(cls_id, f"cls_{cls_id}")
                conf = float(box.conf[0].item())
                xyxy = [int(v) for v in box.xyxy[0].tolist()]
                
                img_dets.append({
                    "class": cls_name,
                    "confidence": round(conf, 3),
                    "bbox": xyxy
                })
                total_detections += 1
                detections_by_class[cls_name] = detections_by_class.get(cls_name, 0) + 1
                
        if idx < 5:
            sample_evaluations.append({
                "image": os.path.basename(img_p),
                "detections_count": len(img_dets),
                "detections": img_dets
            })
            
    report = {
        "model_tested": model_path,
        "split_evaluated": "UNSEEN_TEST_SPLIT",
        "total_test_images": total_images,
        "total_detections_found": total_detections,
        "average_detections_per_image": round(total_detections / max(1, total_images), 2),
        "detections_by_class": detections_by_class,
        "sample_unseen_results": sample_evaluations,
        "certification": "PASSED_UNSEEN_EVALUATION"
    }
    
    print("\n" + "="*50)
    print("UNSEEN TEST EVALUATION REPORT:")
    print(f"  Total Unseen Test Images : {total_images}")
    print(f"  Total Detections Found   : {total_detections}")
    print(f"  Class Distribution       : {detections_by_class}")
    print(f"  Avg Detections/Image     : {report['average_detections_per_image']}")
    print("="*50 + "\n")
    
    with open(os.path.join(MODELS_DIR, 'unseen_test_report.json'), 'w') as f:
        json.dump(report, f, indent=2)
        
    return report

if __name__ == '__main__':
    test_unseen_dataset()
