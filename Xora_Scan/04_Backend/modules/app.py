# import os
# import cv2
# import numpy as np
# import tensorflow as tf
# import base64

# # CONFIGURATIONS & DYNAMIC ABSOLUTE PATHS
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

# STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_flip_detector_v1', 'best_flip_detector.keras')
# STAGE2_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_V4', 'dental_validation_model_v4.keras')

# #Model Load
# IMAGE_SIZE = (224, 224)
# STAGE2_CLASSES = ['0_Correct', '1_Rotate_90', '2_Rotate_180', '3_Rotate_270', '4_Non_Dental']

# CONFIDENCE_THRESHOLD = 0.55

# stage1_model = None
# stage2_model = None

# try:
#     stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH)
#     print(" -> Stage 1 Model (Flip Detector) Loaded Successfully.")
#     stage2_model = tf.keras.models.load_model(STAGE2_MODEL_PATH)
#     print(" -> Stage 2 Model (Orientation/Validity) Loaded Successfully.")
# except Exception as e:
#     print(f"[CRITICAL ERROR] Failed to load Validation Models: {e}")

# #img ready for model
# def preprocess_for_stage1(img_bgr):
#     img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
#     img_resized = cv2.resize(img_rgb, IMAGE_SIZE)
#     img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_resized)
#     return np.expand_dims(img_array, axis=0)

# def preprocess_for_stage2(img_bgr):
#     img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
#     img_resized = cv2.resize(img_rgb, IMAGE_SIZE)
#     img_array = tf.keras.applications.efficientnet.preprocess_input(img_resized)
#     return np.expand_dims(img_array, axis=0)



# def generate_blur_heatmap(img_bgr):
#     """Generates a color coded blur heatmap overlay encoded in Base64 for Frontend UI."""
#     gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
#     laplacian = cv2.Laplacian(gray, cv2.CV_64F)
#     abs_laplacian = np.absolute(laplacian)
    
#     blur_map = cv2.GaussianBlur(abs_laplacian, (15, 15), 0)
#     normalized_map = cv2.normalize(blur_map, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    
#     inverted_map = cv2.bitwise_not(normalized_map)
#     heatmap = cv2.applyColorMap(inverted_map, cv2.COLORMAP_JET)
    
#     overlay = cv2.addWeighted(img_bgr, 0.6, heatmap, 0.4, 0)
    
#     # Encode image to base64
#     _, buffer = cv2.imencode('.png', overlay)
#     base64_heatmap = base64.b64encode(buffer).decode('utf-8')
#     return f"data:image/png;base64,{base64_heatmap}"

# #calculate quality metrics
# def calculate_quality_metrics(img):
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     avg_brightness = np.mean(gray)
#     exposure = "Good"
#     if avg_brightness < 40: exposure = "Under-exposed"
#     elif avg_brightness > 230: exposure = "Over-exposed"
    
#     blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
#     is_blurred = blur_val < 65 
    
#     blur_score_norm = min(100, (blur_val / 200.0) * 100)
#     brightness_score = 100 - abs(127 - avg_brightness) * (100 / 127)
#     final_score = (blur_score_norm * 0.7) + (brightness_score * 0.3)

#     # Bar Charts
#     std_contrast = np.std(gray)
#     contrast_score = min(100, (std_contrast / 64.0) * 100)
    
#     exposure_score = 100
#     if avg_brightness < 40:
#         exposure_score = max(0, (avg_brightness / 40.0) * 100)
#     elif avg_brightness > 230:
#         exposure_score = max(0, ((255 - avg_brightness) / 25.0) * 100)
    
#     metrics_breakdown = {
#         "blur_score": round(blur_score_norm, 2),
#         "brightness_score": round(brightness_score, 2),
#         "contrast_score": round(contrast_score, 2),
#         "exposure_score": round(exposure_score, 2)
#     }
    
#     return exposure, is_blurred, round(blur_val, 2), round(final_score, 2), metrics_breakdown

# def run_image_validation_pipeline(img_cv2):
#     """
#     The image sent from the main app.py is taken and the entire validation process is done.
#     Returns the 'fixed_img' that is awarded and corrected in shape.
#     """
#     if stage1_model is None or stage2_model is None:
#         return {"status": "Rejected", "reason": "Validation models not loaded."}, None

