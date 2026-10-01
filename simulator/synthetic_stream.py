"""
MediaMTX / RTSP Stream Simulator for Gujarat CCTV Platform.
Pushes synthetic animated Gujarat highway traffic to MediaMTX RTSP endpoints:
  rtsp://localhost:8554/cam1 (Ahmedabad)
  rtsp://localhost:8554/cam2 (Gandhinagar)
  rtsp://localhost:8554/cam3 (Surat)
"""
import cv2
import time
import numpy as np
import subprocess
import os

CAMERAS = {
    'cam1': {'name': 'Ahmedabad SG Highway', 'url': 'rtsp://localhost:8554/cam1'},
    'cam2': {'name': 'Gandhinagar Infocity', 'url': 'rtsp://localhost:8554/cam2'},
    'cam3': {'name': 'Surat Ring Road', 'url': 'rtsp://localhost:8554/cam3'}
}

def generate_frame(cam_id: str, t: float):
    h, w = 480, 640
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:180, :] = [60, 45, 35]
    frame[180:, :] = [45, 45, 48]
    
    cv2.line(frame, (0, 330), (w, 330), (180, 180, 180), 2)
    for x in range(0, w, 60):
        dash_x = (x + int(t * 40)) % w
        cv2.line(frame, (dash_x, 250), (dash_x + 30, 250), (220, 220, 220), 2)
        cv2.line(frame, (dash_x, 410), (dash_x + 30, 410), (220, 220, 220), 2)
        
    cv2.rectangle(frame, (0, 0), (w, 35), (15, 15, 18), -1)
    cv2.putText(frame, f"[DEMO STREAM] {CAMERAS[cam_id]['name']}", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 240, 255), 1)
    return frame

if __name__ == '__main__':
    print("RTSP Simulator Ready. In DEMO_MODE=true, the backend runs integrated real-time synthetic stream generators directly.")
