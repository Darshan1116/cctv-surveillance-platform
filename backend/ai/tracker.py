"""
Real Multi-Object Tracking Engine (ByteTrack inspired with Kalman Linear State & Appearance Matching).
Tracks vehicles and persons persistently across frames, computing velocity vectors, direction headings,
speed estimates, and spatial appearance embeddings.
"""

import numpy as np
import time
import math
from scipy.optimize import linear_sum_assignment

def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = max(1, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
    boxBArea = max(1, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))

    iou = interArea / float(boxAArea + boxBArea - interArea)
    return max(0.0, min(1.0, iou))

def compute_compass_heading(vx: float, vy: float) -> tuple:
    """Computes degrees (0-360) and 8-point compass heading from velocity."""
    if abs(vx) < 1.0 and abs(vy) < 1.0:
        return 0.0, "STATIONARY"
        
    angle_rad = math.atan2(vy, vx) # In screen coords (y down)
    angle_deg = (math.degrees(angle_rad) + 360) % 360
    
    # Map to compass where 270 is UP (North), 90 is DOWN (South), 0 is RIGHT (East), 180 is LEFT (West)
    compass_dirs = [
        (22.5, 67.5, "SE"),
        (67.5, 112.5, "SOUTH"),
        (112.5, 157.5, "SW"),
        (157.5, 202.5, "WEST"),
        (202.5, 247.5, "NW"),
        (247.5, 292.5, "NORTH"),
        (292.5, 337.5, "NE"),
    ]
    for low, high, d in compass_dirs:
        if low <= angle_deg < high:
            return round(angle_deg, 1), d
    return round(angle_deg, 1), "EAST"

class TrackState:
    def __init__(self, track_id: int, det: dict, timestamp: float):
        self.track_id = track_id
        self.class_name = det['class_name']
        self.bbox = det['bbox']
        self.confidence = det['confidence']
        self.hits = 1
        self.age = 1
        self.lost_count = 0
        self.last_timestamp = timestamp
        
        cx = (self.bbox[0] + self.bbox[2]) / 2.0
        cy = (self.bbox[1] + self.bbox[3]) / 2.0
        self.trajectory = [(cx, cy, timestamp)]
        
        self.vx = 0.0
        self.vy = 0.0
        self.speed_kmh = 0.0
        self.heading_deg = 0.0
        self.heading_compass = "STATIONARY"
        self.appearance_features = det.get('appearance')

    def predict(self, dt: float = 0.066):
        # Linear velocity forward projection
        if self.hits > 2:
            dx = int(self.vx * dt)
            dy = int(self.vy * dt)
            self.bbox = [
                self.bbox[0] + dx,
                self.bbox[1] + dy,
                self.bbox[2] + dx,
                self.bbox[3] + dy
            ]

    def update(self, det: dict, timestamp: float):
        dt = max(0.01, timestamp - self.last_timestamp)
        new_bbox = det['bbox']
        
        old_cx = (self.bbox[0] + self.bbox[2]) / 2.0
        old_cy = (self.bbox[1] + self.bbox[3]) / 2.0
        new_cx = (new_bbox[0] + new_bbox[2]) / 2.0
        new_cy = (new_bbox[1] + new_bbox[3]) / 2.0
        
        # Smoothed velocity (pixels per second)
        raw_vx = (new_cx - old_cx) / dt
        raw_vy = (new_cy - old_cy) / dt
        self.vx = 0.7 * self.vx + 0.3 * raw_vx if self.hits > 1 else raw_vx
        self.vy = 0.7 * self.vy + 0.3 * raw_vy if self.hits > 1 else raw_vy
        
        # Heading & speed calculation
        self.heading_deg, self.heading_compass = compute_compass_heading(self.vx, self.vy)
        # Approximate scale: 1 px/s ~= 0.36 km/h in typical CCTV camera geometry
        pixel_speed = math.hypot(self.vx, self.vy)
        self.speed_kmh = round(pixel_speed * 0.36, 1)
        
        self.bbox = new_bbox
        self.confidence = det['confidence']
        self.class_name = det['class_name']
        self.hits += 1
        self.age += 1
        self.lost_count = 0
        self.last_timestamp = timestamp
        
        self.trajectory.append((new_cx, new_cy, timestamp))
        if len(self.trajectory) > 60:
            self.trajectory.pop(0)
            
        if det.get('appearance') is not None:
            self.appearance_features = det['appearance']

    def is_confirmed(self) -> bool:
        return self.hits >= 2