#     # [STAGE 1] FLIP DETECTION
#     s1_input = preprocess_for_stage1(img_cv2)
#     flip_prob = float(stage1_model.predict(s1_input, verbose=0)[0][0])
#     is_flipped_detected = flip_prob > 0.5

#     # [STAGE 2] MAX-CONFIDENCE VOTING LOGIC
#     s2_input_orig = preprocess_for_stage2(img_cv2)
#     preds_orig = stage2_model.predict(s2_input_orig, verbose=0)[0]
#     max_conf_orig = float(np.max(preds_orig))
#     class_idx_orig = int(np.argmax(preds_orig))
    
#     # Horizontal flip (Mirror) check
#     flipped_img_cv2 = cv2.flip(img_cv2, 1) 
#     s2_input_corr = preprocess_for_stage2(flipped_img_cv2)
#     preds_corr = stage2_model.predict(s2_input_corr, verbose=0)[0]
#     max_conf_corr = float(np.max(preds_corr))
#     class_idx_corr = int(np.argmax(preds_corr))


#     if max_conf_orig < CONFIDENCE_THRESHOLD and max_conf_corr < CONFIDENCE_THRESHOLD:
#         print("❌ [REJECTED] Model confidence is too low. Image structure is ambiguous.")
#         return {
#             "status": "Rejected",
#             "reason": "Ambiguous image structure. Low model confidence.",
#             "message": "The uploaded X-ray lacks clear structural landmarks or features. Please upload a clearer radiograph."
#         }, None

#     # UPDATED SAFEGUARD LOGIC: Prevents False Flip Triggering on Symmetrical Panorama X-rays
#     strict_flip_condition = (flip_prob >= 0.65 and max_conf_corr > 0.60) or \
#                             (flip_prob > 0.50 and max_conf_corr > (max_conf_orig + 0.15) and class_idx_orig != 4)

#     print(f"⚡ Strict Flip Condition Evaluation Result: {strict_flip_condition}")
#     print("="*60 + "\n")                        

#     if strict_flip_condition:
#         working_img = flipped_img_cv2.copy()
#         detected_class_id = class_idx_corr
#         confidence = max_conf_corr
#         active_preds = preds_corr
#         is_flipped_corrected = True
#         flip_note = "Horizontal Flip anomaly corrected automatically."
#     else:
#         working_img = img_cv2.copy()
#         detected_class_id = class_idx_orig
#         confidence = max_conf_orig
#         active_preds = preds_orig
#         is_flipped_corrected = False
#         flip_note = "No flip anomaly detected."

#     detected_label = STAGE2_CLASSES[detected_class_id]

#     # Class Probabilities Extraction
#     class_probabilities = {
#         cls_name: round(float(prob) * 100, 2)
#         for cls_name, prob in zip(STAGE2_CLASSES, active_preds)
#     }

#     # CHECK CONTENT VALIDITY
#     if detected_label == '4_Non_Dental':
#         return {
#             "status": "Rejected",
#             "reason": "Image is not a dental X-ray.",
#             "confidence": round(confidence, 2),
#             "label": detected_label,
#             "is_flipped_corrected": is_flipped_corrected,
#             "class_probabilities": class_probabilities
#         }, None

#     # AUTO-ROTATION LOGIC 
#     fixed_img = working_img.copy()
#     rotation_note = "No rotation needed"

#     if detected_class_id == 1:
#         fixed_img = cv2.rotate(working_img, cv2.ROTATE_90_COUNTERCLOCKWISE)
#         rotation_note = "Rotated to fix orientation (Method A)"
#     elif detected_class_id == 2:
#         fixed_img = cv2.rotate(working_img, cv2.ROTATE_180)
#         rotation_note = "Rotated 180 degrees to fix"
#     elif detected_class_id == 3:
#         fixed_img = cv2.rotate(working_img, cv2.ROTATE_90_CLOCKWISE)
#         rotation_note = "Rotated to fix orientation (Method B)"

#     # QUALITY ANALYSIS Calculated on the fixed image
#     exposure, is_blurred, blur_val, quality_score, metrics_breakdown = calculate_quality_metrics(fixed_img)

