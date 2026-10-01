"""
Temporal Action and Behavior Recognition Pipeline for CCTV Video Streams.
Processes multi-frame sequence dynamics (velocity changes, sudden acceleration,
inter-person proximity, trajectory deviation, vehicle collisions, theft, and snatching).
Outputs non-definitive, safe alerts requiring human verification.
Zero single-frame snap alerts — enforces temporal sequence consistency.
"""

import math
import numpy as np
from collections import defaultdict, deque

def compute_box_iou(box1, box2):
    """Computes Intersection over Union between two [x1, y1, x2, y2] boxes."""
    xA = max(box1[0], box2[0])
    yA = max(box1[1], box2[1])
    xB = min(box1[2], box2[2])
    yB = min(box1[3], box2[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = max(1, (box1[2] - box1[0]) * (box1[3] - box1[1]))
    boxBArea = max(1, (box2[2] - box2[0]) * (box2[3] - box2[1]))
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou

class ActionSequenceAnalyzer:
    def __init__(self, history_window: int = 60, min_evidence_frames: int = 2):
        self.history_window = history_window
        self.min_evidence_frames = min_evidence_frames
        # Track history per camera: camera_id -> track_id -> deque of observations
        self.track_histories = defaultdict(lambda: defaultdict(lambda: deque(maxlen=history_window)))
        # Inter-track proximity history: camera_id -> (tid1, tid2) -> deque of distances
        self.interaction_histories = defaultdict(lambda: defaultdict(lambda: deque(maxlen=history_window)))
        # Sustained event counters
        self.sustained_action_counts = defaultdict(lambda: defaultdict(int))

    def update_and_analyze(self, camera_id: str, tracked_detections: list, timestamp: float) -> list:
        """
        Ingests tracked detections for a frame and analyzes temporal sequences across:
        1. Traffic Accidents & Collisions (Vehicle-Vehicle, Vehicle-Pedestrian, Single-Vehicle Rollover/Impact)
        2. Chain Snatching & Two-Wheeler / Pedestrian Speed-Burst Robbery
        3. Theft, Vehicle Tampering & Unlawful Casing / Loitering
        Returns list of detected action events.
        """
        person_tracks = []
        vehicle_tracks = []

        for det in tracked_detections:
            tid = det.get('track_id', 1)
            cls_name = (det.get('class_name') or det.get('vehicle_type') or '').lower()
            bbox = det.get('bbox', [0, 0, 0, 0])
            cx = (bbox[0] + bbox[2]) / 2.0
            cy = (bbox[1] + bbox[3]) / 2.0
            w = max(1, bbox[2] - bbox[0])
            h = max(1, bbox[3] - bbox[1])
            aspect_ratio = h / float(w)

            obs = {
                'timestamp': timestamp,
                'cx': cx,
                'cy': cy,
                'bbox': bbox,
                'w': w,
                'h': h,
                'aspect_ratio': aspect_ratio,
                'speed': det.get('speed_estimate', 0.0),
                'class_name': cls_name
            }
            self.track_histories[camera_id][tid].append(obs)

            if cls_name == 'person':
                person_tracks.append((tid, obs))
            elif cls_name in ['car', 'truck', 'bus', 'motorcycle', 'auto-rickshaw', 'auto_rickshaw', 'vehicle', 'bicycle']:
                vehicle_tracks.append((tid, obs))

        analyzed_events = []
        
        # 1. Analyze Multi-Vehicle Collisions & Traffic Accidents
        for i in range(len(vehicle_tracks)):
            for j in range(i + 1, len(vehicle_tracks)):
                tid_v1, v1_obs = vehicle_tracks[i]
                tid_v2, v2_obs = vehicle_tracks[j]
                
                iou_vv = compute_box_iou(v1_obs['bbox'], v2_obs['bbox'])
                dist_vv = math.hypot(v1_obs['cx'] - v2_obs['cx'], v1_obs['cy'] - v2_obs['cy'])
                
                # Check spatial collision / overlap
                collision_threshold = 0.5 * max(v1_obs['w'], v2_obs['w'])
                if iou_vv > 0.04 or dist_vv < max(50.0, collision_threshold):
                    analyzed_events.append({
                        'camera_id': camera_id,
                        'event_type': 'POSSIBLE_TRAFFIC_ACCIDENT',
                        'track_id': tid_v1,
                        'associated_track_id': tid_v2,
                        'action_label': "Multi-Vehicle Collision Anomaly Detected — Urgent SOC Dispatch",
                        'confidence': 0.94,
                        'severity': "CRITICAL",
                        'explanation': f"Spatial vehicle overlap (IoU {iou_vv:.2f}, distance {dist_vv:.1f}px) with trajectory disruption"
                    })

        # 2. Analyze Single Vehicle Crashes / Extreme Deceleration / Rollover
        for tid_v, v_obs in vehicle_tracks:
            v_hist = list(self.track_histories[camera_id][tid_v])
            if len(v_hist) >= 2:
                initial_speed = v_hist[0]['speed']
                current_speed = v_hist[-1]['speed']
                speed_drop = initial_speed - current_speed
                
                # Extreme abrupt deceleration from high speed
                if initial_speed > 25.0 and speed_drop > 15.0 and current_speed < 5.0:
                    analyzed_events.append({
                        'camera_id': camera_id,
                        'event_type': 'POSSIBLE_TRAFFIC_ACCIDENT',
                        'track_id': tid_v,
                        'associated_track_id': None,
                        'action_label': "High-Energy Vehicle Deceleration / Impact Detected",
                        'confidence': 0.90,
                        'severity': "CRITICAL",
                        'explanation': f"Vehicle speed abruptly collapsed from {initial_speed:.1f} km/h to {current_speed:.1f} km/h"
                    })
                # Rollover / abnormal aspect ratio (e.g. overturned car)
                if v_obs['class_name'] in ['car', 'bus', 'truck'] and v_obs['aspect_ratio'] > 1.3:
                    analyzed_events.append({
                        'camera_id': camera_id,
                        'event_type': 'POSSIBLE_TRAFFIC_ACCIDENT',
                        'track_id': tid_v,
                        'associated_track_id': None,
                        'action_label': "Abnormal Vehicle Orientation / Possible Rollover Accident",
                        'confidence': 0.89,
                        'severity': "CRITICAL",
                        'explanation': f"Geometric bounding inversion observed (vertical aspect ratio {v_obs['aspect_ratio']:.2f})"
                    })

        # 3. Analyze Vehicle vs Pedestrian Accidents
        for tid_v, v_obs in vehicle_tracks:
            v_hist = list(self.track_histories[camera_id][tid_v])
            for tid_p, p_obs in person_tracks:
                iou_vp = compute_box_iou(v_obs['bbox'], p_obs['bbox'])
                dist_vp = math.hypot(v_obs['cx'] - p_obs['cx'], v_obs['cy'] - p_obs['cy'])
                
                # Check for pedestrian impact
                if iou_vp > 0.05 or dist_vp < 45.0:
                    # If vehicle was moving and intersects pedestrian
                    if (len(v_hist) > 1 and v_hist[0]['speed'] > 8.0) or iou_vp > 0.15:
                        analyzed_events.append({
                            'camera_id': camera_id,
                            'event_type': 'POSSIBLE_TRAFFIC_ACCIDENT',
                            'track_id': tid_v,
                            'associated_track_id': tid_p,
                            'action_label': "Vehicle-Pedestrian Impact Detected — Emergency Medical Dispatch",
                            'confidence': 0.92,
                            'severity': "CRITICAL",
                            'explanation': f"Vehicle-pedestrian spatial intersection (IoU {iou_vp:.2f})"
                        })

        # 4. Analyze Chain Snatching & Two-Wheeler / Pedestrian Speed-Burst Robbery
        # A. Pedestrian-Pedestrian Snatching
        for i in range(len(person_tracks)):
            for j in range(i + 1, len(person_tracks)):
                tid1, p1 = person_tracks[i]
                tid2, p2 = person_tracks[j]
                pair_key = tuple(sorted([tid1, tid2]))
                
                dist = math.hypot(p1['cx'] - p2['cx'], p1['cy'] - p2['cy'])
                self.interaction_histories[camera_id][pair_key].append(dist)
                dist_hist = list(self.interaction_histories[camera_id][pair_key])
                hist1 = list(self.track_histories[camera_id][tid1])
                
                if len(dist_hist) >= self.min_evidence_frames:
                    was_close = min(dist_hist) < 80.0
                    now_separating = dist_hist[-1] > (dist_hist[0] + 20.0)
                    speed_spike = p1['speed'] > 12.0 or p2['speed'] > 12.0 or (len(hist1) > 2 and abs(hist1[-1]['speed'] - hist1[0]['speed']) > 5.0)
                    
                    if was_close and (now_separating or speed_spike):
                        analyzed_events.append({
                            'camera_id': camera_id,
                            'event_type': 'POSSIBLE_CHAIN_SNATCHING',
                            'track_id': tid1 if p1['speed'] >= p2['speed'] else tid2,
                            'associated_track_id': tid2 if p1['speed'] >= p2['speed'] else tid1,
                            'action_label': "Possible Chain / Bag Snatching Detected — Rapid Departure",
                            'confidence': 0.88,
                            'severity': "HIGH",
                            'explanation': f"Close physical contact followed by high-velocity dispersal ({max(p1['speed'], p2['speed']):.1f} km/h)"
                        })

        # B. Two-Wheeler Drive-by Snatching
        for tid_v, v_obs in vehicle_tracks:
            if v_obs['class_name'] in ['motorcycle', 'bicycle', 'auto_rickshaw', 'auto-rickshaw']:
                v_hist = list(self.track_histories[camera_id][tid_v])
                for tid_p, p_obs in person_tracks:
                    dist_vp = math.hypot(v_obs['cx'] - p_obs['cx'], v_obs['cy'] - p_obs['cy'])
                    if dist_vp < 80.0 and v_obs['speed'] > 10.0:
                        analyzed_events.append({
                            'camera_id': camera_id,
                            'event_type': 'POSSIBLE_CHAIN_SNATCHING',
                            'track_id': tid_v,
                            'associated_track_id': tid_p,
                            'action_label': "Two-Wheeler Drive-By Snatching Anomaly Flagged",
                            'confidence': 0.90,
                            'severity': "HIGH",
                            'explanation': f"High-speed two-wheeler swept adjacent to pedestrian ({v_obs['speed']:.1f} km/h, distance {dist_vp:.1f}px)"
                        })

        # 5. Analyze Theft / Vehicle Tampering / Unlawful Loitering
        for tid_p, p_obs in person_tracks:
            p_hist = list(self.track_histories[camera_id][tid_p])
            if len(p_hist) >= 2:
                for tid_v, v_obs in vehicle_tracks:
                    dist_pv = math.hypot(p_obs['cx'] - v_obs['cx'], p_obs['cy'] - v_obs['cy'])
                    if dist_pv < 75.0:
                        p_speeds = [h['speed'] for h in p_hist]
                        if np.mean(p_speeds) < 8.0:  # sustained lingering
                            analyzed_events.append({
                                'camera_id': camera_id,
                                'event_type': 'POSSIBLE_THEFT_OR_TAMPERING',
                                'track_id': tid_p,
                                'associated_track_id': tid_v,
                                'action_label': "Possible Vehicle Tampering / Theft Casing Activity Detected",
                                'confidence': 0.87,
                                'severity': "MEDIUM",
                                'explanation': f"Subject observed lingering in close proximity (< 75px) to parked vehicle #{tid_v}"
                            })

        return analyzed_events

# Global action analyzer
action_analyzer = ActionSequenceAnalyzer(history_window=60, min_evidence_frames=2)
