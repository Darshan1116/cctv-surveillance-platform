"""
Central Surveillance Event Processing, Hashing, and MQTT/WebSocket Dispatch Pipeline.
Processes real vehicle/person detections, plate OCR results, and temporal action events.
Ensures SHA-256 evidence recording for all flagged events.
"""

import json
import base64
import cv2
from datetime import datetime
from database import get_db
from alerts.alert_service import check_for_alerts
from evidence.hashing import record_evidence
from ingestion.mqtt_publisher import mqtt_bus

def process_and_publish_event(event_dict: dict, frame_bgr = None) -> dict:
    timestamp = event_dict.get('timestamp', datetime.utcnow().isoformat())
    camera_id = event_dict['camera_id']
    event_type = event_dict.get('event_type', 'vehicle_detection')
    track_id = event_dict.get('track_id', 0)
    vehicle_type = event_dict.get('vehicle_type', 'car')
    plate = event_dict.get('plate')
    ocr_confidence = event_dict.get('ocr_confidence', 0.0)
    confidence = event_dict.get('confidence', 0.90)
    direction = event_dict.get('direction', 'STATIONARY')
    speed_estimate = event_dict.get('speed_estimate', 0.0)
    action_label = event_dict.get('action_label')
    action_conf = event_dict.get('action_confidence', confidence if action_label else 0.0)
    explanation = event_dict.get('explanation')
    bbox_str = json.dumps(event_dict.get('bbox', []))
    app_str = json.dumps(event_dict.get('appearance', {})) if event_dict.get('appearance') else None
    evidence_id = event_dict.get('evidence_id')
    
    camera_zone_map = {
        'cam1': 'ZONE_A',
        'cam2': 'ZONE_B',
        'cam3': 'ZONE_C',
        'cam4': 'ZONE_D',
        'cam5': 'ZONE_E'
    }
    zone_id = event_dict.get('zone_id') or camera_zone_map.get(camera_id, 'ZONE_A')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO events (
        camera_id, zone_id, timestamp, event_type, track_id, vehicle_type, plate,
        ocr_confidence, confidence, bbox, direction, speed_estimate,
        action_label, action_confidence, appearance_features, explanation, evidence_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    (
        camera_id, zone_id, timestamp, event_type, track_id, vehicle_type, plate,
        ocr_confidence, confidence, bbox_str, direction, speed_estimate,
        action_label, action_conf, app_str, explanation, evidence_id
    ))
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    standard_event = {
        "event_id": event_id,
        "camera_id": camera_id,
        "zone_id": zone_id,
        "timestamp": timestamp,
        "event_type": event_type,
        "track_id": track_id,
        "vehicle_type": vehicle_type,
        "plate": plate,
        "ocr_confidence": ocr_confidence,
        "confidence": confidence,
        "bbox": event_dict.get('bbox', []),
        "direction": direction,
        "speed_estimate": speed_estimate,
        "action_label": action_label,
        "explanation": explanation
    }
    
    # 1. Publish Event to MQTT topic
    mqtt_bus.publish(f"camera/events/{camera_id}", standard_event)
    
    # 2. Check Rule Engine for Alerts
    alerts_generated = check_for_alerts(standard_event)
    for alert in alerts_generated:
        # Publish Alert to MQTT
        mqtt_bus.publish(f"camera/alerts/{camera_id}", alert)
        
    # 3. Cryptographic SHA-256 Evidence Recording for Alerts / Flagged Events
    if (alerts_generated or plate or action_label) and frame_bgr is not None:
        try:
            _, buffer = cv2.imencode('.jpg', frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 88])
            ev = record_evidence(camera_id, buffer.tobytes(), event_id=event_id)
            # Update event and alert with evidence_id
            if ev and ev.get('evidence_id'):
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute('UPDATE events SET evidence_id = ? WHERE event_id = ?', (ev['evidence_id'], event_id))
                for alert in alerts_generated:
                    if alert.get('alert_id'):
                        cursor.execute('UPDATE alerts SET evidence_id = ? WHERE alert_id = ?', (ev['evidence_id'], alert['alert_id']))
                conn.commit()
                conn.close()
                standard_event['evidence_id'] = ev['evidence_id']
                standard_event['sha256'] = ev['sha256']
        except Exception as e:
            print(f"[EventProcessor] Evidence hashing warning: {e}")
            
    return standard_event