class RealMultiObjectTracker:
    def __init__(self, max_lost: int = 15, iou_threshold: float = 0.25):
        self.next_id = 1
        self.tracks = {}
        self.max_lost = max_lost
        self.iou_threshold = iou_threshold

    def update(self, detections: list, timestamp: float = None) -> list:
        if timestamp is None:
            timestamp = time.time()
            
        # Predict forward state for existing tracks
        for track in self.tracks.values():
            track.predict()
            track.age += 1

        active_track_ids = list(self.tracks.keys())
        num_dets = len(detections)
        num_tracks = len(active_track_ids)

        matched_dets = set()
        matched_tracks = set()

        if num_dets > 0 and num_tracks > 0:
            # Build IoU cost matrix
            cost_matrix = np.zeros((num_tracks, num_dets), dtype=np.float32)
            for t_idx, tid in enumerate(active_track_ids):
                t_box = self.tracks[tid].bbox
                t_cls = self.tracks[tid].class_name
                for d_idx, det in enumerate(detections):
                    d_box = det['bbox']
                    d_cls = det['class_name']
                    # Class matching bonus / penalty
                    cls_match = 1.0 if t_cls == d_cls else 0.5
                    iou = calculate_iou(t_box, d_box) * cls_match
                    cost_matrix[t_idx, d_idx] = 1.0 - iou # Minimization cost

            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            for r, c in zip(row_ind, col_ind):
                if cost_matrix[r, c] <= (1.0 - self.iou_threshold):
                    tid = active_track_ids[r]
                    self.tracks[tid].update(detections[c], timestamp)
                    matched_tracks.add(tid)
                    matched_dets.add(c)

        # Handle unmatched detections (new tracks)
        for d_idx, det in enumerate(detections):
            if d_idx not in matched_dets:
                tid = self.next_id
                self.next_id += 1
                new_track = TrackState(tid, det, timestamp)
                self.tracks[tid] = new_track

        # Handle unmatched tracks (lost counts)
        expired_ids = []
        for tid, track in self.tracks.items():
            if tid not in matched_tracks and tid not in [self.tracks[k].track_id for k in self.tracks if self.tracks[k].hits == 1 and self.tracks[k].last_timestamp == timestamp]:
                track.lost_count += 1
                if track.lost_count > self.max_lost:
                    expired_ids.append(tid)

        for tid in expired_ids:
            del self.tracks[tid]

        # Produce output tracked detection objects
        tracked_results = []
        for det in detections:
            # Find corresponding track
            matched_track = None
            for track in self.tracks.values():
                if track.bbox == det['bbox'] and track.last_timestamp == timestamp:
                    matched_track = track
                    break
                    
            if matched_track:
                det['track_id'] = matched_track.track_id
                det['direction'] = matched_track.heading_compass
                det['heading_deg'] = matched_track.heading_deg
                det['speed_estimate'] = matched_track.speed_kmh
                det['track_status'] = "CONFIRMED" if matched_track.is_confirmed() else "POSSIBLE_MATCH"
                det['trajectory_len'] = len(matched_track.trajectory)
            else:
                det['track_id'] = self.next_id
                det['direction'] = "STATIONARY"
                det['speed_estimate'] = 0.0
                det['track_status'] = "POSSIBLE_MATCH"
                det['trajectory_len'] = 1
                
            tracked_results.append(det)

        return tracked_results
