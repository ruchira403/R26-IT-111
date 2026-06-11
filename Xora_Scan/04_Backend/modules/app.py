
# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# import tensorflow as tf
# import cv2
# import numpy as np
# import os

# app = Flask(__name__)
# CORS(app) 

# # --- 1. CONFIGURATIONS & MODEL PATHS (DYNAMIC ABSOLUTE PATHS) ---
# # app.py file එක තියෙන නිවැරදිම ෆෝල්ඩර් path එක ගනී (D:\Dental_Xray_Projec\03_Backend_API)
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # ප්‍රධාන Project Root ෆෝල්ඩර් එකට පස්සට යයි (D:\Dental_Xray_Projec)
# PROJECT_ROOT = os.path.dirname(BASE_DIR)

# # දැන් නිවැරදි absolute paths ස්වයංක්‍රීයවම ගොඩනඟයි
# STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models','01_Member', 'outputs_flip_detector_v1', 'best_flip_detector.keras')
# STAGE2_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models','01_Member', 'outputs_v4', 'dental_validation_model_v4.keras')

# IMAGE_SIZE = (224, 224)

# # Upload folder එකත් 03_Backend_API ඇතුළේම හැදෙන පරිදි සකස් කර ඇත
# UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
# if not os.path.exists(UPLOAD_FOLDER):
#     os.makedirs(UPLOAD_FOLDER)

# STAGE2_CLASSES = ['0_Correct', '1_Rotate_90', '2_Rotate_180', '3_Rotate_270', '4_Non_Dental']

# # Global variables මුලින්ම හිස්ව තබමු
# stage1_model = None
# stage2_model = None

# print("=" * 70)
# print("   Loading Two-Stage Hybrid Models into Flask Backend...")
# print("   Researcher ID : it22092016")
# print("=" * 70)

# # --- DEBUGGING MODE: NO TRY-EXCEPT TO SEE THE REAL ERROR ---
# print(f"[DEBUG] Loading Stage 1 From: {STAGE1_MODEL_PATH}")
# stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH)
# print(" -> Stage 1 Model (Flip Detector) Loaded Successfully.")

# print(f"[DEBUG] Loading Stage 2 From: {STAGE2_MODEL_PATH}")
# stage2_model = tf.keras.models.load_model(STAGE2_MODEL_PATH)
# print(" -> Stage 2 Model (Orientation/Validity) Loaded Successfully.")

# # --- 3. PREPROCESSING HELPERS ---
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

# # --- 4. QUALITY CHECK LOGIC ---
# def calculate_quality_metrics(img):
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
#     # Exposure Check
#     avg_brightness = np.mean(gray)
#     exposure = "Good"
#     if avg_brightness < 40: exposure = "Under-exposed"
#     elif avg_brightness > 230: exposure = "Over-exposed"
    
#     # Blur Check (Laplacian Variance)
#     blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
#     is_blurred = blur_val < 65 
    
#     # Quality Score Calculation
#     blur_score_norm = min(100, (blur_val / 200.0) * 100)
#     brightness_score = 100 - abs(127 - avg_brightness) * (100 / 127)
    
#     # Final Weight: Blur (70%) + Brightness (30%)
#     final_score = (blur_score_norm * 0.7) + (brightness_score * 0.3)
    
#     return exposure, is_blurred, round(blur_val, 2), round(final_score, 2)

# # --- 5. ROUTES ---
# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)

# @app.route('/', methods=['GET'])
# def home():
#     return jsonify({
#         "status": "Backend is running", 
#         "message": "Dental Validator Hybrid V6.0 Active (Two-Stage Pipeline)"
#     })

# # --- 6. MAIN VALIDATION ROUTE (TWO-STAGE HYBRID LOGIC) ---
# @app.route('/validate', methods=['POST'])
# def validate_xray():
#     if 'image' not in request.files:
#         return jsonify({"error": "No image uploaded"}), 400
    
#     file = request.files['image']
#     file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(file_path)

#     # [CRITICAL FIX] පින්තූරය මුලින්ම OpenCV මඟින් කියවා 'img_cv2' විචල්‍යයට පැවරීම
#     img_cv2 = cv2.imread(file_path)
#     if img_cv2 is None:
#         return jsonify({"error": "Invalid image file"}), 400

#     # --- SAFETY CHECK: MODELS LOADED OR NOT ---
#     if stage1_model is None or stage2_model is None:
#         return jsonify({
#             "error": "Models are not initialized.",
#             "reason": "Backend failed to load .keras files during startup. Check backend console logs."
#         }), 500