#     blur_heatmap_base64 = generate_blur_heatmap(fixed_img)

#     if quality_score < 40 or confidence < CONFIDENCE_THRESHOLD:
#         fail_reason = "Low image quality or high ambiguity."
#         if is_blurred: fail_reason += " Image is too blurry."
#         if exposure != "Good": fail_reason += f" Lighting is {exposure}."
#         if confidence < CONFIDENCE_THRESHOLD: fail_reason += " AI confidence is insufficient."

#         return {
#             "status": "Rejected",
#             "reason": fail_reason,
#             "quality_score": quality_score,
#             "blur_score": blur_val,
#             "exposure": exposure,
#             "confidence": round(confidence, 2),
#             "is_flipped_corrected": is_flipped_corrected,
#             "metrics_breakdown": metrics_breakdown,
#             "class_probabilities": class_probabilities,
#             "blur_heatmap_base64": blur_heatmap_base64,
#             "message": "The image quality is too poor for a safe diagnostic analysis. Please re-upload a higher quality image."
#         }, None

#     # Final Validation Report
#     validation_report = {
#         "status": "Success",
#         "quality_score": quality_score,
#         "blur_score": blur_val,
#         "confidence": round(confidence, 2),
#         "exposure": exposure,
#         "is_blurred": bool(is_blurred),
#         "is_flipped_corrected": is_flipped_corrected,
#         "flip_analysis_note": flip_note,
#         "orientation_detected": detected_class_id,
#         "rotation_applied": rotation_note,
#         "metrics_breakdown": metrics_breakdown,
#         "class_probabilities": class_probabilities,
#         "blur_heatmap_base64": blur_heatmap_base64
#     }
    
#     return validation_report, fixed_img

import os
import cv2
import numpy as np
import tensorflow as tf
import base64

# CONFIGURATIONS & DYNAMIC ABSOLUTE PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_flip_detector_v1', 'best_flip_detector.keras')
STAGE2_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_V4', 'dental_validation_model_v4.keras')

# Model Load
IMAGE_SIZE = (224, 224)
STAGE2_CLASSES = ['0_Correct', '1_Rotate_90', '2_Rotate_180', '3_Rotate_270', '4_Non_Dental']

CONFIDENCE_THRESHOLD = 0.55

stage1_model = None
stage2_model = None

try:
    stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH)
    print(" -> Stage 1 Model (Flip Detector) Loaded Successfully.")
    stage2_model = tf.keras.models.load_model(STAGE2_MODEL_PATH)
    print(" -> Stage 2 Model (Orientation/Validity) Loaded Successfully.")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to load Validation Models: {e}")

# Preprocessing Functions
def preprocess_for_stage1(img_bgr):
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, IMAGE_SIZE)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_resized)
    return np.expand_dims(img_array, axis=0)

def preprocess_for_stage2(img_bgr):
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, IMAGE_SIZE)
    img_array = tf.keras.applications.efficientnet.preprocess_input(img_resized)
    return np.expand_dims(img_array, axis=0)

