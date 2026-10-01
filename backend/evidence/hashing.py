import hashlib
import os
import base64
from datetime import datetime
from database import get_db

def compute_sha256(data_bytes: bytes) -> str:
    hasher = hashlib.sha256()
    hasher.update(data_bytes)
    return hasher.hexdigest()

def record_evidence(camera_id: str, frame_bytes: bytes, event_id: int = None, filename: str = None) -> dict:
    sha256_hash = compute_sha256(frame_bytes)
    timestamp = datetime.utcnow().isoformat()
    if not filename:
        filename = f"{camera_id}_{int(datetime.utcnow().timestamp())}.jpg"
    
    b64_data = base64.b64encode(frame_bytes).decode('utf-8')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO evidence (camera_id, event_id, timestamp, filename, sha256, file_size, data_base64)
                      VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (camera_id, event_id, timestamp, filename, sha256_hash, len(frame_bytes), b64_data))
    evidence_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "evidence_id": evidence_id,
        "camera_id": camera_id,
        "event_id": event_id,
        "timestamp": timestamp,
        "filename": filename,
        "sha256": sha256_hash,
        "file_size": len(frame_bytes),
        "status": "RECORDED"
    }

def verify_evidence(evidence_id: int) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM evidence WHERE evidence_id = ?', (evidence_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"status": "NOT_FOUND", "message": f"Evidence ID {evidence_id} not found", "result": "INTEGRITY FAILED", "is_valid": False}
    
    stored_hash = row['sha256']
    data_base64 = row['data_base64']
    
    try:
        raw_bytes = base64.b64decode(data_base64)
        calculated_hash = compute_sha256(raw_bytes)
        is_valid = (calculated_hash.lower() == stored_hash.lower())
        return {
            "evidence_id": evidence_id,
            "camera_id": row['camera_id'],
            "timestamp": row['timestamp'],
            "filename": row['filename'],
            "stored_hash": stored_hash,
            "calculated_hash": calculated_hash,
            "result": "INTEGRITY VERIFIED" if is_valid else "INTEGRITY FAILED",
            "is_valid": is_valid
        }
    except Exception as e:
        return {"status": "ERROR", "message": str(e), "result": "INTEGRITY FAILED", "is_valid": False}

def get_all_evidence(limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT evidence_id, camera_id, event_id, timestamp, filename, sha256, file_size FROM evidence ORDER BY evidence_id DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
