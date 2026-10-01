"""
Validation Pipeline for CCTV Vehicle and Person Detector.
Computes mAP@0.50, mAP@0.50:0.95, Precision, and Recall on the validation split.
"""

import os
import yaml
import json
from ultralytics import YOLO

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
MODELS_DIR = os.path.join(BACKEND_ROOT, 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'vehicle_person_detector.pt')
RESOLVED_YAML = os.path.join(CURRENT_DIR, 'resolved_dataset.yaml')

def validate_model(model_path: str = None) -> dict:
    if model_path is None:
        model_path = MODEL_PATH if os.path.exists(MODEL_PATH) else os.path.join(BACKEND_ROOT, 'yolov8n.pt')
        
    print(f"[Validation] Running validation with model: {model_path}")
    model = YOLO(model_path)
    
    # Run validation
    metrics = model.val(
        data=RESOLVED_YAML if os.path.exists(RESOLVED_YAML) else os.path.join(CURRENT_DIR, 'dataset_config.yaml'),
        split='val',
        imgsz=640,
        batch=8,
        verbose=True
    )
    
    results = {
        "model": model_path,
        "split": "val",
        "map50": round(float(metrics.box.map50), 4) if hasattr(metrics.box, 'map50') else 0.0,
        "map50_95": round(float(metrics.box.map), 4) if hasattr(metrics.box, 'map') else 0.0,
        "precision": round(float(metrics.box.mp), 4) if hasattr(metrics.box, 'mp') else 0.0,
        "recall": round(float(metrics.box.mr), 4) if hasattr(metrics.box, 'mr') else 0.0,
        "class_names": metrics.names if hasattr(metrics, 'names') else {}
    }
    
    print("\n" + "="*50)
    print("VALIDATION METRICS REPORT:")
    print(f"  mAP@0.50     : {results['map50']:.4f}")
    print(f"  mAP@0.50:0.95: {results['map50_95']:.4f}")
    print(f"  Precision    : {results['precision']:.4f}")
    print(f"  Recall       : {results['recall']:.4f}")
    print("="*50 + "\n")
    
    with open(os.path.join(MODELS_DIR, 'validation_report.json'), 'w') as f:
        json.dump(results, f, indent=2)
        
    return results

if __name__ == '__main__':
    validate_model()