def generate_blur_heatmap(img_bgr):
    """Generates a color coded blur heatmap overlay encoded in Base64 for Frontend UI."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    abs_laplacian = np.absolute(laplacian)
    
    blur_map = cv2.GaussianBlur(abs_laplacian, (15, 15), 0)
    normalized_map = cv2.normalize(blur_map, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    
    inverted_map = cv2.bitwise_not(normalized_map)
    heatmap = cv2.applyColorMap(inverted_map, cv2.COLORMAP_JET)
    
    overlay = cv2.addWeighted(img_bgr, 0.6, heatmap, 0.4, 0)
    
    # Encode image to base64
    _, buffer = cv2.imencode('.png', overlay)
    base64_heatmap = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{base64_heatmap}"

# Calculate Quality Metrics
def calculate_quality_metrics(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray)
    exposure = "Good"
    if avg_brightness < 40: exposure = "Under-exposed"
    elif avg_brightness > 230: exposure = "Over-exposed"
    
    blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurred = blur_val < 65 
    
    blur_score_norm = min(100, (blur_val / 200.0) * 100)
    brightness_score = 100 - abs(127 - avg_brightness) * (100 / 127)
    final_score = (blur_score_norm * 0.7) + (brightness_score * 0.3)

    # Bar Charts
    std_contrast = np.std(gray)
    contrast_score = min(100, (std_contrast / 64.0) * 100)
    
    exposure_score = 100
    if avg_brightness < 40:
        exposure_score = max(0, (avg_brightness / 40.0) * 100)
    elif avg_brightness > 230:
        exposure_score = max(0, ((255 - avg_brightness) / 25.0) * 100)
    
    metrics_breakdown = {
        "blur_score": round(blur_score_norm, 2),
        "brightness_score": round(brightness_score, 2),
        "contrast_score": round(contrast_score, 2),
        "exposure_score": round(exposure_score, 2)
    }
    
    return exposure, is_blurred, round(blur_val, 2), round(final_score, 2), metrics_breakdown

def run_image_validation_pipeline(img_cv2):
    """
    The image sent from the main app.py is taken and the entire validation process is done.
    Returns the 'fixed_img' that is awarded and corrected in shape.
    """
    if stage1_model is None or stage2_model is None:
        return {"status": "Rejected", "reason": "Validation models not loaded."}, None

    print("\n" + "="*70)
    print(" [PIPELINE START] RUNNING INTER-MODEL VALIDATION & DATA FLOW PROOF")
    print("="*70)

    # [STAGE 1] FLIP DETECTION
    s1_input = preprocess_for_stage1(img_cv2)
    flip_prob = float(stage1_model.predict(s1_input, verbose=0)[0][0])
    is_flipped_detected = flip_prob > 0.5

    print(f" [STAGE 1 OUTPUT] MobileNetV2 Flip Probability Score : {flip_prob:.4f}")
    print(f"                   -> Initial Flip Flag Detected      : {is_flipped_detected}")

    # [STAGE 2] MAX-CONFIDENCE VOTING LOGIC
    # Evaluation A: Original Input Tensor passed to Stage 2
    s2_input_orig = preprocess_for_stage2(img_cv2)
    preds_orig = stage2_model.predict(s2_input_orig, verbose=0)[0]
    max_conf_orig = float(np.max(preds_orig))
    class_idx_orig = int(np.argmax(preds_orig))
    
    # Evaluation B: Horizontally Flipped Input Tensor passed to Stage 2
    flipped_img_cv2 = cv2.flip(img_cv2, 1) 
    s2_input_corr = preprocess_for_stage2(flipped_img_cv2)
    preds_corr = stage2_model.predict(s2_input_corr, verbose=0)[0]
    max_conf_corr = float(np.max(preds_corr))
    class_idx_corr = int(np.argmax(preds_corr))

    print(f"[STAGE 2 EVALUATION] Original Input Confidence   : {max_conf_orig:.4f} (Class: {STAGE2_CLASSES[class_idx_orig]})")
    print(f"                       Flipped Input Confidence    : {max_conf_corr:.4f} (Class: {STAGE2_CLASSES[class_idx_corr]})")

    if max_conf_orig < CONFIDENCE_THRESHOLD and max_conf_corr < CONFIDENCE_THRESHOLD:
        print("❌ [REJECTED] Model confidence is too low. Image structure is ambiguous.")
        return {
            "status": "Rejected",
            "reason": "Ambiguous image structure. Low model confidence.",
            "message": "The uploaded X-ray lacks clear structural landmarks or features. Please upload a clearer radiograph."
        }, None

    # SAFEGUARD LOGIC EVALUATION
    strict_flip_condition = (flip_prob >= 0.65 and max_conf_corr > 0.60) or \
                            (flip_prob > 0.50 and max_conf_corr > (max_conf_orig + 0.15) and class_idx_orig != 4)

    print(f"[INTER-STAGE DECISION LOGIC] Strict Flip Condition Met: {strict_flip_condition}")

    # INTERMEDIATE DATA TRANSFORMATION & PASSING
    if strict_flip_condition:
        working_img = flipped_img_cv2.copy()
        detected_class_id = class_idx_corr
        confidence = max_conf_corr
        active_preds = preds_corr
        is_flipped_corrected = True
        flip_note = "Horizontal Flip anomaly corrected automatically."
        print("[DATA PASSING PROOF] -> Stage 1 decision TRIGGERED FLIP TRANSFORMATION.")
        print("                           Passing 'flipped_img_cv2' as 'working_img' into Rotation Stage.")
    else:
        working_img = img_cv2.copy()
        detected_class_id = class_idx_orig
        confidence = max_conf_orig
        active_preds = preds_orig
        is_flipped_corrected = False
        flip_note = "No flip anomaly detected."
        print("[DATA PASSING PROOF] -> Stage 1 decision PASSED UNCHANGED ORIGINAL IMAGE.")
        print("                           Passing 'img_cv2' directly as 'working_img' into Rotation Stage.")

    detected_label = STAGE2_CLASSES[detected_class_id]

    # Class Probabilities Extraction
    class_probabilities = {
        cls_name: round(float(prob) * 100, 2)
        for cls_name, prob in zip(STAGE2_CLASSES, active_preds)
    }

    # CHECK CONTENT VALIDITY
    if detected_label == '4_Non_Dental':
        print(f"❌ [VALIDATION REJECTED] Image identified as Non-Dental (Class ID 4). Confidence: {confidence:.2f}")
        return {
            "status": "Rejected",
            "reason": "Image is not a dental X-ray.",
            "confidence": round(confidence, 2),
            "label": detected_label,
            "is_flipped_corrected": is_flipped_corrected,
            "class_probabilities": class_probabilities
        }, None

    # AUTO-ROTATION LOGIC 
    fixed_img = working_img.copy()
    rotation_note = "No rotation needed"

    if detected_class_id == 1:
        fixed_img = cv2.rotate(working_img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        rotation_note = "Rotated to fix orientation (Method A)"
    elif detected_class_id == 2:
        fixed_img = cv2.rotate(working_img, cv2.ROTATE_180)
        rotation_note = "Rotated 180 degrees to fix"
    elif detected_class_id == 3:
        fixed_img = cv2.rotate(working_img, cv2.ROTATE_90_CLOCKWISE)
        rotation_note = "Rotated to fix orientation (Method B)"

    print(f"🔹 [STAGE 2 FINAL ORIENTATION] Detected Class: {detected_label} | Applied Operation: {rotation_note}")

    # QUALITY ANALYSIS Calculated on the fixed image
    exposure, is_blurred, blur_val, quality_score, metrics_breakdown = calculate_quality_metrics(fixed_img)
    blur_heatmap_base64 = generate_blur_heatmap(fixed_img)

    if quality_score < 40 or confidence < CONFIDENCE_THRESHOLD:
        fail_reason = "Low image quality or high ambiguity."
        if is_blurred: fail_reason += " Image is too blurry."
        if exposure != "Good": fail_reason += f" Lighting is {exposure}."
        if confidence < CONFIDENCE_THRESHOLD: fail_reason += " AI confidence is insufficient."

        print(f"❌ [QUALITY REJECTED] Quality Score: {quality_score} | Reason: {fail_reason}")

        return {
            "status": "Rejected",
            "reason": fail_reason,
            "quality_score": quality_score,
            "blur_score": blur_val,
            "exposure": exposure,
            "confidence": round(confidence, 2),
            "is_flipped_corrected": is_flipped_corrected,
            "metrics_breakdown": metrics_breakdown,
            "class_probabilities": class_probabilities,
            "blur_heatmap_base64": blur_heatmap_base64,
            "message": "The image quality is too poor for a safe diagnostic analysis. Please re-upload a higher quality image."
        }, None

    print("[SUCCESS] Image passed all pipeline checks successfully!")
    print("="*70 + "\n")

    # Final Validation Report
    validation_report = {
        "status": "Success",
        "quality_score": quality_score,
        "blur_score": blur_val,
        "confidence": round(confidence, 2),
        "exposure": exposure,
        "is_blurred": bool(is_blurred),
        "is_flipped_corrected": is_flipped_corrected,
        "flip_analysis_note": flip_note,
        "orientation_detected": detected_class_id,
        "rotation_applied": rotation_note,
        "metrics_breakdown": metrics_breakdown,
        "class_probabilities": class_probabilities,
        "blur_heatmap_base64": blur_heatmap_base64
    }
    
    return validation_report, fixed_img