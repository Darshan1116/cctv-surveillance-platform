import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.environ.get('DATABASE_PATH', os.path.join(os.path.dirname(__file__), 'data', 'cctv_platform.db'))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Cameras & Capabilities
    cursor.execute('''CREATE TABLE IF NOT EXISTS cameras (
        camera_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rtsp_url TEXT,
        onvif_host TEXT,
        onvif_port INTEGER DEFAULT 80,
        latitude REAL,
        longitude REAL,
        location TEXT,
        zone_id TEXT,
        status TEXT DEFAULT 'ONLINE',
        health_score INTEGER DEFAULT 100,
        fps REAL DEFAULT 15.0,
        last_seen TEXT,
        rtsp_available INTEGER DEFAULT 1,
        onvif_available INTEGER DEFAULT 0,
        ptz_available INTEGER DEFAULT 0,
        microphone_available INTEGER DEFAULT 0,
        night_ir_capability INTEGER DEFAULT 1,
        resolution TEXT DEFAULT '1920x1080',
        plate_recognition_suitability REAL DEFAULT 0.95,
        edge_node_id TEXT DEFAULT 'edge-node-west-01',
        mode TEXT DEFAULT 'LIVE_STREAM'
    )''')
    
    # 2. Coverage Zones & Unmonitored Corridors
    cursor.execute('''CREATE TABLE IF NOT EXISTS coverage_zones (
        zone_id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        is_monitored INTEGER DEFAULT 1,
        is_restricted INTEGER DEFAULT 0,
        polygon_geo TEXT NOT NULL,
        connecting_zones TEXT,
        status TEXT DEFAULT 'NORMAL',
        coverage_status TEXT DEFAULT 'COVERED',
        color TEXT DEFAULT '#06b6d4',
        risk_level TEXT DEFAULT 'LOW',
        created_at TEXT
    )''')

    # Migration helper for coverage_zones if old table existed
    try:
        cursor.execute("PRAGMA table_info(coverage_zones)")
        cols = [c[1] for c in cursor.fetchall()]
        if 'code' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN code TEXT DEFAULT 'ZONE'")
        if 'is_restricted' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN is_restricted INTEGER DEFAULT 0")
        if 'status' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN status TEXT DEFAULT 'NORMAL'")
        if 'coverage_status' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN coverage_status TEXT DEFAULT 'COVERED'")
        if 'color' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN color TEXT DEFAULT '#06b6d4'")
        if 'risk_level' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN risk_level TEXT DEFAULT 'LOW'")
        if 'created_at' not in cols:
            cursor.execute("ALTER TABLE coverage_zones ADD COLUMN created_at TEXT")
    except Exception:
        pass

    # 3. Events (Vehicle, Person, Action, OCR)
    cursor.execute('''CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        zone_id TEXT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        track_id INTEGER,
        vehicle_type TEXT,
        plate TEXT,
        ocr_confidence REAL DEFAULT 0.0,
        confidence REAL DEFAULT 0.0,
        bbox TEXT,
        direction TEXT,
        speed_estimate REAL,
        action_label TEXT,
        action_confidence REAL DEFAULT 0.0,
        appearance_features TEXT,
        explanation TEXT,
        evidence_id INTEGER,
        FOREIGN KEY (camera_id) REFERENCES cameras (camera_id)
    )''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_cam ON events (camera_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_time ON events (timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_plate ON events (plate)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type)')

    # Migration for events zone_id
    try:
        cursor.execute("PRAGMA table_info(events)")
        cols = [c[1] for c in cursor.fetchall()]
        if 'zone_id' not in cols:
            cursor.execute("ALTER TABLE events ADD COLUMN zone_id TEXT")
    except Exception:
        pass

    # 4. Alerts & Rules
    cursor.execute('''CREATE TABLE IF NOT EXISTS alerts (
        alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        zone_id TEXT,
        track_id INTEGER,
        plate TEXT,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        details TEXT,
        explanation TEXT,
        status TEXT DEFAULT 'REVIEW_REQUIRED',
        resolved INTEGER DEFAULT 0,
        evidence_id INTEGER,
        FOREIGN KEY (camera_id) REFERENCES cameras (camera_id)
    )''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts (timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status)')

    # Migration for alerts zone_id
    try:
        cursor.execute("PRAGMA table_info(alerts)")
        cols = [c[1] for c in cursor.fetchall()]
        if 'zone_id' not in cols:
            cursor.execute("ALTER TABLE alerts ADD COLUMN zone_id TEXT")
    except Exception:
        pass

    # 5. Incident Response & Zone Tracking
    cursor.execute('''CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        zone_id TEXT NOT NULL,
        camera_id TEXT,
        timestamp TEXT NOT NULL,
        location TEXT,
        incident_type TEXT NOT NULL,
        confidence REAL DEFAULT 0.95,
        evidence_id INTEGER,
        severity TEXT DEFAULT 'HIGH',
        status TEXT DEFAULT 'ACTIVE',
        details TEXT,
        source TEXT DEFAULT 'AI_DETECTOR',
        last_known_observation TEXT,
        route_prediction TEXT,
        matched_observations TEXT
    )''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_incidents_time ON incidents (timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_incidents_zone ON incidents (zone_id)')

    # Migration for incidents
    try:
        cursor.execute("PRAGMA table_info(incidents)")
        cols = [c[1] for c in cursor.fetchall()]
        if 'zone_id' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN zone_id TEXT DEFAULT 'ZONE_A'")
        if 'camera_id' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN camera_id TEXT")
        if 'confidence' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN confidence REAL DEFAULT 0.95")
        if 'evidence_id' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN evidence_id INTEGER")
        if 'details' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN details TEXT")
        if 'location' not in cols:
            cursor.execute("ALTER TABLE incidents ADD COLUMN location TEXT")
    except Exception:
        pass

    # 6. Cryptographic Evidence Vault with SHA-256
    cursor.execute('''CREATE TABLE IF NOT EXISTS evidence (
        evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        event_id INTEGER,
        timestamp TEXT NOT NULL,
        filename TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        file_size INTEGER,
        data_base64 TEXT,
        verified INTEGER DEFAULT 1,
        mime_type TEXT DEFAULT 'image/jpeg'
    )''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_evidence_sha ON evidence (sha256)')

    # 7. Camera Health & Trust History
    cursor.execute('''CREATE TABLE IF NOT EXISTS camera_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        health_status TEXT NOT NULL,
        health_score INTEGER,
        fps REAL,
        blur_score REAL,
        brightness_score REAL,
        frozen_score REAL,
        issue TEXT,
        FOREIGN KEY (camera_id) REFERENCES cameras (camera_id)
    )''')

    # 8. Watchlists
    cursor.execute('''CREATE TABLE IF NOT EXISTS watchlists (
        watchlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL,
        value TEXT NOT NULL UNIQUE,
        category TEXT DEFAULT 'FLAGGED_VEHICLE',
        note TEXT,
        severity TEXT DEFAULT 'HIGH',
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )''')

    # 9. Restricted Zones (Polygon Based)
    cursor.execute('''CREATE TABLE IF NOT EXISTS restricted_zones (
        zone_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        camera_id TEXT,
        polygon_coords TEXT NOT NULL,
        active_hours_start INTEGER DEFAULT 0,
        active_hours_end INTEGER DEFAULT 24,
        target_types TEXT DEFAULT '["vehicle", "person", "truck", "car"]',
        active INTEGER DEFAULT 1
    )''')

    # Seed or Update Coverage Zones (Clean Upsert)
    zones = [
        (
            'ZONE_A', 'ZONE A', 'Ahmedabad Central & SG Highway Corridor', 'Ahmedabad',
            1, 0,
            json.dumps([[22.980, 72.480], [23.080, 72.480], [23.080, 72.580], [22.980, 72.580]]),
            json.dumps(['ZONE_GAP_AB', 'ZONE_D']),
            'NORMAL', 'COVERED', '#06b6d4', 'MEDIUM', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_B', 'ZONE B', 'Gandhinagar Secretariat VIP Zone', 'Gandhinagar',
            1, 1,
            json.dumps([[23.160, 72.590], [23.240, 72.590], [23.240, 72.670], [23.160, 72.670]]),
            json.dumps(['ZONE_GAP_AB']),
            'RESTRICTED_ACTIVE', 'COVERED', '#ef4444', 'HIGH', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_C', 'ZONE C', 'Surat Ring Road & Diamond Corridor', 'Surat',
            1, 0,
            json.dumps([[21.140, 72.780], [21.240, 72.780], [21.240, 72.880], [21.140, 72.880]]),
            json.dumps(['ZONE_GAP_BC', 'ZONE_D']),
            'NORMAL', 'COVERED', '#10b981', 'MEDIUM', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_D', 'ZONE D', 'Vadodara Alkapuri Industrial Corridor', 'Vadodara',
            1, 0,
            json.dumps([[22.260, 73.130], [22.360, 73.130], [22.360, 73.230], [22.260, 73.230]]),
            json.dumps(['ZONE_A', 'ZONE_GAP_BC', 'ZONE_GAP_DE']),
            'NORMAL', 'COVERED', '#8b5cf6', 'LOW', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_E', 'ZONE E', 'Rajkot West Urban Hub', 'Rajkot',
            1, 0,
            json.dumps([[22.240, 70.720], [22.330, 70.720], [22.330, 70.820], [22.240, 70.820]]),
            json.dumps(['ZONE_GAP_DE']),
            'NORMAL', 'COVERED', '#f59e0b', 'MEDIUM', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_GAP_AB', 'GAP A-B', 'Koba Highway Unmonitored Sector (No CCTV)', 'Ahmedabad-Gandhinagar Border',
            0, 0,
            json.dumps([[23.080, 72.530], [23.160, 72.570], [23.160, 72.610], [23.080, 72.570]]),
            json.dumps(['ZONE_A', 'ZONE_B']),
            'GAP_UNMONITORED', 'CAMERA_FREE_GAP', '#64748b', 'HIGH', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_GAP_BC', 'GAP B-C', 'NH-48 Inter-District Highway Gap (No CCTV)', 'Central Gujarat Corridor',
            0, 0,
            json.dumps([[21.500, 72.900], [22.100, 73.050], [22.100, 73.150], [21.500, 73.000]]),
            json.dumps(['ZONE_D', 'ZONE_C']),
            'GAP_UNMONITORED', 'CAMERA_FREE_GAP', '#64748b', 'HIGH', datetime.utcnow().isoformat()
        ),
        (
            'ZONE_GAP_DE', 'GAP D-E', 'Saurashtra Bypass Unmonitored Corridor (No CCTV)', 'Vadodara-Rajkot Transit',
            0, 0,
            json.dumps([[22.250, 71.200], [22.350, 71.200], [22.350, 72.200], [22.250, 72.200]]),
            json.dumps(['ZONE_D', 'ZONE_E']),
            'GAP_UNMONITORED', 'CAMERA_FREE_GAP', '#64748b', 'HIGH', datetime.utcnow().isoformat()
        )
    ]
    cursor.execute('DELETE FROM coverage_zones')
    cursor.executemany('''INSERT INTO coverage_zones (
        zone_id, code, name, city, is_monitored, is_restricted, polygon_geo, connecting_zones,
        status, coverage_status, color, risk_level, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', zones)

    # Seed or Update Cameras with explicit zone_id
    cameras = [
        ('cam1', 'Ahmedabad - SG Highway Junction', 'rtsp://localhost:8554/cam1', '192.168.1.101', 80, 23.0300, 72.5178, 'SG Highway, Ahmedabad', 'ZONE_A', 'ONLINE', 98, 15.0, datetime.utcnow().isoformat(), 1, 1, 1, 1, 1, '1920x1080', 0.98, 'edge-node-ahmedabad-01', 'LIVE_STREAM'),
        ('cam2', 'Gandhinagar - Infocity Circle', 'rtsp://localhost:8554/cam2', '192.168.1.102', 80, 23.1896, 72.6289, 'Infocity Circle, Gandhinagar', 'ZONE_B', 'ONLINE', 95, 15.0, datetime.utcnow().isoformat(), 1, 1, 0, 0, 1, '1920x1080', 0.95, 'edge-node-gandhinagar-01', 'LIVE_STREAM'),
        ('cam3', 'Surat - Ring Road Flyover', 'rtsp://localhost:8554/cam3', '192.168.1.103', 80, 21.1959, 72.8302, 'Ring Road Flyover, Surat', 'ZONE_C', 'ONLINE', 99, 15.0, datetime.utcnow().isoformat(), 1, 0, 1, 0, 1, '1920x1080', 0.92, 'edge-node-surat-01', 'LIVE_STREAM'),
        ('cam4', 'Vadodara - Alkapuri Cross Road', 'rtsp://localhost:8554/cam4', '192.168.1.104', 80, 22.3107, 73.1812, 'Alkapuri, Vadodara', 'ZONE_D', 'ONLINE', 96, 15.0, datetime.utcnow().isoformat(), 1, 1, 0, 1, 1, '1920x1080', 0.90, 'edge-node-vadodara-01', 'LIVE_STREAM'),
        ('cam5', 'Rajkot - Kalawad Road Junction', 'rtsp://localhost:8554/cam5', '192.168.1.105', 80, 22.2856, 70.7725, 'Kalawad Road, Rajkot', 'ZONE_E', 'ONLINE', 97, 15.0, datetime.utcnow().isoformat(), 1, 0, 0, 0, 1, '1920x1080', 0.88, 'edge-node-rajkot-01', 'LIVE_STREAM')
    ]
    for cam in cameras:
        cursor.execute('''INSERT INTO cameras (
            camera_id, name, rtsp_url, onvif_host, onvif_port, latitude, longitude, location, zone_id,
            status, health_score, fps, last_seen, rtsp_available, onvif_available, ptz_available,
            microphone_available, night_ir_capability, resolution, plate_recognition_suitability,
            edge_node_id, mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(camera_id) DO UPDATE SET
            zone_id=excluded.zone_id,
            name=excluded.name,
            location=excluded.location,
            latitude=excluded.latitude,
            longitude=excluded.longitude''', cam)

    # Seed Incidents
    incidents = [
        ('INC-2026-001', 'ZONE_A', 'cam1', (datetime.now() - timedelta(minutes=45)).isoformat(), 'SG Highway Junction, Ahmedabad', 'WATCHLIST_TARGET_HIT', 0.96, 1, 'CRITICAL', 'ACTIVE', 'Flagged heist vehicle GJ01AB1234 detected traversing intersection northward', 'AI_DETECTOR'),
        ('INC-2026-002', 'ZONE_B', 'cam2', (datetime.now() - timedelta(minutes=25)).isoformat(), 'Secretariat VIP Perimeter, Gandhinagar', 'RESTRICTED_ZONE_BREACH', 0.94, 2, 'HIGH', 'ACTIVE', 'Unauthorized commercial truck detected entering high-security VIP perimeter', 'AI_DETECTOR'),
        ('INC-2026-003', 'ZONE_C', 'cam3', (datetime.now() - timedelta(minutes=55)).isoformat(), 'Ring Road Flyover, Surat', 'SPEED_VIOLATION', 0.92, 3, 'MEDIUM', 'RESOLVED', 'Vehicle detected exceeding 88 km/h on urban flyover segment', 'SPEED_RADAR'),
        ('INC-2026-004', 'ZONE_GAP_AB', None, (datetime.now() - timedelta(minutes=15)).isoformat(), 'Koba Highway Unmonitored Sector', 'UNMONITORED_GAP_DISAPPEARANCE', 0.89, None, 'HIGH', 'TRACKING_GAP', 'Target departed ZONE A towards ZONE B; currently transiting camera-free corridor', 'ROUTE_PREDICTOR'),
        ('INC-2026-005', 'ZONE_D', 'cam4', (datetime.now() - timedelta(minutes=70)).isoformat(), 'Alkapuri Cross Road, Vadodara', 'HEAT_ANOMALY', 0.95, 4, 'MEDIUM', 'ACTIVE', 'Heavy vehicle engine core overheating detected at 106.4C by FLIR Radiometric sensor', 'THERMAL_FLIR'),
        ('INC-2026-006', 'ZONE_E', 'cam5', (datetime.now() - timedelta(minutes=10)).isoformat(), 'Kalawad Road Junction, Rajkot', 'PEDESTRIAN_SECURITY_ALERT', 0.91, 5, 'HIGH', 'ACTIVE', 'Pedestrian observed near restricted highway shoulder after hours', 'AI_DETECTOR')
    ]
    cursor.execute('DELETE FROM incidents')
    cursor.executemany('''INSERT INTO incidents (
        incident_id, zone_id, camera_id, timestamp, location, incident_type,
        confidence, evidence_id, severity, status, details, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', incidents)

    # Seed Watchlist
    cursor.execute('SELECT COUNT(*) FROM watchlists')
    if cursor.fetchone()[0] == 0:
        watch_items = [
            ('PLATE', 'GJ01AB1234', 'WANTED_VEHICLE', 'Associated with reported heist in SG Highway Ahmedabad', 'CRITICAL', 1, datetime.utcnow().isoformat()),
            ('PLATE', 'GJ05CD5678', 'STOLEN_VEHICLE', 'Stolen commercial truck reported by Surat Traffic Police', 'HIGH', 1, datetime.utcnow().isoformat()),
            ('PLATE', 'GJ01XY9999', 'SUSPECT_VEHICLE', 'Flagged in hit-and-run investigation', 'HIGH', 1, datetime.utcnow().isoformat()),
            ('PLATE', 'GJ27AA0007', 'VIP_ESCORT_ALERT', 'Authorized security protocol monitoring', 'MEDIUM', 1, datetime.utcnow().isoformat())
        ]
        cursor.executemany('INSERT INTO watchlists (item_type, value, category, note, severity, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', watch_items)

    # Seed Restricted Zones
    cursor.execute('SELECT COUNT(*) FROM restricted_zones')
    if cursor.fetchone()[0] == 0:
        rzones = [
            ('rz_gandhinagar_gov', 'Gandhinagar Secretariat High Security Zone', 'cam2', json.dumps([[23.185, 72.620], [23.195, 72.620], [23.195, 72.635], [23.185, 72.635]]), 0, 24, json.dumps(['truck', 'bus', 'person']), 1),
            ('rz_sg_vip', 'Ahmedabad SG Highway Flyover Restricted Perimeter', 'cam1', json.dumps([[23.025, 72.510], [23.035, 72.510], [23.035, 72.525], [23.025, 72.525]]), 22, 6, json.dumps(['person', 'motorcycle', 'truck']), 1)
        ]
        cursor.executemany('INSERT INTO restricted_zones (zone_id, name, camera_id, polygon_coords, active_hours_start, active_hours_end, target_types, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', rzones)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print('Database initialized successfully with full Zone Separation and Incidents.')
