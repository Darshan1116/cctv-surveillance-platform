"""
Government & Police System Integration-Ready Adapter Layer.
Normalized pluggable interfaces for:
- VAHAN (National Vehicle Registry)
- SARTHI (National Driving License Database)
- eGujCop (Gujarat Police Core Crime & Criminal Tracking Network)
- AFIS (Automated Fingerprint Identification System)
- NAFIS (National Automated Fingerprint Identification System)

Strict rule: Displays honest 'INTEGRATION_READY' status until authorized government gateway credentials are provided.
Never invents fake citizen or vehicle records.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

router = APIRouter(prefix="/api/government", tags=["government"])

GOV_SYSTEMS = [
    {
        "system_id": "VAHAN",
        "name": "VAHAN National Vehicle Registry",
        "agency": "Ministry of Road Transport and Highways (MoRTH)",
        "protocol": "REST / SOAP XML over Secure Gov WAN",
        "status": "INTEGRATION_READY",
        "connection_state": "AWAITING_AUTHORIZED_CREDENTIALS",
        "capabilities": ["Vehicle Registration", "Chassis/Engine Verification", "Owner Classification", "Stolen Vehicle Flagging"]
    },
    {
        "system_id": "SARTHI",
        "name": "SARTHI National Driving License System",
        "agency": "MoRTH / State Transport Department",
        "protocol": "REST API with mTLS",
        "status": "INTEGRATION_READY",
        "connection_state": "AWAITING_AUTHORIZED_CREDENTIALS",
        "capabilities": ["Driver License Validation", "Endorsement History", "Biometric Photo Verification"]
    },
    {
        "system_id": "EGUJCOP",
        "name": "eGujCop Police Records & CCTNS Portal",
        "agency": "Gujarat State Police Department",
        "protocol": "eGujCop Enterprise Service Bus (ESB)",
        "status": "INTEGRATION_READY",
        "connection_state": "AWAITING_AUTHORIZED_CREDENTIALS",
        "capabilities": ["FIR Lookups", "Wanted Person Cross-Check", "Warrant Verification", "Stolen Property Registry"]
    },
    {
        "system_id": "AFIS",
        "name": "Automated Fingerprint Identification System",
        "agency": "State Fingerprint Bureau (FPB) Gujarat",
        "protocol": "ANSI/NIST-ITL 1-2011 Standard",
        "status": "INTEGRATION_READY",
        "connection_state": "AWAITING_AUTHORIZED_CREDENTIALS",
        "capabilities": ["Latent Print Matching", "Tenprint Verification"]
    },
    {
        "system_id": "NAFIS",
        "name": "National Automated Fingerprint Identification System",
        "agency": "National Crime Records Bureau (NCRB)",
        "protocol": "National Police WAN / Secure API Gateway",
        "status": "INTEGRATION_READY",
        "connection_state": "AWAITING_AUTHORIZED_CREDENTIALS",
        "capabilities": ["National Criminal History Check", "Cross-State Wanted Interrogation"]
    }
]

@router.get("/status")
def get_government_systems_status():
    """
    Returns normalized integration readiness status for all external government databases.
    """
    return {
        "gateway": "NetraSuraksha Interoperability Gateway",
        "timestamp": datetime.utcnow().isoformat(),
        "total_systems": len(GOV_SYSTEMS),
        "systems": GOV_SYSTEMS
    }

@router.get("/vahan/{plate}")
def lookup_vahan_vehicle(plate: str):
    """
    Adapter endpoint for VAHAN vehicle registry lookup.
    """
    clean_plate = plate.strip().upper()
    return {
        "system": "VAHAN",
        "queried_plate": clean_plate,
        "status": "INTEGRATION_READY",
        "connection_status": "AWAITING_AUTHORIZED_API_ACCESS",
        "message": f"Integration connector ready for plate '{clean_plate}'. Awaiting authorized MoRTH VAHAN API credentials for live owner verification.",
        "schema_version": "v4.0_MoRTH"
    }

@router.get("/egujcop/{fir_or_plate}")
def lookup_egujcop_record(fir_or_plate: str):
    """
    Adapter endpoint for eGujCop CCTNS lookup.
    """
    clean_query = fir_or_plate.strip().upper()
    return {
        "system": "EGUJCOP",
        "query": clean_query,
        "status": "INTEGRATION_READY",
        "connection_status": "AWAITING_AUTHORIZED_API_ACCESS",
        "message": f"eGujCop CCTNS connector initialized for query '{clean_query}'. Awaiting Gujarat Police state intranet gateway binding.",
        "schema_version": "eGujCop_v3.2"
    }
