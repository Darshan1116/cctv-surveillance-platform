import cv2
import numpy as np
import time
from datetime import datetime
from database import get_db

class CameraHealthMonitor:
    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self.last_frame = None
        self.last_gray = None
        self.ref_histogram = None
        self.frozen_frame_count = 0
        self.last_seen_time = time.time()
        self.frame_times = []
        self.current_status = "HEALTHY"
        self.health_score = 100
        self.current_issue = None
        self.forced_status = None
        
    def set_forced_status(self, status: str):
        self.forced_status = status
        
    def clear_forced_status(self):
        self.forced_status = None
        
    def evaluate_frame(self, frame_bgr: np.ndarray) -> dict:
        self.last_seen_time = time.time()
        now_iso = datetime.utcnow().isoformat()
        
        self.frame_times.append(self.last_seen_time)
        if len(self.frame_times) > 30:
            self.frame_times.pop(0)
        
        fps = 0.0
        if len(self.frame_times) > 1:
            time_diff = self.frame_times[-1] - self.frame_times[0]
            if time_diff > 0:
                fps = round((len(self.frame_times) - 1) / time_diff, 1)
        if fps <= 0:
            fps = 15.0

        if self.forced_status:
            status = self.forced_status
            score = 15 if status in ['FROZEN', 'BLOCKED', 'OFFLINE'] else (45 if status == 'VIEW_CHANGED' else 98)
            issue = f"Simulated {status} Condition"
            self.current_status = status
            self.health_score = score
            self.current_issue = issue
            self._update_db(status, score, fps, now_iso, issue)
            return {
                "camera_id": self.camera_id,
                "health_status": status,
                "health_score": score,
                "fps": fps,
                "last_seen": now_iso,
                "issue": issue
            }

        if frame_bgr is None or frame_bgr.size == 0:
            status = "OFFLINE"
            score = 0
            issue = "No frame received / Stream disconnected"
            self.current_status = status
            self.health_score = score
            self.current_issue = issue
            self._update_db(status, score, fps, now_iso, issue)
            return {
                "camera_id": self.camera_id,
                "health_status": status,
                "health_score": score,
                "fps": fps,
                "last_seen": now_iso,
                "issue": issue
            }

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        status = "HEALTHY"
        score = 100
        issue = "All systems operational"

        # --- A. FROZEN FEED DETECTION (cv2.absdiff) ---
        if self.last_gray is not None and self.last_gray.shape == gray.shape:
            diff = cv2.absdiff(gray, self.last_gray)
            mean_diff = float(np.mean(diff))
            if mean_diff < 0.5:
                self.frozen_frame_count += 1
            else:
                self.frozen_frame_count = max(0, self.frozen_frame_count - 1)
                
            if self.frozen_frame_count >= 25:
                status = "FROZEN"
                score = 15
                issue = "Video stream is static/frozen (cv2.absdiff below threshold)"
        else:
            self.frozen_frame_count = 0

        # --- B. BLOCKED / COVERED LENS DETECTION ---
        avg_brightness = float(np.mean(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        
        if avg_brightness < 20.0 and laplacian_var < 25.0 and status != "FROZEN":
            status = "BLOCKED"
            score = 10
            issue = f"Lens is blocked/covered (Brightness: {avg_brightness:.1f}, Variance: {laplacian_var:.1f})"

        # --- C. TURNED-AWAY CAMERA / VIEW CHANGE DETECTION ---
        hist = cv2.calcHist([gray], [0], None, [32], [0, 256])
        cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        
        if self.ref_histogram is None:
            self.ref_histogram = hist.copy()
        elif status == "HEALTHY":
            corr = cv2.compareHist(self.ref_histogram, hist, cv2.HISTCMP_CORREL)
            if corr < 0.35:
                status = "VIEW_CHANGED"
                score = 45
                issue = f"Camera orientation shifted (Hist Correlation: {corr:.2f})"

        self.last_gray = gray.copy()
        self.last_frame = frame_bgr.copy()
        self.current_status = status
        self.health_score = score
        self.current_issue = issue
        
        self._update_db(status, score, fps, now_iso, issue)
        
        return {
            "camera_id": self.camera_id,
            "health_status": status,
            "health_score": score,
            "fps": fps,
            "last_seen": now_iso,
            "issue": issue
        }

    def _update_db(self, status, score, fps, last_seen, issue):
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''UPDATE cameras
                              SET status = ?, health_score = ?, fps = ?, last_seen = ?
                              WHERE camera_id = ?''',
                           (status, score, fps, last_seen, self.camera_id))
            cursor.execute('''INSERT INTO camera_health (camera_id, timestamp, health_status, health_score, fps, issue)
                              VALUES (?, ?, ?, ?, ?, ?)''',
                           (self.camera_id, last_seen, status, score, fps, issue))
            conn.commit()
            conn.close()
        except Exception:
            pass