#     # ------------------------------------------------------------------
#     # [STAGE 1] FLIP DETECTION (දැන් 'img_cv2' එක නිර්මාණය වී ඇති නිසා Error එක එන්නේ නැත)
#     # ------------------------------------------------------------------
#     s1_input = preprocess_for_stage1(img_cv2)
#     flip_prob = float(stage1_model.predict(s1_input, verbose=0)[0][0])
#     is_flipped_detected = flip_prob > 0.5

#     # ------------------------------------------------------------------
#     # [STAGE 2] MAX-CONFIDENCE VOTING LOGIC
#     # ------------------------------------------------------------------
#     # A. මුල් පින්තූරය Stage 2 එකට දමා බැලීම
#     s2_input_orig = preprocess_for_stage2(img_cv2)
#     preds_orig = stage2_model.predict(s2_input_orig, verbose=0)[0]
#     max_conf_orig = float(np.max(preds_orig))
#     class_idx_orig = int(np.argmax(preds_orig))
    
#     # B. පින්තූරය Horizontal Flip කර Stage 2 එකට දමා බැලීම
#     flipped_img_cv2 = cv2.flip(img_cv2, 1) # 1 = Horizontal Mirror Flip
#     s2_input_corr = preprocess_for_stage2(flipped_img_cv2)
#     preds_corr = stage2_model.predict(s2_input_corr, verbose=0)[0]
#     max_conf_corr = float(np.max(preds_corr))
#     class_idx_corr = int(np.argmax(preds_corr))

# # ------------------------------------------------------------------
#     # C. Hybrid Decision Maker (Strict Logic for True Flips Only)
#     # ------------------------------------------------------------------
#     # 1. මුලින්ම බලනවා Stage 1 Model එක ස්ථිරවම Flip එකක් හඳුනාගත්තාද කියා (Confidence > 65% වගේ තද අගයක්)
#     # 2. එසේත් නැත්නම් Stage 1 එක පොඩ්ඩක් සැක කරනවා නම් (flip_prob > 0.4) සහ Flip කළ පසු Stage 2 Confidence එක පැහැදිලිවම වැඩි නම්:
    
#     strict_flip_condition = (is_flipped_detected and max_conf_corr > 0.50) or \
#                             (flip_prob > 0.40 and max_conf_corr > (max_conf_orig + 0.05) and class_idx_orig != 4)

#     if strict_flip_condition:
#         working_img = flipped_img_cv2.copy() # Flip එක නිවැරදි කළ පින්තූරය ගනී
#         detected_class_id = class_idx_corr
#         confidence = max_conf_corr
#         is_flipped_corrected = True
#         flip_note = "Horizontal Flip anomaly corrected automatically."
#     else:
#         working_img = img_cv2.copy() # සාමාන්‍ය පින්තූරය ඒ විදිහටම ගනී (No Changes)
#         detected_class_id = class_idx_orig
#         confidence = max_conf_orig
#         is_flipped_corrected = False
#         flip_note = "No flip anomaly detected."

#     detected_label = STAGE2_CLASSES[detected_class_id]

#     # --- CONTENT CHECK (NON-DENTAL VALIDATION) ---
#     if detected_label == '4_Non_Dental':
#         return jsonify({
#             "status": "Rejected",
#             "reason": "Image is not a dental X-ray.",
#             "confidence": round(confidence, 2),
#             "label": detected_label,
#             "is_flipped_corrected": is_flipped_corrected
#         }), 200

#     # ------------------------------------------------------------------
#     # [QUALITY ANALYSIS] USING THE CORRECTED WORKING IMAGE
#     # ------------------------------------------------------------------
#     exposure, is_blurred, blur_val, quality_score = calculate_quality_metrics(working_img)

#     if quality_score < 40:
#         fail_reason = "Low image quality."
#         if is_blurred: fail_reason += " Image is too blurry."
#         if exposure != "Good": fail_reason += f" Lighting is {exposure}."

#         return jsonify({
#             "status": "Rejected",
#             "reason": fail_reason,
#             "quality_score": quality_score,
#             "blur_score": blur_val,
#             "exposure": exposure,
#             "is_flipped_corrected": is_flipped_corrected
#         }), 200

#     # ------------------------------------------------------------------
#     # [AUTO-ROTATION LOGIC] ON THE WORKING IMAGE
#     # ------------------------------------------------------------------
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

#     # Final corrected image එක save කිරීම
#     fixed_filename = "fixed_" + file.filename
#     fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
#     cv2.imwrite(fixed_path, fixed_img)

