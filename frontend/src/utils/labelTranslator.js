/**
 * Centralized Police & Control Room Label Translator.
 * Translates complex technical codes (YOLO, ByteTrack, Re-ID, Laplacian, SSIM, MQTT)
 * into intuitive, non-technical police operations language:
 * 
 * COMPLEXITY INSIDE. SIMPLICITY OUTSIDE.
 */

export function getHumanReadableAlertTitle(alertType) {
  if (!alertType) return "Review Required";
  
  const map = {
    'RESTRICTED_ZONE_BREACH': 'Restricted Area Entry',
    'WATCHLIST_MATCH': 'Possible Watchlist Match',
    'WATCHLIST_TARGET_HIT': 'Possible Watchlist Match',
    'CAMERA_FROZEN': 'Camera Not Responding',
    'CAMERA_BLOCKED': 'Camera Lens Obstructed',
    'CAMERA_VIEW_CHANGED': 'Camera View Shifted',
    'TEMPORAL_SNATCHING': 'Possible Snatching',
    'ACTION_CLASSIFICATION_07': 'Possible Snatching',
    'SNATCHING': 'Possible Snatching',
    'FORCED_MOVEMENT': 'Possible Forced Movement',
    'FIGHT': 'Possible Altercation',
    'FALLING': 'Possible Person Down',
    'REID_MATCH': 'Possible Match Across Cameras',
    'SPEED_VIOLATION': 'Excessive Speed Observed',
    'HEAT_ANOMALY': 'High Temperature Anomaly',
    'UNMONITORED_GAP_DISAPPEARANCE': 'Corridor Transit (Coverage Gap)',
    'SOS_EMERGENCY': 'Emergency SOS Triggered',
    'IOT_SENSOR_TRIGGER': 'PIR Motion Sensor Triggered'
  };

  return map[alertType] || alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function getHumanReadableStatus(status) {
  if (!status) return "REVIEW";
  
  const map = {
    'CRITICAL': 'IMMEDIATE ATTENTION',
    'HIGH': 'IMPORTANT',
    'MEDIUM': 'REVIEW',
    'LOW': 'NORMAL',
    'ONLINE': 'NORMAL',
    'HEALTHY': 'NORMAL',
    'WARNING': 'REVIEW',
    'OFFLINE': 'IMMEDIATE ATTENTION',
    'FROZEN': 'IMMEDIATE ATTENTION',
    'BLOCKED': 'IMPORTANT',
    'VIEW_CHANGED': 'REVIEW',
    'REVIEW_REQUIRED': 'REVIEW',
    'ACTIVE': 'IMPORTANT',
    'RESOLVED': 'RESOLVED',
    'UNKNOWN': 'UNKNOWN / UNAVAILABLE'
  };

  return map[status] || status;
}

export function getStatusBadgeStyle(status) {
  const norm = getHumanReadableStatus(status);
  
  switch (norm) {
    case 'IMMEDIATE ATTENTION':
      return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-bold';
    case 'IMPORTANT':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
    case 'REVIEW':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-medium';
    case 'NORMAL':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
