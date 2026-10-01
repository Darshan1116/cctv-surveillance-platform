# NetraSuraksha: 50 to 80,000 CCTV Camera Scalability & High Availability Architecture

## 1. Executive Summary & Core Design Principle
NetraSuraksha (Gujarat Police AI Surveillance SOC Platform) is architected on the fundamental principle:

> **Distributed Edge Processing at the Perimeter, Centralized Intelligence at the Core.**

Sending 80,000 full-resolution RTSP video streams (1080p @ 15-25 FPS) directly to a single central datacenter would require over **320 Gbps of uninterrupted WAN bandwidth** and cause massive network congestion. 

Instead, NetraSuraksha uses a **3-Tier Hierarchical Architecture**:
```
Tier 1: Camera Edge Nodes / Regional Edge Gateways (Video Decoding + YOLOv8 + OCR + ByteTrack + Health)
   │
   ▼ (Lightweight JSON / Protobuf Event Stream & Forensic JPEGs over MQTT / WebSockets: ~2-5 Kbps/cam)
Tier 2: District Aggregation Hubs (Zone Boundary Geofencing + Cross-Camera Corridor Tracking + SHA-256 Hashing)
   │
   ▼ (Centralized Alert Stream & Cryptographic Evidence Indices)
Tier 3: State Command & Control Center (GIS Grid + Vehicle Intelligence + State Watchlists + Audit Vault)
```

---

## 2. Distributed Regional/Edge Compute Topology

| Layer | Compute Footprint | Function | Network Protocol |
|---|---|---|---|
| **Tier 1: Regional Edge Nodes** | Embedded NVIDIA Jetson Orin / Industrial IPCs at Junctions | RTSP-over-TCP decoding, Optical/Thermal inference, ByteTrack multi-object tracking, License plate OCR, Laplacian blur/freeze health monitoring | RTSP / ONVIF Profile S/T |
| **Tier 2: District Hubs (Ahmedabad, Gandhinagar, Surat, Vadodara, Rajkot)** | Dual-GPU Node Clusters | Real-time zone filtering, inter-camera corridor timing, unmonitored gap prediction, SHA-256 evidence hashing | MQTT Bus (`camera/events/{id}`, `camera/alerts/{id}`) |
| **Tier 3: State SOC Hub** | Clustered Microservices (FastAPI + React + Redis + SQLite/PostgreSQL) | State-wide GIS visualization, Watchlist hit arbitration, Plate journey reconstruction, Operator dispatch, External Gov Gateway (VAHAN/CCTNS) | WebSockets (`/ws`), REST APIs |

---

## 3. Sentinel Ingestion & VMS Interoperability Layer
- **Dynamic Catalogue Discovery**: State nodes query `GET /api/ingest` dynamically to discover available cameras, stream resolutions, codecs (H.264/H.265), and WebRTC WHEP preview links without hardcoding.
- **RTSP over TCP Enforcement**: All ffmpeg/OpenCV decoders enforce `OPENCV_FFMPEG_CAPTURE_OPTIONS=rtsp_transport;tcp` to eliminate UDP packet dropping and corrupt macroblock artifacts.
- **PTS Timestamping**: Frame analytics use PTS (Presentation Time Stamp) instead of arrival time to accurately track speed and velocity through network jitter.
- **Fault-Isolated Reconnect**: Each camera runs on an independent worker thread with exponential backoff reconnect (`2s`, `4s`, `8s`, `16s`, `30s max`). Failure of any single camera never degrades or crashes neighboring nodes.

---

## 4. Hot / Warm / Cold Evidence Storage Strategy

| Tier | Storage Type | Retention Period | Data Content |
|---|---|---|---|
| **Hot Storage** | In-Memory / NVMe SSD | 0 - 72 Hours | Active alert frames, bounding box crops, live plate OCR images, real-time WebSocket cache |
| **Warm Storage** | Clustered Distributed Storage (Ceph / MinIO Object Store) | 3 - 90 Days | SHA-256 verified forensic incident stills, verified watchlist hit frames, audit trail logs |
| **Cold Storage** | Write-Once-Read-Many (WORM) Encrypted Archive | 1 - 7 Years | Court-admissible cryptographic evidence packages with digital signatures and timestamped hash chains |

---

## 5. High Availability (HA) & Disaster Recovery (DR)
- **Active-Active District Failover**: If District Hub A experiences power or WAN outage, adjacent District Hub B absorbs edge event streams via MQTT topic failover.
- **Circuit Breakers & Rate Limiting**: AI detectors drop non-essential frames under high load while preserving keyframe integrity and OCR tracking.
- **Graceful Degradation**: If hardware accelerator is unavailable, system automatically degrades to CPU-optimized inference mode without UI crashes.
- **Zero Single Point of Failure**: Database writes use ACID transactional commits with daily automated replication.

---

## 6. Government Interoperability Readiness
The platform incorporates standardized mTLS / REST / ESB adapter interfaces for state and national law enforcement databases:
- **VAHAN**: National vehicle registration and chassis verification.
- **SARTHI**: Driving license and driver identity records.
- **eGujCop**: Gujarat Police CCTNS criminal database, FIR tracking, and stolen vehicle registry.
- **AFIS / NAFIS**: State and National Automated Fingerprint Identification Systems.

*Status is transparently reported as `INTEGRATION_READY` until authorized state network gateway binding is enabled.*
