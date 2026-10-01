"""
Module 1: Incident Response & Camera Coverage Gap Router.
Architected for tracking incidents originating or passing through NO-CAMERA / UNMONITORED ZONES.
Calculates time-distance reachable cameras, sets predictive triggers, and formats coverage gap chains:
LAST OBSERVED -> [COVERAGE GAP: Zone] -> NEXT OBSERVATION -> POSSIBLE MATCH (Human Verification Required).
"""

import json
import math
from datetime import datetime, timedelta
from database import get_db

class IncidentCoverageRouter:
    def __init__(self):
        pass

    def create_no_camera_incident(self, payload: dict) -> dict:
        """
        Creates an incident originating in a monitored or unmonitored zone (SOS, panic button, acoustic, etc.).
        """
        incident_id = payload.get('incident_id', f"INC-{int(datetime.utcnow().timestamp())}")
        incident_type = payload.get('incident_type', 'SOS_EMERGENCY')
        source = payload.get('source', 'SOS_BUTTON')
        lat = payload.get('latitude', 23.1000)
        lng = payload.get('longitude', 72.5500)
        zone_id = payload.get('zone_id', 'zone_ahmedabad_gap_1')
        timestamp = payload.get('timestamp', datetime.utcnow().isoformat())
        severity = payload.get('severity', 'CRITICAL')
        description = payload.get('description', 'Emergency panic alert triggered in unmonitored corridor')
        
        last_obs = payload.get('last_known_observation', {
            'location_desc': 'Koba Highway Unmonitored Sector',
            'timestamp': timestamp,
            'direction': 'NORTH',
            'target_type': payload.get('target_type', 'vehicle'),
            'description': payload.get('target_desc', 'Red hatchback moving North')
        })
        
        # Determine candidate reachable cameras and estimated arrival times
        reachable_cams = self._calculate_reachable_cameras(lat, lng, target_type=last_obs.get('target_type', 'vehicle'))
        
        route_pred = {
            "origin_zone": zone_id,
            "is_unmonitored_zone": True,
            "reachable_cameras": reachable_cams,
            "status": "MONITORING_DOWNSTREAM_CAMERAS"
        }
        
        conn = get_db()
        cursor = conn.cursor()
        location_name = payload.get('location', description)
        cursor.execute('''INSERT INTO incidents (
            incident_id, incident_type, source, location_lat, location_lng, location, zone_id,
            timestamp, severity, status, description, details, last_known_observation, route_prediction, matched_observations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            incident_id, incident_type, source, lat, lng, location_name, zone_id,
            timestamp, severity, 'ACTIVE', description, description,
            json.dumps(last_obs), json.dumps(route_pred), json.dumps([])
        ))
        conn.commit()
        conn.close()
        
        return {
            "incident_id": incident_id,
            "incident_type": incident_type,
            "source": source,
            "zone_id": zone_id,
            "timestamp": timestamp,
            "severity": severity,
            "description": description,
            "last_known_observation": last_obs,
            "route_prediction": route_pred,
            "coverage_gap_chain": [
                {"step": 1, "status": "LAST_OBSERVED", "details": last_obs},
                {"step": 2, "status": "COVERAGE_GAP", "zone": zone_id, "note": "Unmonitored transit corridor — No live CCTV available"},
                {"step": 3, "status": "PREDICTIVE_WATCH", "candidate_cameras": [c['camera_id'] for c in reachable_cams]}
            ]
        }

    def _calculate_reachable_cameras(self, origin_lat: float, origin_lng: float, target_type: str = 'vehicle') -> list:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT camera_id, name, latitude, longitude, location FROM cameras')
        cams = cursor.fetchall()
        conn.close()
        
        speed_kmh = 35.0 if target_type == 'vehicle' else 5.0 # Speed assumption
        reachable = []
        
        for cam in cams:
            clat, clng = cam['latitude'], cam['longitude']
            # Haversine distance in km
            dlat = math.radians(clat - origin_lat)
            dlng = math.radians(clng - origin_lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(origin_lat)) * math.cos(math.radians(clat)) * math.sin(dlng/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = 6371.0 * c
            
            # If within 15 km radius
            if dist_km <= 15.0:
                est_minutes = round((dist_km / speed_kmh) * 60.0, 1)
                reachable.append({
                    "camera_id": cam['camera_id'],
                    "camera_name": cam['name'],
                    "distance_km": round(dist_km, 2),
                    "estimated_arrival_minutes": est_minutes,
                    "location": cam['location']
                })
                
        reachable.sort(key=lambda x: x['distance_km'])
        return reachable

    def correlate_observation(self, incident_id: str, new_observation: dict) -> dict:
        """
        Correlates a newly detected track on a downstream camera with an open incident.
        """
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM incidents WHERE incident_id = ?', (incident_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"error": "Incident not found"}
            
        matched = json.loads(row['matched_observations']) if row['matched_observations'] else []
        
        match_entry = {
            "camera_id": new_observation.get('camera_id'),
            "timestamp": new_observation.get('timestamp', datetime.utcnow().isoformat()),
            "track_id": new_observation.get('track_id'),
            "match_confidence": new_observation.get('similarity_score', 0.82),
            "match_status": "POSSIBLE MATCH — Human Verification Required",
            "observation_details": new_observation
        }
        matched.append(match_entry)
        
        cursor.execute('UPDATE incidents SET matched_observations = ? WHERE incident_id = ?',
                       (json.dumps(matched), incident_id))
        conn.commit()
        conn.close()
        
        return {
            "incident_id": incident_id,
            "status": "OBSERVATION_CORRELATED",
            "match": match_entry
        }

incident_router = IncidentCoverageRouter()
