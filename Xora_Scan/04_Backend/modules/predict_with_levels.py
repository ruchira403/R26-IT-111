from ultralytics import YOLO
import cv2
import numpy as np
import os
from pathlib import Path

# 1. MODEL CONFIGURATION
# Updated path to your latest trained YOLOv11 model
model_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\runs\dental_cls_yolo11n\weights\best.pt'
model = YOLO(model_path)

def analyze_severity(image_path, disease_type):
    """
    OpenCV logic to calculate Disease Levels based on pixel analysis.
    """
    img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return "Unknown", "N/A"

    # Image quality enhancement (Histogram Equalization)
    enhanced = cv2.equalizeHist(img)
    
    # Logic for Dental Cavity
    if "Cavity" in disease_type:
        # Using Thresholding to identify dark pixels (decayed areas)
        _, thresh = cv2.threshold(enhanced, 60, 255, cv2.THRESH_BINARY_INV)
        dark_area_ratio = (cv2.countNonZero(thresh) / (img.shape[0] * img.shape[1])) * 100
        
        if dark_area_ratio < 1.5:
            return "Level 1", "Enamel caries."
        elif 1.5 <= dark_area_ratio < 4.0:
            return "Level 2", "Dentin caries."
        else:
            return "Level 3", "Deep decay."

    # Logic for Periodontal Bone Loss
    elif "Bone_Loss" in disease_type:
        # Edge detection to measure bone texture/structural density
        edges = cv2.Canny(enhanced, 50, 150)
        edge_density = (cv2.countNonZero(edges) / (img.shape[0] * img.shape[1])) * 100
        
        if edge_density < 12:
            return "Level 1", "Initial bone loss < 15%."
        elif 12 <= edge_density < 22:
            return "Level 2", "Significant bone loss 15-33%."
        else:
            return "Level 3", "Critical bone loss > 33%."

    return "General", "Consultation required."


# 2. INPUT IMAGE CONFIGURATION
# Ensure this file exists in your test folder
#image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Non_Dental\222.jpg'
#image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Healthy_Test\217.jpg'
image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Dental _Cavity_Test\p49_png.rf.33fcb764d5c3bd86ace01227e352f76b.jpg'
#image_path = r'D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\test\Periodontal_Bone_Loss_Test\abdeljabbar_kawtha_1899_12_30_2D_Image_Shot_bmp.rf.9e3cb99686c211c5741efb021934b9db.jpg'


# 3. EXECUTION LOGIC (Hybrid Engine)
if os.path.exists(image_path):
    # Run YOLO Inference (Classification)
    results = model.predict(source=image_path, save=False, verbose=False)
    
    for result in results:
        top_name = result.names[result.probs.top1]
        confidence = result.probs.top1conf.item()
        
        print("\n" + " PROCESSING RESULT ".center(50, "-"))
        print(f"File: {Path(image_path).name}")
        print(f"System Confidence : {confidence:.2%}")

        # A. INVALID INPUT (Non-Dental or Low Confidence)
        if "Non_Dental" in top_name or confidence < 0.90:
            print("\n" + "⚠️ INVALID INPUT ⚠️".center(50, "="))
            print("Status: Image identified as Non-Dental or Quality too low.")
            print("Action: Please upload a valid Dental Radiograph.")
            print("="*50)
        
        # B. HEALTHY RESULT
        elif "Healthy" in top_name:
            print("\n" + "X-RAY ANALYSIS REPORT".center(50, "="))
            print(f"DIAGNOSIS      : No Disease Found")
            print(f"CONFIDENCE     : {confidence:.2%}")
            print(f"STATUS         : No significant abnormalities detected.")
            print("="*50)

        # C. DISEASE DETECTED (Hybrid Logic: YOLO Class + OpenCV Severity)
        else:
            # Calculate severity using Computer Vision metrics
            level_value, clinical_note = analyze_severity(image_path, top_name)
            
            # Clean up class name for display (Remove '_Train' and underscores)
            display_name = top_name.replace('_Train', '').replace('_', ' ')
            
            print("\n" + "X-RAY ANALYSIS REPORT".center(50, "="))
            print(f"DIAGNOSIS      : {display_name}")
            print(f"CONFIDENCE     : {confidence:.2%}")
            print(f"DISEASE LEVEL  : {level_value}")
            print("="*50)
else:
    print(f"ERROR: File not found at {image_path}. Please check the path and filename.")