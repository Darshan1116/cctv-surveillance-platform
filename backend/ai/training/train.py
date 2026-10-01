"""
Training Pipeline for YOLO CCTV Vehicle and Person Detector.
Trains an actual Ultralytics YOLO model on the verified surveillance dataset
and exports the certified weights to backend/models/.
"""

import os
import sys
import yaml
import json
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

BACKEND_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
MODELS_DIR = os.path.join(BACKEND_ROOT, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

CONFIG_PATH = os.path.join(CURRENT_DIR, 'dataset_config.yaml')
DATASET_PATH = os.path.join(CURRENT_DIR, 'dataset')

def train_model(epochs: int = 10, img_size: int = 640, batch_size: int = 16, base_model: str = 'yolov8n.pt'):
    print(f"[{datetime.now().isoformat()}] Starting YOLO CCTV Model Training...")
    print(f"  Configuration: {CONFIG_PATH}")
    print(f"  Base weights: {base_model}")
    print(f"  Epochs: {epochs}, Batch size: {batch_size}, Image size: {img_size}")
    
    # 1. Verify dataset readiness
    from prepare_dataset import prepare_dataset, audit_dataset
    audit = audit_dataset(DATASET_PATH)
    if audit['splits'].get('train', {}).get('images', 0) < 10:
        print("[Training] Dataset missing or incomplete. Running prepare_dataset()...")
        audit = prepare_dataset(train_count=100, val_count=25, test_count=25)
        
    print(f"  Verified Train samples: {audit['splits']['train']['images']}")
    print(f"  Verified Val samples: {audit['splits']['val']['images']}")
    
    # Create resolved dataset yaml with absolute paths
    resolved_yaml_path = os.path.join(CURRENT_DIR, 'resolved_dataset.yaml')
    with open(CONFIG_PATH, 'r') as f:
        cfg = yaml.safe_load(f)
    cfg['path'] = os.path.abspath(DATASET_PATH)
    cfg['train'] = os.path.abspath(os.path.join(DATASET_PATH, 'images', 'train'))
    cfg['val'] = os.path.abspath(os.path.join(DATASET_PATH, 'images', 'val'))
    cfg['test'] = os.path.abspath(os.path.join(DATASET_PATH, 'images', 'test'))
    with open(resolved_yaml_path, 'w') as f:
        yaml.safe_dump(cfg, f)
        
    from ultralytics import YOLO
    
    backend_base = os.path.join(BACKEND_ROOT, 'yolov8n.pt')
    initial_weights = backend_base if os.path.exists(backend_base) else base_model
    
    model = YOLO(initial_weights)
    
    # Train
    results = model.train(
        data=resolved_yaml_path,
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        lr0=0.01,
        project=os.path.join(CURRENT_DIR, 'runs'),
        name='cctv_yolo_train',
        exist_ok=True,
        verbose=True,
        plots=True
    )
    
    best_weights_path = os.path.join(CURRENT_DIR, 'runs', 'cctv_yolo_train', 'weights', 'best.pt')
    target_model_path = os.path.join(MODELS_DIR, 'vehicle_person_detector.pt')
    
    if os.path.exists(best_weights_path):
        import shutil
        shutil.copy2(best_weights_path, target_model_path)
        print(f"[Training] Model successfully saved to {target_model_path}")
    else:
        model.save(target_model_path)
        print(f"[Training] Model saved to {target_model_path}")
        
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "model_file": target_model_path,
        "base_model": base_model,
        "epochs": epochs,
        "classes": cfg.get('names', {}),
        "status": "TRAINED_SUCCESSFULLY"
    }
    with open(os.path.join(MODELS_DIR, 'training_metadata.json'), 'w') as f:
        json.dump(report, f, indent=2)
        
    print("[Training] Pipeline completed successfully.")
    return target_model_path

if __name__ == '__main__':
    train_model(epochs=10, batch_size=16)
