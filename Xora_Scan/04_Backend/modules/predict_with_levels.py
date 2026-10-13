import cv2
import numpy as np
import os
from ultralytics import YOLO

# 1. MODEL CONFIGURATION (Dynamic Absolute Path)
# 04_Backend/modules path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR)) # Xora_Scan root 
MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '02_Member_Caries', 'dental_cls_yolo11n', 'weights', 'best.pt')

try:
    caries_model = YOLO(MODEL_PATH)
    print(" -> Stage 3 Model (YOLO Caries Detector) Loaded Successfully.")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to load YOLO Caries model: {e}")
    caries_model = None

def analyze_severity(img_gray, disease_type):
    """
    OpenCV logic to calculate Disease Levels based on pixel analysis.
    Takes img_gray directly as a NumPy array (No re-reading from disk).
    """
    if img_gray is None:
        return "Unknown", "N/A"

    # Image quality enhancement (Histogram Equalization)
    enhanced = cv2.equalizeHist(img_gray)
    
    # Logic for Dental Cavity
    if "Cavity" in disease_type:
        _, thresh = cv2.threshold(enhanced, 60, 255, cv2.THRESH_BINARY_INV)
        dark_area_ratio = (cv2.countNonZero(thresh) / (img_gray.shape[0] * img_gray.shape[1])) * 100
        
        if dark_area_ratio < 1.5:
            return "Level 1", "Enamel caries."
        elif 1.5 <= dark_area_ratio < 4.0:
            return "Level 2", "Dentin caries."
        else:
            return "Level 3", "Deep decay."

    # Logic for Periodontal Bone Loss
    elif "Bone_Loss" in disease_type:
        edges = cv2.Canny(enhanced, 50, 150)
        edge_density = (cv2.countNonZero(edges) / (img_gray.shape[0] * img_gray.shape[1])) * 100
        
        if edge_density < 12:
            return "Level 1", "Initial bone loss < 15%."
        elif 12 <= edge_density < 22:
            return "Level 2", "Significant bone loss 15-33%."
        else:
            return "Level 3", "Critical bone loss > 33%."

    return "General", "Consultation required."

def run_caries_detection(img_bgr):
    """
    Validate, Orientations 
    'fixed_img' (OpenCV Image Object) Input.
    """
    if caries_model is None:
        return {"status": "Error", "reason": "Caries Detection model not initialized."}

    # YOLOv11 Prediction
    # OpenCV Image Object (BGR Matrix) to YOLO (File Path no need)
    results = caries_model.predict(source=img_bgr, save=False, verbose=False)
    
    for result in results:
        top_name = result.names[result.probs.top1]
        confidence = float(result.probs.top1conf.item())
        
        # BGR Image to Grayscale Severity Check
        img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # A. HEALTHY RESULT
        if "Healthy" in top_name:
            return {
                "diagnosis": "No Disease Found",
                "caries_confidence": round(confidence, 2),
                "disease_level": "N/A",
                "clinical_note": "No significant abnormalities detected."
            }
            
        # B. INVALID AT THIS STAGE (Safety Check)
        elif "Non_Dental" in top_name and confidence > 0.90:
            return {
                "diagnosis": "Non-Dental Check Tripped",
                "caries_confidence": round(confidence, 2),
                "disease_level": "N/A",
                "clinical_note": "YOLO flagged image as Non-Dental."
            }
            
        # C. DISEASE DETECTED
        else:
            level_value, clinical_note = analyze_severity(img_gray, top_name)
            display_name = top_name.replace('_Train', '').replace('_', ' ')
            
            return {
                "diagnosis": display_name,
                "caries_confidence": round(confidence, 2),
                "disease_level": level_value,
                "clinical_note": clinical_note
            }

    return {"diagnosis": "Unknown", "caries_confidence": 0.0, "disease_level": "N/A"}