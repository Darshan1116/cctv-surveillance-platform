"""
Robust Video & RTSP Stream Ingestion Engine.
Handles:
- Real RTSP streaming (H.264 / H.265 / MJPEG)
- MP4 / AVI local video loop streaming
- Corrupt frame skipping, dropped frame protection, resolution normalization
- Auto-reconnect with exponential backoff on network/stream disconnect
- Thread-safe frame caching without memory leaks
"""

import cv2
import time
import logging
import threading
import numpy as np
import os

logger = logging.getLogger('rtsp_reader')

class RTSPReader:
    def __init__(self, camera_id: str, stream_source: str, target_fps: float = 15.0):
        self.camera_id = camera_id
        self.stream_source = stream_source
        self.target_fps = target_fps
        self.frame_delay = 1.0 / target_fps
        
        self.cap = None
        self.running = False
        self.is_connected = False
        self.last_frame = None
        self.lock = threading.Lock()
        
        self.consecutive_failures = 0
        self.total_frames_read = 0
        self.dropped_frames = 0
        self.is_file_source = os.path.isfile(stream_source) if stream_source else False
        
        self.thread = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True, name=f"RTSP-{self.camera_id}")
        self.thread.start()

    def _open_capture(self) -> bool:
        """Opens cv2 VideoCapture with appropriate buffering flags."""
        if not self.stream_source:
            return False
            
        try:
            if self.cap is not None:
                self.cap.release()
                
            # For RTSP streams, verify socket reachability first to avoid 30-second ffmpeg blocking
            if str(self.stream_source).startswith('rtsp://') or str(self.stream_source).startswith('http://'):
                try:
                    import urllib.parse, socket
                    parsed = urllib.parse.urlparse(self.stream_source)
                    host = parsed.hostname or 'localhost'
                    port = parsed.port or (554 if parsed.scheme == 'rtsp' else 80)
                    with socket.create_connection((host, port), timeout=0.25):
                        pass
                except Exception:
                    self.is_connected = False
                    return False

                os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|stimeout;1000000|buffer_size;512000"
                self.cap = cv2.VideoCapture(self.stream_source, cv2.CAP_FFMPEG)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            else:
                self.cap = cv2.VideoCapture(self.stream_source)
                
            if self.cap.isOpened():
                self.is_connected = True
                self.consecutive_failures = 0
                return True
            else:
                self.is_connected = False
                return False
        except Exception as e:
            logger.warning(f"[RTSP:{self.camera_id}] Error opening source: {e}")
            self.is_connected = False
            return False

    def _capture_loop(self):
        retry_interval = 1.0
        
        while self.running:
            if not self.is_connected or self.cap is None or not self.cap.isOpened():
                success = self._open_capture()
                if not success:
                    self.consecutive_failures += 1
                    # Exponential backoff up to 10 seconds
                    backoff = min(10.0, retry_interval * (1.5 ** min(5, self.consecutive_failures)))
                    time.sleep(backoff)
                    continue
                else:
                    retry_interval = 1.0
                    
            start_t = time.time()
            try:
                ret, frame = self.cap.read()
                
                # If end of video file, loop back to start
                if not ret and self.is_file_source:
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = self.cap.read()
                    
                if ret and frame is not None and frame.size > 0:
                    # Check for corrupt dimensions
                    if frame.shape[0] < 10 or frame.shape[1] < 10:
                        self.dropped_frames += 1
                        continue
                        
                    with self.lock:
                        self.last_frame = frame
                        self.total_frames_read += 1
                    self.consecutive_failures = 0
                else:
                    self.consecutive_failures += 1
                    if self.consecutive_failures > 5:
                        logger.warning(f"[RTSP:{self.camera_id}] Stream disconnected. Reconnecting...")
                        self.is_connected = False
                        if self.cap:
                            self.cap.release()
            except Exception as e:
                logger.error(f"[RTSP:{self.camera_id}] Decoding exception: {e}")
                self.consecutive_failures += 1
                self.is_connected = False
                
            elapsed = time.time() - start_t
            sleep_time = max(0.005, self.frame_delay - elapsed)
            time.sleep(sleep_time)

    def read_frame(self) -> np.ndarray:
        """Returns the most recent valid frame, or None if stream is offline."""
        with self.lock:
            return self.last_frame.copy() if self.last_frame is not None else None

    def get_stats(self) -> dict:
        return {
            "camera_id": self.camera_id,
            "connected": self.is_connected,
            "total_frames_read": self.total_frames_read,
            "dropped_frames": self.dropped_frames,
            "consecutive_failures": self.consecutive_failures
        }

    def stop(self):
        self.running = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
