# Gujarat CCTV AI Surveillance & Camera Trust Platform

An end-to-end prototype designed for the **Gujarat CCTV Hackathon**, connecting RTSP/ONVIF feeds, edge AI analytics (YOLOv8 + PaddleOCR + ByteTrack), real-time MQTT/WebSocket bridges, and automated Camera Trust & Cryptographic Evidence verification.

---

## ??? Architecture Pipeline

```
RTSP / ONVIF Cameras (Ahmedabad, Gandhinagar, Surat)
         ?
Camera Ingestion & Translator
         ?
MQTT Event Bus
         ?
AI Detection Pipeline (YOLOv8 + OCR + ByteTrack)
         ?
Event Processing & Restricted Zone / Watchlist Engine
         ?
WebSocket Live Stream
         ?
React Dark-Theme Command Center Dashboard
         ?
Alerts + Cross-Camera Vehicle Search + Camera Trust Verification
```

---

## ?? Key Features Implemented

### 1. Ingestion & Connect (Day 1)
- **Multi-Camera Management**: Ingests 3 distinct nodes in Gujarat (`cam1`: Ahmedabad SG Highway, `cam2`: Gandhinagar Infocity, `cam3`: Surat Ring Road).
- **RTSP & Synthetic Demo Engine**: Works seamlessly in `DEMO_MODE=true` without requiring external hardware or physical cameras.
- **ONVIF Discovery Client**: Protocol adapter for vendor cameras.
- **MQTT Event Bus**: Non-blocking message publishing with in-memory fallback.
- **Cryptographic Evidence Hashing**: Computes **SHA-256** hashes for captured event snapshots.

### 2. Edge AI & OCR (Day 2)
- **YOLOv8 Object Detection**: Detects `car`, `motorcycle`, `bus`, `truck`, `person`, `bicycle`.
- **ByteTrack Vehicle Tracking**: Tracks objects across consecutive frames with consistent IDs.
- **Number Plate OCR**: PaddleOCR + high-precision Gujarat vehicle plate generator in DEMO mode.
- **Standardized Event Schema**: Unified event structure across all camera vendors.

### 3. Dashboard & Cross-Camera Search (Day 3 Morning)
- **Gujarat Interactive Leaflet Map**: Dark-themed map with live camera status pins and restricted zone polygons.
- **Live Visual Feeds**: Real-time MJPEG video feeds with AI bounding boxes and metadata overlays.
- **Real-Time WebSocket Feed**: Live detections stream with zero page refreshes.
- **Cross-Camera Vehicle Search**: Search any vehicle plate (e.g. `GJ01AB1234`) to visualize its complete chronological journey across Gujarat cameras.

### 4. Security Alerts & Restricted Zones (Day 3 Afternoon)
- **Watchlist Matching**: Real-time comparison against `watchlist.json`.
- **Restricted Zone Polygon Breaches**: GPS point-in-polygon math detects unauthorized vehicle entry into Gandhinagar / Ahmedabad VIP zones.
- **High-Visibility Alert Banner**: Instant visual pulse and tracking shortcuts.

### 5. Camera Trust & Anti-Tamper USP (Day 3 Evening / Day 4)
- **Frozen Stream Detection**: Analyzes consecutive frames via `cv2.absdiff()`.
- **Blocked/Covered Lens Detection**: Calculates average brightness and Laplacian texture variance.
- **View Change / Turned-Away Camera**: Evaluates histogram correlation drift against reference profiles.
- **Live Health Diagnostics**: Live FPS monitoring, heartbeat logs, and health scores (0-100%).

### 6. Cryptographic Evidence Vault
- **One-Click Integrity Verification**: Re-computes SHA-256 hashes against raw stored bytes to produce `INTEGRITY VERIFIED` / `INTEGRITY FAILED` verdicts.

### 7. IoT Sensor Integration
- **Burst Capture**: Fires on `camera/trigger` (e.g., PIR motion sensor), captures frame bursts, and hashes evidence.

---

## ?? Running the Platform

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Start Backend
```bash
cd backend
python main.py
```
*The FastAPI backend will start at `http://localhost:8000` with WebSocket endpoint at `ws://localhost:8000/ws`.*

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```
*The React Dashboard will be available at `http://localhost:3000`.*

---

## ?? Live Hackathon Demo Workflow

1. **Command Center**: Open `http://localhost:3000` to view the Gujarat map, 3 active camera nodes, and live detection feed.
2. **Live Feeds Tab**: Inspect real-time video feeds with live YOLO bounding boxes and OCR plate labels.
3. **Vehicle Cross-Search**: Search `GJ01AB1234` to view the chronological journey across SG Highway, Gandhinagar, and Surat.
4. **Fault Simulation Tab**:
   - Click **"1. Simulate Frozen Video Stream"** ? View camera status transition to `FROZEN` (Red pin).
   - Click **"2. Simulate Blocked Lens"** ? View camera status transition to `BLOCKED`.
   - Click **"4. Reset"** ? View camera recover to `HEALTHY` (Green pin).
5. **Security Alerts**:
   - Click **"Trigger Watchlist Match"** ? View instant red alert banner for vehicle `GJ01AB1234`.
   - Click **"Trigger Restricted Zone Breach"** ? View critical alert for Gandhinagar VIP sector.
6. **Evidence Vault**: Open the Evidence Vault tab and click **"Verify Hash"** to demonstrate cryptographic SHA-256 tamper verification.
