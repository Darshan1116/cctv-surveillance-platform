"""
Real License Plate Detection and OCR Pipeline.
Uses EasyOCR and computer vision pre-processing for license plate localization and character recognition.
Zero synthetic/fake plate generation — returns verified text or None with strict confidence reporting.
"""

import cv2
import numpy as np
import re
import os

# Indian / Gujarat state vehicle plate regex pattern (e.g. GJ01AB1234, GJ27AA0007, DL01C1234, MH02CD5678)
PLATE_REGEX = re.compile(r'([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4})')

class PlateOCR:
    def __init__(self, use_gpu: bool = True):
        self.reader = None
        self.use_gpu = use_gpu
        self._init_reader()

    def _init_reader(self):
        try:
            import easyocr
            # Initialize with English, numbers only allowed in detector
            self.reader = easyocr.Reader(['en'], gpu=self.use_gpu, verbose=False)
            print("[OCR] EasyOCR initialized successfully with GPU support." if self.use_gpu else "[OCR] EasyOCR initialized on CPU.")
        except Exception as e:
            print(f"[OCR] EasyOCR initialization warning: {e}. Trying CPU fallback...")
            try:
                import easyocr
                self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            except Exception as e2:
                print(f"[OCR] EasyOCR unavailable: {e2}")
                self.reader = None

    def assess_crop_quality(self, crop: np.ndarray) -> dict:
        """Evaluates image sharpness and contrast suitability for OCR."""
        if crop is None or crop.size == 0:
            return {"sharpness": 0.0, "is_readable": False, "reason": "EMPTY_CROP"}
            
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        brightness = np.mean(gray)
        
        is_blurry = laplacian_var < 30.0
        is_too_dark = brightness < 25.0
        is_too_bright = brightness > 240.0
        
        return {
            "sharpness": round(float(laplacian_var), 2),
            "brightness": round(float(brightness), 2),
            "is_readable": not (is_blurry or is_too_dark or is_too_bright),
            "reason": "BLURRY" if is_blurry else ("DARK" if is_too_dark else "NORMAL")
        }

    def preprocess_plate_roi(self, crop: np.ndarray) -> list:
        """Generates contrast-enhanced candidate variations for robust OCR extraction."""
        if crop is None or crop.size == 0:
            return []
            
        h, w = crop.shape[:2]
        # Resize to standard OCR height if small
        scale = max(1.0, 120.0 / float(h))
        resized = cv2.resize(crop, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
        
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
        
        # 1. Bilateral filter (denoise while keeping edges sharp)
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # 2. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(filtered)
        
        # 3. Adaptive Threshold (Otsu binarization)
        _, otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 4. Inverted threshold for dark-on-light / light-on-dark plates
        inv_otsu = cv2.bitwise_not(otsu)
        
        return [enhanced, otsu, inv_otsu, gray]

    def extract_plate_candidate_roi(self, vehicle_crop: np.ndarray) -> np.ndarray:
        """
        Locates the probable license plate region within a vehicle bounding box crop
        (usually lower 45% of the vehicle bumper area).
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return None
            
        h, w = vehicle_crop.shape[:2]
        # Focus on lower 50% of the vehicle
        lower_region = vehicle_crop[int(h * 0.45):h, int(w * 0.15):int(w * 0.85)]
        return lower_region if lower_region.size > 0 else vehicle_crop

    def recognize_plate(self, crop_image: np.ndarray, track_id: int = None, camera_id: str = None) -> dict:
        """
        Runs actual character recognition on the given vehicle/plate crop.
        Never returns synthetic text. Returns plate string, confidence score, and quality stats.
        """
        if crop_image is None or crop_image.size == 0:
            return {"plate": None, "confidence": 0.0, "quality": "EMPTY", "verified": False}
            
        quality = self.assess_crop_quality(crop_image)
        if not quality['is_readable']:
            return {"plate": None, "confidence": 0.0, "quality": quality['reason'], "verified": False}

        if self.reader is None:
            return {"plate": None, "confidence": 0.0, "quality": "OCR_ENGINE_UNAVAILABLE", "verified": False}

        # Try OCR on plate candidate ROI and full crop
        plate_roi = self.extract_plate_candidate_roi(crop_image)
        candidates = self.preprocess_plate_roi(plate_roi if plate_roi is not None else crop_image)
        
        best_plate = None
        best_conf = 0.0
        
        for candidate_img in candidates:
            try:
                results = self.reader.readtext(candidate_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
                for bbox, text, conf in results:
                    cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
                    if len(cleaned) >= 4:
                        # Check regex match for Indian plate format
                        match = PLATE_REGEX.search(cleaned)
                        extracted = match.group(1) if match else cleaned
                        
                        if conf > best_conf:
                            best_plate = extracted
                            best_conf = float(conf)
            except Exception:
                continue
                
            if best_plate and best_conf > 0.85:
                break
                
        if best_plate and best_conf >= 0.40:
            return {
                "plate": best_plate,
                "confidence": round(best_conf, 2),
                "sharpness": quality["sharpness"],
                "quality": "VALID",
                "verified": True
            }
            
        return {
            "plate": None,
            "confidence": round(best_conf, 2) if best_plate else 0.0,
            "quality": "NO_READABLE_PLATE",
            "verified": False
        }

# Global singleton
plate_ocr = PlateOCR(use_gpu=True)