#     # --- SUCCESS RESPONSE ---
#     return jsonify({
#         "status": "Success",
#         "quality_score": quality_score,
#         "blur_score": blur_val,
#         "confidence": round(confidence, 2),
#         "exposure": exposure,
#         "fixed_image_url": f"http://127.0.0.1:5000/uploads/{fixed_filename}",
#         "is_blurred": bool(is_blurred),
#         "is_flipped_corrected": is_flipped_corrected,
#         "flip_analysis_note": flip_note,
#         "orientation_detected": detected_class_id,
#         "rotation_applied": rotation_note,
#         "message": "Image validated, flip-checked, and orientation corrected successfully."
#     })

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)

import os
import cv2
import numpy as np
import tensorflow as tf

# CONFIGURATIONS & DYNAMIC ABSOLUTE PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_flip_detector_v1', 'best_flip_detector.keras')
STAGE2_MODEL_PATH = os.path.join(PROJECT_ROOT, '02_Models', '01_Member', 'outputs_v4', 'dental_validation_model_v4.keras')

IMAGE_SIZE = (224, 224)
STAGE2_CLASSES = ['0_Correct', '1_Rotate_90', '2_Rotate_180', '3_Rotate_270', '4_Non_Dental']

stage1_model = None
stage2_model = None

try:
    stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH)
    print(" -> Stage 1 Model (Flip Detector) Loaded Successfully.")
    stage2_model = tf.keras.models.load_model(STAGE2_MODEL_PATH)
    print(" -> Stage 2 Model (Orientation/Validity) Loaded Successfully.")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to load Validation Models: {e}")

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
    
    return exposure, is_blurred, round(blur_val, 2), round(final_score, 2)

def run_image_validation_pipeline(img_cv2):
    """
    ප්‍රධාන app.py එකෙන් එවන පින්තූරය ගෙන සම්පූර්ණ Validation ක්‍රියාවලියම සිදු කරයි.
    ප්‍රතිඵලය සහ හැඩතල නිවැරදි කරන ලද 'fixed_img' එක Return කරයි.
    """
    if stage1_model is None or stage2_model is None:
        return {"status": "Rejected", "reason": "Validation models not loaded."}, None

    # [STAGE 1] FLIP DETECTION
    s1_input = preprocess_for_stage1(img_cv2)
    flip_prob = float(stage1_model.predict(s1_input, verbose=0)[0][0])
    is_flipped_detected = flip_prob > 0.5

    # [STAGE 2] MAX-CONFIDENCE VOTING LOGIC
    s2_input_orig = preprocess_for_stage2(img_cv2)
    preds_orig = stage2_model.predict(s2_input_orig, verbose=0)[0]
    max_conf_orig = float(np.max(preds_orig))
    class_idx_orig = int(np.argmax(preds_orig))
    
    flipped_img_cv2 = cv2.flip(img_cv2, 1)
    s2_input_corr = preprocess_for_stage2(flipped_img_cv2)
    preds_corr = stage2_model.predict(s2_input_corr, verbose=0)[0]
    max_conf_corr = float(np.max(preds_corr))
    class_idx_corr = int(np.argmax(preds_corr))

    strict_flip_condition = (is_flipped_detected and max_conf_corr > 0.50) or \
                            (flip_prob > 0.40 and max_conf_corr > (max_conf_orig + 0.05) and class_idx_orig != 4)

    if strict_flip_condition:
        working_img = flipped_img_cv2.copy()
        detected_class_id = class_idx_corr
        confidence = max_conf_corr
        is_flipped_corrected = True
        flip_note = "Horizontal Flip anomaly corrected automatically."
    else:
        working_img = img_cv2.copy()
        detected_class_id = class_idx_orig
        confidence = max_conf_orig
        is_flipped_corrected = False
        flip_note = "No flip anomaly detected."

    detected_label = STAGE2_CLASSES[detected_class_id]

    # CHECK CONTENT VALIDITY
    if detected_label == '4_Non_Dental':
        return {
            "status": "Rejected",
            "reason": "Image is not a dental X-ray.",
            "confidence": round(confidence, 2),
            "label": detected_label,
            "is_flipped_corrected": is_flipped_corrected
        }, None

    # QUALITY ANALYSIS
    exposure, is_blurred, blur_val, quality_score = calculate_quality_metrics(working_img)

    if quality_score < 40:
        fail_reason = "Low image quality."
        if is_blurred: fail_reason += " Image is too blurry."
        if exposure != "Good": fail_reason += f" Lighting is {exposure}."

        return {
            "status": "Rejected",
            "reason": fail_reason,
            "quality_score": quality_score,
            "blur_score": blur_val,
            "exposure": exposure,
            "is_flipped_corrected": is_flipped_corrected
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

    # සාර්ථකයි නම් දැනට එකතු කරගත් තොරතුරු Dictionary එකක් ලෙස යවයි
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
        "rotation_applied": rotation_note
    }
    
    return validation_report, fixed_img