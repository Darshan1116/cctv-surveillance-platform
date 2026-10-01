"""
Appearance-based Person and Vehicle Re-Identification (Re-ID) Engine.
Extracts spatial-color feature embeddings (HSV histograms, upper/lower torso split, vehicle profile)
and performs cross-camera appearance matching with explicit uncertainty indicators.
"""

import cv2
import numpy as np

class AppearanceReID:
    def __init__(self, color_bins: int = 16):
        self.color_bins = color_bins

    def extract_features(self, crop_image: np.ndarray, obj_type: str = 'person') -> dict:
        """
        Extracts appearance descriptors from a detected person or vehicle crop.
        """
        if crop_image is None or crop_image.size == 0 or crop_image.shape[0] < 8 or crop_image.shape[1] < 8:
            return {"valid": False, "descriptor": None}
            
        hsv = cv2.cvtColor(crop_image, cv2.COLOR_BGR2HSV)
        # Shift Hue circularly by +30 to prevent Red wrap-around across 0/180 boundary
        hsv[:, :, 0] = (hsv[:, :, 0].astype(np.int16) + 30) % 180
        h, w = crop_image.shape[:2]
        
        if obj_type == 'person':
            # Split person crop into Upper Body (0-50%) and Lower Body (50-100%)
            upper_crop = hsv[0:int(h * 0.50), :]
            lower_crop = hsv[int(h * 0.50):h, :]
            
            upper_hist = cv2.calcHist([upper_crop], [0, 1], None, [self.color_bins, self.color_bins], [0, 180, 0, 256])
            lower_hist = cv2.calcHist([lower_crop], [0, 1], None, [self.color_bins, self.color_bins], [0, 180, 0, 256])
            
            cv2.normalize(upper_hist, upper_hist, alpha=1, beta=0, norm_type=cv2.NORM_L1)
            cv2.normalize(lower_hist, lower_hist, alpha=1, beta=0, norm_type=cv2.NORM_L1)
            
            # Extract dominant colors
            upper_dom = self._get_dominant_color_name(upper_crop)
            lower_dom = self._get_dominant_color_name(lower_crop)
            
            return {
                "valid": True,
                "type": "person",
                "upper_hist": upper_hist.flatten().tolist(),
                "lower_hist": lower_hist.flatten().tolist(),
                "dominant_upper_color": upper_dom,
                "dominant_lower_color": lower_dom,
                "aspect_ratio": round(h / float(w), 2)
            }
        else:
            # Vehicle appearance descriptor (full HSV histogram)
            full_hist = cv2.calcHist([hsv], [0, 1], None, [self.color_bins, self.color_bins], [0, 180, 0, 256])
            cv2.normalize(full_hist, full_hist, alpha=1, beta=0, norm_type=cv2.NORM_L1)
            dom_color = self._get_dominant_color_name(hsv)
            
            return {
                "valid": True,
                "type": "vehicle",
                "hist": full_hist.flatten().tolist(),
                "dominant_color": dom_color,
                "aspect_ratio": round(h / float(w), 2)
            }

    def _get_dominant_color_name(self, hsv_crop: np.ndarray) -> str:
        h, s, v = cv2.split(hsv_crop)
        mean_h = np.mean(h)
        mean_s = np.mean(s)
        mean_v = np.mean(v)
        
        if mean_v < 40:
            return "Black/Dark"
        if mean_s < 30 and mean_v > 180:
            return "White/Light"
        if mean_s < 40:
            return "Gray"
        if (0 <= mean_h < 15) or (165 <= mean_h <= 180):
            return "Red"
        if 15 <= mean_h < 35:
            return "Yellow/Orange"
        if 35 <= mean_h < 85:
            return "Green"
        if 85 <= mean_h < 135:
            return "Blue"
        if 135 <= mean_h < 165:
            return "Purple/Violet"
        return "Unknown"

    def compute_similarity(self, descA: dict, descB: dict) -> dict:
        """
        Compares two appearance descriptors and returns match probability with uncertainty notes.
        """
        if not descA.get('valid') or not descB.get('valid') or descA.get('type') != descB.get('type'):
            return {"match_status": "UNKNOWN", "score": 0.0, "reason": "INVALID_OR_TYPE_MISMATCH"}
            
        if descA['type'] == 'person':
            h1_u = np.array(descA['upper_hist'], dtype=np.float32)
            h2_u = np.array(descB['upper_hist'], dtype=np.float32)
            h1_l = np.array(descA['lower_hist'], dtype=np.float32)
            h2_l = np.array(descB['lower_hist'], dtype=np.float32)
            
            # Histogram intersection on normalized L1 distributions (0.0 to 1.0)
            score_u = max(0.0, min(1.0, float(cv2.compareHist(h1_u, h2_u, cv2.HISTCMP_INTERSECT))))
            score_l = max(0.0, min(1.0, float(cv2.compareHist(h1_l, h2_l, cv2.HISTCMP_INTERSECT))))
            
            # Color name match bonus
            color_bonus = 0.0
            if descA.get('dominant_upper_color') == descB.get('dominant_upper_color'):
                color_bonus += 0.05
            if descA.get('dominant_lower_color') == descB.get('dominant_lower_color'):
                color_bonus += 0.05
                
            total_score = min(1.0, (0.55 * score_u + 0.35 * score_l + color_bonus))
        else:
            h1 = np.array(descA['hist'], dtype=np.float32)
            h2 = np.array(descB['hist'], dtype=np.float32)
            score = max(0.0, min(1.0, float(cv2.compareHist(h1, h2, cv2.HISTCMP_INTERSECT))))
            color_bonus = 0.05 if descA.get('dominant_color') == descB.get('dominant_color') else 0.0
            total_score = min(1.0, score + color_bonus)
            
        score_val = round(float(total_score), 3)
        
        if score_val >= 0.85:
            status = "POSSIBLE MATCH (High Confidence — Human Verification Required)"
        elif score_val >= 0.65:
            status = "POSSIBLE MATCH (Moderate Confidence — Human Verification Required)"
        else:
            status = "UNLIKELY MATCH / UNKNOWN"
            
        return {
            "match_status": status,
            "similarity_score": score_val,
            "confidence_level": "HIGH" if score_val >= 0.85 else ("MODERATE" if score_val >= 0.65 else "LOW"),
            "verification_required": True
        }

reid_engine = AppearanceReID()
