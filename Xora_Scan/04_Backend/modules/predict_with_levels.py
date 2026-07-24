# from ultralytics import YOLO
# import cv2
# import numpy as np
# import os
# from pathlib import Path

# # 1. MODEL CONFIGURATION
# # Updated path to your latest trained YOLOv11 model
# model_path = r'Xora_Scan\02_Member_Caries\runs\dental_cls_yolo11n\weights\best.pt'
# model = YOLO(model_path)

# def analyze_severity(image_path, disease_type):
#     """
#     OpenCV logic to calculate Disease Levels based on pixel analysis.
#     """
#     img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
#     if img is None:
#         return "Unknown", "N/A"

#     # Image quality enhancement (Histogram Equalization)
#     enhanced = cv2.equalizeHist(img)
    
#     # Logic for Dental Cavity
#     if "Cavity" in disease_type:
#         # Using Thresholding to identify dark pixels (decayed areas)
#         _, thresh = cv2.threshold(enhanced, 60, 255, cv2.THRESH_BINARY_INV)
#         dark_area_ratio = (cv2.countNonZero(thresh) / (img.shape[0] * img.shape[1])) * 100
        
#         if dark_area_ratio < 1.5:
#             return "Level 1", "Enamel caries."
#         elif 1.5 <= dark_area_ratio < 4.0:
#             return "Level 2", "Dentin caries."
#         else:
#             return "Level 3", "Deep decay."

#     # Logic for Periodontal Bone Loss
#     elif "Bone_Loss" in disease_type:
#         # Edge detection to measure bone texture/structural density
#         edges = cv2.Canny(enhanced, 50, 150)
#         edge_density = (cv2.countNonZero(edges) / (img.shape[0] * img.shape[1])) * 100
        
#         if edge_density < 12:
#             return "Level 1", "Initial bone loss < 15%."
#         elif 12 <= edge_density < 22:
#             return "Level 2", "Significant bone loss 15-33%."
#         else:
#             return "Level 3", "Critical bone loss > 33%."

#     return "General", "Consultation required."


# # 2. INPUT IMAGE CONFIGURATION
# # Ensure this file exists in your test folder
# image_path = r'Xora_Scan\01_Dataset\02_Member_Caries\test\Dental _Cavity_Test\sample.jpeg'
# #image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Healthy_Test\217.jpg'
# #image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Dental _Cavity_Test\p49_png.rf.89215121a3b6369ee8a7686374806ff9.jpg'


# # 3. EXECUTION LOGIC (Hybrid Engine)
# if os.path.exists(image_path):
#     # Run YOLO Inference (Classification)
#     results = model.predict(source=image_path, save=False, verbose=False)
    
#     for result in results:
#         top_name = result.names[result.probs.top1]
#         confidence = result.probs.top1conf.item()
        
#         print("\n" + " PROCESSING RESULT ".center(50, "-"))
#         print(f"File: {Path(image_path).name}")
#         print(f"System Confidence : {confidence:.2%}")

#         # A. INVALID INPUT (Non-Dental or Low Confidence)
#         if "Non_Dental" in top_name or confidence < 0.90:
#             print("\n" + "⚠️ INVALID INPUT ⚠️".center(50, "="))
#             print("Status: Image identified as Non-Dental or Quality too low.")
#             print("Action: Please upload a valid Dental Radiograph.")
#             print("="*50)
        
#         # B. HEALTHY RESULT
#         elif "Healthy" in top_name:
#             print("\n" + "X-RAY ANALYSIS REPORT".center(50, "="))
#             print(f"DIAGNOSIS      : No Disease Found")
#             print(f"CONFIDENCE     : {confidence:.2%}")
#             print(f"STATUS         : No significant abnormalities detected.")
#             print("="*50)

#         # C. DISEASE DETECTED (Hybrid Logic: YOLO Class + OpenCV Severity)
#         else:
#             # Calculate severity using Computer Vision metrics
#             level_value, clinical_note = analyze_severity(image_path, top_name)
            
#             # Clean up class name for display (Remove '_Train' and underscores)
#             display_name = top_name.replace('_Train', '').replace('_', ' ')
            
#             print("\n" + "X-RAY ANALYSIS REPORT".center(50, "="))
#             print(f"DIAGNOSIS      : {display_name}")
#             print(f"CONFIDENCE     : {confidence:.2%}")
#             print(f"DISEASE LEVEL  : {level_value}")
#             print("="*50)
# else:
#     print(f"ERROR: File not found at {image_path}. Please check the path and filename.")

import cv2
import numpy as np
import os
from ultralytics import YOLO

# 1. MODEL CONFIGURATION (Dynamic Absolute Path)
# 04_Backend/modules සිට පස්සට ගොස් ප්‍රධාන Root එක හරහා මොඩල් එකට path එක සාදා ගනී
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR)) # Xora_Scan root එකට යයි
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
    ප්‍රධාන app.py එකෙන් එවන, ඔයා දැනටමත් Validate කරලා, Orientations හදපු 
    'fixed_img' (OpenCV Image Object) එක කෙලින්ම මෙතනට Input එකක් විදිහට ගනී.
    """
    if caries_model is None:
        return {"status": "Error", "reason": "Caries Detection model not initialized."}

    # YOLOv11 Prediction
    # OpenCV Image Object (BGR Matrix) එක කෙලින්ම YOLO එකට දිය හැක (File Path අවශ්‍ය නැත)
    results = caries_model.predict(source=img_bgr, save=False, verbose=False)
    
    for result in results:
        top_name = result.names[result.probs.top1]
        confidence = float(result.probs.top1conf.item())
        
        # BGR Image එක Grayscale වලට හරවන්නේ Severity Check එක සඳහායි
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